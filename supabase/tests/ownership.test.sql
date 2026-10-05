begin;
create extension if not exists pgtap with schema extensions;
select plan(26);
insert into auth.users(id,email,raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111','alice@example.test','{"full_name":"Alice"}'),
  ('22222222-2222-4222-8222-222222222222','bob@example.test','{"full_name":"Bob"}');
insert into public.transactions(id,user_id,type,amount,category_id,transaction_date,description)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user_id,type,25,id,'2026-10-05','Alice lunch' from public.categories where user_id='11111111-1111-4111-8111-111111111111' and name='Food & dining';
insert into public.transactions(id,user_id,type,amount,category_id,transaction_date,description)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',user_id,type,50,id,'2026-10-05','Bob lunch' from public.categories where user_id='22222222-2222-4222-8222-222222222222' and name='Food & dining';
insert into public.budgets(id,user_id,month,amount) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab','11111111-1111-4111-8111-111111111111','2026-10-01',100),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc','22222222-2222-4222-8222-222222222222','2026-10-01',200);
select is((select count(*)::integer from public.categories where user_id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')),20,'Signup creates default categories for both users');
select is((select count(*)::integer from public.profiles where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')),2,'Signup creates profiles');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select is((select count(*)::integer from public.profiles),1,'Profiles SELECT is owner only');
select is((select count(*)::integer from public.categories),10,'Categories SELECT is owner only');
select is((select count(*)::integer from public.transactions),1,'Transactions SELECT is owner only');
select is((select count(*)::integer from public.budgets),1,'Budgets SELECT is owner only');
select is((public.finance_summary('2026-10-01','2026-10-31')->>'expenses')::numeric,25::numeric,'Summary uses only current-user expenses');
select throws_ok($$insert into public.categories(user_id,name,type) values('22222222-2222-4222-8222-222222222222','Forged','expense')$$,'42501',null,'Cannot INSERT another user category');
select throws_ok($$insert into public.profiles(id) values('33333333-3333-4333-8333-333333333333')$$,'42501',null,'Cannot INSERT another user profile');
select throws_ok($$insert into public.budgets(user_id,month,amount) values('22222222-2222-4222-8222-222222222222','2026-11-01',100)$$,'42501',null,'Cannot INSERT another user budget');
select throws_ok($$insert into public.transactions(user_id,type,amount,category_id,transaction_date) select '22222222-2222-4222-8222-222222222222','expense',10,id,'2026-10-05' from public.categories limit 1$$,'42501',null,'Cannot INSERT another user transaction');
select throws_ok($$update public.categories set user_id='22222222-2222-4222-8222-222222222222' where name='Shopping'$$,'42501',null,'Cannot transfer category ownership');
select throws_ok($$update public.profiles set id='33333333-3333-4333-8333-333333333333'$$,'42501',null,'Cannot transfer profile ownership');
select throws_ok($$update public.budgets set user_id='22222222-2222-4222-8222-222222222222'$$,'42501',null,'Cannot transfer budget ownership');
select throws_ok($$update public.transactions set user_id='22222222-2222-4222-8222-222222222222'$$,'42501',null,'Cannot transfer transaction ownership');
with changed as (update public.transactions set amount=1 where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id) select is((select count(*)::integer from changed),0,'Cannot UPDATE another user transaction');
with deleted as (delete from public.transactions where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id) select is((select count(*)::integer from deleted),0,'Cannot DELETE another user transaction');
with deleted as (delete from public.budgets where user_id='22222222-2222-4222-8222-222222222222' returning id) select is((select count(*)::integer from deleted),0,'Cannot DELETE another user budget');
with deleted as (delete from public.categories where user_id='22222222-2222-4222-8222-222222222222' returning id) select is((select count(*)::integer from deleted),0,'Cannot DELETE another user category');
with deleted as (delete from public.profiles where id='22222222-2222-4222-8222-222222222222' returning id) select is((select count(*)::integer from deleted),0,'Cannot DELETE another user profile');
select throws_ok($$insert into public.transactions(user_id,type,amount,category_id,transaction_date) values('11111111-1111-4111-8111-111111111111','expense',10,'00000000-0000-4000-8000-000000000000','2026-10-05')$$,'23503',null,'Category ownership enforced by composite FK');
select throws_ok($$insert into public.budgets(user_id,month,amount) values('11111111-1111-4111-8111-111111111111','2026-10-01',200)$$,'23505',null,'Only one overall budget per month');
select throws_ok($$insert into storage.objects(bucket_id,name) values('receipts','22222222-2222-4222-8222-222222222222/test.pdf')$$,'42501',null,'Cannot upload into another user receipt folder');
select lives_ok($$update public.transactions set amount=30 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,'Owner can update own transaction');
select lives_ok($$update public.profiles set currency='PHP' where id='11111111-1111-4111-8111-111111111111'$$,'Owner can save an expanded currency option');
select throws_ok($$update public.profiles set currency='INVALID' where id='11111111-1111-4111-8111-111111111111'$$,'23514',null,'Database rejects unsupported currency codes');
select * from finish();
rollback;
