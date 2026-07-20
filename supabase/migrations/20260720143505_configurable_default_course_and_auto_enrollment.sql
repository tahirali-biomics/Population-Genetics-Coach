begin;

-- ---------------------------------------------------------------------------
-- Add a configurable default course
-- ---------------------------------------------------------------------------

alter table public.courses
add column if not exists is_default boolean not null default false;

create unique index if not exists courses_one_default_idx
on public.courses (is_default)
where is_default = true;

-- The default course must also be active.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_default_must_be_active'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
    add constraint courses_default_must_be_active
    check (is_default = false or active = true);
  end if;
end;
$$;

-- Set the existing Population Genetics Coach course as default.
update public.courses
set is_default = (id = 1);

-- ---------------------------------------------------------------------------
-- Automatically enrol newly created student profiles
-- ---------------------------------------------------------------------------

create or replace function public.auto_enroll_new_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id bigint;
begin
  -- Only student profiles are enrolled automatically.
  if coalesce(new.account_type, 'student') <> 'student' then
    return new;
  end if;

  select c.id
  into target_course_id
  from public.courses c
  where c.is_default = true
    and c.active = true
  limit 1;

  -- Do not block registration if no active default course exists.
  if target_course_id is null then
    return new;
  end if;

  insert into public.course_members (
    course_id,
    user_id,
    role
  )
  values (
    target_course_id,
    new.user_id,
    'student'
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists auto_enroll_student_after_profile_insert
on public.profiles;

create trigger auto_enroll_student_after_profile_insert
after insert on public.profiles
for each row
execute function public.auto_enroll_new_student();

-- ---------------------------------------------------------------------------
-- Backfill existing students into the current default course
-- ---------------------------------------------------------------------------

insert into public.course_members (
  course_id,
  user_id,
  role
)
select
  c.id,
  p.user_id,
  'student'
from public.profiles p
cross join lateral (
  select id
  from public.courses
  where is_default = true
    and active = true
  limit 1
) c
where coalesce(p.account_type, 'student') = 'student'
  and not exists (
    select 1
    from public.course_members cm
    where cm.course_id = c.id
      and cm.user_id = p.user_id
  )
on conflict do nothing;

commit;
