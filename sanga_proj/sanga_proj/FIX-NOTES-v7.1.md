# v7.1 학원소개 표시 오류 수정

원인:
- academy.html 일부 섹션은 `.reveal-up` 클래스를 사용
- 기존 app.js의 전역 reveal 로직은 `[data-reveal]`, `[data-stagger]`만 처리
- 따라서 `.reveal-up` 요소가 `opacity: 0` 상태에서 `is-visible`을 받지 못해 화면에 표시되지 않음

수정:
- `initGlobalMotion()`에서 `.reveal-up`도 IntersectionObserver 대상으로 포함
- 화면 진입 시 `.is-visible` 클래스 추가
- prefers-reduced-motion 환경에서도 정상 노출
