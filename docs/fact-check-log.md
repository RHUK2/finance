# 사실 검증 기록

설명 페이지의 수치·연도·규격을 원문과 대조한 결과다. 여기 적힌 항목은 대조를 마쳤으므로 다시 검증하지 않아도 된다. 맞았던 값을 남기는 문서이고, 대조하다 고친 값은 고친 뒤 값을 원문과 함께 적는다. 예외는 `## 원문 미확인` 절과 미대조로 표시한 항목이다. 그 값은 아직 원문과 맞춰 보지 못했다.

대조는 두 번 했다. 1차는 2026년 8월이고, 절마다 맨 위 목록이 그 결과다. 2차는 2026-10-01이고, 절마다 `2026-10-01 대조` 표로 붙였다. 표의 결과 칸은 `일치` 아니면 `고침`이다. `고침`은 화면이나 코드 값을 원문에 맞춰 바꿨다는 뜻이고 원문 칸이 고친 뒤 값의 근거다. 시세·시장 데이터처럼 시간이 지나면 변하는 값은 `## 시간이 지나면 다시 봐야 하는 값`에 따로 모았다.

## 비트코인 프로토콜

### secp256k1·ECDSA (`/ecdsa`)

2026-10-01 대조

| 값                                                                                              | 결과 | 원문                                                                                                                                    | 출처                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| p = 2²⁵⁶ − 2³² − 977, n ≈ 1.158 × 10⁷⁷(78자리), Gx 앞머리 `79BE667E F9DCBBAC 55A06295 CE870B07` | 일치 | p = FFFF…FFFE FFFFFC2F, n = FFFF…BAAEDCE6AF48A03BBFD25E8CD0364141. G가 곡선 위에 있음을 계산으로 확인                                   | https://www.secg.org/sec2-v2.pdf (2.4.1절)                                                                                                             |
| 토이 곡선 y² = x³ + 7 mod 43, 아핀 점 30개(무한원점 포함 31), G = (2, 12) 위수 31               | 일치 | 전수 계산. 31이 소수라 무한원점이 아닌 모든 점의 위수가 31. 12² ≡ 15 ≡ 2³ + 7 (mod 43)                                                  | 계산                                                                                                                                                   |
| 유한체 설명 "지구의 원자 개수(약 10⁵⁰)를 훨씬 넘는다"                                           | 고침 | 비교 대상이 없던 "원자 개수"를 지구로 좁혔다. 우주의 원자 수(10⁷⁸~10⁸²)는 n보다 크고, 지구의 원자 수 약 1.33 × 10⁵⁰보다는 n이 훨씬 크다 | https://sciencenotes.org/how-many-atoms-are-in-the-world/                                                                                              |
| 전수 탐색 "1초에 10억 줄 × 지구의 모든 원자 × 우주의 나이로도 끝나지 않는다"                    | 일치 | 1.33 × 10⁵⁰ × 10⁹ × 4.35 × 10¹⁷초 ≈ 5.8 × 10⁷⁶줄로 n의 절반이다. 성립하지만 여유는 2배다                                                | https://arxiv.org/abs/1807.06209                                                                                                                       |
| 2010년 PS3 서명 k 고정, 2013년 안드로이드 난수 결함                                             | 일치 | fail0verflow 27C3(2010-12), bitcoin.org 경고(2013-08-11)                                                                                | https://fahrplan.events.ccc.de/congress/2010/Fahrplan/attachments/1780_27c3_console_hacking_2010.pdf · https://bitcoin.org/en/alert/2013-08-11-android |

### BIP-39 (`/wallet-keys`)

- 엔트로피 128~256비트, 체크섬 = ENT ÷ 32, 단어 수 = (ENT + CS) ÷ 11
- 시드 파생은 PBKDF2-HMAC-SHA512 2048회
- 단어장 2048개가 실제 BIP-39 영어 목록이다. `abandon`(0) ~ `zoo`(2047)
- 공정한 6면 주사위 한 번은 log₂6 ≈ 2.585비트다. 99번이면 약 255.9비트라 256비트에 못 미치고, 100번(약 258.5비트)이어야 넘는다
- 엔트로피 → 11비트 청크 → 인덱스 → 단어 매핑이 실제 규칙 그대로다. 화면의 12개를 전부 대조해 통과했다
  (125=autumn · 601=enroll · 1878=turn · 874=hood · 900=identify · 171=betray · 1410=raccoon · 288=catch · 706=flame · 1264=own · 1149=moral · 927=initial)

2026-10-01 대조

| 값                                  | 결과 | 원문                                                                                                        | 출처                                                                                         |
| ----------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 주사위 100번이어야 256비트를 넘는다 | 일치 | Coldcard 문서는 "99 rolls for a 24 word seed"라고 적지만 99번은 255.9비트다. 화면은 산술대로 100번이라 쓴다 | https://coldcard.com/docs/master-seed/ · https://coldcard.com/docs/verifying-dice-roll-math/ |

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

2026-10-01 대조

| 값                         | 결과 | 원문                                                                                                            | 출처                                                                                                                            |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 서명 길이 변동 ±1~2 vB     | 일치 | DER 서명 71~73바이트. legacy 입력은 ±1 vB, SegWit은 witness 할인으로 ±0.25 vB. "±1~2"는 상한을 넉넉히 잡은 표현 | https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki · https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki |
| 블록 한도 약 1MvB, 약 10분 | 일치 | `MAX_BLOCK_WEIGHT` 4,000,000 = 1,000,000 vB, 목표 간격 600초                                                    | https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h                                                        |
| 꽉 찬 블록 보통 1.5~2MB    | 일치 | 2026-10-01 최근 15블록 1.47~2.11MB(빈 블록 제외), 최근 3개월 평균 1.58~1.60MB                                   | https://mempool.space/api/v1/blocks · https://api.blockchain.info/charts/avg-block-size                                         |

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
- `doubleSpendProbability`가 백서 11장 공식을 그대로 구현했다. q=0.1에서 백서 표와 일치. `/chain-reorg` 화면의 확률도 이 함수로 계산해 찍는다. 아래 표의 z는 백서의 z(트랜잭션이 담긴 블록 뒤에 이어진 블록 수)라, 트랜잭션이 담긴 블록을 1확인으로 세는 확인 수(`CONTEXT.md` 「확인 수」)로는 z + 1확인이다. 6확인은 z = 5(백서 9.137e-4)다

  | z   | 코드      | 백서                            |
  | --- | --------- | ------------------------------- |
  | 1   | 2.0459e-1 | 2.0459e-1                       |
  | 2   | 5.0978e-2 | 5.0978e-2                       |
  | 3   | 1.3172e-2 | 1.3172e-2                       |
  | 6   | 2.4280e-4 | 2.4280e-4                       |
  | 10  | 1.2414e-6 | 1.2000e-6 (백서는 7자리 반올림) |

2026-10-01 대조

| 값                                                                               | 결과 | 원문                                                                                                                                                         | 출처                                                                                                 |
| -------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| ASIC 1대 초당 약 500조 회, 전 세계 100만 배 이상, 목표 앞자리 0 열아홉 자리 안팎 | 일치 | 500 TH/s는 최상위 수랭 기종 수준. 3일 평균 약 995 EH/s ÷ 500 TH/s ≈ 200만 배. 난이도 132.76T에서 앞자리 0 약 78.9비트 = 16진 19자리                          | https://mempool.space/api/v1/mining/hashrate/3d · https://mempool.space/api/v1/difficulty-adjustment |
| 반감기 210,000블록, 초기 보상 50 BTC                                             | 일치 | `nSubsidyHalvingInterval = 210000`, 초기 보조금 50 BTC                                                                                                       | https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp                            |
| 반감기 날짜 2012-11-28 · 2016-07-09 · 2020-05-11 · 2024-04-20                    | 일치 | 블록 210,000·420,000·630,000·840,000의 타임스탬프(UTC)                                                                                                       | https://mempool.space/api/block-height/840000 (높이별 조회)                                          |
| 다음 반감기 추정 2028-04-13 (`src/lib/bitcoin-models.ts`)                        | 고침 | 2028-04-20에서 당겼다. 2026-08-18 블록 963,000에서 87,000블록 × 10분. 화면의 반감기 예상일은 로더가 실시간으로 계산하고 이 상수는 Puell 시대 경계에만 쓰인다 | https://mempool.space/api/block-height/963000                                                        |
| 마지막 보조금 시대 32, 2140년 언저리, 누적 20,999,999.9769 BTC                   | 일치 | 50 BTC를 32번 반감하면 1 sat, 33번이면 0. 총합 2,099,999,997,690,000 sat. 33번째 시대 시작 약 2140.2년                                                       | https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp (`GetBlockSubsidy`)                |
| 2032년에 상한의 98% 발행, 최대 발행량 2,100만                                    | 일치 | 2032년 초 약 98.3%. 50 × 210,000 × 2 = 21,000,000                                                                                                            | 계산                                                                                                 |

