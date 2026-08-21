# 변동성 페이지의 `채택 추세` 라벨이 용어집과 충돌한다

Status: needs-triage
Section: S2
Tags: 정정, 일관성

`CONTEXT.md`는 채택률을 "전체 행위자 중 이미 채택한 비율"로 정의한다. `bitcoin-volatility/volatility-engine`의 슬라이더 라벨 `채택 추세 (drift)`는 그것이 아니라 성공 확률 p의 표류항을 가리킨다.

같은 사이트에서 채택이라는 말이 두 가지를 뜻한다.

## 할 일

- 라벨에서 채택이라는 말을 걷어낸다. 슬라이더가 실제로 미는 것은 p의 방향성이다
- `models.ts`의 `drift` 파라미터 주석도 함께 맞춘다
