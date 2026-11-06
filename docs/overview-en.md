# FIU ICPC Hub: Technical Overview (Main Documentation)

This document is the main entry point to the project documentation. Start here to understand how the different parts of the application work together. For a more detailed explanation of a specific area, follow the links to the documents below.

**Live site:** https://fiu-icpc-hub.vercel.app  
**Contest day:** November 7, 2026 (America/New_York time)

## Documentation Index

| Document | Description |
|---|---|
| [step-1-explained.md](step-1-explained.md) | The five database tables, importing the Excel roster, and correction rules in `data/` |
| [step-2-explained.md](step-2-explained.md) | Volunteer profile pages, cookies, Home Screen manifests and icons, link exports, locations, maps, and task instructions |
| [step-3-explained.md](step-3-explained.md) | The main page (`/`): contest-day schedule, venue map, lunch directions, and the two navigation tabs |
| [step-4-explained.md](step-4-explained.md) | Push notifications: service worker, subscriptions, test notifications, and pre-task reminders |
| [admin-explained.md](admin-explained.md) | The admin dashboard (`/admin`): sign-in, announcements, editing locations and shifts, adding volunteers, and the overview table |
| [task-instructions-draft.md](task-instructions-draft.md) | Draft instructions for each task (English and Chinese; pending confirmation) |
| [../design-system/icpc-checkpoint/MASTER.md](../design-system/icpc-checkpoint/MASTER.md) | Design system: colors, fonts, and card styles |
| [../CLAUDE.md](../CLAUDE.md) | Project handoff notes: progress, outstanding work, rules, and deployment information |

## How Everything Connects

```text
Excel roster ──(npm run db:import)──▶ Neon database ◀──(edits from /admin)
                                           │
                                           ▼
                  Next.js application hosted on Vercel
                  (server queries the database and renders pages)
                                           │
                   ┌───────────────────────┼───────────────────────┐
                   ▼                       ▼                       ▼
            Main page `/`         Volunteer page `/[slug]`    Push notifications
              (everyone)               (volunteers)                (phones)
                                                                    ▲
                  cron-job.org calls /api/cron/reminders every minute ┘
                  (sends reminders 10 minutes before each task)
```

**What happens when a volunteer opens their personal page** (for example, `/lingtong-meng`):

1. The phone requests the page URL. Vercel runs `app/[slug]/page.tsx`.
2. The page calls `lib/schedule.ts` to query the database and retrieve that volunteer's information and assigned shifts.
3. `components/volunteer-view.tsx` assembles the volunteer's name, arrival and departure times, and task cards into the page. It also inserts a **Check in** card (PG6 112) at the beginning, based on the volunteer's arrival time. `lib/time.ts` handles time formatting.
4. Once the page reaches the phone:
   - `task-list.tsx` uses the phone's clock to identify tasks as **Now**, **Next**, or **Done**.
   - `remember-me.tsx` saves a cookie to remember the volunteer.
   - `notify-button.tsx` displays the button for enabling notifications.

## Project Structure and File Responsibilities

### `app/` — Pages and API Routes

In Next.js App Router, the folder structure determines the URL paths.

| File | URL | Purpose | Details |
|---|---|---|---|
| `layout.tsx` | All pages | Shared page layout, including fonts, page titles, and iPhone settings | step-2 |
| `globals.css` | — | Global styles, consistent with the project's design system | step-2 |
| `page.tsx` | `/` | Main page with the schedule, map, and lunch information; the same for everyone | step-3 |
| `[slug]/page.tsx` | `/[slug]` | Personal page for each volunteer | step-2 |
| `not-found.tsx` | Invalid URLs | Displays the "Page not found" screen | step-2 |
| `manifest/route.ts`, `manifest/[slug]/route.ts` | `/manifest`, `/manifest/[slug]` | Generate Home Screen app manifests, including a volunteer-specific version | step-2 |
| `icons/[size]/route.tsx` | `/icons/180`, etc. | Generate Home Screen icons programmatically | step-2 |
| `api/push/subscribe/route.ts` | `/api/push/subscribe` | Store a device's push-notification subscription | step-4 |
| `api/push/test/route.ts` | `/api/push/test` | Send a test notification to the current device | step-4 |
| `api/cron/reminders/route.ts` | `/api/cron/reminders` | Protected endpoint called every minute to send reminders before tasks | step-4 |
| `admin/page.tsx` | `/admin` | Admin dashboard home: sign-in, announcements, and task locations | admin |
| `admin/[slug]/page.tsx` | `/admin/[slug]` | Edit an individual's shifts and arrival/departure times | admin |
| `admin/overview/page.tsx` | `/admin/overview` | View all assignments, grouped by task or by person | admin |
| `admin/actions.ts` | — | Server-side actions triggered by Save buttons in the admin interface | admin |

### `components/` — Reusable UI Components

| File | Purpose | Details |
|---|---|---|
| `volunteer-view.tsx` | Volunteer interface: name, total hours, reminder panel, and task cards | step-2 |
| `task-list.tsx` | Task cards; uses the phone's clock for Now / Next / Done and provides expandable maps and instructions | step-2 |
| `remember-me.tsx` | Writes a cookie when a volunteer opens their personal page | step-2 |
| `room-map.tsx` | PG6 floor plan with the relevant room highlighted | step-2 |
| `instructions.tsx` | Displays task instructions, including headings, steps, and key points | step-2 |
| `volunteer-nav.tsx` | Two navigation tabs shown only to volunteers: **My schedule** and **Contest day** | step-3 |
| `notify-button.tsx` | The **Turn on reminders** button and its various states | step-4 |
| `announcements.tsx` | Displays the latest announcements at the top of the page | admin |
| `auto-refresh.tsx` | Refreshes the page every minute so announcements and updates appear without a manual reload | admin |
| `admin-forms.tsx` | Handles the **Saving…** state and feedback messages in admin forms | admin |

