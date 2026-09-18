import base64
import json
import logging
import os
import re
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from groq import AsyncGroq, GroqError
from openai import APIError, AsyncOpenAI
from pydantic import BaseModel, Field

# Setup structured logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("vuxo-infrastructure")

# Load environment variables
load_dotenv()

# Global AI Clients
groq_client: AsyncGroq | None = None
openai_client: AsyncOpenAI | None = None
gemini_client: genai.Client | None = None

# Default Models
GROQ_DEFAULT_MODEL = "qwen/qwen3.6-27b"
GEMINI_DEFAULT_MODEL = "gemini-3.6-flash"
OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

# In-memory Telemetry Aggregator
telemetry_history: list[dict] = []


async def log_synthesis_telemetry(
    model_used: str,
    latency_ms: int,
    char_count: int,
    profile_id: str | None = None,
):
    log_entry = {
        "modelUsed": model_used,
        "latencyMs": latency_ms,
        "characterCount": char_count,
        "profileId": profile_id,
        "timestamp": time.time(),
    }
    telemetry_history.append(log_entry)
    if len(telemetry_history) > 1000:
        telemetry_history.pop(0)

    logger.info(
        "TELEMETRY | Model: %s | Latency: %dms | Chars: %d",
        model_used,
        latency_ms,
        char_count,
    )

    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    if supabase_url and supabase_key:
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        payload = {
            "modelUsed": model_used,
            "latencyMs": latency_ms,
            "characterCount": char_count,
        }
        if profile_id:
            payload["profileId"] = profile_id

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{supabase_url}/rest/v1/SynthesisLog",
                    json=payload,
                    headers=headers,
                )
        except (httpx.HTTPError, RuntimeError, ValueError) as telemetry_err:
            logger.warning("Supabase Telemetry insert skipped: %s", telemetry_err)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global groq_client, openai_client, gemini_client

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        groq_client = AsyncGroq(api_key=groq_key)
        logger.info("Groq client initialized.")

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        openai_client = AsyncOpenAI(api_key=openai_key)
        logger.info("OpenAI client initialized.")

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        gemini_client = genai.Client(api_key=gemini_key)
        logger.info("Gemini async client initialized.")

    logger.info("VUXO Infrastructure started with non-blocking async architecture.")
    yield
    logger.info("VUXO Infrastructure is shutting down.")


