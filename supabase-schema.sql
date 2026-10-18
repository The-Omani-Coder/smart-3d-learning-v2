-- Smart 3D Learning — run once in Supabase SQL Editor.
-- The primary admin email is configured near the bottom of this file.

create extension if not exists pgcrypto;

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_invites (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null unique check (email = lower(email)),
  invite_code text not null unique,
  claimed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','teacher','admin')),
  name text not null,
  email text not null unique check (email = lower(email)),
  grade int check (grade between 1 and 12),
  sem int check (sem in (1,2)),
  track text check (track is null or track in ('sci','arts')),
  parent_code text unique,
  lang text not null default 'ar',
  teacher_grades int[] not null default '{}',
  teacher_sems int[] not null default '{}',
  teacher_subjects text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.content_slots (
  slot_no int primary key check (slot_no between 1 and 120),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.grades (
  id text primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  title text not null,
  score numeric not null check (score >= 0),
  max_score numeric not null check (max_score > 0 and score <= max_score),
  teacher_label text not null,
  grade_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_models (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  storage_path text not null unique,
  published boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_saves (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  model_id text not null references public.lab_models(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists grades_student_id_idx on public.grades(student_id);
create index if not exists lab_saves_user_id_idx on public.lab_saves(user_id);
create index if not exists lab_models_created_by_idx on public.lab_models(created_by);

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.can_view_profile(p_id uuid, p_role text, p_grade int, p_sem int)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare me public.profiles%rowtype;
begin
  if auth.uid() is null then return false; end if;
  if p_id = auth.uid() then return true; end if;
  select * into me from public.profiles where id = auth.uid();
  if me.role = 'admin' then return true; end if;
  return me.role = 'teacher' and p_role = 'student'
    and p_grade = any(me.teacher_grades) and p_sem = any(me.teacher_sems);
end $$;

create or replace function public.teacher_can_access(p_student uuid, p_subject text)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare me public.profiles%rowtype; student public.profiles%rowtype;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.role = 'admin' then return true; end if;
  if me.role <> 'teacher' then return false; end if;
  select * into student from public.profiles where id = p_student and role = 'student';
  return found and student.grade = any(me.teacher_grades) and student.sem = any(me.teacher_sems)
    and p_subject = any(me.teacher_subjects);
end $$;

create or replace function public.make_parent_code()
returns text language plpgsql volatile security definer set search_path = public
as $$
declare candidate text;
begin
  loop
    candidate := 'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where parent_code = candidate);
  end loop;
  return candidate;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data->>'requested_role', 'student');
  final_role text := 'student';
  invite public.teacher_invites%rowtype;
  grades int[] := '{}'; sems int[] := '{}'; subjects text[] := '{}';
begin
  if requested = 'admin' then
    if not exists (select 1 from public.admin_allowlist where email = lower(new.email)) then
      raise exception 'admin email is not allowlisted';
    end if;
    final_role := 'admin';
  elsif requested = 'teacher' then
    select * into invite from public.teacher_invites
      where email = lower(new.email)
        and upper(invite_code) = upper(coalesce(new.raw_user_meta_data->>'teacher_invite_code',''))
        and claimed_at is null;
    if not found then raise exception 'invalid or expired teacher invitation'; end if;
    grades := array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'teacher_grades','[]'::jsonb))::int);
    sems := array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'teacher_sems','[]'::jsonb))::int);
    subjects := array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'teacher_subjects','[]'::jsonb)));
    if cardinality(grades) = 0 or cardinality(sems) = 0 or cardinality(subjects) = 0 then
      raise exception 'teacher classes are required';
    end if;
    final_role := 'teacher';
    update public.teacher_invites set claimed_at = now() where id = invite.id;
  end if;

  insert into public.profiles(id, role, name, email, grade, sem, track, parent_code, lang, teacher_grades, teacher_sems, teacher_subjects)
  values (
    new.id, final_role, coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)), lower(new.email),
    case when final_role='student' then greatest(1, least(12, coalesce((new.raw_user_meta_data->>'grade')::int,1))) end,
    case when final_role='student' then case when (new.raw_user_meta_data->>'sem')::int = 2 then 2 else 1 end end,
    case when final_role='student' and (new.raw_user_meta_data->>'grade')::int >= 11 then nullif(new.raw_user_meta_data->>'track','') end,
    case when final_role='student' then public.make_parent_code() end,
    coalesce(nullif(new.raw_user_meta_data->>'lang',''),'ar'), grades, sems, subjects
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.admin_allowlist enable row level security;
alter table public.teacher_invites enable row level security;
alter table public.profiles enable row level security;
alter table public.content_slots enable row level security;
alter table public.grades enable row level security;
alter table public.lab_models enable row level security;
alter table public.lab_saves enable row level security;

create policy "profiles_visible_by_role" on public.profiles for select to authenticated
using (public.can_view_profile(id, role, grade, sem));

create policy "admin_manage_invites" on public.teacher_invites for all to authenticated
using (public.current_profile_role() = 'admin') with check (public.current_profile_role() = 'admin' and created_by = auth.uid());

create policy "authenticated_read_content" on public.content_slots for select to authenticated using (true);
create policy "admin_insert_content" on public.content_slots for insert to authenticated with check (public.current_profile_role() = 'admin');
create policy "admin_update_content" on public.content_slots for update to authenticated using (public.current_profile_role() = 'admin') with check (public.current_profile_role() = 'admin');
create policy "admin_delete_content" on public.content_slots for delete to authenticated using (public.current_profile_role() = 'admin');

