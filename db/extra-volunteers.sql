-- Volunteers added after the Excel roster (2026-10-31: Talin Malki).
-- `npm run db:import -- ... --reset` deletes all shifts, so run this again after a reset,
-- or better: add these people to the Excel file too.
-- Times copied from volunteers with the same day (e.g. Ahmed Mostafa, Alex Santa Maria).

insert into volunteers (slug, name, team, arrive_at, leave_at)
values ('talin-malki', 'Talin Malki', 'general',
        ('2026-11-07'::date + '08:00'::time) at time zone 'America/New_York',
        ('2026-11-07'::date + '21:00'::time) at time zone 'America/New_York')
on conflict (slug) do update set name = excluded.name, arrive_at = excluded.arrive_at, leave_at = excluded.leave_at;

delete from shifts where volunteer_id = (select id from volunteers where slug = 'talin-malki');

insert into shifts (volunteer_id, task_id, starts_at, ends_at)
select v.id, t.id,
       ('2026-11-07'::date + x.st::time) at time zone 'America/New_York',
       ('2026-11-07'::date + x.en::time) at time zone 'America/New_York'
from (values ('Extra',            '08:00', '11:00'),
             ('Orientation',      '11:00', '12:00'),
             ('Lunch',            '12:00', '13:30'),
             ('Balloon Running',  '13:30', '18:00'),
             ('Dinner Setup',     '18:00', '19:00'),
             ('Awards',           '19:00', '20:30'),
             ('Event Break Down', '20:30', '21:00')) as x(task, st, en)
join tasks t on t.name = x.task
cross join volunteers v
where v.slug = 'talin-malki';
