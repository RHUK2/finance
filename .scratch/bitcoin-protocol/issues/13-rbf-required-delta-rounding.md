# RBF 요구 증분이 소수점 사토시로 표시된다

Status: resolved
Section: P2
Tags: 직관성

`수수료가 422 sat 늘어 요구치(140.5 sat) 이상이다`처럼 요구 증분이 소수로 나온다. 사토시는 정수 단위다.

## Answer

`canReplaceByFee`의 `requiredDelta`를 올림한다. 판정 결과가 바뀌는 경계값은 아니지만 화면에 소수점 사토시가 뜨지 않는다.

같은 파일의 `TOTAL_BLOCKS_APPROX`도 960,000에서 963,000으로 갱신했다. 주석이 "2026년 8월 기준"이라 못박고 있는데 실제 높이는 963,401이었다.