### 소프트포크 (`/soft-fork-activation`)

- BIP9 상태 전이 STARTED → LOCKED_IN → ACTIVE, 타임아웃 시 FAILED
- BIP9 메인넷 기본 임계값 95%(1916/2016). 임계값은 프로토콜 상수가 아니라 배포마다 정하는 파라미터다
- Taproot는 Speedy Trial로 90%(1815/2016)를 썼다
- Taproot 타임라인: 2018 BIP340-342 제안 → 2021.05 시그널링 시작 → 2021.06 LOCKED_IN → 2021.11 ACTIVE

2026-10-01 대조

| 값                         | 결과 | 원문                                                                                               | 출처                                                                        |
| -------------------------- | ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 최초 BIP9 타임아웃 약 1년  | 일치 | "timeout should be 1 year (31536000 seconds) after starttime"                                      | https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki              |
| Speedy Trial 약 3개월 시한 | 일치 | starttime 2021-04-24, timeout 2021-08-11. 2021-06 신호 기간에 90% 도달, 활성 블록 709,632(2021-11) | https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki (Deployment) |
| BIP8 LOT                   | 일치 | `lockinontimeout`이 참이면 타임아웃 직전 기간에 신호를 강제하고 LOCKED_IN으로 넘어간다             | https://github.com/bitcoin/bips/blob/master/bip-0008.mediawiki              |

### P2P (`/p2p-network`)

- 블록 헤더 80바이트 고정
- BIP125 RBF 규칙 3·4: 절대 수수료가 커야 하고, 증분이 최소 릴레이 수수료율 × 대체 tx 크기 이상이어야 한다
- `generateGossipGraph`는 무작위 스패닝 트리 + 무작위 간선이다. 격자가 아니다

2026-10-01 대조

| 값                                                            | 결과 | 원문                                                                                                                                                               | 출처                                                                                                          |
| ------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 평균 블록 1.5MB                                               | 일치 | 최근 3개월 평균 약 1.60MB(2026-09-30)                                                                                                                              | https://api.blockchain.info/charts/avg-block-size?timespan=3months                                            |
| 체인 전체 크기 약 760GB (`CHAIN_SIZE_APPROX_BYTES`)           | 고침 | 전에는 963,000 × 1.5MB ≈ 1.4TB로 계산했다. 초기 블록이 작아 약 1.9배 과대였다. 실측 약 762GB(2026-08-18, 블록 963,000 무렵). 2026-09-30은 약 772GB                 | https://api.blockchain.info/charts/blocks-size?timespan=1year                                                 |
| 헤더 대비 블록 약 18,750배, 라벨 「크기 비율(최근 블록 1개)」 | 고침 | 값은 1,500,000 ÷ 80으로 맞다. 체인 전체 비율로 오독되지 않게 라벨에 기준을 밝혔다                                                                                  | 계산                                                                                                          |
| 노드 피어 8~125개 (Bitcoin Core 31 기준)                      | 고침 | v31.1(2026-07-08)까지 아웃바운드 full-relay 8 + block-relay-only 2, `DEFAULT_MAX_PEER_CONNECTIONS` 125. v32.0rc2(2026-09)에서 200. 출시판 기준을 화면에 밝혔다     | https://github.com/bitcoin/bitcoin/blob/v31.1/src/net.h · https://github.com/bitcoin/bitcoin/pull/28463       |
| 네트워크 수만 노드                                            | 일치 | Bitnodes 도달 가능 노드 25,108(2026-10-01)                                                                                                                         | https://bitnodes.io/api/v1/snapshots/                                                                         |
| 기본 멤풀 300MB                                               | 일치 | `DEFAULT_MAX_MEMPOOL_SIZE_MB{300}`                                                                                                                                 | https://github.com/bitcoin/bitcoin/blob/master/src/kernel/mempool_options.h                                   |
| 최소 릴레이 수수료율 기본 0.1 sat/vB, 슬라이더 0.1 간격       | 고침 | 1 sat/vB에서 내렸다. Bitcoin Core 29.1(2025-09)부터 `-minrelaytxfee`·`-incrementalrelayfee` 기본 100 sat/kvB = 0.1 sat/vB. RBF 증분도 같은 상태를 써서 함께 맞는다 | https://bitcoincore.org/en/releases/29.1/ · https://github.com/bitcoin/bitcoin/blob/v31.1/src/policy/policy.h |

### 라이트닝·프라이버시 (`/lightning-network`, `/privacy`)

- 채널은 2-of-2 멀티시그로 열고, 커밋먼트 교체로 오프체인 갱신하며, 구버전 방송에 벌칙 조항이 걸린다
- HTLC 정산은 수취인 쪽 링크부터 역방향으로 전파된다
- CoinJoin 익명 집합은 참가자 수 N에 대해 1/N
- 공통 입력 소유권 휴리스틱

2026-10-01 대조

| 값                             | 결과 | 원문                                                                             | 출처                                                     |
| ------------------------------ | ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 라우팅 수수료 "보통 아주 소액" | 일치 | 공개 채널 중앙값 수수료율 100 ppm(0.01%), 기본 수수료 중앙값 0.5 sat(2026-08-30) | https://mempool.space/api/v1/lightning/statistics/latest |

## 비트코인 경제·논쟁

### 역사 (`/bitcoin-history`)

거버넌스 9건(2026-08-21 기준), 시장·채택 11건을 대조했다. 2026-08-25에 더한 거버넌스 사건 「BIP-110과 8월의 두 분기」는 2026-10-01에 대조를 마쳤고 결과는 아래 `/chain-split` 절에 함께 적었다.

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

2026-10-01 대조

| 값                                                 | 결과 | 원문                                                                                                            | 출처                           |
| -------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Knots 점유율 "2026년 현재 도달 가능 노드의 15~25%" | 일치 | coin.dance 2026-10-01 16.51%(6월 말 22.65%, 8월 10일 21.43%). 범위 안이지만 하향 추세라 아래 재확인 표에 올렸다 | https://coin.dance/nodes/share |

### 체인 분기 (`/chain-split`)

BIP-110 의무 신호와 그 뒤의 두 분기(2026년 8월)를 대조했다. 화면은 2026년 8월 기준이라 9월 이후 사건은 반영하지 않았고, 그 사실은 아래 재확인 표에 둔다.

2026-10-01 대조