create policy "grades_visible_by_role" on public.grades for select to authenticated
using (student_id = auth.uid() or public.current_profile_role() = 'admin' or public.teacher_can_access(student_id, subject));
create policy "grades_insert_by_role" on public.grades for insert to authenticated
with check (public.current_profile_role() = 'admin' or public.teacher_can_access(student_id, subject)
  or (student_id = auth.uid() and teacher_label = 'lab'));
create policy "grades_update_by_staff" on public.grades for update to authenticated
using (public.current_profile_role() = 'admin' or public.teacher_can_access(student_id, subject))
with check (public.current_profile_role() = 'admin' or public.teacher_can_access(student_id, subject));
create policy "grades_delete_by_staff" on public.grades for delete to authenticated
using (public.current_profile_role() = 'admin' or public.teacher_can_access(student_id, subject));

create policy "models_read" on public.lab_models for select to authenticated
using (published or created_by = auth.uid() or public.current_profile_role() = 'admin');
create policy "models_insert" on public.lab_models for insert to authenticated
with check (public.current_profile_role() in ('teacher','admin') and created_by = auth.uid());
create policy "models_update" on public.lab_models for update to authenticated
using (created_by = auth.uid() or public.current_profile_role() = 'admin')
with check (created_by = auth.uid() or public.current_profile_role() = 'admin');
create policy "models_delete" on public.lab_models for delete to authenticated
using (created_by = auth.uid() or public.current_profile_role() = 'admin');

create policy "own_lab_saves_select" on public.lab_saves for select to authenticated using (user_id = auth.uid() or public.current_profile_role() = 'admin');
create policy "own_lab_saves_insert" on public.lab_saves for insert to authenticated with check (user_id = auth.uid());
create policy "own_lab_saves_update" on public.lab_saves for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_lab_saves_delete" on public.lab_saves for delete to authenticated using (user_id = auth.uid() or public.current_profile_role() = 'admin');

create or replace function public.parent_portal(p_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare student public.profiles%rowtype; result jsonb;
begin
  select * into student from public.profiles where role='student' and parent_code=upper(trim(p_code));
  if not found then return null; end if;
  select jsonb_build_object(
    'student', jsonb_build_object('id',student.id,'name',student.name,'email',student.email,'grade',student.grade,'sem',student.sem,'track',student.track,'parentCode',student.parent_code),
    'grades', coalesce(jsonb_agg(jsonb_build_object('id',g.id,'studentId',g.student_id,'subject',g.subject,'title',g.title,'score',g.score,'max',g.max_score,'teacher',g.teacher_label,'date',g.grade_date)) filter (where g.id is not null), '[]'::jsonb)
  ) into result from public.grades g where g.student_id=student.id;
  return result;
end $$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth
as $$ begin
  if public.current_profile_role() <> 'admin' then raise exception 'forbidden'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot delete current admin'; end if;
  delete from public.teacher_invites
    where email = (select email from public.profiles where id = p_user_id and role = 'teacher');
  delete from auth.users where id = p_user_id;
end $$;

create or replace function public.admin_reset_data()
returns void language plpgsql security definer set search_path = public
as $$ begin
  if public.current_profile_role() <> 'admin' then raise exception 'forbidden'; end if;
  delete from public.lab_saves;
  delete from public.grades;
  delete from public.lab_models;
  delete from public.content_slots;
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.content_slots, public.grades, public.lab_models, public.lab_saves to authenticated;
grant select, insert, update, delete on public.teacher_invites to authenticated;
grant insert, update, delete on public.content_slots, public.grades, public.lab_models, public.lab_saves to authenticated;
grant execute on function public.parent_portal(text) to anon, authenticated;
grant execute on function public.admin_delete_user(uuid), public.admin_reset_data() to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('lab-models','lab-models',false,62914560,array['model/gltf-binary','model/gltf+json','application/octet-stream']),
       ('content-assets','content-assets',true,10485760,null)
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy "authenticated_read_lab_models" on storage.objects for select to authenticated
using (bucket_id='lab-models' and exists (
  select 1 from public.lab_models m where m.storage_path = storage.objects.name
    and (m.published or m.created_by = auth.uid() or public.current_profile_role() = 'admin')
));
create policy "staff_upload_lab_models" on storage.objects for insert to authenticated with check (bucket_id='lab-models' and public.current_profile_role() in ('teacher','admin'));
create policy "staff_update_lab_models" on storage.objects for update to authenticated using (bucket_id='lab-models' and (owner_id=(auth.uid())::text or public.current_profile_role()='admin'));
create policy "staff_delete_lab_models" on storage.objects for delete to authenticated using (bucket_id='lab-models' and (owner_id=(auth.uid())::text or public.current_profile_role()='admin'));
create policy "admin_upload_content_assets" on storage.objects for insert to authenticated with check (bucket_id='content-assets' and public.current_profile_role()='admin');
create policy "admin_update_content_assets" on storage.objects for update to authenticated using (bucket_id='content-assets' and public.current_profile_role()='admin');
create policy "admin_delete_content_assets" on storage.objects for delete to authenticated using (bucket_id='content-assets' and public.current_profile_role()='admin');

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='content_slots') then
    alter publication supabase_realtime add table public.content_slots;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='lab_models') then
    alter publication supabase_realtime add table public.lab_models;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='grades') then
    alter publication supabase_realtime add table public.grades;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Primary administrator allowlist entry.
insert into public.admin_allowlist(email) values (lower('anofli2015@gmail.com')) on conflict do nothing;