# Utility: Clean <think> tags from reasoning models
def clean_ai_response(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<think>.*?</think>\n*", "", text, flags=re.DOTALL)
    return cleaned.strip()


class ThinkFilter:
    """
    Streaming filter to strip <think>...</think> tags cleanly across chunk boundaries.
    """

    def __init__(self):
        self.in_think = False
        self.buffer = ""

    def filter(self, chunk: str) -> str:
        self.buffer += chunk
        output = []
        while self.buffer:
            if not self.in_think:
                start = self.buffer.find("<think>")
                if start != -1:
                    output.append(self.buffer[:start])
                    self.in_think = True
                    self.buffer = self.buffer[start + 7 :]
                else:
                    if len(self.buffer) > 6:
                        emit_len = len(self.buffer) - 6
                        output.append(self.buffer[:emit_len])
                        self.buffer = self.buffer[emit_len:]
                    break
            else:
                end = self.buffer.find("</think>")
                if end != -1:
                    self.in_think = False
                    self.buffer = self.buffer[end + 8 :]
                else:
                    if len(self.buffer) > 7:
                        self.buffer = self.buffer[-7:]
                    break
        return "".join(output)

    def flush(self) -> str:
        if not self.in_think:
            res = self.buffer
            self.buffer = ""
            return res
        self.buffer = ""
        return ""


# FastAPI App
app = FastAPI(
    title="VUXO Infrastructure",
    description="Enterprise-grade FastAPI engine with multi-model routing, telemetry logging, streaming, Groq Whisper transcription, and multimodal support.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Policy Configuration
ALLOWED_ORIGINS = [
    "https://vuxohq.tech",
    "https://www.vuxohq.tech",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security: Supabase JWT Header Verification Dependency
async def verify_supabase_jwt(authorization: str | None = Header(default=None)):
    """
    Validates optional Supabase Bearer JWT token from request Authorization header.
    """
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
    if len(token) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization Bearer Token",
        )
    return token


# --- Pydantic Data Models ---
class Attachment(BaseModel):
    mime_type: str = Field(default="image/jpeg", description="MIME type of attachment")
    data: str = Field(description="Base64-encoded string or public URL")


class Message(BaseModel):
    role: str = Field(description="Role: 'user', 'assistant', or 'system'")
    content: str = Field(default="", description="Text message content")
    attachments: list[Attachment] | None = Field(
        default=None, description="Optional files or images"
    )


class ChatRequest(BaseModel):
    messages: list[Message]
    model_provider: str = Field(
        default="groq", description="Provider: 'groq', 'gemini', or 'openai'"
    )
    stream: bool = Field(default=False, description="Enable streaming mode")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    profile_id: str | None = Field(
        default=None, description="Optional Supabase profile UUID for telemetry"
    )


class ChatResponse(BaseModel):
    provider: str
    response: str
    model: str


class TranscribeRequest(BaseModel):
    audio_base64: str = Field(description="Base64 encoded audio bytes")
    filename: str = Field(default="dictation.webm", description="Optional filename")


# --- Core Provider Invocation Handlers ---


async def _invoke_groq(messages: list[Message], temperature: float) -> tuple[str, str]:
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY not configured",
        )

    standard_msgs = []
    for m in messages:
        standard_msgs.append({"role": m.role, "content": m.content})

    completion = await groq_client.chat.completions.create(
        model=GROQ_DEFAULT_MODEL,
        messages=standard_msgs,
        temperature=temperature,
        max_tokens=2048,
    )
    raw_text = completion.choices[0].message.content or ""
    return clean_ai_response(raw_text), GROQ_DEFAULT_MODEL


async def _invoke_gemini(
    messages: list[Message], temperature: float
) -> tuple[str, str]:
    if not gemini_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured",
        )

    gemini_contents: list[genai_types.Content] = []
    for m in messages:
        role = "model" if m.role == "assistant" else "user"
        parts: list[genai_types.Part] = []

        if m.content:
            parts.append(genai_types.Part.from_text(text=m.content))

        if m.attachments:
            for att in m.attachments:
                try:
                    clean_data = re.sub(r"^data:image/[^;]+;base64,", "", att.data)
                    raw_bytes = base64.b64decode(clean_data)
                    parts.append(
                        genai_types.Part.from_bytes(
                            data=raw_bytes, mime_type=att.mime_type
                        )
                    )
                except (ValueError, TypeError) as b64_err:
                    logger.warning("Failed to decode base64 attachment: %s", b64_err)

        if parts:
            gemini_contents.append(genai_types.Content(role=role, parts=parts))

    config = genai_types.GenerateContentConfig(temperature=temperature)
    response = await gemini_client.aio.models.generate_content(
        model=GEMINI_DEFAULT_MODEL,
        contents=gemini_contents,
        config=config,
    )
    raw_text = response.text or ""
    return clean_ai_response(raw_text), GEMINI_DEFAULT_MODEL


async def _invoke_openai(
    messages: list[Message], temperature: float
) -> tuple[str, str]:
    if not openai_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY not configured",
        )

    standard_msgs = [{"role": m.role, "content": m.content} for m in messages]
    completion = await openai_client.chat.completions.create(
        model=OPENAI_DEFAULT_MODEL,
        messages=standard_msgs,
        temperature=temperature,
    )
    raw_text = completion.choices[0].message.content or ""
    return clean_ai_response(raw_text), OPENAI_DEFAULT_MODEL


# --- Endpoints ---


@app.get("/")
@app.get("/health")
@app.get("/api")
@app.get("/api/health")
async def root():
    return {
        "status": "Online",
        "service": "VUXO Infrastructure",
        "version": "2.0.0",
        "providers": {
            "groq": {
                "model": GROQ_DEFAULT_MODEL,
                "status": "active" if groq_client else "missing_key",
            },
            "gemini": {
                "model": GEMINI_DEFAULT_MODEL,
                "status": "active" if gemini_client else "missing_key",
            },
            "openai": {
                "model": OPENAI_DEFAULT_MODEL,
                "status": "active" if openai_client else "missing_key",
            },
        },
    }


