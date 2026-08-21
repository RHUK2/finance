# BCRA 비율의 이름과 방향을 통일한다

Status: resolved
Section: S1
Tags: 정정, 일관성

`softwar/abstract-vs-physical`와 `softwar/softwar-vs-hardwar`는 `이득 ÷ 비용`을 BCRA라 부르고 1 미만이면 안전으로 읽는다. `bitcoin-game-theory/attack-game`은 같은 관계를 `비용 ÷ 이득`으로 뒤집어 표시하고 이름을 붙이지 않았으며, 이쪽은 1을 넘겨야 안전이다.

두 페이지를 오간 독자에게는 같은 상황의 안전 판정이 뒤집혀 보인다.

## 할 일

- `attack-game`의 `비용 ÷ 이득` 지표를 BCRA(`이득 ÷ 비용`)로 방향을 맞추고 이름을 붙인다
- 판정 문구(`탈취됨` / `방어됨`)의 임계 조건이 세 곳에서 같은 부등호를 쓰는지 확인한다
- BCRA를 `CONTEXT.md`에 정의한다. 약어 원어(Benefit-to-Cost of Attack Ratio)의 출처가 로워리의 `Softwar`임을 밝힌다

## Answer

`attack-game`의 비율을 BCRA(이득÷비용)로 뒤집고 계산·표시를 `src/lib/bcra.ts`로 모았다. 소프트워의 `powerCapture`도 같은 모듈을 쓴다. 두 페이지 모두 `1 미만이면 방어`를 기준선으로 표시한다. 근거는 ADR-0002.
