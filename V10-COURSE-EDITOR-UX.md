# v10 Course editor UX

## Added

- Collapsible/sliding sections in the course editor.
- Section open/closed state is remembered in localStorage.
- Cohort reuse panel for existing courses.
- `선택 기수 편집`: loads an existing cohort into the current editor.
- `새 기수로 복사`: copies operating information and prepares a new cohort row.
- New cohort number is automatically set to the next number in the selected year.
- Optional `기간 간격 유지`: after cloning, changing a start date automatically shifts its end date by the same original duration.

## Required Supabase patch

Run `SUPABASE_COHORT_REUSE_PATCH.sql` once in Supabase SQL Editor.

It adds `public.admin_course_cohorts(token, course_id)` which is only usable with a valid admin session and a content-management role.
