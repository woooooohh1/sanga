# 상아컴퓨터학원 관리자 페이지

## 현재 구현
- 대시보드
- 수강과정 추가/수정/삭제
- 공지사항 추가/수정/삭제
- 취업정보 추가/수정/삭제
- 학원연혁 추가/수정/삭제
- 상담신청 확인/상태변경
- 모바일 관리자 메뉴

## 데모 저장 방식
현재는 DB가 없으므로 브라우저 `localStorage`를 사용합니다.
따라서 같은 브라우저에서 새로고침해도 데이터가 유지됩니다.

주의: 실제 운영용 저장 방식이 아닙니다.

## 실제 운영 전 필수 구현
1. 관리자 로그인
2. 서버 세션/JWT 인증
3. 관리자 권한 체크
4. DB CRUD API
5. 이미지/첨부파일 업로드
6. 게시글 HTML 에디터 사용 시 XSS 필터링
7. CSRF / SQL Injection / 파일 업로드 보안
8. 삭제 데이터 백업 또는 Soft Delete 권장

## 권장 API

### 과정
- GET `/api/admin/courses`
- POST `/api/admin/courses`
- PUT `/api/admin/courses/:id`
- DELETE `/api/admin/courses/:id`

### 공지
- GET `/api/admin/notices`
- POST `/api/admin/notices`
- PUT `/api/admin/notices/:id`
- DELETE `/api/admin/notices/:id`

### 취업정보
- GET `/api/admin/jobs`
- POST `/api/admin/jobs`
- PUT `/api/admin/jobs/:id`
- DELETE `/api/admin/jobs/:id`

### 연혁
- GET `/api/admin/history`
- POST `/api/admin/history`
- PUT `/api/admin/history/:id`
- DELETE `/api/admin/history/:id`

### 상담
- GET `/api/admin/inquiries`
- PUT `/api/admin/inquiries/:id/status`

## 연결 구조
관리자에서 저장한 DB 데이터를 사용자 페이지의 아래 API와 공유하면 됩니다.

- `/api/courses`
- `/api/notices`
- `/api/jobs`
- `/api/academy/history`

즉 같은 DB를
`사용자용 조회 API`와 `관리자용 CRUD API`가 함께 사용하는 구조를 권장합니다.


## 과정 상세 CMS
`수강과정 관리`에서 다음 항목을 모두 폼으로 관리합니다.

- 기본정보 / 공개·비공개
- 상세 첫 화면 문구 / 핵심 포인트
- 핵심 역량
- 커리큘럼
- 추천 대상
- 수강 혜택
- FAQ
- 미리보기

반복 항목은 `+ 추가`와 `삭제` 버튼으로 관리하므로 운영자는 HTML/JavaScript를 수정할 필요가 없습니다.
현재 데모 저장소는 localStorage이며 실제 배포 시에는 같은 폼 payload를 `/api/admin/courses`에 저장하도록 교체해야 합니다.
