-- SANGA Academy full Supabase integration
-- Run this AFTER sanga_course_schema_v2.sql and sanga_sample_data_v1.sql.
-- It keeps the existing course schema and adds:
-- custom username/password admin sessions, notices, jobs, history, inquiries,
-- public inquiry RPC, and one admin RPC used by the static HTML admin UI.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ------------------------------------------------------------------
-- 1) Harden / extend admin account tables
-- ------------------------------------------------------------------
alter table public.admin_users add column if not exists failed_login_count integer not null default 0;
alter table public.admin_users add column if not exists locked_until timestamptz;

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent text
);

create index if not exists idx_admin_sessions_active
  on public.admin_sessions (admin_user_id, expires_at)
  where revoked_at is null;

alter table public.admin_sessions enable row level security;
revoke all on table public.admin_sessions from anon, authenticated;

-- ------------------------------------------------------------------
-- 2) Public CMS tables
-- ------------------------------------------------------------------
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title varchar(250) not null,
  content text not null,
  status varchar(20) not null default 'draft',
  published_on date not null default current_date,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_title_chk check (btrim(title) <> ''),
  constraint notices_status_chk check (status in ('published','draft')),
  constraint notices_view_count_chk check (view_count >= 0)
);

create table if not exists public.jobs (
  id bigint generated always as identity primary key,
  category varchar(100) not null,
  company varchar(160) not null,
  title varchar(250) not null,
  description text,
  apply_url text,
  status varchar(20) not null default 'draft',
  published_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_chk check (status in ('published','draft'))
);

create table if not exists public.academy_history (
  id bigint generated always as identity primary key,
  year_label varchar(20) not null,
  tag varchar(60),
  title varchar(250) not null,
  description text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_history_sort_chk check (sort_order >= 0)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  phone varchar(30) not null,
  course_interest varchar(250),
  message text,
  consultation_note text,
  status varchar(20) not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_name_chk check (char_length(btrim(name)) between 1 and 80),
  constraint inquiries_phone_chk check (char_length(btrim(phone)) between 7 and 30),
  constraint inquiries_status_chk check (status in ('waiting','consulting','completed','cancelled'))
);

-- updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_notices_updated_at') THEN
    CREATE TRIGGER trg_notices_updated_at BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_jobs_updated_at') THEN
    CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_academy_history_updated_at') THEN
    CREATE TRIGGER trg_academy_history_updated_at BEFORE UPDATE ON public.academy_history
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_inquiries_updated_at') THEN
    CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

create index if not exists idx_notices_public on public.notices(status, published_on desc, id desc);
create index if not exists idx_jobs_public on public.jobs(status, published_on desc, id desc);
create index if not exists idx_history_public on public.academy_history(is_published, sort_order, id);
create index if not exists idx_inquiries_status_created on public.inquiries(status, created_at desc);

-- ------------------------------------------------------------------
-- 3) Public RLS
-- ------------------------------------------------------------------
alter table public.notices enable row level security;
alter table public.jobs enable row level security;
alter table public.academy_history enable row level security;
alter table public.inquiries enable row level security;

revoke all on table public.notices from anon, authenticated;
revoke all on table public.jobs from anon, authenticated;
revoke all on table public.academy_history from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;

grant select on table public.notices to anon, authenticated;
grant select on table public.jobs to anon, authenticated;
grant select on table public.academy_history to anon, authenticated;

DROP POLICY IF EXISTS "public read published notices" ON public.notices;
CREATE POLICY "public read published notices" ON public.notices
FOR SELECT TO anon, authenticated USING (status='published');

DROP POLICY IF EXISTS "public read published jobs" ON public.jobs;
CREATE POLICY "public read published jobs" ON public.jobs
FOR SELECT TO anon, authenticated USING (status='published');

DROP POLICY IF EXISTS "public read academy history" ON public.academy_history;
CREATE POLICY "public read academy history" ON public.academy_history
FOR SELECT TO anon, authenticated USING (is_published=true);