| 값                                                                                           | 결과 | 원문                                                                                                                                                          | 출처                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BIP-110 공개 2025.10 (초안 공개, 12월 BIP 번호 부여)                                         | 고침 | "2026년 7월"에서 고쳤다. 초안 2025-10-24, Assigned 2025-12-03, bips 저장소 병합 2026-02-07, starttime 2025-12-01                                              | https://github.com/bitcoin/bips/blob/master/bip-0110.mediawiki                                                                                                                          |
| 의무 신호 개시 블록 961,632                                                                  | 일치 | 의무 신호 구간 961,632~963,647, 잠금 기한 963,648, max_activation_height 965,664                                                                              | BIP-110 Deployment 절                                                                                                                                                                   |
| 개시일 2026년 8월 8일(UTC)                                                                   | 고침 | "8월 7일"에서 고쳤다. 블록 961,632 타임스탬프 2026-08-08 19:35:55 UTC(KST 8월 9일 04:35)                                                                      | https://mempool.space/api/block-height/961632                                                                                                                                           |
| 개시 직전 신호 51/2,016 = 2.53%, 조기 활성화 55%(1109/2016)                                  | 일치 | 51블록, 2.53%. 1109/2016                                                                                                                                      | https://crypto.news/bitcoin-bip-110-split-widens-as-fork-freezes-at-2-blocks/ · BIP-110 Deployment 절                                                                                   |
| 2.53%는 블록 신호율이고 옮겨 간 해시레이트는 훨씬 적다                                       | 고침 | 전에는 "2%대 해시레이트"라고 써서 신호율과 해시를 섞었다. 분기 체인 해시는 Ocean 보고 약 257 PH/s(전체의 약 0.03%)                                            | crypto.news(위)                                                                                                                                                                         |
| 소수 체인 2블록 뒤 정지 (2026년 8월 9일 오후 기준)                                           | 일치 | 961,632·961,633 두 블록 뒤 정지, BIP 문서 2026-08-09 Closed. 기준 시점을 화면에 붙였다                                                                        | https://www.coindesk.com/tech/2026/08/09/controversial-bitcoin-fork-bip-110-mines-two-blocks-then-stops                                                                                 |
| 규칙 34B · OP_RETURN 83B · 푸시·witness 256B · 약 1년 · 기존 UTXO 면제                       | 일치 | 규칙 1·2, active_duration 52,416블록, 활성화 높이 이전 UTXO를 쓰는 입력은 새 규칙 면제                                                                        | BIP-110 Specification 절                                                                                                                                                                |
| 거래소가 분기 후 코인과 섞어 분리해 둔 뒤 출금한 코인만 한쪽 체인에 있다                     | 고침 | 전에는 조건 없이 "분기 이후 출금한 코인은 한쪽에만"이라 썼다. 분기 전 UTXO만 쓰는 출금은 리플레이로 양쪽에 생길 수 있다                                       | https://www.crypto-finance.com/bip-110-and-the-custody-implications-of-a-bitcoin-chain-split/                                                                                           |
| eCash(ECX) 알파 분기 963,648블록 · 2026년 8월 23일, 정식 스냅샷 973,728블록 · 10월 31일 예정 | 고침 | 964,000·8월 21일은 발표 당시 예정값이었다. 8월 8일 3단계로 바뀌었다: 알파 963,648(2026-08-23 00:48 UTC), 베타 967,680(9월 20일), 정식 973,728(10월 31일 예정) | https://news.bitcoin.com/crypto-news/bitcoins-ecx-hard-fork-splinters-into-3-launches-through-october/ · https://www.gncrypto.news/news/ecx-hard-fork-bitcoin-snapshots-sept-20-oct-31/ |
| 1 BTC당 1 eCash를 주는 설계                                                                  | 고침 | 정식 스냅샷 전이라 과거형("배포되어")을 설계로 바꿨다                                                                                                         | gncrypto(위)                                                                                                                                                                            |
| 폴 스토르츠 · Drivechain(BIP300/301) · SHA-256 유지, 사토시 휴면 코인 약 50만 개 재배정      | 일치 | LayerTwo Labs. 약 110만 개 중 60만 개는 두고 약 50만 개를 투자자·개발 자금으로                                                                                | https://www.coindesk.com/tech/2026/04/27/a-long-time-developer-wants-to-fork-bitcoin-and-reassign-satoshi-coins-the-community-is-calling-it-a-theft · gncrypto(위)                      |
| 리플레이 보호 불완전                                                                         | 일치 | 선택 적용(공식 지갑만, nLockTime 499,999,999)                                                                                                                 | news.bitcoin.com(위)                                                                                                                                                                    |

### 양자컴퓨터 (`/bitcoin-quantum`)

- NIST가 2024년 8월 ML-DSA(FIPS 204)와 SLH-DSA(FIPS 205)를 최종 표준으로 확정했다
- 서명 크기 ML-DSA 약 2.4~4.6KB, SLH-DSA 약 7.9KB, 슈노어 64B, ECDSA 71~72B
- 공개키 노출 잔고 비중 추정 약 25~33%(2026-10-01 고침, 전에는 20~30%). 잔고 기준이고 무엇을 세느냐에 따라 연구마다 갈린다. Deloitte(2019~2020) 약 25%는 P2PK 약 200만 + 재사용 P2PKH 약 250만 BTC로 Taproot를 넣지 않았다. Project Eleven은 P2TR·P2MS까지 세어 2025-01-17 6,262,905 BTC(약 31%), 2026년 약 690만 BTC(약 1/3)로 본다. Chaincode Labs(2025-05)는 20~50%(400만~1,000만 BTC)로 범위를 넓게 잡는다. 화면 sub는 "P2PK·P2TR·P2MS·재사용 주소의 잔고 기준"이다

  출처: https://www.deloitte.com/nl/en/services/risk-advisory/perspectives/quantum-computers-and-the-bitcoin-blockchain.html · https://chaincode.com/bitcoin-post-quantum.pdf · https://forklog.com/en/chaincode-labs-sizes-up-the-quantum-threat-to-bitcoin/

- 공개키가 드러나는 시점은 출력 타입마다 다르다. P2PKH·P2WPKH는 출력에 공개키 해시만 담아 그 주소에서 처음 지출할 때 서명과 함께 드러나고, P2PK와 P2TR은 출력에 공개키를 그대로 담아 받는 순간 드러난다. P2TR 출력은 tweak된 x-only 공개키 32바이트를 담고(BIP-341), 주소는 그 값을 Bech32m으로 인코딩한다(BIP-350). 2026-10-01 재대조에서도 일치

  출처: https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki · https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki

### 채굴·보안 예산 (`/bitcoin-game-theory`, `/security-budget`)

51% 공격 탭은 해시레이트·효율·전기료·수명 네 값이 함께 정직 채굴 회수 기간을 정한다. 해시레이트만 910으로 올리면 회수 기간이 6.28년이 되어 수명 5년을 넘고 판정이 뒤집힌다. 그래서 효율을 함께 고쳤다.

2026-10-01 대조

