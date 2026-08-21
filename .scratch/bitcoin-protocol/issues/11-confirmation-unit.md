# 확인 수 단위가 영어로 표기된다

Status: resolved
Section: P2
Tags: 일관성

`chain-reorg`의 슬라이더와 표가 `${v}confirm` 형식을 써서 화면에 `3confirm`으로 뜬다. 사이트 전체가 한국어 단위(`회`·`개`·`블록`·`시간`)를 쓰고, 같은 페이지의 산문도 "트랜잭션을 3개 확인 보고", "확인 수가 늘수록"이라고 쓴다. 한 화면에서 같은 개념이 두 표기로 나온다.

## Answer

세 곳(`reorg-race` 슬라이더, `confirmation-safety` 슬라이더와 확률 표)을 `확인 N개`로 바꿨다.

`CONTEXT.md`에 `확인 수`를 정의하고 피할 말로 `컨펌`·`confirm`을 적는다.
