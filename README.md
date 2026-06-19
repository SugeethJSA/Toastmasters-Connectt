# Toastmasters Connect

> A full-featured club management platform for Toastmasters clubs — meeting orchestration, member administration, education tracking, club governance, and finance, all in one place.

---

## Vision

Toastmasters Connect is built on a simple premise: **club officers should spend their time mentoring members, not wrestling spreadsheets.**

Every Toastmasters club runs on the same cycles — weekly meetings, role assignments, membership dues, education awards, distinguished club goals. Yet most clubs patch together Google Sheets, email chains, and standalone timer apps to keep things running. Toastmasters Connect replaces that fragmentation with a single, real-time platform that models the full club lifecycle.

Whether you're the Toastmaster of the Day running a meeting, the Secretary sealing the minutes, the Treasurer tracking dues, or the VP Education monitoring Pathways progress — everything lives in one place, scoped to your club, accessible from any device.

---

## What It Does

Toastmasters Connect is organized around five functional hubs:

### Meeting Conductor
The control room for running a meeting. Includes:
- **Stage View** — Full-screen presentation mode with live timer, spotlight on the current speaker, table topics display, role call, and guest roll
- **TMOD Cockpit** — Toastmaster of the Day command center with drag-and-drop timeline, spotlight controls, and timer presets
- **Role Players** — Dedicated panels for Timer (stopwatch + log), Ah Counter (filler-word tracker), Grammarian (word/phrase usage), and Table Topics Master (prompt management)
- **Agenda Builder** — Drag-and-drop meeting agenda editor with unlimited speaker/evaluator slots, custom items, presiding officer field, and save-to-meeting sync

### Education
Track member progress through the Pathways learning experience:
- **Speech Evaluations** — Standard 7-competency evaluation form (clarity, vocal variety, eye contact, gestures, audience awareness, comfort level, subject matter) with positive/improvement/challenge sections
- **General Evaluator Report** — Meeting-level assessment with per-role-player ratings and feedback
- **Pathways Dashboard** — Track 20 official pathway names, levels 1–5, project completion, and education awards (CC, CL, ACB, ACS, DTM, etc.)

### People
Complete member and guest lifecycle management:
- **Club Roster** — Registered members list, role assignment to meetings, attendance check-in
- **Guest CRM** — Guest tracking with source, home club, visit history, follow-up status (pending/contacted/joined/not_interested), interests, and notes
- **Roles History** — Per-member role count across all meetings (current + archived), showing who has played what and when
- **Access Control** — User management with role-based permissions (member/officer/admin), approve/deny registration requests

