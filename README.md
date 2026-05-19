# askWillow

A real estate chat agent that understands a buyer's full context (budget, pets, kids, location) and translates natural language queries into precise database searches with human-in-the-loop approval.

## Stack

- Next.js 16 (App Router) on Vercel
- Vercel AI SDK + Workflow SDK (`DurableAgent`)
- Drizzle ORM + Neon Postgres
- Vitest for evals

## Running locally

```bash
cp .env.example .env.local   # add DATABASE_URL, DIRECT_URL, etc.
pnpm install
pnpm dev
```

## Evals

```bash
pnpm run eval
```
