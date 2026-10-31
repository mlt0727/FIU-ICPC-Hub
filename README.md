# FIU ICPC Hub

A mobile-first web app for running contest day at FIU: the ICPC regional contest on **Saturday, November 7, 2026**.

Live site: https://fiu-icpc-hub.vercel.app

## Why this exists

Contest day involves about 50 volunteers, many contestants and coaches, and a schedule that changes by the hour. Before this app, the plan lived in a spreadsheet:

- **Volunteers had to dig through a shared spreadsheet** to find their own shifts, and many don't have it open on their phone during the day.
- **Many volunteers aren't CS students.** Some have never heard of a programming contest, so instructions need to be plain and obvious.
- **People miss things.** Shifts start and end all day, and announcements sent in a group chat get buried.
- **Nobody should need an account or an app store.** Volunteers get one link, and that's it.

The goal: every volunteer opens one personal link and sees exactly what they need to do, where, and when. They get a reminder before each task, and organizers can reach everyone at once.

## What it does

**For everyone (contestants, coaches, volunteers)**: the main page `/`

- The day's schedule, with the current item highlighted (Now / Next / Done)
- A floor plan of the venue (PG6) with rooms highlighted
- Where lunch is, with directions back to the contest area

**For volunteers**: a personal page, for example `/jane-doe`

- Name, arrival and leave times, and total hours
- One card per task: time, task name, location. The task happening right now has an amber outline.
- "Show on map" for each location, and step-by-step instructions where they exist
- Push notifications 10 minutes before each task, plus announcements from the organizers
- Works as a Home Screen app on iPhone and Android, and remembers who you are

**For organizers**: a password-protected admin page `/admin`

- Send an announcement: shown on every volunteer page and pushed to every phone that has notifications on
- Edit task locations and instructions
- Add volunteers, and change anyone's shifts or hours
- See the whole plan in one table, by task or by person

## Design principles

- **Plain language.** Everyday words ("Now", "Next", "Done"), no contest jargon.
- **One card, three facts.** Time, task, location. Everything else is one tap away.
- **Phone first.** Built for a 375 px screen, then checked on larger ones. Dark theme, high contrast, large tap targets.
- **No logins for volunteers.** A personal link is enough. The links are not secret; seeing someone else's schedule is fine.
- **Push is a bonus, not the only channel.** Notifications can be silenced by Focus mode, so announcements always appear on the page too.

## How it works

```
Excel roster ──import──▶ Postgres (Neon) ◀── admin page edits
                              │
                              ▼
                 Next.js app on Vercel (server-rendered pages)
                              │
         ┌────────────────────┼─────────────────────┐
         ▼                    ▼                     ▼
   main page /       personal page /name     push notifications
                                                    ▲
             cron-job.org calls /api/cron/reminders every minute
```

A few decisions worth knowing:

- **One web app manifest per volunteer.** On iPhone, a Home Screen app doesn't share cookies with Safari, and notifications only work from the Home Screen. So each personal page links its own manifest whose `start_url` is that person's page: the Home Screen icon always knows who it belongs to.
- **Reminders without a paid plan.** Vercel's free plan only runs cron jobs once a day, so an external scheduler (cron-job.org) calls a protected endpoint every minute. Each shift is claimed and marked in a single SQL `UPDATE`, so nobody gets the same reminder twice.
- **All times are stored as exact moments** (`timestamptz`) and shown in New York time, whatever time zone the phone is set to.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with TypeScript and React 19
- [Neon](https://neon.tech) serverless Postgres, plain SQL with `@neondatabase/serverless` (no ORM)
- [Vercel](https://vercel.com) hosting; pushes to `main` deploy automatically
- Web Push with VAPID (`web-push`) and a service worker (`public/sw.js`)
- `exceljs` to import the volunteer roster

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and the other values
npm run db:migrate           # create the tables (safe to re-run)
npm run dev                  # http://localhost:3000
```

Useful commands:

| Command | What it does |
|---|---|
| `npm run db:import -- "roster.xlsx" [--reset]` | Import the volunteer roster from Excel |
| `npm run db:details` | Load task locations and instructions from `data/task-details.json` |
| `npm run links` | Export every volunteer's personal link to `volunteer-links.csv` |
| `npm run build` / `npm run typecheck` | Check the app builds, as Vercel does |

Tip: add `?now=2026-11-07T14:00-05:00` to any page URL to preview it as if it were that moment on contest day.

Environment variables (see `.env.example`): `DATABASE_URL`, `EVENT_DATE`, `EVENT_TZ`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, `ADMIN_PASSWORD`.

The volunteer roster and the exported links contain personal names, so they are kept out of git.

## Project layout

```
app/          pages and API routes (the folder path is the URL)
components/   pieces of the pages (task cards, map, reminder button, ...)
lib/          shared server code (database, time zones, push, admin login)
data/         hand-edited content (task locations, instructions, event schedule)
db/           database schema and extra seed data
scripts/      command-line tools (import, export, self-checks)
public/       service worker and the venue floor plan
docs/         detailed write-ups (in Chinese), starting with docs/overview.md
```