### Club Records
Governance, archives, and performance analytics:
- **Archive & Minutes of Meeting** — Secretary console with timeline notes, timer logs, ah-counter logs, grammarian logs, evaluation records, voting results, attendance, narrative editorial summary, and PDF export
- **Ballot Controls** — Create and manage live polls (Best Speaker, Best Table Topics, Best Evaluator, Best Role Player, Custom), cast votes, view live results, approve MOM
- **Club Performance** — Analytics dashboard with meeting counts, timer/evaluation/attendance totals, approval rates, attendance trends, and recent milestones
- **DCP Tracker** — Distinguished Club Program progress across 10 standard goals in education, membership, training, and administration categories, with progress bars, current/target editing, and club status indicators (Standard / Distinguished / Select Distinguished / President's Distinguished)

### Finance & Data
Club financial management and data export:
- **Dues Tracking** — Per-member dues records with period, amount, paid/unpaid toggle, payment method, and notes
- **Expense Tracking** — Club expenses with description, amount, category, date, paid-by, and notes
- **CSV Exports** — One-click exports for members, guests, dues, expenses, pathways, and awards

### Additional Features
- **Meeting Templates** — Save and load meeting configurations (theme, word of day, timeline)
- **Club Settings** — Configure club name, meeting day/time, district, area, location, timezone, and link
- **Profile** — Member profiles with avatar URL, name, email, phone, quote, and password change
- **Notifications** — Role-assignment alerts with bell icon, unread badge, adaptive polling with exponential backoff, and optional SMTP email delivery
- **Responsive Design** — Mobile-friendly sidebar with slide-in navigation on small screens

---

## How It Helps Your Club

| Role | Benefit |
|---|---|
| **President** | Real-time visibility into meeting quality, member engagement, and DCP goal progress |
| **VP Education** | Track every member's Pathways progress, speech history, and education awards in one place |
| **VP Membership** | Guest CRM with follow-up tracking, attendance history, and membership growth metrics |
| **Secretary** | Consolidated MOM creation with all meeting logs, one-click archive, and PDF export |
| **Treasurer** | Dues and expense tracking with paid/unpaid status, CSV export for records |
| **Sergeant at Arms** | Ballot controls and live poll management for awards voting |
| **Toastmaster of the Day** | Full control room — timeline, timer, spotlight, role panels |
| **General Evaluator** | Dedicated report form to evaluate role players and the overall meeting |
| **Members** | View evaluations, track personal role history, manage profile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js + TypeScript |
| **Frontend** | React 19 + Vite + Tailwind CSS + Framer Motion |
| **Backend** | Express.js |
| **Database** | MongoDB + Mongoose (with in-memory fallback for zero-config development) |
| **Auth** | JWT (bcryptjs password hashing, cookie-based tokens) |
| **Real-time** | WebSocket (timer sync, spotlight, topic controls) |
| **Notifications** | Server-sent events + Nodemailer SMTP |
| **Containerization** | Docker + multi-stage build |
| **CI/CD** | GitHub Actions |
| **Icons** | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (optional — app runs with in-memory storage)

### Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000` with Express + Vite middleware. No separate Vite process needed.

### Default Credentials (Development)
| Email | Password | Role |
|---|---|---|
| admin@toastmasters.club | admin123 | admin |
| sarah@toastmasters.club | member123 | officer |
| audrey@toastmasters.club | member123 | member |
| david@toastmasters.club | member123 | member |

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes (prod) | dev-only fallback | JWT signing secret |
| `MONGODB_URI` | No | — | MongoDB connection string |
| `PORT` | No | `3000` | Server port |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS origins (comma-separated) |
| `SMTP_HOST` | No | — | SMTP server for email notifications |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | `noreply@toastmastersconnect.app` | From address |

### Production

```bash
JWT_SECRET=your-secret NODE_ENV=production npm run build
NODE_ENV=production npm start
```

Or via Docker:

```bash
docker build -t toastmasters-connect .
docker run -p 3000:3000 -e JWT_SECRET=your-secret toastmasters-connect
```

---

## Architecture

### Data Model
All data is scoped by `clubId`. Users register with an invite code and must be approved by an admin before they can log in. The key entities:

- **Club** — name, slug, district, area, timezone, meeting day/time, location
- **User** — email, name, role (member/officer/admin), club membership, profile fields
- **Meeting** — active meeting state with timeline, role players, logs, polls, attendance
- **ArchiveMeeting** — sealed minutes of meeting with all logs, evaluations, and approval status
- **Notification** — per-user notifications for role assignments and system events
- **Pathway** — per-member pathway tracking (level, projects completed, status)
- **EducationAward** — awards earned (CC, CL, ACB, ACS, DTM, etc.)
- **DuesRecord** — member dues payments
- **Expense** — club expenses
- **Guest** — visitor tracking with follow-up workflow
- **DcpGoal** — DCP goals with current/target tracking
- **MeetingTemplate** — reusable meeting configurations

### Key Design Decisions

- **Invite-code gated registration** — Only users with a valid invite code can register; admins approve each registration
- **In-memory fallback** — When MongoDB is unavailable, all operations work with in-memory arrays (ideal for development)
- **Single-page application** — All views render inside a single Dashboard component with animated transitions; only login/register/stage/vote are separate routes
- **Lifted state** — Meeting state lives in the Dashboard and flows down to views via props; a debounced sync persists to the server
- **Real-time sync** — WebSocket connection enables the standalone StagePage and VotePage to mirror live meeting state
- **Rate limiting** — Auth endpoints limited to 20 requests per 15 minutes; vote endpoints to 30 per minute

### Project Structure

```
├── server.ts              # Express app, all API routes, schemas, WebSocket
├── seed.ts                # Database seeding script
├── src/
│   ├── App.tsx            # Dashboard shell, routing, state management
│   ├── types.ts           # TypeScript interfaces
│   ├── mockData.ts        # Initial state defaults
│   ├── components/        # View components and shared UI
│   ├── pages/             # Route-level page components
│   ├── context/           # AuthContext, ThemeContext
│   └── hooks/             # useTimerSync, custom hooks
├── vite.config.ts         # Vite configuration with API proxy
├── Dockerfile             # Multi-stage production build
├── .github/workflows/     # CI pipeline
└── dist/                  # Production build output
```

---

## License

MIT
