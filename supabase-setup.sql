-- ════════════════════════════════════════════════════════════
-- 名片掃描 App - Supabase 資料庫初始化
-- 在 Supabase Dashboard → SQL Editor 貼上整段執行即可
-- ════════════════════════════════════════════════════════════

-- 1. 名片資料表
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default '',
  company text default '',
  title text default '',
  email text default '',
  phone text default '',
  address text default '',
  website text default '',
  industry text default '',
  notes text default '',
  image_url text,
  ai_score integer,
  ai_reason text,
  ai_follow_up text,
  ai_priority text,
  last_contact_date timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. AI 分析結果儲存表
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_business text default '',
  result jsonb not null,
  created_at timestamp with time zone default now()
);

-- 3. 索引（加速查詢）
create index if not exists cards_user_id_idx on public.cards(user_id);
create index if not exists cards_created_at_idx on public.cards(created_at desc);
create index if not exists analyses_user_id_idx on public.analyses(user_id);

-- 4. Row Level Security（每個使用者只能看到自己的資料）
alter table public.cards enable row level security;
alter table public.analyses enable row level security;

drop policy if exists "users can view own cards" on public.cards;
create policy "users can view own cards" on public.cards
  for select using (auth.uid() = user_id);

drop policy if exists "users can insert own cards" on public.cards;
create policy "users can insert own cards" on public.cards
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own cards" on public.cards;
create policy "users can update own cards" on public.cards
  for update using (auth.uid() = user_id);

drop policy if exists "users can delete own cards" on public.cards;
create policy "users can delete own cards" on public.cards
  for delete using (auth.uid() = user_id);

drop policy if exists "users can view own analyses" on public.analyses;
create policy "users can view own analyses" on public.analyses
  for select using (auth.uid() = user_id);

drop policy if exists "users can insert own analyses" on public.analyses;
create policy "users can insert own analyses" on public.analyses
  for insert with check (auth.uid() = user_id);

-- 5. 圖片儲存桶
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

drop policy if exists "users can upload own card images" on storage.objects;
create policy "users can upload own card images" on storage.objects
  for insert with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "anyone can view card images" on storage.objects;
create policy "anyone can view card images" on storage.objects
  for select using (bucket_id = 'card-images');

drop policy if exists "users can delete own card images" on storage.objects;
create policy "users can delete own card images" on storage.objects
  for delete using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ════════════════════════════════════════════════════════════
-- 完成！執行成功後，回到 App 即可開始使用
-- ════════════════════════════════════════════════════════════
