# Agent Workflow — HITL Production System

## The Rule: Nothing ships without Fares's approval.

## Workflow

### Phase 1: REQUEST
```
Fares → Ziko: "I want to build X"
```

### Phase 2: PLANNING (Ziko orchestrates)
Ziko activates as Nabil (Supreme Commander) and:
1. Drafts project roadmap
2. Defines feature list with priorities
3. Estimates scope (time, complexity, cost)
4. Gets input from:
   - Omar (CTO): Technical architecture, tech stack, risks
   - Karim (Marketing): Market positioning, revenue potential
   - Hady (Design): UX direction, visual approach

Produces: **Project Spec Document** with:
- Goal & vision
- Feature list (P0/P1/P2)
- Technical architecture
- Design direction
- Timeline estimate
- Resource allocation (which agents do what)

### Phase 3: 🛑 HITL GATEWAY
```
Ziko → Fares: "Here's the plan. Approve / Modify / Reject?"
```
**NOTHING PROCEEDS UNTIL FARES SAYS "APPROVE"**

If "Modify" → Ziko adjusts and re-presents
If "Reject" → Back to drawing board
If "Approve" → Phase 4 begins

### Phase 4: DESIGN
1. Hady (Design Lead) → Creates wireframes, mockups, UX flows
2. Design review → Ziko presents to Fares for approval
3. Once approved → Specs handed to Omar

### Phase 5: BUILD
Omar (CTO) breaks approved design into tasks:

```
Omar assigns:
├── Sara (Frontend) → UI implementation
├── Ali (Backend) → APIs, database, auth
├── Yasser (Full Stack) → End-to-end features / FlashInference
├── Mostafa (Tech Lead) → Code reviews, standards
├── Bassem (DevOps) → CI/CD, deployment, hosting
└── Security checks throughout
```

Build cycle:
1. Developers build → commit
2. Mostafa reviews code quality
3. Omar reviews architecture fit
4. Farah (QA) tests everything

### Phase 6: QA GATE
```
Farah (QA): "Green Light" or "Blocked — here are the bugs"
```
- If bugs → back to devs
- If green → Phase 7

### Phase 7: DEPLOYMENT
1. Bassem deploys to staging
2. Ziko presents staging link to Fares
3. **Fares approves production deploy**
4. Bassem deploys to production

### Phase 8: DELIVERY
Ziko presents to Fares:
- ✅ Live link
- 📄 Documentation
- 📊 Tracking/analytics plan
- 🔄 Suggested next iterations

### Phase 9: GROWTH (Marketing kicks in)
Once live, Karim's squad activates:
- Sami → SEO optimization
- Maya → Content creation
- Salma → Client outreach (if client work)
- Nour → Social media promotion
- Rami → Conversion optimization
- Tarek → Retention monitoring

## Key Principles
1. **Fares approves at every major gate** (plan, design, deploy)
2. **No code before approved spec**
3. **No deploy before QA green light**
4. **No production before Fares sees staging**
5. **All progress tracked in PMS**