| 값                                                                    | 결과 | 원문                                                                                                                                                                                                           | 출처                                                                                                                              |
| --------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 네트워크 해시레이트 기본값 910 EH/s (2026년 8월)                      | 고침 | 810에서 올렸다. 8월 월평균 약 911 EH/s(8월 8일 난이도 127.5T ≈ 913). CoinShares는 8월 중순 7일 평균 약 920. 810은 2025년 2~3월 수준이었다                                                                      | https://mempool.space/api/v1/mining/hashrate/2y · https://coinshares.com/us/insights/research-data/bitcoin-mining-report-q2-2026/ |
| ASIC 효율 15 J/TH (현행 주력 세대, S21 Pro급)                         | 고침 | 20에서 내렸다. S21 Pro 15, S21 XP 13.5, S23 Hydro 9.5 J/TH. 네트워크 평균 추정은 28.2 J/TH(Cambridge, 2024-06)                                                                                                 | https://www.jbs.cam.ac.uk/faculty-research/centres/alternative-finance/publications/cambridge-digital-mining-industry-report/     |
| 전기료 기본값 $0.025/kWh, 힌트 "전력이 가장 싼 축의 대형 채굴장 수준" | 고침 | 값은 두고 힌트만 고쳤다. Cambridge 2025 조사 중앙값 $45/MWh(전력), 하위 사분위 약 3.2¢ 이하. $0.025는 평균이 아니라 최저가 축이다                                                                              | Cambridge 2025(위)                                                                                                                |
| 장비 단가 $15/TH                                                      | 일치 | 2026년 시세 약 $10.6~$30/TH 범위 안                                                                                                                                                                            | https://hashrateindex.com/blog/top-10-bitcoin-mining-asic-machines-for-2026/                                                      |
| ASIC 실효 수명 5년                                                    | 일치 | 값은 두고 근거 주석을 달았다(`src/app/bitcoin-game-theory/models.ts`). 회계 내용연수 3년(CleanSpark FY2025 10-K, Cipher)은 장부 기준이고, 네트워크 평균 28.2 J/TH가 상각 끝난 구세대 기종이 돌고 있음을 보인다 | https://www.sec.gov/Archives/edgar/data/827876/000119312525297510/clsk-20250930.htm                                               |
| 정직 채굴 회수 약 4.3년, 손익분기 약 $0.0515/kWh                      | 고침 | 위 값(910 EH/s · 15 J/TH · $0.025 · $75,000)의 산술. 4.31년으로 수명 5년 안이다. $0.05면 회수 약 75.6년이라 "회수 불가"는 $0.0515를 넘어야 하고 슬라이더 눈금으로는 $0.055부터다                               | 계산(`models.test.ts`가 단언)                                                                                                     |
| 블록당 수수료 0.02 BTC, "혼잡할 때 잠깐 그 열 배 가까이"              | 고침 | 0.05에서 내렸다. 블록 평균 수수료 1개월 0.0236 BTC(중앙값 0.0191), 6개월 0.0219, 6개월 최대 약 0.13~0.2                                                                                                        | https://mempool.space/api/v1/mining/blocks/fees/6m                                                                                |
| 연간 보안 예산 약 $12.40B                                             | 고침 | (3.125 + 0.02) × 75,000 × 52,560. 수수료를 고치면서 $12.52B에서 따라 내려갔다                                                                                                                                  | 계산                                                                                                                              |
| BTC 기준 시세 $75,000 (2026년 8월)                                    | 일치 | 8월 일봉 종가 범위 약 $62,800~$78,600 안. 2026-10-01은 약 $83,700                                                                                                                                              | https://api.exchange.coinbase.com/products/BTC-USD/candles                                                                        |
| 2022년 가격이 채굴 원가 아래, 대형 채굴사 파산, 난이도 하향           | 일치 | Core Scientific 2022-12-21 Chapter 11, Compute North 2022-09 파산, 2022-12-06 난이도 −7.32%                                                                                                                    | https://www.coindesk.com/tech/2022/12/06/bitcoin-mining-difficulty-drops-most-since-july-2021-as-crypto-winter-cuts-profitability |

### 변동성·모델 (`/bitcoin-volatility`, 레인보 차트)

2026-10-01 대조

| 값                                                                  | 결과 | 원문                                                                                                                                                              | 출처                                                                                             |
| ------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 금 시가총액 $32.2조 = 지상 금 약 220,000톤 × $4,549 (`GOLD_CAP`)    | 고침 | 216,000톤(WGC 2024년 말)을 2025년 말 추정 약 220,000톤으로 올렸다. $4,549는 8월 범위($4,091~4,698) 안. 슬라이더 기본값은 반올림으로 32 그대로                     | https://www.gold.org/goldhub/research/market-primer/gold-market-primer-market-size-and-structure |
| 실현 변동성 "2017~2020년에 100%를 훌쩍 넘던 값이"                   | 고침 | 전에는 "초기에"라 썼다. 90일 창 연도별 최대: 2015 67%, 2016 84%, 2017 109%, 2018 138%, 2019 100%, 2020 134%, 2023 이후 56~66%. 차트 첫해는 100% 아래다            | Coinbase candles API로 재계산                                                                    |
| Power Law `PL_A` 5.97 · `PL_B` −17.72 주석 "세 점에 맞춘 자체 보정" | 고침 | 산술은 맞다(보정점 $13·$280·$3,200 재현 $12.8·$277·$3,426). 주석의 "cycle lows"는 틀려 고쳤다. 사이클 저점은 2018-12뿐이고 공개 모델(Burger 2019)과 계수가 다르다 | https://hcburger.com/blog/powerlaw/                                                              |

### 자금추적 (`/illicit-funds`)

- 실크로드 69,370 BTC를 2020-11 미 법무부가 압수(해커 Individual X 보유분)
- 콜로니얼 파이프라인 2021-05 몸값 75 BTC 지불, 2021-06 63.7 BTC 회수
- 비트파이넥스 2016-08 해킹 119,754 BTC, 2022-02 약 94,000 BTC 압수
- 미화 100달러권 1장 = 1.0g, 156.1 × 66.3 × 0.1093mm ≈ 1.13cm³
- 온체인 거래액 중 불법 주소 비중은 업체마다 1% 안팎이다(2026-10-01 고침, 전에는 "1% 미만(체인분석 업계 추정)"). Chainalysis 2026 보고서는 2025년 비중을 1% 미만으로, TRM Labs 2026 보고서는 2025년 1.2%(2024년 1.3%, 2023년 2.4%)로 본다. "1% 미만"은 Chainalysis에만 맞는다. 세계 자금세탁 규모 GDP의 2~5%(UNODC)

  출처: https://www.chainalysis.com/blog/2026-crypto-crime-report-introduction/ · https://www.trmlabs.com/reports-and-whitepapers/2026-crypto-crime-report

2026-10-01 대조

| 값                                                                                    | 결과 | 원문                                                                                                           | 출처                                                                                                                               |
| ------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 비트파이넥스 "2,000건이 넘는 무단 거래로 119,754 BTC를 빼냈다. 그 뒤 6년에 걸쳐 세탁" | 고침 | 전에는 2,000여 건을 6년간의 세탁 분할 건수로 썼다. 미 법무부: 2,000건 넘는 무단 거래는 해킹 당시의 탈취 거래다 | https://www.justice.gov/usao-dc/pr/husband-and-wife-plead-guilty-money-laundering-conspiracy-involving-hack-and-theft              |
| 비트파이넥스 두 사람 유죄 인정                                                        | 일치 | 2023-08-03 유죄 인정, 2024-11 선고                                                                             | https://www.justice.gov/usao-dc/pr/bitfinex-hacker-sentenced-money-laundering-conspiracy-involving-billions-stolen                 |
| 콜로니얼 몸값 75 BTC "당시 약 440만 달러"                                             | 일치 | 약 440만 달러 지불(2021-05-08), 63.7 BTC(약 230만 달러) 압수(2021-06-07)                                       | https://www.justice.gov/archives/opa/pr/department-justice-seizes-23-million-cryptocurrency-paid-ransomware-extortionists-darkside |
| 실크로드 2013년 10월 폐쇄·체포                                                        | 일치 | 울브리히트 2013-10-01 체포, 같은 시기 사이트 압수                                                              | https://www.justice.gov/archive/usao/nys/pressreleases/October13/SilkRoadSeizurePR.php                                             |
| 현금 신고 기준 미국·EU 1만 달러/유로                                                  | 일치 | FinCEN Form 105는 1만 달러 초과, EU 규정 2018/1672는 1만 유로 이상                                             | https://fincen105.cbp.dhs.gov/ · https://eur-lex.europa.eu/eli/reg/2018/1672/oj/eng                                                |
| 위탁 수하물 23kg                                                                      | 일치 | 이코노미 위탁 수하물 1개 23kg(50lb)이 국제선 통상 기준. 항공사마다 다르다                                      | https://www.koreanair.com/contents/plan-your-travel/baggage/checked-baggage/free-baggage                                           |

### 전력망·선물 (`/grid-battery`, `/futures-hedging`)

2026-10-01 대조

| 값                                           | 결과 | 원문                                                                                                                              | 출처                                                                                                  |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 채굴기가 "몇 초 안에" 가동 정지              | 고침 | 전에는 "1초 만에". ERCOT 통제 가능 부하는 지시 수준에 15초 안 도달 요건(2차 자료). 1차 원문은 아래 `## 원문 미확인`               | https://k33.com/research/archive/articles/bitcoin-miners-can-strengthen-electricity-grids             |
| 펀딩 8시간 주기(하루 3회), 기준 0.01%        | 일치 | Binance BTCUSDT 8시간(상한 ±0.30%), BitMEX XBTUSD 8시간·0.0001                                                                    | https://fapi.binance.com/fapi/v1/fundingInfo · https://www.bitmex.com/api/v1/instrument?symbol=XBTUSD |
| "비트코인에서 주로 거래되는 것은 무기한선물" | 고침 | 전에는 "실제로 거래되는 것은". CME 만기 선물도 큰 시장이다                                                                        | 일반                                                                                                  |
| 3:2:1을 "흔히 기준으로 쓰는 비율"로 소개     | 고침 | 전에는 "실제 정제 수율". 3:2:1은 크랙 스프레드 벤치마크다. 미국 정유 수율은 원유 42갤런에서 휘발유 19.57·중간유분 12.47갤런(2023) | https://www.eia.gov/tools/faqs/faq.php?id=327&t=6                                                     |

