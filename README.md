# FIU ICPC Volunteer Hub

A proposed web-based platform for organizing ICPC volunteers, event schedules, assignments, locations, and announcements at Florida International University (FIU).

> **Document status:** The feature descriptions below are based on the project whiteboard and may include planned functionality. The technology and setup instructions are based on the existing FIU ICPC Hub codebase.

## Overview

The **FIU ICPC Volunteer Hub** provides volunteers with a single place to view their responsibilities and gives event administrators a central portal for managing volunteers and schedules.

**Core concept:** Every student or volunteer receives a **unique link** that opens their personalized dashboard. Administrators use a separate portal to manage the event.

## User Roles

| Role | Purpose |
| --- | --- |
| **Volunteer / Student** | View event schedules, assigned tasks, locations, instructions, and announcements. |
| **Administrator** | Manage volunteers, assignments, schedule details, and announcements. |

## Volunteer Features

### 1. Personalized Access

- Open the Volunteer Hub through a unique personal link.
- View the assignments and schedule associated with that volunteer.

### 2. Event Schedule and Venue Maps

- View the complete schedule for the event day.
- Access the venue map associated with each event.
- See the scheduled start and end times of personally assigned shifts, including the times originally signed up for.

### 3. Task and Assignment Details

- View a personal list of assigned jobs or duties.
- Open each assignment to see:
  - Task or job name.
  - Scheduled start and end times.
  - Location or venue.
  - Relevant map.
  - Instructions, when provided.

### 4. Self-Test

- Provide a **self-test button** so volunteers can verify that the app is working for them.
- The exact behavior of the self-test is still to be defined.

### 5. Announcements

- Receive announcements published by administrators.
- View current and previous announcements for as long as administrators have not deleted them.

### 6. Automatic Reminders

- Send an automatic reminder **10 minutes before the volunteer's next assigned event or shift**.
- The reminder delivery method is to be determined.

## Administrator Features

### 1. Admin Portal

- Provide a separate link to open the administrative portal.
- Restrict administrative actions to authorized administrators.

### 2. Volunteer and Assignment Management

- View volunteers grouped by task or job.
- View all tasks assigned to an individual volunteer.
- Manually add a volunteer and assign duties to them.
- Edit an individual volunteer's duties and scheduled times.
- **Do not automatically reassign volunteers** when administrators edit assignments; reassignment must be an explicit administrative action.

### 3. Job and Venue Management

- Change the venue or location for a job when needed.
- Update job instructions when needed.
- Ensure updated details are available to affected volunteers.

### 4. Announcement Management

- Create and send announcements to volunteers.
- Delete announcements that should no longer be displayed.
- Keep past announcements visible until they are deleted by an administrator.

## Communication Channels

| Channel | Intended use | Direction |
| --- | --- | --- |
| **ICPC Volunteer Hub** | Official event announcements and schedule information | One-way announcements from administrators to volunteers |
| **WhatsApp** | Questions, discussions, and coordination | Two-way conversations |

The Volunteer Hub is intended to complement WhatsApp, not replace two-way messaging.

## Data Requirements

The platform needs to store and connect the following information:

| Data | Description |
| --- | --- |
| **Volunteers** | Student/volunteer names and unique dashboard links. |
| **Events** | Event names, dates, times, venues, and associated maps. |
| **Tasks / Jobs** | Volunteer duties, locations, and any instructions. |
| **Assignments** | Which volunteer is assigned to which event/task, and the corresponding shift start and end times. |
| **Student Hours** | Hours associated with each student or volunteer; the counting method needs clarification. |
| **Announcements** | Admin-posted messages and whether they remain visible. |

### Suggested Data Relationships

```text
Volunteer
  ├── Unique dashboard link
  ├── Assignments
  │     ├── Event
  │     ├── Task / job
  │     ├── Start and end times
  │     └── Location and instructions
  └── Student hours

Event
  ├── Date and time
  ├── Venue and map
  └── Assignments

Announcement
  ├── Content
  ├── Created by administrator
  └── Visibility / deletion status
```

This is a conceptual model, not a finalized database schema.

## Typical Workflows

### Volunteer Workflow