### `lib/` — Shared Application Logic

These files contain shared logic that does not directly render on the page.

| File | Purpose | Details |
|---|---|---|
| `db.ts` | Database connection; the single shared entry point for database access | step-1 |
| `slug.ts` | Converts names into URL slugs (for example, `Isabel González Lopez` → `isabel-gonzalez-lopez`) | step-1 |
| `schedule.ts` | Retrieves a volunteer's details and all assigned shifts | step-2 |
| `time.ts` | Time formatting (`8:00 AM`), New York time-zone conversion, and advance reminder calculations | step-2 |
| `manifest.ts` | Generates app manifests; the app name (`APP_NAME`) is defined here | step-2 |
| `rooms.ts` | Defines room locations on the floor plan and maps location labels to rooms | step-2 |
| `instructions.ts` | Parses instruction text into headings and lists | step-2 |
| `event.ts` | Reads the contest-day schedule for the main page | step-3 |
| `push.ts` | Sends push notifications | step-4 |
| `push-subscription.ts` | Validates push-subscription data submitted by phones | step-4 |
| `admin-auth.ts` | Handles admin password authentication and cookie signing | admin |

### `data/` — Manually Maintained Content

| File | Purpose | What to do after editing |
|---|---|---|
| `task-details.json` | Task locations, instructions, and volunteer-specific location assignments | Run `npm run db:details` |
| `instructions/*.md` | Source Markdown files for longer task instructions | Run `npm run db:details` |
| `event-schedule.json` | Contest-day schedule displayed on the main page | Push the change to GitHub |
| `corrections.json` | Corrections for known errors in the Excel roster | Changes take effect on the next import |
| `all-hands.json` | Rules for mandatory attendance at Orientation | Changes take effect on the next import |

### `db/` — Database

| File | Purpose |
|---|---|
| `schema.sql` | Database schema containing the `volunteers`, `tasks`, `shifts`, `announcements`, and `push_subscriptions` tables |
| `extra-volunteers.sql` | Volunteers added outside the original Excel roster (for example, Talin Malki) |
| `test-lingtong.sql` | Test account for Lingtong |

### `scripts/` — Local Command-Line Utilities

| Command | File | Purpose |
|---|---|---|
| `npm run db:migrate` | `migrate.ts` | Creates database tables; safe to run more than once |
| `npm run db:import -- "roster.xlsx" [--reset]` | `import-excel.ts` | Imports the volunteer roster from Excel |
| `npm run db:details` | `apply-task-details.ts` | Writes the contents of `task-details.json` to the database |
| `npm run links` | `export-links.ts` | Exports personal volunteer URLs to `volunteer-links.csv` |
| `npx tsx scripts/check-*.ts` | `check-time` / `check-rooms` / `check-instructions` / `check-push-subscription` | Runs self-checks after changes to the corresponding code, helping catch regressions |

### Other Files and Directories

| File or directory | Purpose |
|---|---|
| `public/sw.js` | Service worker that receives push messages and displays notifications in the background on phones |
| `public/pg6-map.webp` | PG6 venue floor plan |
| `proxy.ts` | Supports signing into the admin dashboard through `/admin?key=<password>` |
| `README.md` | English project introduction: why it exists, what it does, and how to run it; displayed on the GitHub repository homepage |
| `.env.local` | Real credentials and passwords (excluded from Git); `.env.example` provides a placeholder template |
| `.claude/skills/` | Local copy of the `ui-ux-pro-max` design skill (excluded from Git); the global version is stored in `~/.claude/skills/` |
| `AGENTS.md` | Instructions for AI coding agents to consult the documentation before working with this newer version of Next.js |
| `package.json` | Project dependencies and definitions of the `npm run` commands listed above |

## External Services

| Service | Role |
|---|---|
| **Neon** (project `academy`, database `icpc_day`) | Stores all application data |
| **Vercel** (project `fiu-icpc-hub`) | Hosts the web app; pushes to GitHub's `main` branch deploy automatically. Environment variables: `DATABASE_URL`, `EVENT_DATE`, `EVENT_TZ`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, `ADMIN_PASSWORD` |
| **GitHub** (`mlt0727/FIU-ICPC-Hub`) | Hosts the source code |
| **cron-job.org** | Calls `/api/cron/reminders` every minute on contest day |
| **Apple / Google push services** | Deliver push notifications to mobile devices |

## Quick Reference: Common Tasks

| Task | How to do it |
|---|---|
| Send an announcement | Open `/admin` → Announcements |
| Change a task's location | Edit it in `/admin`, or update `task-details.json` and then run `npm run db:details` |
| Change someone's shifts or add a volunteer | Open `/admin/[slug]` to edit their shifts, or add a volunteer from `/admin` |
| View the full volunteer schedule | Open `/admin/overview` |
| Update the schedule on the main page | Edit `data/event-schedule.json` and push the change to GitHub |
| Preview a specific time on contest day | Append `?now=2026-11-07T14:00-05:00` to the page URL |
| Re-export personal volunteer links | Run `npm run links` (close the CSV in Excel first if it is open) |
