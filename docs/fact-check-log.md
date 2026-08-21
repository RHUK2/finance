# 사실 검증 기록

설명 페이지의 수치·연도·규격을 원문과 대조한 결과다. 여기 적힌 항목은 대조를 마쳤으므로 다시 검증하지 않아도 된다. 정정한 것이 아니라 맞았던 것을 남기는 문서다.

대조 시점은 2026년 8월이다. 시세·시장 데이터처럼 시간이 지나면 변하는 값은 `## 시간이 지나면 다시 봐야 하는 값`에 따로 모았다.

## 비트코인 프로토콜

### BIP-39 (`/wallet-keys`)

- 엔트로피 128~256비트, 체크섬 = ENT ÷ 32, 단어 수 = (ENT + CS) ÷ 11
- 시드 파생은 PBKDF2-HMAC-SHA512 2048회
- 단어장 2048개가 실제 BIP-39 영어 목록이다. `abandon`(0) ~ `zoo`(2047)
- 엔트로피 → 11비트 청크 → 인덱스 → 단어 매핑이 실제 규칙 그대로다. 화면의 12개를 전부 대조해 통과했다
  (125=autumn · 601=enroll · 1878=turn · 874=hood · 900=identify · 171=betray · 1410=raccoon · 288=catch · 706=flame · 1264=own · 1149=moral · 927=initial)

### BIP-32 / 44 (`/wallet-keys`)

- 마스터 키는 HMAC-SHA512(key = "Bitcoin seed"), 출력 왼쪽 32B = 개인키, 오른쪽 32B = 체인코드
- 하드닝 파생은 부모 개인키가 필요하고 일반 파생은 부모 공개키로 충분하다
- purpose 44'/49'/84'/86' ↔ P2PKH / P2SH-P2WPKH / P2WPKH / P2TR
- 주소 접두어 `1` / `3` / `bc1q` / `bc1p`, 총 길이 34 / 34 / 42 / 62자
- base58 문자셋 58자(`0`·`O`·`I`·`l` 제외), bech32 문자셋 32자

### 트랜잭션·수수료 (`/transactions`)

- 입력 vByte: legacy 148 · nested 91 · native 68 · taproot 57.5
- 출력 vByte: legacy 34 · nested 32 · native 31 · taproot 43
- 트랜잭션 오버헤드 10.5 vB (version 4 + locktime 4 + 개수 varint + SegWit marker/flag)

### 서명·스크립트 (`/script-verify`, `/multisig-timelock`)

- ECDSA 서명 r·s 각 32B + DER + sighash flag = 71~72B, Schnorr 64B (SIGHASH_DEFAULT는 flag 생략)
- 개인키 32B, 압축 공개키 33B(`02`/`03` 접두), x-only 공개키 32B, sighash 다이제스트 32B, HASH160 20B
- `OP_CHECKMULTISIG`의 오프바이원 때문에 scriptSig 앞에 더미 `OP_0`이 필요하다
- 서명은 공개키 목록과 같은 순서로 나열해야 한다
- CLTV는 절대 블록 높이(또는 시각), CSV는 UTXO 확정 시점 기준 상대 블록
- 라이트닝 강제 종료 유예는 관행적으로 약 144블록

### 블록·합의 (`/block-mining`, `/chain-reorg`)

- 블록 헤더 80바이트 = version 4 + prevHash 32 + merkleRoot 32 + timestamp 4 + bits 4 + nonce 4
- 난이도 조정 주기 2016블록, 목표 기간 14일, 조정 폭은 ±4배로 제한
- `doubleSpendProbability`가 백서 11장 공식을 그대로 구현했다. q=0.1에서 백서 표와 일치

  | z   | 코드      | 백서                            |
  | --- | --------- | ------------------------------- |
  | 1   | 2.0459e-1 | 2.0459e-1                       |
  | 2   | 5.0978e-2 | 5.0978e-2                       |
  | 3   | 1.3172e-2 | 1.3172e-2                       |
  | 6   | 2.4280e-4 | 2.4280e-4                       |
  | 10  | 1.2414e-6 | 1.2000e-6 (백서는 7자리 반올림) |

### 소프트포크 (`/soft-fork-activation`)

- BIP9 상태 전이 STARTED → LOCKED_IN → ACTIVE, 타임아웃 시 FAILED
- BIP9 메인넷 기본 임계값 95%(1916/2016). 임계값은 프로토콜 상수가 아니라 배포마다 정하는 파라미터다
- Taproot는 Speedy Trial로 90%(1815/2016)를 썼다
- Taproot 타임라인: 2018 BIP340-342 제안 → 2021.05 시그널링 시작 → 2021.06 LOCKED_IN → 2021.11 ACTIVE

### P2P (`/p2p-network`)

- 블록 헤더 80바이트 고정
- BIP125 RBF 규칙 3·4: 절대 수수료가 커야 하고, 증분이 최소 릴레이 수수료율 × 대체 tx 크기 이상이어야 한다
- `generateGossipGraph`는 무작위 스패닝 트리 + 무작위 간선이다. 격자가 아니다

### 라이트닝·프라이버시 (`/lightning-network`, `/privacy`)