## 데이터 대시보드

대시보드 다섯의 지표 경계와 로더가 기대하는 외부 응답 모양이다. 2026-10-01에 처음 대조했다.

2026-10-01 대조

| 값                                                                | 결과 | 원문                                                                                                                                             | 출처                                                                                                                             |
| ----------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 메이어 배수 2.4 과열, 1.5 고평가, 1 저평가                        | 일치 | 2.4는 Trace Mayer의 시뮬레이션 경계. 1.5·1은 관례                                                                                                | https://charts.bitbo.io/mayermultiple/                                                                                           |
| 파이사이클 111일 MA와 350일 MA × 2, "과거 고점과 며칠 안쪽"       | 일치 | "market cycle highs within 3 days"                                                                                                               | https://www.lookintobitcoin.com/charts/pi-cycle-top-indicator/                                                                   |
| 푸엘 배수 정의(일일 발행 가치 ÷ 365일 이동평균)                   | 일치 | 정의만 일치. 구간 경계는 아래 `## 원문 미확인`                                                                                                   | https://www.lookintobitcoin.com/charts/puell-multiple/                                                                           |
| 공포·탐욕 기준선 25·46·54·75, "76~100(극도의 탐욕)"               | 고침 | 기준선 45·55와 "75~100"에서 고쳤다. API가 붙인 분류(전체 3,161건): 극도의 공포 ≤25, 공포 26~46, 중립 47~54, 탐욕 55~75, 극도의 탐욕 ≥76          | https://api.alternative.me/fng/?limit=0                                                                                          |
| Alternative.me `limit=2000`                                       | 일치 | 전체 3,161건, 첫 값 2018-02-01. 2000건이면 2021-04-10부터라 앞 3년여가 빠진다. 의도한 범위로 둔다                                                | https://api.alternative.me/fng/?limit=0                                                                                          |
| 달러인덱스 "주요 6개 통화", 심볼 `DX-Y.NYB`                       | 일치 | ICE USDX 유로 57.6 · 엔 13.6 · 파운드 11.9 · 캐나다달러 9.1 · 크로나 4.2 · 스위스프랑 3.6(%). 2026-09-30 101.78                                  | https://www.ice.com/publicdocs/ICE_USDX_Brochure.pdf                                                                             |
| 반감기 "표본이 네 번뿐"                                           | 일치 | 2012·2016·2020·2024                                                                                                                              | 위 블록·합의 절                                                                                                                  |
| 야후 `ZC=F` `meta.currency`가 `USX`, `GC=F`·`CL=F`·`BZ=F`는 `USD` | 일치 | `ZC=F` 2026-09-30 503.0(= $5.03/부셸). 금·WTI·브렌트는 `USD`(4,189 · 92.68 · 100.64). `src/lib/yahoo.ts`가 `USX`일 때만 100으로 나누는 것이 맞다 | https://query1.finance.yahoo.com/v8/finance/chart/ZC=F?range=5d&interval=1d                                                      |
| STRC "2025년 상장"                                                | 일치 | 2025-07-24 공모가 결정, 7-30 나스닥 거래 시작                                                                                                    | https://www.strategy.com/press/strategy-announces-pricing-of-strc-perpetual-preferred-stock_07-25-2025                           |
| SPCX "스페이스X 본주, 2026년 6월 나스닥 상장"                     | 고침 | 전에는 "비상장 스페이스X 간접 노출 종목". 2026-06-12 나스닥 상장(공모가 $135), 야후 longName "Space Exploration Technologies Corp."              | https://www.cnbc.com/2026/06/12/spacex-ipo-spcx-live-updates.html                                                                |
| Coinbase BTC-USD 첫 일봉 2015-07-20                               | 일치 | 2015-07-01~08-15 요청에 첫 캔들 2015-07-20                                                                                                       | https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=2015-07-01T00:00:00Z&end=2015-08-15T00:00:00Z |
| FRED `T10Y2Y` 살아 있는 일간 시리즈                               | 일치 | Daily, 폐기 아님, 1976-06-01~2026-09-30(0.41). 산식은 재무부 BC_10YEAR − BC_2YEAR. 죽으면 `fred` 라우트 전체가 갱신되지 않는 위험은 지금 없다    | https://fred.stlouisfed.org/series/T10Y2Y                                                                                        |
| FRED `FEDFUNDS` 월간, 관측일 매월 1일                             | 일치 | 일별값 평균. 최신 관측 2026-08-01(3.63)                                                                                                          | https://fred.stlouisfed.org/series/FEDFUNDS                                                                                      |
| 삼성전자 야후 일봉 2000년 시작, 스트래티지 BTC 매입 2020년 8월    | 일치 | `005930.KS` firstTradeDate 2000-01-04. 2020-08-11 21,454 BTC 매입 발표(8-K)                                                                      | https://www.sec.gov/Archives/edgar/data/1050446/000119312520215604/d921849d8k.htm                                                |

## 화폐·거시

### 최저임금 (`/inflation`)

- 한국: 2024년 9,860원 · 2025년 10,030원 · 2026년 10,320원 · 2027년 10,700원(2026-10-01 추가, 고용노동부 고시 제2026-60호, 2026-08-05)
- 한국 2000~2023년 값도 최저임금위원회 표와 전부 같다(2026-10-01). 2006년 이전은 적용기간(전년 9월~당해 8월)이 끝나는 해를 `year`로 둔다
- 미국 연방: 1975년 $2.10을 2026-10-01에 넣었다. 빠져 있어 1975년 조회가 $2.00을 돌려줬다. 나머지 1968~2009년 행은 미 노동부 표와 일치. 2009년 $7.25 이후 변동 없음

  출처: https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744 · https://www.minimumwage.go.kr/minWage/policy/decisionMain.do · https://www.dol.gov/agencies/whd/minimum-wage/history/chart

  두 표는 룩업 의미가 다르다. 미국은 표에 없는 연도가 "안 바뀐 것"이지만 한국은 "아직 표에 안 넣은 것"이다. 미국 표는 이하 최댓값 룩업이라 인상 시점이 하나라도 빠지면 그 해 값이 틀린다. 1975년이 그 예였다.

### 인플레이션 데이터 (`/inflation`)

2026-10-01 대조

| 값                                                        | 결과 | 원문                                                                                                                                                                                            | 출처                                                                                                                  |
| --------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 각주 "M2는 2021년 정의가 변경되었고"                      | 고침 | 문장을 지웠다. 바뀐 것은 M1이다(2020년 5월분부터 저축예금을 M1에 포함, 2021-02-23 공표). 연준은 M2 총량은 그대로라고 밝혔다                                                                     | https://www.federalreserve.gov/releases/h6/20210223                                                                   |
| FRED 시리즈 여덟, NASDAQCOM 1971-02 · CSUSHPISA 1987 시작 | 일치 | 여덟 모두 폐기 아님. NASDAQCOM 첫 관측 1971-02-05, CSUSHPISA 1987-01-01                                                                                                                         | https://fred.stlouisfed.org/series/NASDAQCOM                                                                          |
| ECOS 통계표·항목 코드 여섯                                | 일치 | 901Y009/0 · 161Y006/BBHA00 · 722Y001/0101000 · 901Y014/1070000 · 901Y062/P63A · 731Y004/0000001/0000100 모두 2026-08까지 값을 준다. KB 지수는 `2026.01=100`으로 재기준됐지만 비율로만 써서 무관 | ECOS `StatisticSearch`(공개 sample 키)                                                                                |
| ECOS 시작 `199601` 주석                                   | 고침 | 주석을 "CPI·KB 주택지수가 닿는 1996년부터. 기준금리는 1999년 5월부터"로 고쳤다. 722Y001 첫 값은 1999-05(4.75%)                                                                                  | ECOS 722Y001                                                                                                          |
| 한국 M2 신계열 시작 2003-10, 기준연도 2004                | 고침 | 연도는 맞지만 10월 시작이라 기준연도 2003이면 CPI는 1월, M2는 10월이 100이 되어 9개월 어긋났다. 한국 `minYear`·`gapBaseYear`를 2004로 올렸다                                                    | ECOS 161Y006                                                                                                          |
| 2022년 장기물이 주식만큼 하락 (`/bonds-rates`)            | 일치 | 2022년 총수익 TLT −31.2%, SPY −18.2%. "주식만큼"은 보수적                                                                                                                                       | 야후 chart API(`TLT`·`SPY`)                                                                                           |
| 역전 후 침체까지 반년~2년, 지난 반세기 거의 예외 없음     | 일치 | 1955년 이후 아홉 번의 침체 앞에 모두 역전, 오신호는 1960년대 중반 한 번                                                                                                                         | https://www.frbsf.org/research-and-insights/publications/economic-letter/2018/03/economic-forecasts-with-yield-curve/ |

