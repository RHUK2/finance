# 51% 공격을 다루는 세 곳을 서로 연결한다

Status: resolved
Section: S1
Tags: 중복

51% 공격이 세 곳에 있고 서로를 참조하지 않는다.

- `chain-reorg` (프로토콜 그룹): 기술. 재구성이 왜 일어나는지, 확인 수가 왜 안전을 주는지, 51%로도 못 하는 것이 무엇인지
- `bitcoin-game-theory/attack-game` (인사이트 그룹): 경제. 왜 합리적 공격자는 공격하지 않는지
- `mempool` 채굴풀 카드: 풀 점유율 50% 초과 위험 한 줄

관점이 갈리므로 셋 다 남긴다. 다만 `attack-game`만 읽은 독자는 51%가 무엇이든 뒤집을 수 있다고 오해한다. `chain-reorg/attack-scope`가 그 범위 제약을 이미 설명한다.

## 할 일

- `attack-game`에 51%가 뒤집을 수 있는 범위의 제약을 한 문장으로 넣고 `/chain-reorg`로 링크
- `mempool` 채굴풀 설명에 `/chain-reorg` 링크
- 프로토콜 그룹인 `/chain-reorg`는 이번 정비 범위 밖이므로 링크를 받기만 하고 수정하지 않는다

## Answer

`attack-game` 인트로에 51%가 뒤집을 수 있는 범위의 제약을 한 문장으로 넣고 `/chain-reorg`로 링크했다. `mempool` 채굴풀 카드에도 `/chain-reorg` 링크를 넣었다(S4). 그 과정에서 원래 서술("특정 풀이 50%를 초과하면 51% 공격 위험이 커집니다")이 부정확하다는 것도 드러나 함께 고쳤다. 티켓 21 참조.