- 채널은 2-of-2 멀티시그로 열고, 커밋먼트 교체로 오프체인 갱신하며, 구버전 방송에 벌칙 조항이 걸린다
- HTLC 정산은 수취인 쪽 링크부터 역방향으로 전파된다
- CoinJoin 익명 집합은 참가자 수 N에 대해 1/N
- 공통 입력 소유권 휴리스틱

## 비트코인 인사이트

### 양자컴퓨터 (`/bitcoin-quantum`)

- NIST가 2024년 8월 ML-DSA(FIPS 204)와 SLH-DSA(FIPS 205)를 최종 표준으로 확정했다
- 서명 크기 ML-DSA 약 2.4~4.6KB, SLH-DSA 약 7.9KB, 슈노어 64B, ECDSA 71~72B
- 공개키 노출 잔고 비중 추정 약 20~30%
- 주소는 공개키의 해시이고, 공개키는 그 주소에서 처음 지출할 때 서명과 함께 드러난다

### 역사 (`/bitcoin-history`)

거버넌스 9건, 시장·채택 11건을 전부 대조했다.

- 백서 2008-10-31 공개, 9쪽, 암호학 메일링 리스트
- 제네시스 블록 2009-01-03, 코인베이스 문구 `The Times 03/Jan/2009 Chancellor on brink of second bailout for banks`
- 피자데이 2010-05-22, 1만 BTC
- $1 패리티 2011-02, 고점 약 $31
- 키프로스 2013-03, 첫 $1,000 돌파 2013년 말
- Mt.Gox 2014-02, 약 85만 BTC
- OP_RETURN이 Bitcoin Core 0.9에서 80바이트 제안을 40바이트로 낮춰 표준화됐다
- Bitcoin XT(2015, BIP101) · Classic(2016, 2MB) · 홍콩 합의(2016) · 뉴욕 합의(2017)
- BIP148 UASF와 BCH 분기가 같은 날(2017-08-01)
- SegWit2x 2017-11 취소
- CME·CBOE 선물 2017-12 상장, 고점 약 $20,000
- 엘살바도르 2021-09-07 법정화폐 채택, 고점 약 $69,000
- FTX 2022-11 파산, 저점 약 $16,000
- 미국 현물 ETF 2024-01 승인, 4차 반감기로 블록 보상 3.125 BTC
- Bitcoin Core 30.0은 2025-10-10 공개. `datacarriersize` 기본값 83 → 100,000, 복수 OP_RETURN 릴레이 허용, `-datacarrier`·`-datacarriersize` 모두 deprecated로 표시되고 이후 릴리스에서 제거 예정

  출처: https://bitcoincore.org/en/releases/30.0/

### 자금추적 (`/illicit-funds`)

- 실크로드 69,370 BTC를 2020-11 미 법무부가 압수(해커 Individual X 보유분)
- 콜로니얼 파이프라인 2021-05 몸값 75 BTC 지불, 2021-06 63.7 BTC 회수
- 비트파이넥스 2016-08 해킹 119,754 BTC, 2022-02 약 94,000 BTC 압수
- 미화 100달러권 1장 = 1.0g, 156.1 × 66.3 × 0.1093mm ≈ 1.13cm³
- 온체인 거래액 중 불법 주소 비중 1% 미만(체인분석 업계 추정), 세계 자금세탁 규모 GDP의 2~5%(UNODC)

## 화폐·부동산

### 최저임금 (`/inflation`)

- 한국: 2024년 9,860원 · 2025년 10,030원 · 2026년 10,320원
- 미국 연방: 2009년 $7.25 이후 변동 없음

  두 표는 룩업 의미가 다르다. 미국은 표에 없는 연도가 "안 바뀐 것"이지만 한국은 "아직 표에 안 넣은 것"이다.

### 주택담보대출 (`/mortgage`)

- DSR 한도 40%
- 스트레스 DSR 3단계는 2025.7부터 하한 1.5%p였고, 10·15 대책으로 2025.10.16부터 수도권·규제지역 주택담보대출은 3.0%p다. 비수도권은 더 낮다

## 시간이 지나면 다시 봐야 하는 값

아래는 대조 시점(2026년 8월)에는 맞았지만 시간이 지나면 틀려지는 값이다. 화면에 쓸 때 기준 시점을 함께 적는다.

| 값                         | 위치                              | 2026-08 기준                           |
| -------------------------- | --------------------------------- | -------------------------------------- |
| BTC 시세 기본값            | `bitcoin-game-theory/attack-game` | $75,000                                |
| 네트워크 해시레이트 기본값 | `bitcoin-game-theory/attack-game` | 810 EH/s                               |
| 금 시가총액                | `bitcoin-volatility/models.ts`    | $31.6조 (온스당 $4,549 × 약 216,000톤) |
| 근사 블록 높이             | `lib/p2p-concept.ts`              | 963,000                                |
| 최저임금 표                | `lib/inflation-models.ts`         | 한국 2026년까지                        |
| LTV·DSR·스트레스 가산폭    | `mortgage/limit.tsx`              | 위 참조                                |
| Knots 노드 점유율          | `bitcoin-history/events.ts`       | 도달 가능 노드의 15~25%                |
