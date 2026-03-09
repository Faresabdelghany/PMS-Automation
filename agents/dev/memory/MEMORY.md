# Dev — Memory

## Tech Stack
- Next.js 15 (App Router, Server Components, Server Actions)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Realtime)
- Deployed on Vercel
- Package manager: pnpm

## Project Architecture
- App Router: /app directory
- Server Actions: /lib/actions/*.ts
- Components: /components (shadcn/ui based)
- Database types: generated from Supabase schema
- Auth: Supabase Auth

## Preferred Libraries
- shadcn/ui for all UI components
- Lucide React for icons
- Zod for validation
- date-fns for dates

## Coding Standards
- No `any` types
- Server Components by default
- "use client" only when absolutely needed
- Meaningful commit messages: feat:, fix:, refactor:
- Small, logical commits
- Always run pnpm build before reporting done

## Repository Structure
- PMS repo: main branch, Vercel auto-deploys
- Never force-push, never delete branches, never rewrite history

## Known Issues
- Next.js 16 Turbopack crashes on Windows (PostCSS `nul` bug) — stick to Next.js 15
