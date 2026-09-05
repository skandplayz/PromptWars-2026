# ProjectMentor

**Live Demo:** [Vercel URL — to be filled after deployment]

AI-powered mentor for final-year projects. A student enters their interests,
skills, domain, difficulty, and constraints; the app generates several tailored
project ideas, produces a full mentorship plan for a chosen idea, and refines the
plan on demand (simpler, more advanced, add AI, reduce cost, shorter timeline).

## Stack

- **Next.js (App Router)** + React + TypeScript
- **Gemini** via `@google/genai` (Interactions API, `gemini-flash-latest`), server-side only
- **Zod** validates both client input and AI responses
- No database, no authentication — none required

## Architecture

```
Client form → POST /api/{ideas,plan,refine} → Gemini (structured JSON) → Zod validate → Client
```

All Gemini logic lives in `lib/gemini.ts` (shared by all three routes). AI output is
strictly structured JSON validated against `lib/schemas.ts`; it is rendered with
React components — never as raw HTML.

## Local development

```bash
npm install
cp .env.example .env.local   # then add your key
npm run dev                  # http://localhost:3000
```

Get a `GEMINI_API_KEY` at https://aistudio.google.com/apikey.

## Testing

```bash
npm test        # Playwright: schema, server-logic, and E2E journey tests
```

Tests never call Gemini — the E2E journey mocks all `/api/*` routes.

## Deploy (Vercel)

1. Push to a Git repo and import into Vercel (zero config for Next.js).
2. Add the `GEMINI_API_KEY` environment variable in the Vercel project settings.
3. Deploy.

## Notes

- The Gemini key is server-only and never shipped to the client.
- `gemini-flash-latest` is used for generous quota; swap `MODEL` in `lib/gemini.ts`
  if you enable billing and want a pinned model.
- No server-side rate limiting yet — input length caps in `lib/schemas.ts` bound
  per-call cost; add per-IP limiting if abuse becomes a concern.
