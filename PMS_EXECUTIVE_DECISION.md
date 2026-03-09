# PMS Executive Decision Document
**Date:** 2026-02-22 | **Author:** Main Agent (Product Owner)

---

## Executive Summary

We have 35+ features built but **zero revenue capability**. Stripe billing is the critical blocker. Every day without it is a day we can't charge users already on the platform. Client portal is our moat, AI agent actions our differentiator — but neither matters without billing.

**Decision: Ship billing first. Period.**

---

## 1. Sprint Plan — Next 4 Weeks

### Sprint 1 (Weeks 1–2): Stripe Billing — "Turn On Revenue"
- Stripe integration (subscriptions, webhooks, customer portal)
- 3 pricing tiers: Free, Pro ($15/user/mo), Business ($25/user/mo)
- Usage limits enforcement per tier
- Upgrade/downgrade flows
- Invoice generation & receipts
- Trial period (14-day Pro trial for new signups)

### Sprint 2 (Week 3): Client Portal — "The Moat"
- Branded client-facing portal (white-label ready)
- Client can view projects, invoices, files, messages
- Client approval workflows (deliverables sign-off)
- Restricted permissions layer (clients see only their data)

### Sprint 3 (Week 4): AI Agent Actions + Polish — "The Differentiator"
- AI-powered task suggestions & auto-assignment
- Smart scheduling (deadline conflict detection)
- Natural language project queries ("show overdue tasks for Client X")
- Bug fixes, performance, onboarding UX polish

---

## 2. Resource Allocation (18 Agents)

| Sprint | Focus Area | Agents | Roles |
|--------|-----------|--------|-------|
| S1 | Stripe Billing | 8 | 2 backend (API/webhooks), 2 frontend (checkout/portal UI), 1 database (schema/migrations), 1 testing, 1 security (PCI compliance), 1 DevOps (env/keys/deploy) |
| S1 | Client Portal (pre-work) | 3 | 1 design (wireframes), 1 backend (API scaffolding), 1 frontend (component shell) |
| S1 | Maintenance & Support | 3 | Bug fixes, monitoring, existing feature stability |
| S1 | AI Agent Actions (R&D) | 2 | Prompt engineering, prototype action framework |
| S1 | QA & Documentation | 2 | End-to-end test suite, user docs, API docs |

Sprint 2 shifts 6 agents to client portal. Sprint 3 shifts 5 to AI actions.

---

## 3. Definition of Done — Sprint 1 (Stripe Billing)

Billing is **done** when ALL of the following are true:

- [ ] User can subscribe to Free, Pro, or Business from the app
- [ ] Stripe Checkout session creates subscription correctly
- [ ] Webhooks handle: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Feature gating enforced (Free users hit limits, upgrade prompts shown)
- [ ] User can upgrade/downgrade mid-cycle (proration works)
- [ ] User can cancel (access continues until period end)
- [ ] Stripe Customer Portal accessible for self-service billing management
- [ ] Invoices and receipts emailed automatically
- [ ] 14-day Pro trial activates for new signups (no card required)
- [ ] Admin dashboard shows MRR, subscriber count, churn
- [ ] Tested with Stripe test mode end-to-end (happy path + failure paths)
- [ ] Security review passed (no API keys exposed, webhook signature verification)
- [ ] Deployed to production with Stripe live keys

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stripe webhook failures / missed events | Medium | High | Idempotent handlers, webhook retry queue, reconciliation cron job |
| Scope creep (adding enterprise tier, usage billing) | High | Medium | Strict 3-tier scope. Enterprise is post-launch. |
| PCI compliance gaps | Low | Critical | Use Stripe Checkout (hosted) — we never touch card data |
| Existing users resist paying | Medium | High | Generous free tier, 14-day trial, grandfather early adopters for 3 months |
| Client portal delays Sprint 2 | Medium | Medium | Pre-work in Sprint 1 (3 agents on scaffolding) reduces risk |
| AI features underwhelm | Medium | Low | Ship as "beta" — sets expectations, gathers feedback |
| Key agent unavailability | Low | High | Cross-train: no single-agent dependency on billing code |

---

## 5. Revenue Projections — First 6 Months

**Assumptions:**
- Launch billing end of Week 2 (March 8, 2026)
- Current user base: ~200 accounts (from 35+ features already live)
- Conversion: 15% to Pro, 5% to Business in month 1, growing 20% MoM
- New signups: 50/month growing to 150/month by month 6
- Churn: 5%/month

| Month | Total Users | Free | Pro ($15) | Business ($25) | MRR |
|-------|------------|------|-----------|----------------|-----|
| 1 (Mar) | 250 | 200 | 30 | 12 | **$750** |
| 2 (Apr) | 310 | 230 | 48 | 19 | **$1,195** |
| 3 (May) | 385 | 270 | 70 | 28 | **$1,750** |
| 4 (Jun) | 475 | 310 | 100 | 40 | **$2,500** |
| 5 (Jul) | 580 | 350 | 138 | 55 | **$3,445** |
| 6 (Aug) | 700 | 390 | 185 | 75 | **$4,650** |

**6-month cumulative revenue: ~$14,290**

*Conservative model. Client portal launch (month 2) and AI features (month 3) should accelerate Pro/Business conversion significantly. With client portal as moat, Business tier conversion could 2x.*

---

## 6. The Decision: Billing First or Client Portal First?

### **RECOMMENDATION: Billing First** ✅

**Reasoning:**

1. **Revenue unlocks everything.** 35 features with $0 revenue = expensive hobby. Billing converts it to a business overnight. Even $750 MRR in month 1 validates the product.

2. **Client portal without billing = free feature for free users.** Building the moat before the gate means users enjoy premium features with no incentive to pay.

3. **Billing informs portal design.** Once we know what's Free vs Pro vs Business, the client portal naturally tier-gates itself. Building portal first means retrofitting permissions later.

4. **Psychological momentum.** First paying customer changes team energy. Revenue, even small, proves market fit and justifies continued investment.

5. **Client portal is Sprint 2, not "someday."** We're not deprioritizing it — it's 2 weeks away. And 3 agents start pre-work in Sprint 1.

**The only argument for portal-first** is if we had a specific enterprise deal waiting on it. We don't. Ship billing.

---

## Action Items — This Week

1. **Today:** Finalize Stripe account setup, confirm API keys in env
2. **Day 1-2:** Database schema for subscriptions, plans, invoices
3. **Day 2-3:** Stripe Checkout integration + webhook handlers
4. **Day 3-4:** Feature gating middleware + tier enforcement
5. **Day 5:** Billing UI (plan selection, upgrade/downgrade, receipts)
6. **Week 2:** Testing, security review, Stripe Customer Portal, deploy

---

*This document is the source of truth for PMS product direction. Review weekly.*
