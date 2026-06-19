# TOASTMASTERS CONNECT — SUPER APP ROADMAP

## PHASE 0 — Registration & Member Approval (Immediate)
- **Invite code system:** Admins generate invite codes; users must enter one to register
- **Pending approval queue:** New registrations are `isActive: false` until approved
- **Members page:** Show pending users with Approve/Reject actions
- **Notifications:** Alert officers when someone registers
- **Roster:** Only shows approved/active members

## PHASE 1 — Secretary Console (Replaces AI MOM)
- **Remove** all AI/Gemini MOM generation (`POST /api/gemini/generate-mom`, Gemini SDK, AI button)
- **Repurpose Archive.tsx** into a Secretary's Console showing:
  - **Agenda timeline** — each item with a textarea for secretary's notes
  - **Timer report** — inline table of speaker timings
  - **Evaluations** — per-speaker expandable scorecards
  - **Grammarian report** — WOD/POD usage, elegant phrases, mistakes
  - **Ah-Counter report** — filler word totals per speaker
  - **Voting results** — poll winners
  - **Attendance** — members present + guest list
- Secretary types commentary per agenda item; saves as structured MOM
- Keep PDF export, approval/sign-off flow

## PHASE 2 — Production Deployment & DevOps
- Docker multi-stage build
- GitHub Actions CI/CD
- Graceful shutdown handlers
- CORS lockdown, JWT_SECRET enforcement
- Rate limiting, HTTPS enforcement

## PHASE 3 — Multi-Club & Tenant Isolation
- Club model (name, slug, timezone, logo, settings)
- Club signup flow
- All data scoped by `clubId`
- Super admin management
- Member transfer between clubs

## PHASE 4 — Email & Notification System
- SMTP integration
- Meeting reminders, role assignment alerts
- Guest follow-up, MOM distribution
- In-app notification bell

## PHASE 5 — Education & Pathways Tracker
- Pathways level tracking (Level 1-5 + DTM)
- Speech project library
- Progress dashboard
- Evaluation-to-Pathways linking
- DCP goal tracking

## PHASE 6 — Dues, Finance & Membership Lifecycle
- Membership types, dues tracking
- Payment recording
- Renewal reminders
- Member status lifecycle
- Expense tracking, P&L report

## PHASE 7 — Contests & Special Events
- Speech contest module
- Contestant registration, judge scoring
- Timer lights, results/ranking
- Certificate generation, district data export

## PHASE 8 — Public Club Website & Guest Management
- Public landing page
- Meeting calendar, guest RSVP
- Guest check-in
- Club blog/news
- SEO optimization

## PHASE 9 — Mobile & PWA Enhancement
- Touch-optimized timer
- Offline-first support
- Push notifications
- Install prompt
- Responsive sidebar, camera integration

## PHASE 10 — Integrations & API
- Public REST API with API keys
- Slack bot, Google Calendar sync
- Zoom/Meet link management
- Discord webhook, TI Central API

## PHASE 11 — Analytics & Insights
- Member journey map
- Speech analytics
- Club health score
- AI coaching recommendations
- CSV/Excel export

## PHASE 12 — Tech Debt & Hardening
- Test suite (Vitest + Playwright)
- Error boundaries, structured logging
- Input validation (Zod)
- Remove dead code
- Fix Gemini model string
- Consolidate duplicate components
- Swagger/OpenAPI docs
