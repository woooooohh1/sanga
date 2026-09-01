# 상아컴퓨터학원 리뉴얼 - Semantic HTML 버전

## 구조 변경
기존 버전은 `assets/app.js`가 페이지 콘텐츠까지 생성했지만,
이번 버전부터는 각 HTML 파일이 실제 콘텐츠 구조를 직접 가지고 있습니다.

즉:

- HTML: 문서 구조 / 콘텐츠 / 접근성
- CSS: 스타일
- JavaScript: 메뉴, 모달, 애니메이션, 검색/필터 등 인터랙션만 담당
- DB/API: HTML 내 `[DB/API 연동 지점]` 주석 위치에 연결

## 주요 시맨틱 요소
- `<header>`
- `<nav>`
- `<main>`
- `<section>`
- `<article>`
- `<aside>`
- `<footer>`
- `<address>`
- `<table>`
- `<form>`

## DB/API 연동 권장 엔드포인트
- GET `/api/courses`
- GET `/api/courses/:id`
- GET `/api/notices`
- GET `/api/jobs`
- GET `/api/academy/history`
- POST `/api/inquiries`

## 개발 방식 예시
### 서버 렌더링
JSP, Thymeleaf, PHP에서 `article.course-card`를 반복 출력.

### REST API
HTML 뼈대는 유지하고 필요한 목록 영역만 `fetch()`로 교체.

## 파일
- `index.html`
- `academy.html`
- `unemployed.html`
- `worker.html`
- `general.html`
- `olympiad.html`
- `jobs.html`
- `community.html`
- `assets/styles.css`
- `assets/app.js`
- `assets/data.js` (mock/API 구조 참고용)


## 관리자 페이지
`admin/index.html`에서 관리자 데모를 확인할 수 있습니다.

현재는 localStorage 기반이며, 실제 운영 전 DB/API 및 관리자 인증 연결이 필요합니다.
자세한 내용은 `admin/README.md` 참고.

## 과정 상세페이지
과정 목록의 `과정 상세` 버튼은 공통 템플릿 `course-detail.html?id={과정ID}` 로 이동합니다.

- 상세 템플릿: `course-detail.html`
- 과정별 상세 콘텐츠: `assets/course-details.js`
- 상세 렌더링/FAQ/커리큘럼 인터랙션: `assets/course-detail-page.js`
- 상세페이지 스타일: `assets/styles.css` 하단 `Course Detail Landing Page` 영역

현재 샘플 ID는 1~6이며, 같은 템플릿에 데이터만 추가하면 새로운 과정 상세페이지를 만들 수 있습니다.
관리자 데모(`admin/courses.html`)의 기본 정보는 동일한 `localStorage`의 과정 ID를 기준으로 상세페이지에서 우선 반영합니다.
실제 운영에서는 `GET /api/courses/:id` 응답을 `assets/course-detail-page.js`의 데이터 소스로 교체하는 방식을 권장합니다.

## v9 과정 상세 CMS

`admin/courses.html`에서 과정의 기본정보뿐 아니라 상세페이지 전체 콘텐츠를 코딩 없이 편집할 수 있습니다.

- 공개/비공개 관리
- 상세 첫 화면 문구 및 핵심 포인트
- 핵심 역량 카드 추가/삭제
- 단계별 커리큘럼 추가/삭제
- 추천 대상 추가/삭제
- 수강 혜택 추가/삭제
- FAQ 추가/삭제
- 관리자 미리보기
- 새 과정 저장 시 해당 과정 구분의 공개 목록에 자동 표시
- 과정 수정/삭제/비공개 상태가 공개 목록 및 상세페이지에 반영

현재 데모는 백엔드가 없는 정적 사이트이므로 관리자 데이터는 브라우저 `localStorage`에 저장됩니다. 실제 운영에서는 동일한 데이터 구조를 서버 DB/API에 연결해야 여러 관리자/방문자에게 동일한 내용이 제공됩니다.
