# Public feed patch v4

이번 패치는 관리자 저장 데이터와 홈페이지 공개 데이터를 안정적으로 연결합니다.

## 반드시 먼저 실행
Supabase Dashboard > SQL Editor에서 `SUPABASE_PUBLIC_FEED_PATCH.sql` 전체를 1회 실행하세요.

추가되는 공개 조회 RPC:
- `public_courses_feed`
- `public_course_detail`
- `public_notices_feed`
- `public_jobs_feed`
- `public_history_feed`

브라우저는 복잡한 테이블 관계를 직접 조회하지 않고 위 읽기 전용 RPC를 사용합니다.
관리자 등록/수정은 기존 `admin_api`를 그대로 사용합니다.

## 변경 사항
- 메인 과정/공지 조회를 서로 독립 처리: 공지 오류가 과정 영역까지 덮어쓰지 않음
- 과정 목록/상세 페이지도 동일 공개 RPC 사용
- 학원 연혁은 `academy_history` 공개 데이터만 렌더링
- 동적으로 생성된 연혁 카드가 숨겨지지 않도록 처리
- 연혁 등록/수정 팝업 UI 개선
  - 연도/태그 빠른 입력
  - 설명 글자 수
  - 실시간 홈페이지 미리보기
  - 모바일 대응

## 로컬 확인
`assets/supabase-config.js`에 Project URL / Publishable key가 입력된 상태에서 Live Server로 실행하세요.
변경 후 Ctrl+Shift+R 강력 새로고침을 권장합니다.
