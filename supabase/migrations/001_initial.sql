create extension if not exists pgcrypto;

create table if not exists public.site_content (
  content_key text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  file_name text not null,
  mime_type text not null,
  size bigint not null check (size >= 0),
  created_at timestamptz not null default now(),
  created_by text not null default ''
);

create table if not exists public.survey_responses (
  id uuid primary key,
  role text not null,
  answers jsonb not null,
  questions jsonb not null,
  note text not null default '',
  submitted_at timestamptz not null default now()
);

create index if not exists survey_responses_submitted_at_idx
  on public.survey_responses (submitted_at desc);

alter table public.site_content enable row level security;
alter table public.media_assets enable row level security;
alter table public.survey_responses enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 浏览器只访问本站 API。数据库写入和图片上传由服务器端 service role 完成，
-- 因此这些表无需为 anon/authenticated 角色开放 RLS policy。
