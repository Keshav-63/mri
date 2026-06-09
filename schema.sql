-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist to avoid collision during schema updates
drop table if exists public.chat_messages;
drop table if exists public.reports;
drop table if exists public.profiles;

-- 1. Custom Users Table (independent of Supabase internal Auth)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null, -- Stored as a secure bcrypt hash
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MRI Reports Table linked to our custom Users table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_size integer,
  analysis_result jsonb not null, -- Contains findings, layman explanations, severity, and coordinates
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Chat Messages Table linked to reports and custom users
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'ai')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable Row Level Security (RLS) on these tables.
-- The FastAPI backend connects using a service key/admin credentials and performs all queries.
alter table public.users disable row level security;
alter table public.reports disable row level security;
alter table public.chat_messages disable row level security;
