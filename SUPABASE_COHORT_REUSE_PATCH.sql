-- ============================================================
-- SANGA Academy CMS - Cohort reuse helper
-- Run once in Supabase SQL Editor after the full integration SQL.
-- Adds a secure admin-only RPC used by the course editor to load
-- all cohorts of a course for edit/copy workflows.
-- ============================================================

create or replace function public.admin_course_cohorts(
  p_token text,
  p_course_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_admin uuid;
  v_allowed boolean := false;
  v_result jsonb;
begin
  v_admin := private.admin_id_from_token(p_token);

  select exists (
    select 1
    from public.admin_user_roles aur
    join public.roles r on r.id = aur.role_id
    where aur.admin_user_id = v_admin
      and r.code in ('super_admin','admin','editor')
  ) into v_allowed;

  if not v_allowed then
    raise exception 'ADMIN_PERMISSION_DENIED';
  end if;

  if not exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.deleted_at is null
  ) then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.cohort_year desc, x.cohort_number desc), '[]'::jsonb)
  into v_result
  from (
    select
      cc.id,
      cc.course_id,
      cc.cohort_year,
      cc.cohort_number,
      cc.cohort_name,
      cc.recruitment_type,
      cc.application_start_date,
      cc.application_end_date,
      cc.course_start_date,
      cc.course_end_date,
      cc.class_start_time,
      cc.class_end_time,
      cc.capacity,
      cc.total_days,
      cc.total_hours,
      cc.tuition_amount,
      cc.support_description,
      cc.delivery_mode,
      cc.location_id,
      cc.operation_status,
      cc.is_published,
      coalesce(
        (
          select jsonb_agg(cw.weekday order by cw.weekday)
          from public.cohort_weekdays cw
          where cw.cohort_id = cc.id
        ),
        '[]'::jsonb
      ) as weekdays
    from public.course_cohorts cc
    where cc.course_id = p_course_id
      and cc.deleted_at is null
  ) x;

  return jsonb_build_object('ok', true, 'data', v_result);
end;
$$;

revoke all on function public.admin_course_cohorts(text,uuid) from public;
grant execute on function public.admin_course_cohorts(text,uuid) to anon, authenticated;
