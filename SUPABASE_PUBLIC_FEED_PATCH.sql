-- ============================================================
-- SANGA Academy CMS - Public feed patch
-- Purpose:
--   1) Public homepage/course/history/notices/jobs reads use stable RPCs.
--   2) Avoid deep PostgREST/RLS relationship queries from browser.
--   3) Admin writes remain unchanged.
-- Run once in Supabase SQL Editor.
-- ============================================================

begin;

create or replace function public.public_courses_feed(p_type_code text default null)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(row_data order by (row_data->>'sort_order')::int, row_data->>'title'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'short_description', c.short_description,
      'description', c.description,
      'eyebrow', c.eyebrow,
      'badge', c.badge,
      'lead', c.lead,
      'is_published', c.is_published,
      'sort_order', c.sort_order,
      'course_types', jsonb_build_object('code', ct.code, 'name', ct.name),
      'course_categories', jsonb_build_object('name', cc.name),
      'course_cohorts', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', ch.id,
            'cohort_year', ch.cohort_year,
            'cohort_number', ch.cohort_number,
            'cohort_name', ch.cohort_name,
            'recruitment_type', ch.recruitment_type,
            'application_start_date', ch.application_start_date,
            'application_end_date', ch.application_end_date,
            'course_start_date', ch.course_start_date,
            'course_end_date', ch.course_end_date,
            'class_start_time', ch.class_start_time,
            'class_end_time', ch.class_end_time,
            'capacity', ch.capacity,
            'tuition_amount', ch.tuition_amount,
            'support_description', ch.support_description,
            'operation_status', ch.operation_status,
            'is_published', ch.is_published,
            'cohort_weekdays', coalesce((
              select jsonb_agg(jsonb_build_object('weekday', cw.weekday) order by cw.weekday)
              from public.cohort_weekdays cw
              where cw.cohort_id = ch.id
            ), '[]'::jsonb)
          )
          order by ch.cohort_year desc, ch.cohort_number desc
        )
        from public.course_cohorts ch
        where ch.course_id = c.id
          and ch.is_published = true
          and ch.deleted_at is null
      ), '[]'::jsonb),
      'course_tags', coalesce((
        select jsonb_agg(jsonb_build_object('tags', jsonb_build_object('name', t.name)) order by t.name)
        from public.course_tags ctag
        join public.tags t on t.id = ctag.tag_id
        where ctag.course_id = c.id
          and t.is_active = true
      ), '[]'::jsonb)
    ) as row_data
    from public.courses c
    join public.course_types ct on ct.id = c.course_type_id
    join public.course_categories cc on cc.id = c.category_id
    where c.is_published = true
      and c.deleted_at is null
      and ct.is_active = true
      and cc.is_active = true
      and (p_type_code is null or ct.code = p_type_code)
  ) q;
$$;

