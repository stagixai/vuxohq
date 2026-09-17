# Unity AI Project Rules

## Architecture & Code Standards
- Framework: FastAPI with async lifespan management and CORS middleware.
- Models: All request and response structures must use Pydantic v2 `BaseModel`.
- AI Routing:
  - Groq: `qwen/qwen3.6-27b` for ultra-fast text inference.
  - Gemini: `gemini-3.6-flash` for deep reasoning and multimodal (images/documents).
  - OpenAI: `gpt-4o-mini` for code/logic.
- Streaming: Implement Server-Sent Events (SSE) on `/api/chat/stream`.

## Automated Quality Gates
- Every code change must pass `ruff check .` with 0 errors.
- Every code change must be formatted with `ruff format .`.
- Automated test runs before reporting completion.