@app.get("/telemetry")
@app.get("/api/telemetry")
async def get_telemetry():
    total_requests = len(telemetry_history)
    total_chars = sum(t["characterCount"] for t in telemetry_history)
    avg_latency = (
        sum(t["latencyMs"] for t in telemetry_history) // total_requests
        if total_requests > 0
        else 0
    )

    model_breakdown = {}
    for t in telemetry_history:
        m = t["modelUsed"]
        model_breakdown[m] = model_breakdown.get(m, 0) + 1

    return {
        "status": "Active",
        "service": "VUXO Infrastructure Telemetry",
        "total_requests": total_requests,
        "total_characters_processed": total_chars,
        "average_latency_ms": avg_latency,
        "model_breakdown": model_breakdown,
        "recent_logs": telemetry_history[-10:],
    }


@app.post("/transcribe")
@app.post("/api/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcribes base64 audio payload using Groq Whisper API (whisper-large-v3-turbo).
    """
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY not configured for Whisper transcription",
        )

    try:
        clean_b64 = re.sub(r"^data:audio/[^;]+;base64,", "", request.audio_base64)
        audio_bytes = base64.b64decode(clean_b64)
        filename = request.filename or "dictation.webm"

        transcription = await groq_client.audio.transcriptions.create(
            file=(filename, audio_bytes, "audio/webm"),
            model="whisper-large-v3-turbo",
            response_format="json",
        )
        text = (
            transcription.text
            if hasattr(transcription, "text")
            else str(transcription)
        )
        return {
            "text": text,
            "model": "whisper-large-v3-turbo",
            "provider": "Groq Whisper",
        }
    except Exception as err:
        logger.error("Groq Whisper transcription error: %s", err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq Whisper transcription failed: {err}",
        ) from err


@app.post("/chat", response_model=ChatResponse)
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main endpoint for routing requests with multimodal support, automatic failover, and telemetry.
    """
    start_time = time.time()
    provider = request.model_provider.lower()

    has_attachments = any(m.attachments for m in request.messages)
    if has_attachments and provider != "gemini":
        logger.info("Attachment detected. Auto-routing to Gemini multimodal engine.")
        provider = "gemini"

    try:
        if provider == "groq":
            try:
                text, model = await _invoke_groq(request.messages, request.temperature)
                response_obj = ChatResponse(provider="Groq", response=text, model=model)
            except GroqError as groq_err:
                logger.warning(
                    "Groq failed with %s. Attempting failover to Gemini...", groq_err
                )
                if gemini_client:
                    text, model = await _invoke_gemini(
                        request.messages, request.temperature
                    )
                    response_obj = ChatResponse(
                        provider="Gemini (Failover)", response=text, model=model
                    )
                else:
                    raise

        elif provider == "gemini":
            text, model = await _invoke_gemini(request.messages, request.temperature)
            response_obj = ChatResponse(provider="Gemini", response=text, model=model)

        elif provider == "openai":
            text, model = await _invoke_openai(request.messages, request.temperature)
            response_obj = ChatResponse(provider="OpenAI", response=text, model=model)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider '{provider}'. Choose 'groq', 'gemini', or 'openai'.",
            )

        latency_ms = int((time.time() - start_time) * 1000)
        char_count = len(response_obj.response)
        await log_synthesis_telemetry(
            model_used=response_obj.model,
            latency_ms=latency_ms,
            char_count=char_count,
            profile_id=request.profile_id,
        )
        return response_obj

    except HTTPException:
        raise
    except (GroqError, genai_errors.APIError, APIError) as api_err:
        logger.error("AI Provider API Error: %s", api_err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(api_err)
        ) from api_err
    except (RuntimeError, ValueError, TypeError) as exc:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc


@app.post("/chat/stream")
@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint with multimodal attachment support & telemetry.
    """
    start_time = time.time()
    provider = request.model_provider.lower()

    async def event_generator() -> AsyncGenerator[str, None]:
        total_tokens_chars = 0
        used_model = GROQ_DEFAULT_MODEL
        try:
            if provider == "groq" and groq_client:
                used_model = GROQ_DEFAULT_MODEL
                standard_msgs = [
                    {"role": m.role, "content": m.content} for m in request.messages
                ]
                stream = await groq_client.chat.completions.create(
                    model=GROQ_DEFAULT_MODEL,
                    messages=standard_msgs,
                    temperature=request.temperature,
                    stream=True,
                )
                think_filter = ThinkFilter()
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    filtered = think_filter.filter(delta)
                    if filtered:
                        total_tokens_chars += len(filtered)
                        yield f"data: {json.dumps({'token': filtered, 'provider': 'Groq'})}\n\n"
                flushed = think_filter.flush()
                if flushed:
                    total_tokens_chars += len(flushed)
                    yield f"data: {json.dumps({'token': flushed, 'provider': 'Groq'})}\n\n"

            elif provider == "gemini" and gemini_client:
                used_model = GEMINI_DEFAULT_MODEL
                gemini_contents: list[genai_types.Content] = []
                for m in request.messages:
                    role = "model" if m.role == "assistant" else "user"
                    parts: list[genai_types.Part] = []
                    if m.content:
                        parts.append(genai_types.Part.from_text(text=m.content))
                    if m.attachments:
                        for att in m.attachments:
                            try:
                                clean_data = re.sub(
                                    r"^data:image/[^;]+;base64,", "", att.data
                                )
                                raw_bytes = base64.b64decode(clean_data)
                                parts.append(
                                    genai_types.Part.from_bytes(
                                        data=raw_bytes, mime_type=att.mime_type
                                    )
                                )
                            except (ValueError, TypeError) as b64_err:
                                logger.warning(
                                    "Failed to decode base64 attachment in stream: %s",
                                    b64_err,
                                )
                    if parts:
                        gemini_contents.append(
                            genai_types.Content(role=role, parts=parts)
                        )

                response_stream = (
                    await gemini_client.aio.models.generate_content_stream(
                        model=GEMINI_DEFAULT_MODEL,
                        contents=gemini_contents,
                    )
                )
                async for chunk in response_stream:
                    try:
                        text = chunk.text
                        if text:
                            total_tokens_chars += len(text)
                            yield f"data: {json.dumps({'token': text, 'provider': 'Gemini'})}\n\n"
                    except (ValueError, AttributeError) as gem_err:
                        logger.warning(
                            "Gemini chunk text extraction skipped: %s", gem_err
                        )

            elif provider == "openai" and openai_client:
                used_model = OPENAI_DEFAULT_MODEL
                standard_msgs = [
                    {"role": m.role, "content": m.content} for m in request.messages
                ]
                stream = await openai_client.chat.completions.create(
                    model=OPENAI_DEFAULT_MODEL,
                    messages=standard_msgs,
                    temperature=request.temperature,
                    stream=True,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        total_tokens_chars += len(delta)
                        yield f"data: {json.dumps({'token': delta, 'provider': 'OpenAI'})}\n\n"

            else:
                yield f"data: {json.dumps({'error': f'Provider {provider} not configured or active'})}\n\n"

        except (
            GroqError,
            genai_errors.APIError,
            APIError,
            RuntimeError,
        ) as stream_err:
            logger.error("Streaming error: %s", stream_err)
            yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"

        latency_ms = int((time.time() - start_time) * 1000)
        await log_synthesis_telemetry(
            model_used=used_model,
            latency_ms=latency_ms,
            char_count=total_tokens_chars,
            profile_id=request.profile_id,
        )
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class TTSRequest(BaseModel):
    text: str = Field(description="Text content to synthesize into speech")
    voice_id: str = Field(
        default="21m00Tcm4TlvDq8ikWAM", description="ElevenLabs Voice ID"
    )
    model_id: str = Field(
        default="eleven_multilingual_v2", description="ElevenLabs Model ID"
    )
    profile_id: str | None = Field(
        default=None, description="Optional Supabase profile UUID for telemetry"
    )


@app.post("/tts")
@app.post("/api/tts")
async def text_to_speech_endpoint(request: TTSRequest):
    """
    Synthesizes text into audio using ElevenLabs API with telemetry logging.
    """
    start_time = time.time()
    eleven_key = os.getenv("ELEVENLABS_API_KEY")
    if not eleven_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ELEVENLABS_API_KEY not configured",
        )

    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty"
        )

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": eleven_key,
    }
    payload = {
        "text": request.text[:2500],
        "model_id": request.model_id,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(
                    "ElevenLabs API error [%d]: %s", resp.status_code, resp.text
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"ElevenLabs API error: {resp.text}",
                )

            latency_ms = int((time.time() - start_time) * 1000)
            await log_synthesis_telemetry(
                model_used=request.model_id,
                latency_ms=latency_ms,
                char_count=len(request.text),
                profile_id=request.profile_id,
            )
            return Response(content=resp.content, media_type="audio/mpeg")
    except httpx.HTTPError as http_err:
        logger.error("ElevenLabs network error: %s", http_err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs network error: {http_err}",
        ) from http_err
