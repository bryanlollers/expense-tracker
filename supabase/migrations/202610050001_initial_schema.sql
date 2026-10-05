begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  currency text not null default 'USD' check (currency in ('USD','EUR','GBP','CNY','JPY','CAD','AUD')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type text not null check (type in ('income','expense')),
  icon text not null default 'circle' check (char_length(icon) <= 12),
  color text not null default '#059669' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,user_id,type)
);
create unique index categories_name_owner_type on public.categories(user_id,lower(trim(name)),type);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid not null,
  description text not null default '' check (char_length(description) <= 500),
  transaction_date date not null,
  receipt_path text check (receipt_path is null or (type = 'expense' and split_part(receipt_path,'/',1) = user_id::text and receipt_path ~ '^[0-9a-f-]+/[0-9a-f-]+\.(jpg|png|webp|pdf)$')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (category_id,user_id,type) references public.categories(id,user_id,type) on delete restrict
);
create index transactions_owner_date on public.transactions(user_id,transaction_date desc,id);
create index transactions_category_owner on public.transactions(category_id,user_id,type);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  category_type text not null default 'expense' check (category_type = 'expense'),
  month date not null check (extract(day from month) = 1),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (category_id,user_id,category_type) references public.categories(id,user_id,type) on delete restrict
);
create unique index budgets_owner_month_category on public.budgets(user_id,month,category_id) nulls not distinct;
create index budgets_category_owner on public.budgets(category_id,user_id,category_type);

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.touch_updated_at();
create trigger transactions_updated before update on public.transactions for each row execute function public.touch_updated_at();
create trigger budgets_updated before update on public.budgets for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles for delete to authenticated using ((select auth.uid()) = id);
create policy categories_select on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy categories_insert on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy categories_update on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete on public.categories for delete to authenticated using ((select auth.uid()) = user_id);
create policy transactions_select on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy transactions_insert on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy transactions_update on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_delete on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);
create policy budgets_select on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy budgets_insert on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy budgets_update on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy budgets_delete on public.budgets for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.profiles,public.categories,public.transactions,public.budgets from anon;
grant select,insert,update,delete on public.profiles,public.categories,public.transactions,public.budgets to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100));
  insert into public.categories(user_id,name,type,icon,color) values
    (new.id,'Salary','income','briefcase','#059669'),
    (new.id,'Freelance','income','laptop','#0d9488'),
    (new.id,'Other income','income','plus','#0284c7'),
    (new.id,'Food & dining','expense','utensils','#f59e0b'),
    (new.id,'Shopping','expense','bag','#8b5cf6'),
    (new.id,'Transport','expense','car','#3b82f6'),
    (new.id,'Housing','expense','home','#ec4899'),
    (new.id,'Entertainment','expense','film','#f97316'),
    (new.id,'Health','expense','heart','#14b8a6'),
    (new.id,'Other expenses','expense','circle','#64748b');
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Invoker rights retain RLS; aggregate in PostgreSQL without the API's row limit.
create function public.finance_summary(start_date date,end_date date) returns jsonb language sql stable security invoker set search_path = '' as $$
with selected as (
  select * from public.transactions where user_id = (select auth.uid()) and transaction_date between start_date and end_date
), category_totals as (
  select category_id,sum(amount) as amount from selected where type = 'expense' group by category_id
), monthly_totals as (
  select to_char(transaction_date,'YYYY-MM') as month,
    coalesce(sum(amount) filter (where type = 'income'),0) as income,
    coalesce(sum(amount) filter (where type = 'expense'),0) as expenses
  from selected group by to_char(transaction_date,'YYYY-MM')
)
select jsonb_build_object(
  'income',coalesce((select sum(amount) from selected where type = 'income'),0),
  'expenses',coalesce((select sum(amount) from selected where type = 'expense'),0),
  'category_totals',coalesce((select jsonb_agg(to_jsonb(c) order by amount desc) from category_totals c),'[]'::jsonb),
  'monthly_totals',coalesce((select jsonb_agg(to_jsonb(m) order by month) from monthly_totals m),'[]'::jsonb)
);
$$;
revoke all on function public.finance_summary(date,date) from public,anon;
grant execute on function public.finance_summary(date,date) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy receipts_select on storage.objects for select to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipts_insert on storage.objects for insert to authenticated with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipts_update on storage.objects for update to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipts_delete on storage.objects for delete to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
