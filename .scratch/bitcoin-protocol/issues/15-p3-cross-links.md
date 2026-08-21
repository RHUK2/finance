# 라이트닝·프라이버시가 다른 페이지를 이름으로만 부른다

Status: resolved
Section: P3
Tags: 중복

두 페이지 모두 내부 링크가 하나도 없었다(소스로 확인). 그런데 산문은 다른 페이지를 계속 이름으로 가리킨다.

```text
privacy/address-reuse      "지갑 키 생성 페이지에서 다룬 시드 파생 구조"
lightning/onchain-comp     "온체인 트랜잭션 해부·스크립트 검증·블록 채굴에서 다룬 모든 규칙"
lightning/htlc-routing     "타임락은 왜 필요할까"  ← timelock-lab이 CLTV·CSV 정본 (S0의 D5)
privacy (페이지 전체)       인사이트 그룹 illicit-funds가 이쪽을 링크하는데 역방향 없음
```

## Answer

이름만 부르던 자리를 전부 링크로 바꿨다.

- `htlc-routing`의 타임락 카드 → `/multisig-timelock`. "그 페이지가 잠금 조건을 정면으로 다루고, 여기서는 그것을 여러 홉에 걸어 중계자를 믿지 않아도 되게 만드는 쓰임을 본다"로 역할 분담을 밝혔다
- `onchain-comparison` 마무리 카드 → `/transactions`, `/script-verify`, `/block-mining` 셋
- `privacy/address-reuse` 배너 → `/wallet-keys`
- `privacy` 페이지 인트로 → `/illicit-funds` 역방향 링크

## Comments

`privacy` 탭 ②(체인분석 휴리스틱)만 배너가 없는 점도 봤지만 그대로 뒀다. `이 휴리스틱들이 100% 정확하지는 않다` 설명 카드가 "실제로는 더 많은 휴리스틱과 오프체인 데이터를 쓴다"는 고지 역할을 이미 하고 있어, 배너를 새로 달면 같은 말이 한 화면에 두 번 나온다.