create or replace function public.public_course_detail(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'short_description', c.short_description,
      'description', c.description,
      'eyebrow', c.eyebrow,
      'badge', c.badge,
      'lead', c.lead,
      'is_published', c.is_published,
      'course_types', jsonb_build_object('code', ct.code, 'name', ct.name),
      'course_categories', jsonb_build_object('name', cc.name),
      'course_cohorts', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', ch.id,
            'cohort_year', ch.cohort_year,
            'cohort_number', ch.cohort_number,
            'cohort_name', ch.cohort_name,
            'recruitment_type', ch.recruitment_type,
            'application_start_date', ch.application_start_date,
            'application_end_date', ch.application_end_date,
            'course_start_date', ch.course_start_date,
            'course_end_date', ch.course_end_date,
            'class_start_time', ch.class_start_time,
            'class_end_time', ch.class_end_time,
            'capacity', ch.capacity,
            'total_days', ch.total_days,
            'total_hours', ch.total_hours,
            'tuition_amount', ch.tuition_amount,
            'support_description', ch.support_description,
            'operation_status', ch.operation_status,
            'is_published', ch.is_published,
            'cohort_weekdays', coalesce((
              select jsonb_agg(jsonb_build_object('weekday', cw.weekday) order by cw.weekday)
              from public.cohort_weekdays cw
              where cw.cohort_id = ch.id
            ), '[]'::jsonb)
          ) order by ch.cohort_year desc, ch.cohort_number desc
        )
        from public.course_cohorts ch
        where ch.course_id = c.id and ch.is_published = true and ch.deleted_at is null
      ), '[]'::jsonb),
      'course_tags', coalesce((
        select jsonb_agg(jsonb_build_object('tags', jsonb_build_object('name', t.name)) order by t.name)
        from public.course_tags ctag join public.tags t on t.id = ctag.tag_id
        where ctag.course_id = c.id and t.is_active = true
      ), '[]'::jsonb),
      'course_hero_points', coalesce((
        select jsonb_agg(jsonb_build_object('content', x.content, 'sort_order', x.sort_order) order by x.sort_order)
        from public.course_hero_points x where x.course_id = c.id
      ), '[]'::jsonb),
      'course_competencies', coalesce((
        select jsonb_agg(jsonb_build_object('title', x.title, 'description', x.description, 'sort_order', x.sort_order) order by x.sort_order)
        from public.course_competencies x where x.course_id = c.id
      ), '[]'::jsonb),
      'course_curriculum_sections', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'description', s.description,
            'sort_order', s.sort_order,
            'course_curriculum_items', coalesce((
              select jsonb_agg(jsonb_build_object('content', i.content, 'sort_order', i.sort_order) order by i.sort_order)
              from public.course_curriculum_items i where i.section_id = s.id
            ), '[]'::jsonb)
          ) order by s.sort_order
        ) from public.course_curriculum_sections s where s.course_id = c.id
      ), '[]'::jsonb),
      'course_targets', coalesce((
        select jsonb_agg(jsonb_build_object('content', x.content, 'sort_order', x.sort_order) order by x.sort_order)
        from public.course_targets x where x.course_id = c.id
      ), '[]'::jsonb),
      'course_benefits', coalesce((
        select jsonb_agg(jsonb_build_object('title', x.title, 'description', x.description, 'sort_order', x.sort_order) order by x.sort_order)
        from public.course_benefits x where x.course_id = c.id
      ), '[]'::jsonb),
      'course_faqs', coalesce((
        select jsonb_agg(jsonb_build_object('question', x.question, 'answer', x.answer, 'sort_order', x.sort_order) order by x.sort_order)
        from public.course_faqs x where x.course_id = c.id
      ), '[]'::jsonb)
    )
    from public.courses c
    join public.course_types ct on ct.id = c.course_type_id
    join public.course_categories cc on cc.id = c.category_id
    where c.is_published = true
      and c.deleted_at is null
      and (c.slug = p_key or c.id::text = p_key)
    limit 1
  ), 'null'::jsonb);
$$;

create or replace function public.public_notices_feed(p_limit integer default null)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.published_on desc, x.id desc), '[]'::jsonb)
  from (
    select id, title, content, published_on, view_count
    from public.notices
    where status = 'published'
    order by published_on desc, id desc
    limit case when p_limit is null or p_limit <= 0 then null else p_limit end
  ) x;
$$;

create or replace function public.public_jobs_feed(p_limit integer default null)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.published_on desc, x.id desc), '[]'::jsonb)
  from (
    select id, category, company, title, description, apply_url, published_on
    from public.jobs
    where status = 'published'
    order by published_on desc, id desc
    limit case when p_limit is null or p_limit <= 0 then null else p_limit end
  ) x;
$$;

create or replace function public.public_history_feed()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order, x.id), '[]'::jsonb)
  from (
    select id, year_label, tag, title, description, sort_order
    from public.academy_history
    where is_published = true
  ) x;
$$;

revoke all on function public.public_courses_feed(text) from public;
revoke all on function public.public_course_detail(text) from public;
revoke all on function public.public_notices_feed(integer) from public;
revoke all on function public.public_jobs_feed(integer) from public;
revoke all on function public.public_history_feed() from public;

grant execute on function public.public_courses_feed(text) to anon, authenticated;
grant execute on function public.public_course_detail(text) to anon, authenticated;
grant execute on function public.public_notices_feed(integer) to anon, authenticated;
grant execute on function public.public_jobs_feed(integer) to anon, authenticated;
grant execute on function public.public_history_feed() to anon, authenticated;

commit;

-- quick checks (optional):
-- select public.public_courses_feed(null);
-- select public.public_history_feed();
