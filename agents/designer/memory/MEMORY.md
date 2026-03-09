# Designer — Memory

## UI Component Patterns
- shadcn/ui as the component library
- Lucide React for all icons
- Card-based layouts for data display
- Modal/sheet for detail views
- Command palette for power-user actions

## Design System Decisions
- Theme: Dark mode first
- Primary accent: Violet/purple
- Neutrals: Zinc/slate
- Border radius: rounded-lg / rounded-xl
- Spacing: 4px grid system
- Typography: System font stack (Inter-like)

## Layout Templates
- Dashboard: sidebar + main content area
- List views: table with sortable columns
- Detail views: panel/sheet overlay
- Forms: vertical stack with consistent spacing

## Responsiveness Rules
- Mobile-responsive from the start
- Sidebar collapses on mobile
- Tables become card lists on small screens
- Touch targets minimum 44px

## Tailwind + shadcn Usage Patterns
- Use cn() utility for conditional classes
- Prefer composition over custom components
- Follow shadcn/ui theming conventions
- Dark mode via class strategy
