-- Database schema for the ICPC day site.
-- Every statement is safe to run more than once ("if not exists"), so `npm run db:migrate` can be re-run.

-- One row per person who helps on the day.
create table if not exists volunteers (
  id          serial primary key,
  slug        text not null unique,          -- used in the URL: /isabel-gonzalez-lopez
  name        text not null,                 -- display name exactly as in the roster
  team        text not null default 'general' check (team in ('general', 'tech')),
  arrive_at   timestamptz,                   -- when they said they can arrive
  leave_at    timestamptz,                   -- when they said they must leave
  created_at  timestamptz not null default now()
);

-- One row per kind of job (Registration, Balloon Running, LUNCH, ...).
create table if not exists tasks (
  id            serial primary key,
  name          text not null unique,
  kind          text not null default 'duty',  -- 'duty' = work, 'break' = meals, 'meeting' = all-hands like Orientation
  location      text,                       -- e.g. "PG6 lobby"; filled from data/task-details.json or the admin page
  instructions  text,                       -- free text shown to every volunteer on this task
  created_at    timestamptz not null default now()
);

-- One row per "this volunteer does this task from X to Y". A volunteer usually has several.
create table if not exists shifts (
  id            serial primary key,
  volunteer_id  integer not null references volunteers(id) on delete cascade,
  task_id       integer not null references tasks(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  note          text,                       -- optional note for this one person only
  check (ends_at > starts_at)
);
-- Kept outside "create table" so the allowed kinds can change on a database that already exists.
alter table tasks drop constraint if exists tasks_kind_check;
alter table tasks add constraint tasks_kind_check check (kind in ('duty', 'break', 'meeting'));

create index if not exists shifts_volunteer_idx on shifts (volunteer_id, starts_at);
create index if not exists shifts_starts_idx on shifts (starts_at);

-- Messages the organizers post during the day. Also sent as push notifications (step 4).
create table if not exists announcements (
  id          serial primary key,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- One row per phone/browser that agreed to receive push notifications (filled in step 4).
create table if not exists push_subscriptions (
  id            serial primary key,
  volunteer_id  integer references volunteers(id) on delete cascade,  -- null = contestant / anonymous
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  created_at    timestamptz not null default now()
);

-- Step 4: when the "starts in 10 minutes" push was sent for this shift (null = not yet). Stops double reminders.
alter table shifts add column if not exists reminder_sent_at timestamptz;

-- Location for this one person's shift, when people on the same task go to different places
-- (e.g. Print Running: some in Room 105, some in Room 106). Empty = use the task's location.
alter table shifts add column if not exists location text;

-- When the "check in at Room 112" push was sent for this person (null = not yet). Stops double reminders.
alter table volunteers add column if not exists checkin_reminder_sent_at timestamptz;