-- ------------------------------------------------------------------
-- 4) Public inquiry submit RPC
-- ------------------------------------------------------------------
create or replace function public.submit_inquiry(
  p_name text,
  p_phone text,
  p_course_interest text default null,
  p_message text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if char_length(btrim(coalesce(p_name,''))) < 1 then
    raise exception '이름을 입력해 주세요.';
  end if;
  if char_length(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g')) < 9 then
    raise exception '연락처를 확인해 주세요.';
  end if;

  insert into public.inquiries(name, phone, course_interest, message)
  values (btrim(p_name), btrim(p_phone), nullif(btrim(p_course_interest),''), nullif(btrim(p_message),''))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.submit_inquiry(text,text,text,text) from public;
grant execute on function public.submit_inquiry(text,text,text,text) to anon, authenticated;

-- ------------------------------------------------------------------
-- 5) Private helpers for custom admin auth
-- ------------------------------------------------------------------
create or replace function private.admin_id_from_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_admin_id uuid;
begin
  if p_token is null or char_length(p_token) < 40 then
    raise exception 'ADMIN_SESSION_REQUIRED';
  end if;

  select s.admin_user_id
    into v_admin_id
  from public.admin_sessions s
  join public.admin_users u on u.id=s.admin_user_id
  where s.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and s.revoked_at is null
    and s.expires_at > now()
    and u.is_active = true
  limit 1;

  if v_admin_id is null then
    raise exception 'ADMIN_SESSION_INVALID';
  end if;

  update public.admin_sessions
     set last_seen_at=now()
   where token_hash = encode(digest(p_token, 'sha256'), 'hex');

  return v_admin_id;
end;
$$;

revoke all on function private.admin_id_from_token(text) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- 6) Admin login / logout / me
-- ------------------------------------------------------------------
create or replace function public.admin_login(p_login_id text, p_password text, p_user_agent text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  u public.admin_users%rowtype;
  v_token text;
  v_expires timestamptz := now() + interval '8 hours';
  v_roles jsonb;
begin
  select * into u from public.admin_users where login_id=btrim(p_login_id) limit 1;

  if u.id is null or u.is_active=false then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok',false,'message','아이디 또는 비밀번호가 올바르지 않습니다.');
  end if;

  if u.locked_until is not null and u.locked_until > now() then
    return jsonb_build_object('ok',false,'message','로그인 시도가 많아 잠시 잠겼습니다. 잠시 후 다시 시도해 주세요.');
  elsif u.locked_until is not null and u.locked_until <= now() then
    update public.admin_users set failed_login_count=0, locked_until=null where id=u.id;
    u.failed_login_count := 0;
    u.locked_until := null;
  end if;

  if u.password_hash is null or crypt(p_password, u.password_hash) <> u.password_hash then
    update public.admin_users
       set failed_login_count = failed_login_count + 1,
           locked_until = case when failed_login_count + 1 >= 5 then now() + interval '15 minutes' else null end
     where id=u.id;
    perform pg_sleep(0.35);
    return jsonb_build_object('ok',false,'message','아이디 또는 비밀번호가 올바르지 않습니다.');
  end if;

  update public.admin_users
     set failed_login_count=0, locked_until=null, last_login_at=now(), updated_at=now()
   where id=u.id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.admin_sessions(admin_user_id, token_hash, expires_at, user_agent)
  values (u.id, encode(digest(v_token,'sha256'),'hex'), v_expires, left(p_user_agent,1000));

  select coalesce(jsonb_agg(r.code order by r.code),'[]'::jsonb)
    into v_roles
  from public.admin_user_roles aur
  join public.roles r on r.id=aur.role_id
  where aur.admin_user_id=u.id;

  return jsonb_build_object(
    'ok',true,
    'token',v_token,
    'expires_at',v_expires,
    'user',jsonb_build_object('id',u.id,'login_id',u.login_id,'name',u.name,'roles',v_roles)
  );
end;
$$;

create or replace function public.admin_logout(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
begin
  update public.admin_sessions
     set revoked_at=now()
   where token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex')
     and revoked_at is null;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.admin_me(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_id uuid;
  u public.admin_users%rowtype;
  v_roles jsonb;
begin
  v_id := private.admin_id_from_token(p_token);
  select * into u from public.admin_users where id=v_id;
  select coalesce(jsonb_agg(r.code order by r.code),'[]'::jsonb) into v_roles
  from public.admin_user_roles aur join public.roles r on r.id=aur.role_id
  where aur.admin_user_id=v_id;
  return jsonb_build_object('ok',true,'user',jsonb_build_object('id',u.id,'login_id',u.login_id,'name',u.name,'roles',v_roles));
end;
$$;

revoke all on function public.admin_login(text,text,text) from public;
revoke all on function public.admin_logout(text) from public;
revoke all on function public.admin_me(text) from public;
grant execute on function public.admin_login(text,text,text) to anon, authenticated;
grant execute on function public.admin_logout(text) to anon, authenticated;
grant execute on function public.admin_me(text) to anon, authenticated;

-- ------------------------------------------------------------------
-- 7) One admin API RPC for static admin pages
-- ------------------------------------------------------------------
create or replace function public.admin_api(p_token text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_admin uuid;
  v_result jsonb;
  v_id bigint;
  v_uuid uuid;
  v_course_id uuid;
  v_cohort_id uuid;
  v_type_id smallint;
  v_category_id bigint;
  v_category_name text;
  v_category_slug text;
  v_course_slug text;
  v_status text;
  v_date date;
  v_item jsonb;
  v_section_id bigint;
  v_order int;
  v_tag_id bigint;
  v_tag_name text;
  v_i jsonb;
  v_i_order int;
  v_year int;
  v_number int;
  v_loc_id bigint;
  v_can_content boolean := false;
  v_can_inquiries boolean := false;
begin
  v_admin := private.admin_id_from_token(p_token);
  select
    bool_or(r.code in ('super_admin','admin','editor')),
    bool_or(r.code in ('super_admin','admin','counselor'))
  into v_can_content, v_can_inquiries
  from public.admin_user_roles aur
  join public.roles r on r.id=aur.role_id
  where aur.admin_user_id=v_admin;
  v_can_content := coalesce(v_can_content,false);
  v_can_inquiries := coalesce(v_can_inquiries,false);

  -- Dashboard
  if p_action='dashboard' then
    select jsonb_build_object(
      'counts', jsonb_build_object(
        'courses',(select count(*) from public.courses where deleted_at is null),
        'notices',(select count(*) from public.notices),
        'jobs',(select count(*) from public.jobs),
        'inquiries',(select count(*) from public.inquiries where status='waiting')
      ),
      'recent_courses', coalesce((
        select jsonb_agg(to_jsonb(x)) from (
          select c.id,c.title,cat.name category,c.is_published,c.created_at
          from public.courses c join public.course_categories cat on cat.id=c.category_id
          where c.deleted_at is null order by c.created_at desc limit 5
        ) x
      ),'[]'::jsonb),
      'recent_inquiries', coalesce((
        select jsonb_agg(to_jsonb(x)) from (
          select id,name,course_interest,status,created_at from public.inquiries order by created_at desc limit 5
        ) x
      ),'[]'::jsonb)
    ) into v_result;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;

  -- Course/content permissions
  if p_action like 'course%' or p_action like 'notice%' or p_action like 'job%' or p_action like 'history%' then
    if not v_can_content then raise exception 'ADMIN_PERMISSION_DENIED'; end if;
  end if;
  if p_action like 'inquir%' then
    if not v_can_inquiries then raise exception 'ADMIN_PERMISSION_DENIED'; end if;
  end if;

  -- Course list with all published/unpublished rows
  if p_action='courses.list' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_result
    from (
      select c.id,c.slug,c.title,c.short_description,c.description,c.eyebrow,c.badge,c.lead,
             c.is_published,c.sort_order,c.created_at,
             ct.code type_code,ct.name type_name,cat.name category_name,
             lc.id cohort_id,lc.cohort_year,lc.cohort_number,lc.cohort_name,lc.recruitment_type,
             lc.application_start_date,lc.application_end_date,lc.course_start_date,lc.course_end_date,
             lc.class_start_time,lc.class_end_time,lc.capacity,lc.total_days,lc.total_hours,
             lc.tuition_amount,lc.support_description,lc.operation_status,lc.is_published cohort_published
      from public.courses c
      join public.course_types ct on ct.id=c.course_type_id
      join public.course_categories cat on cat.id=c.category_id
      left join lateral (
        select cc.* from public.course_cohorts cc
        where cc.course_id=c.id and cc.deleted_at is null
        order by (cc.course_start_date >= current_date) desc, cc.course_start_date asc nulls last, cc.cohort_year desc, cc.cohort_number desc
        limit 1
      ) lc on true
      where c.deleted_at is null
      order by c.sort_order,c.created_at desc
    ) x;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;

  if p_action='course.get' then
    v_course_id := (p_payload->>'id')::uuid;
    select jsonb_build_object(
      'course',to_jsonb(cbase),
      'hero_points',coalesce((select jsonb_agg(content order by sort_order) from public.course_hero_points where course_id=v_course_id),'[]'::jsonb),
      'competencies',coalesce((select jsonb_agg(jsonb_build_array(lpad(sort_order::text,2,'0'),title,coalesce(description,'')) order by sort_order) from public.course_competencies where course_id=v_course_id),'[]'::jsonb),
      'curriculum',coalesce((select jsonb_agg(jsonb_build_array('STEP '||s.sort_order,s.title,coalesce((select jsonb_agg(i.content order by i.sort_order) from public.course_curriculum_items i where i.section_id=s.id),'[]'::jsonb)) order by s.sort_order) from public.course_curriculum_sections s where s.course_id=v_course_id),'[]'::jsonb),
      'targets',coalesce((select jsonb_agg(content order by sort_order) from public.course_targets where course_id=v_course_id),'[]'::jsonb),
      'benefits',coalesce((select jsonb_agg(jsonb_build_array(title,coalesce(description,'')) order by sort_order) from public.course_benefits where course_id=v_course_id),'[]'::jsonb),
      'faqs',coalesce((select jsonb_agg(jsonb_build_array(question,answer) order by sort_order) from public.course_faqs where course_id=v_course_id),'[]'::jsonb),
      'tags',coalesce((select jsonb_agg(t.name order by t.name) from public.course_tags ct join public.tags t on t.id=ct.tag_id where ct.course_id=v_course_id),'[]'::jsonb),
      'weekdays',coalesce((select jsonb_agg(cw.weekday order by cw.weekday) from public.cohort_weekdays cw where cw.cohort_id=cbase.cohort_id),'[]'::jsonb)
    ) into v_result
    from (
      select c.*,ct.code type_code,ct.name type_name,cat.name category_name,
             cc.id cohort_id,cc.cohort_year,cc.cohort_number,cc.cohort_name,cc.recruitment_type,
             cc.application_start_date,cc.application_end_date,cc.course_start_date,cc.course_end_date,
             cc.class_start_time,cc.class_end_time,cc.capacity,cc.total_days,cc.total_hours,
             cc.tuition_amount,cc.support_description,cc.delivery_mode,cc.location_id,cc.operation_status,cc.is_published cohort_published
      from public.courses c
      join public.course_types ct on ct.id=c.course_type_id
      join public.course_categories cat on cat.id=c.category_id
      left join lateral (
        select q.* from public.course_cohorts q where q.course_id=c.id and q.deleted_at is null
        order by q.cohort_year desc,q.cohort_number desc limit 1
      ) cc on true
      where c.id=v_course_id and c.deleted_at is null
    ) cbase;
    return jsonb_build_object('ok',true,'data',coalesce(v_result,'{}'::jsonb));
  end if;

  if p_action='course.save' then
    select id into v_type_id from public.course_types where code=coalesce(p_payload->>'type','general') limit 1;
    if v_type_id is null then raise exception '과정 구분을 확인해 주세요.'; end if;

    v_category_name := btrim(coalesce(p_payload->>'category',''));
    if v_category_name='' then raise exception '분야를 입력해 주세요.'; end if;
    select id into v_category_id from public.course_categories where name=v_category_name limit 1;
    if v_category_id is null then
      v_category_slug := 'category-'||substr(md5(v_category_name),1,12);
      insert into public.course_categories(name,slug,sort_order,is_active)
      values(v_category_name,v_category_slug,100,true) returning id into v_category_id;
    end if;

    if nullif(p_payload->>'id','') is null then
      v_course_slug := 'course-'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
      insert into public.courses(course_type_id,category_id,title,slug,short_description,description,eyebrow,badge,lead,is_published,sort_order)
      values(v_type_id,v_category_id,btrim(p_payload->>'title'),v_course_slug,nullif(p_payload->>'description',''),nullif(p_payload->>'description',''),nullif(p_payload->>'eyebrow',''),nullif(p_payload->>'badge',''),nullif(p_payload->>'lead',''),coalesce((p_payload->>'published')::boolean,true),100)
      returning id into v_course_id;
    else
      v_course_id := (p_payload->>'id')::uuid;
      update public.courses set course_type_id=v_type_id,category_id=v_category_id,title=btrim(p_payload->>'title'),
        short_description=nullif(p_payload->>'description',''),description=nullif(p_payload->>'description',''),
        eyebrow=nullif(p_payload->>'eyebrow',''),badge=nullif(p_payload->>'badge',''),lead=nullif(p_payload->>'lead',''),
        is_published=coalesce((p_payload->>'published')::boolean,true),updated_at=now()
      where id=v_course_id and deleted_at is null;
    end if;

    -- Cohort: update provided cohort or create next number
    if nullif(p_payload->>'cohort_id','') is not null then v_cohort_id := (p_payload->>'cohort_id')::uuid; end if;
    v_year := coalesce(nullif(p_payload->>'cohort_year','')::int, extract(year from coalesce(nullif(p_payload->>'course_start_date','')::date,current_date))::int);
    if nullif(p_payload->>'cohort_number','') is not null then
      v_number := (p_payload->>'cohort_number')::int;
    else
      select coalesce(max(cohort_number),0)+1 into v_number from public.course_cohorts where course_id=v_course_id and cohort_year=v_year;
    end if;
    select id into v_loc_id from public.locations where is_active=true order by id limit 1;

    if v_cohort_id is null then
      insert into public.course_cohorts(course_id,cohort_year,cohort_number,cohort_name,recruitment_type,application_start_date,application_end_date,course_start_date,course_end_date,class_start_time,class_end_time,capacity,tuition_amount,support_description,delivery_mode,location_id,operation_status,is_published,sort_order)
      values(v_course_id,v_year,v_number,coalesce(nullif(p_payload->>'cohort_name',''),v_year||'년 '||v_number||'기'),coalesce(nullif(p_payload->>'recruitment_type',''),'scheduled'),
        nullif(p_payload->>'application_start_date','')::date,nullif(p_payload->>'application_end_date','')::date,
        nullif(p_payload->>'course_start_date','')::date,nullif(p_payload->>'course_end_date','')::date,
        nullif(p_payload->>'class_start_time','')::time,nullif(p_payload->>'class_end_time','')::time,
        nullif(p_payload->>'capacity','')::int,coalesce(nullif(regexp_replace(coalesce(p_payload->>'tuition',''),'[^0-9]','','g'),'')::numeric,0),nullif(p_payload->>'support',''),
        'offline',v_loc_id,'normal',coalesce((p_payload->>'published')::boolean,true),100)
      returning id into v_cohort_id;
    else
      update public.course_cohorts set cohort_year=v_year,cohort_number=v_number,cohort_name=coalesce(nullif(p_payload->>'cohort_name',''),v_year||'년 '||v_number||'기'),
        recruitment_type=coalesce(nullif(p_payload->>'recruitment_type',''),'scheduled'),
        application_start_date=nullif(p_payload->>'application_start_date','')::date,application_end_date=nullif(p_payload->>'application_end_date','')::date,
        course_start_date=nullif(p_payload->>'course_start_date','')::date,course_end_date=nullif(p_payload->>'course_end_date','')::date,
        class_start_time=nullif(p_payload->>'class_start_time','')::time,class_end_time=nullif(p_payload->>'class_end_time','')::time,
        capacity=nullif(p_payload->>'capacity','')::int,tuition_amount=coalesce(nullif(regexp_replace(coalesce(p_payload->>'tuition',''),'[^0-9]','','g'),'')::numeric,0),
        support_description=nullif(p_payload->>'support',''),is_published=coalesce((p_payload->>'published')::boolean,true),updated_at=now()
      where id=v_cohort_id and course_id=v_course_id;
    end if;

    delete from public.cohort_weekdays where cohort_id=v_cohort_id;
    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'weekdays','[]'::jsonb)) loop
      insert into public.cohort_weekdays(cohort_id,weekday) values(v_cohort_id,(v_item#>>'{}')::smallint) on conflict do nothing;
    end loop;

    -- replace tags
    delete from public.course_tags where course_id=v_course_id;
    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'tags','[]'::jsonb)) loop
      v_tag_id := null;
      v_tag_name := btrim(v_item#>>'{}');
      if v_tag_name<>'' then
        select id into v_tag_id from public.tags where name=v_tag_name limit 1;
        if v_tag_id is null then
          insert into public.tags(name,slug,is_active) values(v_tag_name,'tag-'||substr(md5(v_tag_name),1,12),true) returning id into v_tag_id;
        end if;
        insert into public.course_tags(course_id,tag_id) values(v_course_id,v_tag_id) on conflict do nothing;
      end if;
    end loop;

    delete from public.course_hero_points where course_id=v_course_id;
    v_order:=0;
    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'heroPoints','[]'::jsonb)) loop
      v_order:=v_order+1; insert into public.course_hero_points(course_id,content,sort_order) values(v_course_id,v_item#>>'{}',v_order);
    end loop;

    delete from public.course_competencies where course_id=v_course_id;
    v_order:=0;
    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'outcomes','[]'::jsonb)) loop
      v_order:=v_order+1; insert into public.course_competencies(course_id,title,description,sort_order) values(v_course_id,coalesce(v_item->>1,''),nullif(v_item->>2,''),v_order);
    end loop;

    delete from public.course_curriculum_sections where course_id=v_course_id;
    v_order:=0;
    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'curriculum','[]'::jsonb)) loop
      v_order:=v_order+1;
      insert into public.course_curriculum_sections(course_id,title,sort_order) values(v_course_id,coalesce(v_item->>1,'STEP '||v_order),v_order) returning id into v_section_id;
      v_i_order:=0;
      for v_i in select value from jsonb_array_elements(coalesce(v_item->2,'[]'::jsonb)) loop
        v_i_order:=v_i_order+1;
        insert into public.course_curriculum_items(section_id,content,sort_order) values(v_section_id,v_i#>>'{}',v_i_order);
      end loop;
    end loop;

    delete from public.course_targets where course_id=v_course_id;
    v_order:=0; for v_item in select value from jsonb_array_elements(coalesce(p_payload->'targets','[]'::jsonb)) loop
      v_order:=v_order+1; insert into public.course_targets(course_id,content,sort_order) values(v_course_id,v_item#>>'{}',v_order); end loop;

    delete from public.course_benefits where course_id=v_course_id;
    v_order:=0; for v_item in select value from jsonb_array_elements(coalesce(p_payload->'benefits','[]'::jsonb)) loop
      v_order:=v_order+1; insert into public.course_benefits(course_id,title,description,sort_order) values(v_course_id,coalesce(v_item->>0,''),nullif(v_item->>1,''),v_order); end loop;

    delete from public.course_faqs where course_id=v_course_id;
    v_order:=0; for v_item in select value from jsonb_array_elements(coalesce(p_payload->'faqs','[]'::jsonb)) loop
      v_order:=v_order+1; insert into public.course_faqs(course_id,question,answer,sort_order) values(v_course_id,coalesce(v_item->>0,''),coalesce(v_item->>1,''),v_order); end loop;

    return jsonb_build_object('ok',true,'data',jsonb_build_object('id',v_course_id,'cohort_id',v_cohort_id));
  end if;

  if p_action='course.delete' then
    v_course_id := (p_payload->>'id')::uuid;
    update public.course_cohorts set is_published=false,deleted_at=now() where course_id=v_course_id and deleted_at is null;
    update public.courses set is_published=false,deleted_at=now(),updated_at=now() where id=v_course_id;
    return jsonb_build_object('ok',true);
  end if;

  -- Generic list actions
  if p_action='notices.list' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_result from (select * from public.notices order by published_on desc,id desc) x;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;
  if p_action='jobs.list' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_result from (select * from public.jobs order by published_on desc,id desc) x;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;
  if p_action='history.list' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_result from (select * from public.academy_history order by sort_order,id) x;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;
  if p_action='inquiries.list' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_result from (select * from public.inquiries order by created_at desc) x;
    return jsonb_build_object('ok',true,'data',v_result);
  end if;

  if p_action='notice.save' then
    v_status := case when p_payload->>'status'='게시' then 'published' else 'draft' end;
    v_date := coalesce(nullif(p_payload->>'date','')::date,current_date);
    if nullif(p_payload->>'id','') is null then
      insert into public.notices(title,content,status,published_on,view_count) values(p_payload->>'title',p_payload->>'content',v_status,v_date,0) returning id into v_id;
    else
      v_id := (p_payload->>'id')::bigint; update public.notices set title=p_payload->>'title',content=p_payload->>'content',status=v_status,published_on=v_date where id=v_id;
    end if;
    return jsonb_build_object('ok',true,'data',jsonb_build_object('id',v_id));
  end if;
  if p_action='notice.delete' then delete from public.notices where id=(p_payload->>'id')::bigint; return jsonb_build_object('ok',true); end if;

  if p_action='job.save' then
    v_status := case when p_payload->>'status'='게시' then 'published' else 'draft' end;
    v_date := coalesce(nullif(p_payload->>'date','')::date,current_date);
    if nullif(p_payload->>'id','') is null then
      insert into public.jobs(category,company,title,status,published_on) values(p_payload->>'category',p_payload->>'company',p_payload->>'title',v_status,v_date) returning id into v_id;
    else
      v_id := (p_payload->>'id')::bigint; update public.jobs set category=p_payload->>'category',company=p_payload->>'company',title=p_payload->>'title',status=v_status,published_on=v_date where id=v_id;
    end if;
    return jsonb_build_object('ok',true,'data',jsonb_build_object('id',v_id));
  end if;
  if p_action='job.delete' then delete from public.jobs where id=(p_payload->>'id')::bigint; return jsonb_build_object('ok',true); end if;

  if p_action='history.save' then
    if nullif(p_payload->>'id','') is null then
      insert into public.academy_history(year_label,tag,title,description,sort_order,is_published)
      values(p_payload->>'year',nullif(p_payload->>'tag',''),p_payload->>'title',p_payload->>'description',coalesce((select max(sort_order)+10 from public.academy_history),10),true) returning id into v_id;
    else
      v_id := (p_payload->>'id')::bigint; update public.academy_history set year_label=p_payload->>'year',tag=nullif(p_payload->>'tag',''),title=p_payload->>'title',description=p_payload->>'description' where id=v_id;
    end if;
    return jsonb_build_object('ok',true,'data',jsonb_build_object('id',v_id));
  end if;
  if p_action='history.delete' then delete from public.academy_history where id=(p_payload->>'id')::bigint; return jsonb_build_object('ok',true); end if;

  if p_action='inquiry.update' then
    v_uuid := (p_payload->>'id')::uuid;
    v_status := case p_payload->>'status' when '대기' then 'waiting' when '상담중' then 'consulting' when '완료' then 'completed' when '취소' then 'cancelled' else p_payload->>'status' end;
    update public.inquiries set status=v_status,consultation_note=nullif(p_payload->>'consultation_note','') where id=v_uuid;
    return jsonb_build_object('ok',true);
  end if;

  raise exception 'UNKNOWN_ADMIN_ACTION: %',p_action;
end;
$$;

revoke all on function public.admin_api(text,text,jsonb) from public;
grant execute on function public.admin_api(text,text,jsonb) to anon, authenticated;

-- ------------------------------------------------------------------
-- 8) No demo rows are inserted here.
--    Add real notices/jobs/history from the admin UI after login.
-- ------------------------------------------------------------------

commit;

-- ------------------------------------------------------------------
-- FIRST ADMIN PASSWORD
-- ------------------------------------------------------------------
-- If admin_users already has a row, set a password in SQL Editor like this:
-- UPDATE public.admin_users
-- SET password_hash = crypt('CHANGE_THIS_PASSWORD', gen_salt('bf', 12)),
--     failed_login_count = 0,
--     locked_until = null,
--     is_active = true
-- WHERE login_id = 'admin';
--
-- If it has no row yet:
-- INSERT INTO public.admin_users(login_id,password_hash,name,is_active)
-- VALUES('admin',crypt('CHANGE_THIS_PASSWORD',gen_salt('bf',12)),'관리자',true);
--
-- Then grant super_admin if needed:
-- INSERT INTO public.admin_user_roles(admin_user_id,role_id)
-- SELECT u.id,r.id FROM public.admin_users u CROSS JOIN public.roles r
-- WHERE u.login_id='admin' AND r.code='super_admin'
-- ON CONFLICT DO NOTHING;