### 달러 패권 (`/dollar-hegemony`, `/money-creation`)

2026-10-01 대조

| 값                                                                      | 결과 | 원문                                                                                                                                                                                                                                                  | 출처                                                                                                              |
| ----------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 외환보유고 달러 비중 57.8% (2024년 4분기, IMF COFER)                    | 고침 | 57.5%에서 고쳤다. 2024Q4 57.80%(2024Q3 57.30%). 기준 시점은 두었다. 최신은 2026Q2 56.70%                                                                                                                                                              | https://data.imf.org/en/datasets/IMF.STA:COFER · https://data.imf.org/en/news/imf%20data%20brief%20september%2030 |
| 미국 연방 총부채 36조 달러 (2025년 1분기)                               | 일치 | 2025-03-31 $36.214조. 2026-09-29는 $40.097조                                                                                                                                                                                                          | https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny                    |
| 대출금리 가산폭 1.6%p (2025년 평균)                                     | 고침 | 기준 시점을 2024년에서 2025년으로 고쳤다. 2025년 예금은행 대출금리(신규취급액) 4.19% − 기준금리 평균 약 2.64% ≈ 1.55%p. 2024년은 약 1.3%p였다                                                                                                         | ECOS 121Y006/BECBLA01 · 722Y001                                                                                   |
| 금 1온스 = 35달러, 미국이 각국 중앙은행 금의 약 70%, 1971년 금태환 중단 | 고침 | 전에는 "세계 금의 약 70%". 종전 무렵 미국 보유분은 화폐용 금의 약 2/3~71%다                                                                                                                                                                           | https://www.imf.org/-/media/Files/Publications/WP/2019/WPIEA2019161.ashx                                          |
| 1974년 미국·사우디 비공개 합의, 석유를 계속 달러로 가격 매김            | 고침 | 전에는 "1973~74년 석유 결제를 달러로만 하기로 합의". 문서로 확인되는 것은 군사 지원과 오일머니의 미국채 재투자를 맞바꾼 1974년 비공개 합의다. "달러로만 판다"는 공식 합의는 없고 달러 가격 관행은 사실이다. Metric 값도 '석유 거래는 달러로'로 맞췄다 | https://www.rfa.org/english/news/afcl/afcl-us-saudi-oil-deal-07082024043619.html                                  |
| 2023년 사우디·이란 관계 정상화 중국 중재                                | 일치 | 2023-03-10 베이징 합의                                                                                                                                                                                                                                | https://iranprimer.usip.org/blog/2023/mar/10/iran-and-saudi-arabia-restore-ties                                   |
| SWIFT 배제 이란 2012·2018, 러시아 2022, 이라크 2000년 유로 결제         | 일치 | 이란 2012-03-17, 2018-11 제재 복원, 러시아 7개 은행 2022-03-12, 이라크 2000-11-06 승인                                                                                                                                                                | https://www.europarl.europa.eu/RegData/etudes/ATAG/2022/729289/EPRS_ATA(2022)729289_EN.pdf                        |
| 미국 지급준비율 2020년 3월부터 0%                                       | 일치 | 2020-03-15 발표, 03-26 시행                                                                                                                                                                                                                           | https://www.federalreserve.gov/monetarypolicy/reservereq.htm                                                      |

## 시장·기업

### 법인 (`/corporation`)

- 법인격은 설립등기로 발생한다(상법 172). 화면의 순서(정관 작성 → 출자 납입 → 설립등기 → 법인격 발생)는 발기설립 기준으로 맞다
- 주주총회 특별결의 요건: 출석 의결권의 2/3 이상 + 발행주식총수의 1/3 이상(상법 434). 정관 변경·합병·영업양도가 여기 해당하고 이사 선임은 보통결의
- 대표이사가 이사회 결의를 빠뜨린 거래에서 상대방 보호 기준은 선의·무중과실이다. 대법원 2021. 2. 18. 선고 2015다45451 전원합의체 판결이 종전의 선의·무과실 기준을 바꿨다
- 영업양도에 필요한 주주총회 특별결의를 빠뜨리면 상대방의 선의 여부와 무관하게 무효다. 이사회 결의 흠결과 결론이 갈리는 지점이 맞다
- 법인에 과할 수 있는 형벌은 재산형(벌금·과료·몰수)뿐이다. 자유형은 자연인에게만 집행할 수 있다. 양벌규정 설명도 맞다
- 자기주식에는 의결권이 없고(상법 369조 2항) 이익배당청구권도 인정되지 않는다
- 자기주식 취득은 배당가능이익 범위 안에서만 가능하다(상법 341조 1항)
- 배당세액공제(gross-up)로 이중과세의 일부를 덜어 준다는 서술도 맞다
- 정관에 존립기간을 적지 않는 한 수명 제한이 없다는 서술이 맞다(2026-10-01). 상법 517조 1호 → 227조 1호가 존립기간 만료를 해산사유로 둔다

  출처: https://www.law.go.kr/법령/상법 (Open API 현행 본문으로 대조)

### 자본구조 (`/capital-structure`)

- 최우선변제 임금채권의 범위는 최종 3개월분 임금과 재해보상금(근로기준법 38조 2항), 최종 3년분 퇴직급여(근로자퇴직급여보장법 12조 2항)다. 담보권보다 앞선다는 서술이 맞다
- 세금 방패의 현재가치가 부채 × 세율이 되는 것은 영구 부채를 차입이자율로 할인할 때다. 이자율이 약분돼 사라지므로 곡선이 이자율과 무관한 것이 맞다
- ROE = ROA + (D/E) × (ROA − 세후 이자율)이 성립하려면 ROA도 세후여야 한다. 세전 ROA와 세후 ROE를 나란히 놓으면 "ROE가 ROA를 넘어선다"는 문장이 낮은 부채 비중에서 거짓이 된다
- 미지급 세금의 국세 우선권이 일반채권보다 앞선다(국세기본법 35조 1항, 2026-10-01). 전환사채 표면금리 0%도 흔하다는 서술도 맞다(2026년 코스닥 CB 다수가 0%, 언론 기사 기준)

  출처: https://www.law.go.kr/법령/국세기본법 · https://www.numbers.co.kr/news/articleView.html?idxno=21588

## 부동산

### 전세 (`/jeonse`)

- 대항력은 전입신고와 점유(주택임대차보호법 3조 1항), 우선변제권은 대항요건에 확정일자를 더해야 생긴다(3조의2 2항). 확정일자만으로는 순위가 서지 않는다
- 대항력의 효력은 전입신고 다음 날 0시부터다. 잔금일 당일 설정된 근저당이 임차인보다 앞서는 하루의 공백이 여기서 생긴다
- 선순위 대항력이 있는 임차인이 배당으로 일부만 받으면 나머지는 매수인이 인수한다
- 전월세전환율은 `월세 × 12 ÷ (전세보증금 − 월세보증금)`이다. `deposit-loan`은 월세보증금을 0으로 두어 `월세 × 12 ÷ 보증금`이 된다

