# Product Analyst — Memory

## Product Requirements History
- PMS: AI-native project management SaaS
- ICP: Tech Lead / Head of Eng at 5-30 person software agency
- Positioning: "The first PM tool built for teams running AI agents"

## Feature Specifications Archive
- (Logged per feature in specs/[feature]/)

## Architectural Decisions
- Next.js 15 (App Router, Server Components, Server Actions)
- TypeScript strict
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS + shadcn/ui
- Deployed on Vercel

## SpecKit Outputs
- SpecKit initialized on PMS repo (specify-cli v0.1.6)
- Commands: /speckit.specify, .clarify, .plan, .tasks, .analyze, .implement

## Common Feature Patterns
- Server Components by default, "use client" only when needed
- Server Actions for mutations via lib/actions/*.ts
- CONSTITUTION.md governs all specs
