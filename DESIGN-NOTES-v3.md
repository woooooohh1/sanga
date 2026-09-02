# v3 디자인 개선 포인트

- 전체 페이지 스크롤 reveal / stagger 애니메이션 적용
- 메인 히어로 장식 요소 부드러운 floating motion
- 내비게이션 active/hover underline motion
- 과정 카드 정보 계층 재설계
  - 분야/상태 → 과정명 → 설명 → 기간/시간/지원 → 태그 → 가격/상세
- emoji 중심 아이콘을 제거하고 inline SVG 아이콘으로 통일
- 실업자/재직자/일반 과정 페이지에 요약 영역 + 개선된 검색/필터 UI 추가
- 카드 hover elevation / shimmer 효과
- 버튼, 상담 CTA, 페이지 히어로에 미세 모션 추가
- prefers-reduced-motion 대응

DB 연동 시에는 `assets/data.js`의 임시 데이터를 API 응답으로 교체하면 됩니다.
