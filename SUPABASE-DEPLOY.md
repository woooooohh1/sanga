# Supabase 전체 연동 적용 순서

이 프로젝트는 정적 HTML/JS를 유지하면서 Supabase에 연결하도록 수정되어 있습니다.

## 1. 추가 SQL 실행

Supabase Dashboard → SQL Editor에서 프로젝트 루트의 `SUPABASE_FULL_INTEGRATION.sql` 전체를 실행합니다.

이 SQL은 기존에 만든 과정 테이블을 지우지 않습니다. 다음을 추가합니다.

- 관리자 세션(`admin_sessions`)
- 아이디/비밀번호 로그인 RPC
- 관리자 CRUD RPC
- 공지사항(`notices`)
- 취업정보(`jobs`)
- 연혁(`academy_history`)
- 상담신청(`inquiries`)
- 공개 상담접수 RPC
- 각 테이블 RLS

## 2. 첫 관리자 계정/비밀번호 설정

`admin_users`에 `admin` 계정이 이미 있다면 SQL Editor에서 아래처럼 실행합니다.

```sql
update public.admin_users
set password_hash = crypt('여기에_새_비밀번호', gen_salt('bf', 12)),
    failed_login_count = 0,
    locked_until = null,
    is_active = true
where login_id = 'admin';
```

계정이 없다면:

```sql
insert into public.admin_users(login_id,password_hash,name,is_active)
values('admin',crypt('여기에_새_비밀번호',gen_salt('bf',12)),'관리자',true);

insert into public.admin_user_roles(admin_user_id,role_id)
select u.id,r.id
from public.admin_users u
cross join public.roles r
where u.login_id='admin' and r.code='super_admin'
on conflict do nothing;
```

비밀번호 평문은 DB에 저장되지 않고 bcrypt 해시만 저장됩니다.

## 3. Supabase URL / Publishable key 입력

`assets/supabase-config.js`를 열어 입력합니다.

```js
window.SANGA_SUPABASE_CONFIG = {
  url: "https://프로젝트ID.supabase.co",
  publishableKey: "sb_publishable_..."
};
```

`sb_secret_...` 또는 `service_role`은 절대 브라우저 파일에 넣지 않습니다.

## 4. 로컬 실행

VS Code Live Server 또는 로컬 HTTP 서버로 실행합니다.

- 홈페이지: `/index.html`
- 관리자 로그인: `/admin/login.html`

관리자 로그인은 `admin_users.login_id + 비밀번호` 방식이며 이메일을 사용하지 않습니다.

## 5. 이번 버전에서 Supabase로 연결된 영역

### 홈페이지
- 메인 인기 과정
- 실업자/재직자/일반 과정 목록
- 과정 상세
- 공지사항 메인/목록
- 취업정보 목록
- 학원 연혁
- 상담신청 저장

### 관리자
- 실제 아이디/비밀번호 로그인
- 세션 만료/로그아웃
- 대시보드 통계
- 과정 목록/검색/페이지네이션
- 과정 추가/수정/삭제(soft delete)
- 과정 상세 콘텐츠(핵심포인트, 역량, 커리큘럼, 추천대상, 혜택, FAQ)
- 공지사항 CRUD
- 취업정보 CRUD
- 연혁 CRUD
- 상담신청 조회/상태/메모 관리

## 보안 메모

관리자 테이블과 `admin_sessions`는 브라우저에서 직접 SELECT/INSERT/UPDATE할 수 없습니다. 로그인과 관리자 CRUD는 `SECURITY DEFINER` RPC 내부에서 세션 토큰을 검증한 뒤 실행됩니다. 세션 토큰 원문은 DB에 저장하지 않고 SHA-256 해시만 저장합니다.
