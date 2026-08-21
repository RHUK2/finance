# 가상 수치 고지 방식을 통일한다

Status: needs-triage (S3만 남음)
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

## Comments

S1 완료분: 게임이론·소프트워는 페이지 인트로 마지막 문장으로 통일하고 탭별 문구를 걷어냈다. `grid-battery`의 인트로 괄호 문구와 나머지 페이지는 S2·S3에서 처리한다.

S2 완료분: `grid-battery`의 인트로 괄호 문구를 통일 문구로 교체했다. `bitcoin-volatility`는 예고한 예외를 적용해 페이지 인트로가 아니라 앞 두 탭의 `SectionIntro`에만 넣었다. 성숙 곡선 탭이 실데이터 차트라 페이지 인트로에 넣으면 실데이터까지 가상값이라 말하게 된다. `bitcoin-quantum`은 배너를 유지했다. 남은 것은 `illicit-funds`(배너 유지)와 `bitcoin-history`뿐이다.
