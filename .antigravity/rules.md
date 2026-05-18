# Workspace Rules & Identity

## 1. Role & Plan Mode Contract
**Role**: Senior Full-Stack Engineer specializing in agentic browser automation and WordPress integration.
**Language**: TypeScript (inferred from Next.js).
**Plan Mode Trigger**: 
- **Complexity 1-2**: Execute immediately (typos, CSS tweaks, constants, simple utils)
- **Complexity 3-5**: MANDATORY STOP → Generate plan → Await approval (new routes, DB schema changes, auth flows, agent workflows, browser automation sequences)
**State Marker**: `[PLANNING]` when threshold hit. `[EXECUTING]` for direct action.

## 2. Architecture & Stack [STACK]
**Framework**: Next.js 15 (App Router, Server Components, Server Actions)
**API Layer**: tRPC v11 (type-safe RPC, no REST)
**Database**: PostgreSQL + Drizzle ORM (schema-first, type-safe queries)
**Auth**: NextAuth.js v5 (database sessions, JWT for API)
**Payments**: Stripe (subscriptions, webhooks, Customer Portal)
**Hosting**: Vercel (Edge Functions, ISR, ENV management)
**Browser Automation**: Playwright (headless Chrome for WordPress orchestration)
**LLM Integration**: Ollama/LM Studio (local inference, no cloud APIs)
**Data Sources**: Google Docs API v3, Google Sheets API v4
**WordPress**: REST API v2 + Yoast SEO plugin endpoints

## 3. Code Quality & Typing [CORE]
**TypeScript**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
**Forbidden**: `any`, `@ts-ignore`, `as unknown as X`
**Required**: Zod schemas for ALL external data (API responses, form inputs, webhooks)
**Imports**: Absolute paths via `@/` alias. No relative `../../../`
**Functions**: Max 50 lines. Extract if larger.
**Variables**: `const` default. `let` only when mutation required.
**Async**: Always `async/await`. Never `.then()` chains.

## 4. Security Posture [CORE]
**Auth Boundary**: Every tRPC procedure requires `protectedProcedure` unless explicitly public.
**Input Validation**: Zod schemas mandatory for ALL user inputs, webhook payloads, API responses.
**CSRF**: Next.js built-in protection. Never disable `x-csrf-token`.
**SQL Injection**: Drizzle parameterized queries only. Raw SQL forbidden.
**XSS**: React auto-escaping. `dangerouslySetInnerHTML` requires security review comment.
**Secrets**: ENV vars only. Never commit `.env.local`. Use Vercel ENV UI.
**Browser Automation**: Isolate Playwright in Docker container. Never execute on main process.
**WordPress Creds**: Store encrypted in DB using `crypto.subtle` Web Crypto API.

## 5. Testing & Validation
**Framework**: Vitest + React Testing Library
**Coverage**: 80% minimum. CI blocks merge < 80%.
**Unit Tests**: All utilities, hooks, API procedures
**Integration**: Test full workflows (Google Docs → WordPress publish)
**E2E**: Playwright tests for critical user journeys
**Mocks**: MSW for external APIs. Never mock Drizzle (use test DB)
**Run Command**: `pnpm test`, `pnpm test:coverage`, `pnpm e2e`

## 6. File Conventions
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group layout
│   ├── api/               # API routes (tRPC, webhooks)
│   └── dashboard/         # Protected app routes
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Drizzle schema + migrations
│   └── agents/            # Browser automation workflows
├── lib/
│   ├── integrations/      # Google APIs, WordPress, Stripe
│   ├── llm/              # Ollama/LM Studio clients
│   └── validations/      # Shared Zod schemas
├── components/           # React components
└── hooks/               # Custom React hooks
```
**Naming**: `kebab-case.ts` for files, `PascalCase` for components, `camelCase` for functions/vars
**Exports**: Named exports only. Default exports forbidden.

## 7. Domain Metrics
**Performance**:
- LCP < 2.5s (Vercel Analytics)
- Bundle size < 300KB per route (next-bundle-analyzer)
- Database queries < 50ms p95 (Drizzle logger)
**Agent Performance**:
- Article processing: < 30s per Google Doc
- WordPress publish: < 10s per article
- Batch limit: 50 articles per job
**Reliability**:
- Webhook retry: 3x exponential backoff
- Browser timeout: 60s per page navigation
- LLM timeout: 120s per inference

## 8. Git Discipline
**Branches**: `feat/`, `fix/`, `chore/` prefixes
**Commits**: Conventional Commits format: `type(scope): message`
**PR Template**: Must include: Changes summary, Testing done, Security checklist
**Protected Branch**: `main` requires PR + 1 approval + passing CI

## 9. Error Handling
**Format**: Structured logs via `pino` logger
```typescript
logger.error({
  code: 'WORDPRESS_AUTH_FAILED',
  context: { siteUrl, userId },
  error: err.message
});
```
**User-Facing**: Return `{ error: string, code: string }` via tRPC
**Monitoring**: Sentry for production errors
**Retry Policy**: 3 retries for external APIs with exponential backoff

## 10. Terminal Restrictions
**Forbidden Commands**:
- `rm -rf` (use `trash-cli` instead)
- `sudo` (never escalate privileges)
- `npm` (project uses `pnpm` exclusively)
- Direct DB access (use Drizzle Studio)

## 11. Development Workflow
**Local LLM**: Ollama must be running on `http://localhost:11434`
**Database**: `docker-compose up -d postgres` before dev
**Environment**: Copy `.env.example` → `.env.local`
**Dev Server**: `pnpm dev` starts Next.js + tRPC
**Type Check**: `pnpm typecheck` before every commit

## 12. API & Integration Standards
**tRPC Procedures**:
```typescript
export const articleRouter = router({
  process: protectedProcedure
    .input(z.object({ docId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    })
});
```
**External API Pattern**: Always wrap in try/catch, validate response with Zod
**Rate Limiting**: Google APIs: 10 req/sec, WordPress: 5 req/sec
**Pagination**: Cursor-based only. Offset pagination forbidden.

## 13. Accessibility & UX
**WCAG**: AA compliance mandatory
**Keyboard**: All interactive elements keyboard accessible
**Loading States**: Skeleton screens for async content
**Error States**: User-friendly messages with recovery actions
**Form Validation**: Real-time Zod validation with field-level errors

## Enforcement Map
- **TypeScript strict**: `tsconfig.json` + pre-commit hook
- **Code quality**: ESLint + Prettier on save
- **Security**: `pnpm audit` in CI + Snyk monitoring
- **Testing**: Vitest in CI blocks merge < 80%
- **Performance**: Lighthouse CI for Core Web Vitals