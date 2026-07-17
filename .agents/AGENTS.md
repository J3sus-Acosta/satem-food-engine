<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:satem-food-engine-rules -->

# SATEM Food Engine — Agent Rules

This project has a comprehensive `AGENTS.md` at the repository root.
**All agents MUST read [`AGENTS.md`](../AGENTS.md) before writing any code.**

## Quick Reference (enforce these always)

1. **No business logic in React components.** Services only.
2. **No `src/server/` imports from Client Components.** Use `server-only`.
3. **No `any` in TypeScript.** Use `unknown` + type guards.
4. **API Routes are thin.** Validate → call service → return response.
5. **Server Components by default.** Only `'use client'` when necessary.
6. **Read local Next.js docs** at `node_modules/next/dist/docs/` first.

<!-- END:satem-food-engine-rules -->
