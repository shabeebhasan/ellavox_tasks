-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- Cleanup (DANGEROUS: Drops all existing data to update schema)
drop table if exists claims cascade;

-- Claims table
create table if not exists claims (
    id uuid default gen_random_uuid() primary key,
    carrier text,
    group_name text,
    claim_number text,
    subscriber_id text,
    member_id text,
    member_custom_id text,
    incurred_date date,
    paid_date date,
    billed_amount numeric,
    allowed_amount numeric,
    paid_amount numeric,
    member_paid_amount numeric,
    diag_code_principal text,
    diag_desc_principal text,
    dx1_code text,
    dx1_desc text,
    dx2_code text,
    dx2_desc text,
    dx3_code text,
    dx3_desc text,
    cpt_code text,
    cpt_category text,
    cpt_description text,
    icd_proc_code_1 text,
    icd_proc_desc_1 text,
    icd_proc_code_2 text,
    icd_proc_desc_2 text,
    service_category text,
    drg_code text,
    drg_description text,
    cob_amount numeric,
    coinsurance_amount numeric,
    copayment_amount numeric,
    covered_amount numeric,
    deductible_amount numeric,
    discount_amount numeric,
    not_covered_amount numeric,
    facility text,
    benefit_package text,
    raw_data jsonb,
    created_at timestamptz default now()
);

-- Basic Indexes
create index if not exists idx_claims_member_id on claims(member_id);
create index if not exists idx_claims_incurred_date on claims(incurred_date);
create index if not exists idx_claims_service_category on claims(service_category);
create index if not exists idx_claims_claim_number on claims(claim_number);

-- Covering Indexes for heavy analytical aggregations (400k+ records)
create index if not exists idx_claims_member_agg on claims(member_id, incurred_date, paid_amount, billed_amount);
create index if not exists idx_claims_facility_agg on claims(facility, incurred_date, paid_amount);

-- Enable Row Level Security (RLS)
alter table claims enable row level security;

-- Policies (Idempotent)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Allow generic insert' and tablename = 'claims') then
        create policy "Allow generic insert" on claims for insert to anon with check (true);
    end if;
    
    if not exists (select 1 from pg_policies where policyname = 'Allow generic select' and tablename = 'claims') then
        create policy "Allow generic select" on claims for select to anon using (true);
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Allow generic delete' and tablename = 'claims') then
        create policy "Allow generic delete" on claims for delete to anon using (true);
    end if;
end $$;

-- DANGEROUS: For POC only. function to execute dynamic SQL.
create or replace function exec_sql(query text)
returns json
language plpgsql
security definer
as $$
declare
    result json;
begin
    -- Increase timeout for large analytical queries (e.g. 2 minutes)
    perform set_config('statement_timeout', '120000', true);
    
    if lower(query) like 'select%' then
        execute 'select json_agg(t) from (' || query || ') t' into result;
    else
        execute query;
        result := '{"status": "success"}'::json;
    end if;
    return result;
end;
$$;

