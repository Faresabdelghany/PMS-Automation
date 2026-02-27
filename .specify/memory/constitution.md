<!--
Sync Impact Report
===================
Version change: (new) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (7 principles)
  - Technology Constraints
  - Development Workflow
  - Performance Standards
  - Testing Requirements
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ compatible (Constitution Check section is generic)
  - .specify/templates/spec-template.md — ✅ compatible (no constitution-specific references)
  - .specify/templates/tasks-template.md — ✅ compatible (phase structure supports all principles)
  - .specify/templates/commands/*.md — N/A (no command files exist)
  - CONTRIBUTING.md — ✅ compatible (workflow aligns with Development Workflow section)
Follow-up TODOs: None
-->

# Project Dashboard Constitution

## Core Principles

### I. Component-First Design

Every UI feature MUST be built as a composable, reusable component
following the Shadcn/UI and Radix UI pattern established in the project.

- Components MUST have a clear props API with TypeScript interfaces
- Components MUST be self-contained: styles, logic, and types
  colocated or clearly imported
- Shared primitives live in `components/ui/`; feature components
  live in `components/<feature>/`
- New UI elements MUST use existing Radix primitives before
  introducing new dependencies
- No component may exceed 300 lines without being decomposed into
  smaller, testable units

### II. Type Safety

TypeScript strict mode MUST be enforced across the entire codebase.
Types are documentation — they replace the need for runtime checks
on internal boundaries.

- All component props MUST have explicit TypeScript interfaces
- All data models in `lib/data/` MUST have corresponding type
  definitions
- The `any` type is prohibited; use `unknown` with type guards
  when the type is genuinely uncertain
- Utility types (`Pick`, `Omit`, `Partial`) MUST be preferred
  over duplicating type definitions
- Zod schemas MUST be used for any external data validation
  (API responses, form inputs, URL parameters)

### III. Accessibility (a11y)

All interactive elements MUST be keyboard-navigable and
screen-reader compatible. Radix UI handles much of this, but
custom components MUST meet the same standard.

- All interactive elements MUST be reachable via Tab and
  operable via Enter/Space
- All images and icons MUST have appropriate `alt` text or
  `aria-label` attributes
- Color contrast MUST meet WCAG 2.1 AA standards (4.5:1 for
  normal text, 3:1 for large text)
- Focus indicators MUST be visible and follow the project's
  design system
- Custom drag-and-drop interactions (dnd-kit) MUST provide
  keyboard alternatives

### IV. Visual Polish & UX

The dashboard MUST maintain high design quality with purposeful
animations, consistent theming, and responsive layouts. Generic
or "AI-generated looking" aesthetics are not acceptable.

- Animations MUST use the Motion (Framer Motion) library and
  be purposeful — no gratuitous movement
- Dark mode MUST be fully supported via `next-themes` and CSS
  custom properties
- All spacing, typography, and color MUST use Tailwind utility
  classes tied to the design system tokens in `globals.css`
- Loading and empty states MUST be designed, not just spinners
  or blank screens
- Transitions between views (Timeline, List, Board) MUST feel
  smooth and intentional

### V. Simplicity (YAGNI)

Start simple. Do not build abstractions, configurations, or
features that are not immediately needed. The right amount of
complexity is the minimum required for the current task.

- No premature abstractions: three similar lines of code are
  better than a utility function used once
- No feature flags or backward-compatibility shims — change
  the code directly
- No backend, database, or API integration until explicitly
  required — mock data in `lib/data/` is sufficient
- Complexity MUST be justified in PR descriptions when added
- If a simpler alternative exists, it MUST be chosen unless
  a specific, documented reason prevents it

### VI. Responsive Design

The dashboard MUST work on desktop and tablet viewports.
Mobile support is a secondary goal but layouts MUST NOT break
on smaller screens.

- The `use-mobile` hook MUST be used for breakpoint-dependent
  behavior
- Sidebar MUST collapse gracefully on narrow viewports
- Tables, boards, and timeline views MUST adapt or scroll
  horizontally — no content clipping
- Touch targets MUST meet minimum 44x44px for interactive
  elements on touch devices
- Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) MUST be
  used consistently

### VII. Consistent Patterns

The codebase MUST follow established conventions. When a pattern
exists, new code MUST follow it. When a better pattern is
adopted, existing code MUST be migrated — no two patterns for
the same concern.

- File naming: kebab-case for files, PascalCase for components
- State management: React hooks and URL query parameters —
  no global state library unless explicitly adopted
- Imports MUST use path aliases (`@/components`, `@/lib`, etc.)
  as configured in `tsconfig.json` and `components.json`
- New pages MUST follow the Next.js App Router conventions
  established in `app/`
- Form handling MUST use React Hook Form + Zod validation

## Technology Constraints

The following stack is locked for this project. Changes to core
dependencies require a constitution amendment.

| Layer | Technology | Version Lock |
|-------|-----------|-------------|
| Framework | Next.js (App Router) | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| Component System | Shadcn/UI + Radix UI | Latest compatible |
| Animations | Motion (Framer Motion) | 12.x |
| Icons | Lucide React + Phosphor Icons | Current |
| Forms | React Hook Form + Zod | Current |
| Drag & Drop | dnd-kit | Current |
| Rich Text | Tiptap | 3.x |
| Charts | Recharts | 2.x |

**Constraints**:
- No backend framework or database unless explicitly approved
- No global state management library (Redux, Zustand) unless
  explicitly approved
- New dependencies MUST be justified — prefer existing libraries
- All dependencies MUST be compatible with React 19 and Next.js 16

## Development Workflow

1. **Branch**: Create a feature branch from `main`
2. **Develop**: Run `next dev` locally; verify changes render
   correctly in both light and dark mode
3. **Lint**: Run `eslint .` — all warnings MUST be resolved
   before opening a PR
4. **Build**: Run `next build` — the build MUST succeed with
   no TypeScript errors
5. **PR**: Open a pull request with a clear description of what
   changed and why
6. **Review**: All PRs MUST be reviewed before merging to `main`

**Branch naming**: `<type>/<short-description>`
(e.g., `feat/task-board-filters`, `fix/sidebar-collapse`)

**Commit messages**: Use conventional commits format
(`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `chore:`)

## Performance Standards

The dashboard MUST meet these performance targets measured
via Lighthouse on a production build:

| Metric | Target |
|--------|--------|
| Lighthouse Performance | >= 90 |
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Total Bundle Size (JS) | Monitor — no regressions |

- Route-level code splitting MUST be maintained via Next.js
  App Router conventions
- Images MUST use `next/image` for automatic optimization
  when a backend is available
- Heavy components (charts, rich text editor) SHOULD be
  lazy-loaded via `dynamic()` imports

## Testing Requirements

Testing is currently not established in this project. When
tests are introduced, the following standards apply:

- **Unit tests**: For utility functions in `lib/` and complex
  component logic
- **Integration tests**: For multi-step user flows (e.g.,
  project wizard, filtering)
- **Visual regression**: Recommended for critical UI components
- **Framework**: To be determined when testing is adopted
  (Vitest + Testing Library recommended)
- Tests are OPTIONAL unless explicitly requested in a feature
  specification

## Governance

This constitution is the highest-authority document for the
Project Dashboard codebase. It supersedes informal conventions,
PR comments, and individual preferences.

**Amendment process**:
1. Propose the change via a PR modifying this file
2. Document the rationale and migration plan for any breaking
   principle changes
3. Update the version number per semantic versioning rules:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or materially expanded guidance
   - PATCH: Clarifications, wording fixes, non-semantic changes
4. Update dependent templates if principles change

**Compliance**:
- All PRs and code reviews MUST verify compliance with these
  principles
- Added complexity MUST be justified against Principle V
  (Simplicity)
- Use `CLAUDE.md` or `.specify/` guidance files for runtime
  development guidance that supplements this constitution

**Version**: 1.0.0 | **Ratified**: 2026-02-27 | **Last Amended**: 2026-02-27
