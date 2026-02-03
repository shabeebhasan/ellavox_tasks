-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- Claims table
create table if not exists claims (
    id uuid default gen_random_uuid() primary key,
    claim_id text,
    member_id text,
    date_of_service date,
    allowed_amount numeric,
    paid_amount numeric,
    claim_type text,
    raw_data jsonb,
    created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table claims enable row level security;

-- Policy to allow anonymous inserts (for POC)
-- In production, this should be authenticated
create policy "Allow generic insert"
on claims for insert
to anon
with check (true);

-- Policy to allow anonymous select
create policy "Allow generic select"
on claims for select
to anon
using (true);

-- DANGEROUS: For POC only. function to execute dynamic SQL.
create or replace function exec_sql(query text)
returns json
language plpgsql
security definer
as $$
declare
    result json;
begin
    execute 'select json_agg(t) from (' || query || ') t' into result;
    return result;
end;
$$;

