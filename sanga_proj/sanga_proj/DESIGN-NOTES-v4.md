# v4 수정사항

- 과정 카드의 `교육기간 / 교육시간 / 지원구분` 라벨이 한 글자씩 줄바꿈되던 CSS 오류 수정
  - 원인: `.course-meta span` 규칙이 내부의 `.meta-label` span까지 재귀적으로 적용됨
  - 수정: `.course-meta > span`으로 직접 자식에만 grid 적용
- 좁은 화면에서도 라벨은 한 줄 유지 (`word-break: keep-all`, `white-space: nowrap`)
- 오시는 길 섹션 고급화
  - Google Maps 주소 검색 기반 embed
  - 네이버지도 열기 버튼
  - 구글지도 열기 버튼
  - 방문상담 CTA
- 지도 영역 반응형 대응

실제 배포 시 네이버 지도 API를 직접 삽입하려면 Naver Cloud Platform Maps Client ID가 필요합니다.
현재는 별도 키 없이 동작하도록 Google 지도 embed + Naver 검색 링크 방식으로 구성했습니다.
