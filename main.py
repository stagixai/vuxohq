import base64
import json
import logging
import os
import re
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
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
logger = logging.getLogger("unity-ai")

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

    logger.info("Elite AI Backend started with non-blocking async architecture.")
    yield
    logger.info("Elite AI Backend is shutting down.")


# Utility: Clean <think> tags from reasoning models
def clean_ai_response(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<think>.*?</think>\n*", "", text, flags=re.DOTALL)
    return cleaned.strip()


# FastAPI App
app = FastAPI(
    title="Unity AI - Elite Master Backend",
    description="Enterprise-grade FastAPI backend with multi-model routing, streaming, and multimodal support for FlutterFlow.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for FlutterFlow Web, Desktop, and Mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


class ChatResponse(BaseModel):
    provider: str
    response: str
    model: str


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
                    raw_bytes = base64.b64decode(att.data)
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
async def root():
    return {
        "status": "Online",
        "service": "Unity AI Elite Master Backend",
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


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main endpoint for routing requests with multimodal support and automatic failover.
    """
    provider = request.model_provider.lower()

    # If any message contains attachments (images/PDFs), automatically route to Gemini
    has_attachments = any(m.attachments for m in request.messages)
    if has_attachments and provider != "gemini":
        logger.info("Attachment detected. Auto-routing to Gemini multimodal engine.")
        provider = "gemini"

    # Execution with smart failover
    try:
        if provider == "groq":
            try:
                text, model = await _invoke_groq(request.messages, request.temperature)
                return ChatResponse(provider="Groq", response=text, model=model)
            except GroqError as groq_err:
                logger.warning(
                    "Groq failed with %s. Attempting failover to Gemini...", groq_err
                )
                if gemini_client:
                    text, model = await _invoke_gemini(
                        request.messages, request.temperature
                    )
                    return ChatResponse(
                        provider="Gemini (Failover)", response=text, model=model
                    )
                raise

        elif provider == "gemini":
            text, model = await _invoke_gemini(request.messages, request.temperature)
            return ChatResponse(provider="Gemini", response=text, model=model)

        elif provider == "openai":
            text, model = await _invoke_openai(request.messages, request.temperature)
            return ChatResponse(provider="OpenAI", response=text, model=model)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider '{provider}'. Choose 'groq', 'gemini', or 'openai'.",
            )

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


@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time token delivery.
    """
    provider = request.model_provider.lower()

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            if provider == "groq" and groq_client:
                standard_msgs = [
                    {"role": m.role, "content": m.content} for m in request.messages
                ]
                stream = await groq_client.chat.completions.create(
                    model=GROQ_DEFAULT_MODEL,
                    messages=standard_msgs,
                    temperature=request.temperature,
                    stream=True,
                )
                in_think = False
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if "<think>" in delta:
                        in_think = True
                        continue
                    if "</think>" in delta:
                        in_think = False
                        continue
                    if not in_think and delta:
                        yield f"data: {json.dumps({'token': delta, 'provider': 'Groq'})}\n\n"

            elif provider == "gemini" and gemini_client:
                gemini_contents = [
                    genai_types.Content(
                        role="model" if m.role == "assistant" else "user",
                        parts=[genai_types.Part.from_text(text=m.content)],
                    )
                    for m in request.messages
                    if m.content
                ]
                response_stream = (
                    await gemini_client.aio.models.generate_content_stream(
                        model=GEMINI_DEFAULT_MODEL,
                        contents=gemini_contents,
                    )
                )
                async for chunk in response_stream:
                    if chunk.text:
                        yield f"data: {json.dumps({'token': chunk.text, 'provider': 'Gemini'})}\n\n"

            else:
                yield f"data: {json.dumps({'error': 'Provider streaming not configured'})}\n\n"

        except (GroqError, genai_errors.APIError, APIError, RuntimeError) as stream_err:
            logger.error("Streaming error: %s", stream_err)
            yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
