# v5 Naver 지도 중심 수정

- 네이버지도 링크 검색어를 주소가 아닌 `상아컴퓨터학원`으로 변경
- Google 지도 iframe 제거
- 한국 사용자 기준으로 네이버 지도 UX를 메인으로 변경
- 네이버 지도 스타일의 위치 프리뷰 영역 추가
- 클릭 시 Naver Maps에서 `상아컴퓨터학원` 검색 결과로 이동
- 주소 표기:
  - 인천광역시 계양구 경명대로 1124
  - 명인프라자1 501호
- 실제 네이버 지도 SDK를 페이지 내부에 렌더링하려면 Naver Cloud Platform Maps Client ID가 필요함

설정값은 `assets/data.js`의 아래 항목에서 관리합니다.
- mapSearchName
- mapRoadAddress
- mapDetailAddress
