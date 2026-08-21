# 모델 배치 규약이 두 그룹에서 다른데 문서에 없다

Status: needs-triage
Section: P3
Tags: 일관성

```text
인사이트 그룹   src/app/<page>/models.ts
프로토콜 그룹   src/lib/<domain>-concept.ts   (9개)
```

`CLAUDE.md`의 아키텍처 절은 `bitcoin-models.ts`만 언급하고 `*-concept.ts` 규약은 아예 없다. 새로 들어온 사람이 모델을 어디에 둘지 판단할 근거가 없다.

"여러 페이지가 공유하면 `lib/`"이라는 기준이 실제로 성립하는지 확인했더니 9개 중 7개가 한 페이지 전용이었다. 공유되는 건 `tx-concept`(3개 페이지)와 `script-concept`(2개 페이지)뿐이다. 배치가 원칙이 아니라 그룹의 관례다.

## 할 일

- 파일을 옮기는 리팩터는 하지 않는다. 범위가 크고 얻는 게 적다
- `CLAUDE.md`에 기준이 아니라 사실대로 적는다. 두 관례가 공존하며 어느 쪽이 어느 그룹의 것인지, 새 모델은 어디에 두면 되는지
