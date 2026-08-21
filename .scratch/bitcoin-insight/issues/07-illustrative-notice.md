# 가상 수치 고지 방식을 통일한다

Status: needs-triage
Section: S1, S2, S3
Tags: 일관성

가상 수치를 쓰는 페이지가 6개인데 고지 방식이 셋으로 갈린다.

| 방식                                    | 페이지                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `IllustrativeDisclaimer` 배너           | `bitcoin-quantum`, `illicit-funds`                     |
| 인트로 괄호 문구                        | `grid-battery`                                         |
| `models.ts` 주석에만 있고 화면에는 없음 | `bitcoin-game-theory`, `softwar`, `bitcoin-volatility` |

## 할 일

- 인트로 마지막에 통일 문구 한 문장을 넣는다
- 배너는 실제 위험 예측으로 오독될 여지가 큰 `bitcoin-quantum`과 `illicit-funds`만 남긴다
- `grid-battery`의 인트로 괄호 문구는 통일 문구로 교체한다
- `bitcoin-volatility/maturation-curve`는 실데이터 차트이므로 고지 대상이 아니다. 페이지 인트로 문구가 이 탭까지 덮지 않도록 배치에 주의한다
