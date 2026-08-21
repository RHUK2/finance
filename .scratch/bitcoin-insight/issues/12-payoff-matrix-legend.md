# 죄수의 딜레마 행렬에 표기법 범례가 없다

Status: resolved
Section: S1
Tags: 일관성

`payoff-matrix`는 밑줄(최적대응)과 링(내쉬 균형) 표기를 두 행렬 모두에서 쓰는데, `MatrixLegend`는 위쪽 채택 게임 카드 안에만 있었다. 아래로 스크롤해 죄수의 딜레마 행렬을 보는 독자에게는 표기의 뜻을 알 길이 없다.

## Answer

`PayoffGrid`가 `MatrixLegend`를 항상 함께 렌더하도록 옮겼다. 표기를 쓰는 곳과 범례가 떨어질 수 없게 된다.