1. Open the unique dashboard link.
2. Review the full event-day schedule and venue maps.
3. Check personal shift times and assigned jobs.
4. Open a job to review its location and instructions.
5. Read announcements and receive a reminder before the next assigned shift.

### Administrator Workflow

1. Open the admin portal.
2. Review the volunteer roster by task or volunteer.
3. Add volunteers or update duties, shift times, locations, and instructions as needed.
4. Publish or delete announcements.
5. Verify that changes are reflected in the relevant volunteer dashboards.

## Key Rules

- Every volunteer must have their own unique dashboard link.
- Volunteers should be able to see both the full event-day schedule and their personal assignments.
- Edits to duties or shift times must **not trigger automatic reassignment**.
- Previously posted announcements remain visible unless deleted by an administrator.
- Reminders are scheduled for **10 minutes before** the next assigned event or shift.
- The Volunteer Hub is a **one-way announcement platform**; WhatsApp handles back-and-forth conversations.

## Tech Stack

The following stack is used by the existing [FIU ICPC Hub repository](https://github.com/mlt0727/FIU-ICPC-Hub).

| Component | Technology | Purpose |
| --- | --- | --- |
| **Frontend and backend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), and TypeScript | Responsive volunteer pages, admin portal, and server-side routes. |
| **Database** | [Neon PostgreSQL](https://neon.tech/) with `@neondatabase/serverless` | Store volunteer, schedule, assignment, and announcement data using SQL. |
| **Hosting and deployment** | [Vercel](https://vercel.com/) | Host the application and deploy changes from the `main` branch. |
| **Notifications** | Web Push (VAPID), `web-push`, and a service worker | Deliver push announcements and shift reminders to subscribed devices. |
| **Reminder scheduler** | [cron-job.org](https://cron-job.org/) | Call the protected reminder endpoint on a recurring schedule. |
| **Data import** | `exceljs` | Import the volunteer roster from Excel. |
| **Package management** | Node.js and npm | Install dependencies and run the project scripts. |

## Open Online or Run Locally

### Option 1: Open Online

**Project deployment:** [https://fiu-icpc-hub.vercel.app](https://fiu-icpc-hub.vercel.app)

The deployment URL is taken from the existing project repository. The main routes are:

- **Main event dashboard:** [`/`](https://fiu-icpc-hub.vercel.app/) — event schedule and venue information.
- **Personal volunteer dashboard:** `/<volunteer-slug>` — individual tasks, times, and instructions. Volunteers should use their assigned personal links.
- **Admin portal:** [`/admin`](https://fiu-icpc-hub.vercel.app/admin) — restricted to authorized administrators.

### Option 2: Run Locally

**Prerequisites:** Git, Node.js 20.9 or newer, npm, access to the GitHub repository (which is private), and the required environment credentials. A separate development database is recommended.

**1. Clone the repository and install dependencies:**

```bash
git clone https://github.com/mlt0727/FIU-ICPC-Hub.git
cd FIU-ICPC-Hub
npm install
```

**2. Create a local environment file:**

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

On macOS, Linux, or Git Bash:

```bash
cp .env.example .env.local
```

Edit `.env.local` and supply the appropriate values. The template includes `DATABASE_URL`, `EVENT_DATE`, `EVENT_TZ`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, and `ADMIN_PASSWORD`. **Never commit `.env.local` or share credentials.**

**3. Prepare the database and start the development server:**

```bash
npm run db:migrate
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. The admin page is at `http://localhost:3000/admin`.

> **Note:** Run migrations against a database you are authorized to change; use a separate development database where possible. Automatic reminders also depend on the external scheduler and valid push configuration, not just the local web server.

### Useful Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm run typecheck` | Check TypeScript types. |
| `npm run db:migrate` | Apply the database schema. |
| `npm run db:import -- "roster.xlsx"` | Import a volunteer roster from Excel. |
| `npm run db:details` | Apply task locations and instructions. |
| `npm run links` | Export volunteers' individual dashboard links. |

For additional implementation details, see the repository's [technical overview](https://github.com/mlt0727/FIU-ICPC-Hub/blob/main/docs/overview-en.md).