2026-10-01 대조

| 값                                      | 결과 | 원문                                                                             | 출처                                                                   |
| --------------------------------------- | ---- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 제목 "왜 전세는 한국에서 이렇게 커졌나" | 고침 | 전에는 "왜 한국에만 전세가 있나". 볼리비아의 안티크레티코가 같은 구조로 현존한다 | http://journal.kci.go.kr/krihs/archive/articleView?artiId=ART002001385 |
| 등기부 을구에 채권최고액 기재           | 일치 | 부동산등기법 75조 2항 1호                                                        | https://www.law.go.kr/법령/부동산등기법                                |
| 반환보증 구조, 깡통전세·갭투자 산술     | 일치 | 보증기관이 먼저 지급하고 임대인에게 구상한다. 나머지는 산술로 성립               | https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp                    |

### 주택담보대출 (`/mortgage`)

- DSR 한도 40%. 은행권 기준이고 제2금융권은 50%다. 2026-10-01에 다시 확인해 값이 같다. 2026-04-01 가계부채 관리방안, 2026-06-30 규제지역 추가 지정, 2026-08-13 대책 모두 차주 DSR 한도를 바꾸지 않았다. 2026-08·09의 고DSR 주담대 위험가중치 상향은 은행 자본 규제(2027 시행)라 무관하다. `dsrNote`를 "2026년 10월 현재"로 올렸다

  출처: https://www.fsc.go.kr/no010101/86606 · https://www.fnnews.com/news/202608140500559928

- 스트레스 DSR 3단계는 2025.7부터 하한 1.5%p였고, 10·15 대책으로 2025.10.16부터 수도권·규제지역 주택담보대출은 3.0%p다. 3.0%p는 변동금리 기준이고 혼합형·주기형은 적용비율이 낮다(2026-10-01, `stressNote`에 "변동금리 기준"을 넣었다). 비수도권은 2단계 0.75%p를 2026-12-31까지 유지한다

  출처: https://www.korea.kr/news/policyNewsView.do?newsId=148950959 · https://www.mt.co.kr/finance/2026/06/18/2026061817015748988

- 주택 유상거래 취득세율(지방세법 11조 1항 8호, 1주택): 6억 이하 1%, 6억 초과 9억 이하는 `(취득가액 × 2 ÷ 3억) − 3`%, 9억 초과 3%. 지방교육세가 취득세율의 10%만큼 더 붙는다(취득세율 × 1/2 × 20%, 151조 1항 1호). 두 경계 모두 연속이다. 2026-10-01에 시행 2026-01-01판 본문으로 다시 대조했고, 2026-09 발표된 지방세제 개편안도 기본 세율 구간은 건드리지 않는다. `ACQUISITION_TAX_NOTE`를 "2026년 10월 현재"로 올렸다

  ```text
  6.0억  1.10%     8.0억  2.57%
  6.5억  1.47%     9.0억  3.30%
  7.0억  1.83%    12.0억  3.30%
  ```

  다주택·조정대상지역 중과세율과 전용 85제곱미터 초과 농특세 0.2%는 넣지 않았다

  출처: https://www.law.go.kr/법령/지방세법 · https://www.lawtimes.co.kr/news/articleView.html?idxno=225817

- 원리금균등에서 금리가 그대로면 몇 년이 지나도 월 상환액이 같다. 남은 잔액을 남은 기간으로 다시 나누면 같은 값이 나오기 때문이다. `rate-stress`의 상승폭 0 구간이 이 성질에 기댄다
- 중도상환수수료는 법으로 대출 실행 후 3년 안에만 붙을 수 있다(금융소비자보호법 20조 1항 4호 나목, 2026-10-01). 화면은 전에 "보통 3년 안에만"이라 썼고, 은행 이자 수익과의 관계를 이유가 아니라 같은 시기의 사실로 낮춰 고쳤다

  출처: https://www.fsc.go.kr/no010101/83833

- LTV 기본값 70%는 비규제지역 상한·규제지역 생애최초 상한과 같은 값이다(2026-10-01). 규제지역 일반은 40%이고 수도권·규제지역은 금액 상한이 겹친다. 화면 힌트가 예시값이라고 밝혀 두어 틀린 문장은 없다

  출처: https://www.korea.kr/news/policyNewsView.do?newsId=148954140 · https://www.fsc.go.kr/no010101/87222

## 시간이 지나면 다시 봐야 하는 값

아래는 대조 시점에는 맞았지만 시간이 지나면 틀려지는 값이다. 화면에 쓸 때 기준 시점을 함께 적는다. 화면의 기준 시점은 대부분 2026년 8월로 두었다(움직이는 값을 한 시점에 묶는 결정). 대조일 칸이 원문과 맞춰 본 날이고, 2026-10-01 현재치가 기준 값과 다르면 함께 적었다.

