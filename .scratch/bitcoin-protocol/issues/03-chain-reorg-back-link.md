# 체인 재구성에서 게임이론으로 가는 역방향 링크가 없다

Status: wontfix
Section: P2
Tags: 중복

인사이트 그룹 정비 때 `bitcoin-game-theory/attack-game`에 `/chain-reorg` 링크를 넣었다(`.scratch/bitcoin-insight/issues/03`). 역방향이 없어 `chain-reorg`만 읽은 독자는 "51%가 기술적으로 무엇을 할 수 있는가"는 알아도 "왜 아무도 안 하는가"라는 경제적 답을 못 얻는다.

## 할 일

- `chain-reorg/attack-scope`에 `/bitcoin-game-theory` 링크를 한 문장으로 넣는다
- 주인 관계는 그대로다. 기술은 `/chain-reorg`, 경제는 `/bitcoin-game-theory`

## Answer

이미 있었다. `chain-reorg/attack-scope.tsx`의 `과반 공격자도 할 수 없는 것` 카드 본문이 `/bitcoin-game-theory`로 링크하고, "과반 해시레이트를 갖출 정도의 투자자는 이미 네트워크 최대 이해관계자라 공격으로 얻는 이득보다 신뢰 붕괴로 잃는 게 훨씬 크다"까지 적고 있다.

S0에서 "역방향이 없다"고 기록한 건 잘못이다. 브라우저에서 링크를 세었는데 그때 ① 탭만 마운트된 상태였고, 이 링크는 ③ 탭의 접힌 `ExplainCard` 안에 있어 DOM에 없었다. 소스를 봤어야 했다.

위치도 적절하다. "51%로도 못 하는 것"을 나열한 바로 그 자리에서 경제적 이유로 이어지는 흐름이다. 손대지 않는다.
