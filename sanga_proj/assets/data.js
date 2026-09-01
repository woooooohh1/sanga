/*
 * =========================================================
 * 임시 데이터 참고 파일
 * =========================================================
 * 현재 semantic HTML 버전에서는 이 파일을 직접 로드하지 않습니다.
 *
 * 실제 DB 연동 시 권장 구조:
 *
 * 1) 서버 렌더링 방식
 *    - JSP / Thymeleaf / PHP 등에서 HTML 안의 반복 영역을 서버에서 생성
 *
 * 2) API 방식
 *    - GET /api/courses
 *    - GET /api/courses/:id
 *    - GET /api/notices
 *    - GET /api/jobs
 *    - GET /api/academy/history
 *    - POST /api/inquiries
 *
 * 페이지 내 각 연동 위치는
 * "[DB/API 연동 지점]" 주석으로 표시해 두었습니다.
 *
 * 필요 시 아래 객체를 mock API 응답 구조로 확장해서 사용할 수 있습니다.
 */

window.SANGA_MOCK_DATA = {
  academy: {
    name: "상아컴퓨터학원",
    mapSearchName: "상아컴퓨터회계학원",
    phone: "032-541-0131",
    address: "인천광역시 계양구 경명대로 1124"
  }
};
