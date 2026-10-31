-- Test volunteer for Lingtong's own testing. Not in the Excel roster.
-- `npm run db:import -- ... --reset` deletes all shifts, so run this again after a reset.
-- Remove before the event if he should not appear in lists:
--   delete from volunteers where slug = 'lingtong-meng';

insert into tasks (name, kind) values ('Breakfast Setup', 'duty')
on conflict (name) do nothing;

insert into volunteers (slug, name, team, arrive_at, leave_at)
values ('lingtong-meng', 'Lingtong Meng', 'general',
        ('2026-11-07'::date + '08:00'::time) at time zone 'America/New_York',
        ('2026-11-07'::date + '19:00'::time) at time zone 'America/New_York')
on conflict (slug) do update set arrive_at = excluded.arrive_at, leave_at = excluded.leave_at;

delete from shifts where volunteer_id = (select id from volunteers where slug = 'lingtong-meng');

insert into shifts (volunteer_id, task_id, starts_at, ends_at)
select v.id, t.id,
       ('2026-11-07'::date + x.st::time) at time zone 'America/New_York',
       ('2026-11-07'::date + x.en::time) at time zone 'America/New_York'
from (values ('Breakfast Setup', '08:00', '11:00'),
             ('Orientation',     '11:00', '12:00'),
             ('Lunch',           '12:00', '13:30'),
             ('Proctors',        '13:30', '19:00')) as x(task, st, en)
join tasks t on t.name = x.task
cross join volunteers v
where v.slug = 'lingtong-meng';