| 값                           | 위치                                                                                                     | 기준 값                                                                                                                                    | 대조일     | 다음에 다시 볼 때                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------- |
| BTC 시세 기본값              | `src/lib/market-baselines.ts` `BTC_PRICE_BASELINE`(`attack-game`과 security-budget `BASE`가 가져다 쓴다) | $75,000(2026년 8월). 10-01 현재 약 $83,700                                                                                                 | 2026-10-01 | 화면 기준 시점을 옮길 때. 한 자리만 고치면 두 탭이 함께 바뀐다                        |
| 네트워크 해시레이트 기본값   | `src/app/bitcoin-game-theory/attack-game.tsx`                                                            | 910 EH/s(2026년 8월 월평균 약 911). 10-01 3일 평균 약 995                                                                                  | 2026-10-01 | 기준 시점을 옮길 때. 혼자 올리면 회수 판정이 뒤집히므로 효율·전기료와 함께 본다       |
| 전기 요금 기본값과 회수 기간 | `src/app/bitcoin-game-theory/attack-game.tsx`, `models.ts`(`J_PER_TH` 15, 수명 5년)                      | $0.025/kWh. 위 두 값과 함께 회수 약 4.3년(수명 5년 안), 손익분기 약 $0.0515/kWh. $0.05면 회수 약 75.6년이고 회수 불가는 $0.0515 초과부터다 | 2026-10-01 | 주력 ASIC 세대 교체, Cambridge 채굴 보고서 갱신                                       |
| 블록당 수수료                | `src/app/security-budget/models.ts` `BASE.feePerBlock`                                                   | 0.02 BTC(mempool.space 1개월 0.0236, 6개월 0.0219)                                                                                         | 2026-10-01 | 수수료 시장이 바뀔 때, 다음 반감기(2028) 전후                                         |
| 금 시가총액                  | `src/app/bitcoin-volatility/models.ts` `GOLD_CAP`(`two-regime.tsx` 기본값이 여기서 파생)                 | $32.2조(온스당 $4,549 × 약 220,000톤, WGC 2025년 말). 10-01 금값 약 $4,190이면 약 $29.6조                                                  | 2026-10-01 | WGC 연간 추정 갱신(매년 초), 금 시세                                                  |
| 근사 블록 높이               | `src/lib/p2p-concept.ts` `TOTAL_BLOCKS_APPROX`(`/p2p-network` IBD, `/multisig-timelock` CLTV 기본값)     | 963,000(2026-08-18). 10-01 팁 969,434는 CLTV 슬라이더 범위(960,000~966,000) 밖이다                                                         | 2026-10-01 | 기준 시점을 옮길 때. 체인 크기와 함께 고친다                                          |
| 체인 전체 크기               | `src/lib/p2p-concept.ts` `CHAIN_SIZE_APPROX_BYTES`                                                       | 약 760GB(2026-08-18 약 762GB). 09-30 약 772GB                                                                                              | 2026-10-01 | 블록 높이와 함께                                                                      |
| 다음 반감기 추정일           | `src/lib/bitcoin-models.ts` `HALVINGS`(`estimated: true`)                                                | 2028-04-13(블록 963,000에서 87,000블록 × 10분)                                                                                             | 2026-10-01 | 2028년 실제 반감기 뒤 확정값으로 바꾼다                                               |
| 노드 피어 상한               | `src/app/p2p-network/gossip-sim.tsx`, `src/lib/p2p-concept.ts` 주석                                      | 8~125개(Bitcoin Core 31). v32.0rc2에서 200                                                                                                 | 2026-10-01 | v32.0 정식 출시 때 "8~200개"로                                                        |
| 최소 릴레이 수수료율 기본값  | `src/app/p2p-network/mempool-policy.tsx`                                                                 | 0.1 sat/vB(Bitcoin Core 29.1부터)                                                                                                          | 2026-10-01 | Core 릴리스 노트가 `-minrelaytxfee` 기본값을 바꿀 때                                  |
| 외환보유고 달러 비중         | `src/app/dollar-hegemony/models.ts` `reserveShare`                                                       | 57.80%(2024년 4분기). 최신 2026년 2분기 56.70%                                                                                             | 2026-10-01 | IMF COFER 분기 공표(분기 말 뒤 약 3개월). 기준 시점을 옮길 때                         |
| 미국 연방 총부채             | `src/app/dollar-hegemony/models.ts`                                                                      | 36조 달러(2025년 1분기). 2026-09-29 $40.1조                                                                                                | 2026-10-01 | 기준 시점을 옮길 때                                                                   |
| 대출금리 가산폭              | `src/app/dollar-hegemony/models.ts` spread                                                               | 1.6%p(2025년 평균)                                                                                                                         | 2026-10-01 | 2026년 연간 값이 나오는 2027년 초                                                     |
| 통화 계층 발행국 GDP         | `src/app/dollar-hegemony/models.ts` `HOME_SIZE`                                                          | 28조 달러(2023년 수준, 예시값). 2025년은 약 30.8조(IMF WEO 2026년 4월). 예시값이라 고치지 않았다                                           | 2026-10-01 | 예시값을 손볼 때                                                                      |
| 불법 거래 비중               | `src/app/illicit-funds/real-cases.tsx`                                                                   | 1% 안팎(Chainalysis 1% 미만 · TRM Labs 1.2%, 2025년)                                                                                       | 2026-10-01 | 두 업체 연간 보고서가 나오는 매년 1~2월                                               |
| 최저임금 표                  | `src/lib/inflation-models.ts`                                                                            | 한국 2027년(10,700원)까지                                                                                                                  | 2026-10-01 | 2027년 8월 초 2028년 값 고시                                                          |
| DSR·스트레스 가산폭          | `src/lib/mortgage-models.ts` `REGULATION`                                                                | 40%, 3.0%p(수도권·규제지역 변동금리). 2026년 10월 재확인                                                                                   | 2026-10-01 | 비수도권 유예가 끝나는 2027-01, 대출 규제 대책 발표                                   |
| 취득세율 구간                | `src/lib/mortgage-models.ts`                                                                             | 지방세법 11조 1항 8호(시행 2026-01-01판). 2026년 10월 재확인                                                                               | 2026-10-01 | 2026년 지방세제 개편안 국회 통과, 지방세법 개정                                       |
| Knots 노드 점유율            | `src/app/bitcoin-history/events.ts`                                                                      | 화면 "15~25%". 2026-10-01 16.51%(6월 말 22.65%)                                                                                            | 2026-10-01 | 분기마다. 15% 밑으로 내려가면 화면 범위를 고친다                                      |
| BIP-110 소수 체인 블록 수    | `src/app/chain-split/models.ts` `FACTS.minorityBlocks`, `src/app/bitcoin-history/events.ts`(문구)        | 2(8월 9일 오후). 9월 1일 PoW를 BLAKE2b로 바꾸는 하드포크로 재가동해 800블록 넘게 캤다. 8월 기준 화면이라 반영하지 않았다                   | 2026-10-01 | 화면 기준 시점을 9월 이후로 옮길 때                                                   |
| eCash 분기 일정              | `src/app/chain-split/models.ts` `ecashHeight`·`ecashSnapshotHeight`                                      | 알파 963,648(8월 23일), 베타 967,680(9월 20일), 정식 스냅샷 973,728(10월 31일 예정)                                                        | 2026-10-01 | 2026-10-31 정식 스냅샷 뒤. 실제 분기 높이와 1:1 배포 여부를 보고 "설계" 서술을 고친다 |
| 공개키 노출 잔고 비중        | `src/app/bitcoin-quantum/bitcoin-quantum-view.tsx`                                                       | 약 25~33%. Deloitte 약 25%(P2PK + 재사용 P2PKH) ~ Project Eleven 약 31~33%(P2TR·P2MS 포함), 모두 잔고 기준                                 | 2026-10-01 | Project Eleven 등 새 집계가 나올 때, Taproot 잔고가 크게 늘 때                        |

출처는 각 값이 있는 위 절에 적었다. `/mortgage`의 LTV 기본값(70%)은 `REGULATION`에 없는 슬라이더 시작값이라 이 표에 넣지 않았다. 규제값으로 정하면 그때 `REGULATION`과 이 표에 함께 넣는다.

## 대조 대기

코드가 기대하는 외부 응답의 모양을 아직 실제로 확인하지 않은 것이다. 확인하면 이 절에서 해당 절로 옮긴다. 2026-10-01 기준 남은 항목이 없다. 야후 `ZC=F`(`USX`, 센트 호가)와 FRED `T10Y2Y`(살아 있는 일간 시리즈)는 확인을 마쳐 `## 데이터 대시보드` 절로 옮겼다.

## 원문 미확인

2026-10-01 대조에서 1차 원문으로 값을 확인하지 못한 것이다. 화면 값은 그대로 두거나 안전한 쪽으로만 고쳤다.

| 값                                            | 위치                                                               | 미확인 사유                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVRV Z 경계 7·3·0.1, 푸엘 배수 경계 4·1.5·0.5 | `src/components/mvrv-zscore-chart.tsx`, `puell-multiple-chart.tsx` | 원 지표 페이지(LookIntoBitcoin)가 구간을 색으로만 그리고 수치를 글로 적지 않는다. 7·0.1과 4·0.5는 2차 자료의 관례값이고, 3·1.5는 이 사이트의 중간 구간이라 대조할 원문이 없다 |
| VIX 20 이상 불안, 30 이상 극도의 공포         | `src/app/economy/economy-view.tsx`                                 | Cboe 방법론 문서는 정의(30일 기대 변동성)만 다루고 해석 구간을 정하지 않는다. 시장 관례라 1차 출처가 없다                                                                     |
| ECOS가 오류를 HTTP 200 + `RESULT.CODE`로 준다 | `src/lib/loaders/inflation-data-kr.ts`                             | 개발 가이드가 SPA라 본문을 읽지 못했다. 공개 sample 키로 직접 호출해 `INFO-100`·`INFO-200`이 HTTP 200으로 오는 동작만 확인했다                                                |
| 분기 후 거래소 출금 코인의 분리               | `src/app/chain-split/models.ts`                                    | 특정 거래소의 분리 정책 원문을 찾지 못했다. 원리상 조건부로만 참이라 조건을 붙여 고쳤다                                                                                       |
| 채굴기 부하 차단 응답 시간                    | `src/app/grid-battery/grid-battery-view.tsx`                       | ercot.com이 403이었다. 15초 요건은 2차 자료로만 봤고, 화면은 "몇 초 안에"로 넓혔다                                                                                            |
| 멤풀 프리셋 2·15·60 sat/vB(여유·보통·혼잡)    | `src/lib/tx-concept.ts`                                            | 프로토콜 값이 아닌 예시라 원문이 없다. 2026-10-01 시장은 economy 0.2 · fastest 1 sat/vB라 "여유 2"도 지금 시장보다 높다. 최소 릴레이 0.1보다는 위라 화면이 모순되지는 않는다  |
| 물리 큐비트 수천 개가 논리 큐비트 하나        | `CONTEXT.md` 용어집                                                | Gidney 2025 초록은 물리 큐비트 총수(100만 미만)만 밝힌다. 표면 부호 일반식(약 2d²)으로는 수백~1,000개대가 나온다. 화면 문구가 아니다                                          |
