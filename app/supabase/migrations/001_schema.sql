-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Topics
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- Lessons (type: 'lesson' | 'qa')
create table lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  type text not null check (type in ('lesson', 'qa')),
  title text not null,
  video_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- PDFs
create table pdfs (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- Enrollments: topic_id = specific topic, is_full_course = true means access to all topics
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  is_full_course boolean not null default false,
  created_at timestamptz not null default now(),
  constraint enrollment_unique unique (user_id, topic_id),
  constraint enrollment_valid check (
    (is_full_course = true and topic_id is null) or
    (is_full_course = false and topic_id is not null)
  )
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS Policies
alter table topics enable row level security;
alter table lessons enable row level security;
alter table pdfs enable row level security;
alter table profiles enable row level security;
alter table enrollments enable row level security;

-- Topics: anyone can read, only admin can write
create policy "topics_select" on topics for select using (true);
create policy "topics_insert" on topics for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "topics_update" on topics for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "topics_delete" on topics for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Lessons: enrolled users can read their topic's lessons
create policy "lessons_select" on lessons for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  or exists (
    select 1 from enrollments e
    where e.user_id = auth.uid()
    and (e.is_full_course = true or e.topic_id = lessons.topic_id)
  )
);
create policy "lessons_admin_write" on lessons for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- PDFs: same as lessons
create policy "pdfs_select" on pdfs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  or exists (
    select 1 from enrollments e
    where e.user_id = auth.uid()
    and (e.is_full_course = true or e.topic_id = pdfs.topic_id)
  )
);
create policy "pdfs_admin_write" on pdfs for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Profiles: users see their own profile, admin sees all
create policy "profiles_select_own" on profiles for select using (
  auth.uid() = id
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_admin_all" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Enrollments: users see their own, admin sees all
create policy "enrollments_select" on enrollments for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "enrollments_admin_write" on enrollments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Storage bucket for PDFs
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false);

create policy "pdfs_storage_select" on storage.objects for select using (
  bucket_id = 'pdfs' and (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or exists (
      select 1 from pdfs p
      join enrollments e on e.topic_id = p.topic_id or e.is_full_course = true
      where p.storage_path = name and e.user_id = auth.uid()
    )
  )
);

create policy "pdfs_storage_insert" on storage.objects for insert with check (
  bucket_id = 'pdfs' and
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "pdfs_storage_delete" on storage.objects for delete using (
  bucket_id = 'pdfs' and
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
