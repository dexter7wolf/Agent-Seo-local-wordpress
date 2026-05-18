---
name: Ollama LLM Integration
description: Local LLM orchestration patterns for Ollama/LM Studio with streaming, context management, and fallback handling
---

# Trigger (When to activate)
- Command contains `llm`, `ollama`, `generate`, `ai-content`
- Files matching `*/llm/*`, `*/ai/*`, `*-generation.ts`
- Context requires natural language processing or content generation

# Context Required
- `.env.local`: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `LM_STUDIO_ENDPOINT`
- Available models via `curl http://localhost:11434/api/tags`
- Current generation task parameters and constraints

# Execution Steps
1. **Model Selection**: Query available models, validate compatibility
2. **Context Assembly**: Build prompt with system/user roles, enforce token limits
3. **Streaming Setup**: Initialize SSE connection for real-time generation
4. **Error Boundaries**: Implement retry logic (3x exponential backoff), fallback to LM Studio
5. **Response Validation**: Parse JSON outputs, sanitize HTML, enforce schema compliance

# Validation Criteria
- Response latency < 2s for first token
- Memory usage < 4GB per generation session
- Structured outputs pass Zod schema validation
- No prompt injection vulnerabilities (sanitize all user inputs)