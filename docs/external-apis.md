# 외부 API 레퍼런스

이 프로젝트가 사용하는 모든 외부 API 목록. 각 API는 서버 Route Handler(`src/app/api/*/route.ts`)에서만 호출되며 ISR로 캐싱된다. 클라이언트에는 도메인·API 키를 노출하지 않는다.

캐시 시간은 `src/lib/cache-config.ts`의 `ENDPOINTS`가 단일 출처이며, 각 `route.ts`의 `revalidate` 리터럴이 이를 미러링한다. 값을 바꿀 땐 양쪽을 함께 수정한다.

## 제공처별 목록

| 제공처                       | 엔드포인트 / 패키지                           | 사용 라우트                                                                                            | 용도                                          | 인증              | 캐시         |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------- | ------------ |
| **Yahoo Finance**            | `yahoo-finance2` (`yf.quote` / `yf.chart`)    | `market`, `commodities`, `economy`                                                                     | 자산 현물가·주식·환율·국채·VIX·원자재 시계열  | 불필요            | 5분 / 1시간  |
| **Google Finance**           | `google.com/finance/quote` (스크레이프)       | `market`                                                                                               | Yahoo 보조/폴백 시세                          | 불필요            | 5분          |
| **Coinbase Exchange**        | `api.exchange.coinbase.com/.../candles`       | `bitcoin-historical`                                                                                   | BTC 일별 OHLC (2015~, 300일 청크)             | 불필요            | 24시간       |
| **FRED** (세인트루이스 연준) | `api.stlouisfed.org/fred/series/observations` | `fred`, `inflation-data`                                                                               | M2·CPI·금리·나스닥·주택 등 거시 시계열        | 🔑 `FRED_API_KEY` | 24시간       |
| **BOK ECOS** (한국은행)      | `ecos.bok.or.kr/api/StatisticSearch`          | `inflation-data-kr`                                                                                    | 한국 M2·CPI·예금금리                          | 🔑 `ECOS_API_KEY` | 24시간       |
| **Alternative.me**           | `api.alternative.me/fng/`                     | `fear-greed`                                                                                           | 공포·탐욕 지수                                | 불필요            | 24시간       |
| **CoinMetrics** (community)  | `community-api.coinmetrics.io/v4/...`         | `mvrv`                                                                                                 | BTC MVRV / Realized Cap                       | 불필요            | 24시간       |
| **mempool.space**            | `mempool.space/api/...`                       | `hashrate-history`, `mining-stats`, `mining-pools`, `recent-blocks`, `mempool-stats`, `mempool-blocks` | 해시레이트·난이도·채굴풀·블록·수수료·메모리풀 | 불필요            | 1분 ~ 24시간 |

**API 키 필요: 2개** — FRED(설정됨), ECOS(미설정 시 한국 데이터는 `available: false`로 우아하게 비활성).

## 캐시 시간별 목록

### 1분 (60초) — 실시간 네트워크 상태

| 라우트           | 제공처        | 용도                        |
| ---------------- | ------------- | --------------------------- |
| `mempool-stats`  | mempool.space | 권장 수수료·메모리풀 크기   |
| `mempool-blocks` | mempool.space | 메모리풀 블록별 수수료 분포 |
| `recent-blocks`  | mempool.space | 최근 10개 블록              |

### 5분 (300초) — 자산 시세

| 라우트   | 제공처                 | 용도                      |
| -------- | ---------------------- | ------------------------- |
| `market` | Yahoo + Google Finance | 자산 현물가·주식·암호화폐 |

### 10분 (600초) — 채굴 라이브 지표

| 라우트         | 제공처        | 용도                                           |
| -------------- | ------------- | ---------------------------------------------- |
| `mining-stats` | mempool.space | 현재 해시레이트·난이도 조정 진행률·다음 반감기 |

### 1시간 (3600초) — 거시 시장 (2년 시계열)

| 라우트        | 제공처        | 용도                            |
| ------------- | ------------- | ------------------------------- |
| `economy`     | Yahoo Finance | DXY·국채·VIX·나스닥·코스피·환율 |
| `commodities` | Yahoo Finance | 금·WTI·Brent·옥수수             |

### 24시간 (86400초) — 장기·저빈도 데이터

| 라우트               | 제공처         | 용도                                | 키      |
| -------------------- | -------------- | ----------------------------------- | ------- |
| `bitcoin-historical` | Coinbase       | BTC 일별 시계열 (2015~)             | —       |
| `mvrv`               | CoinMetrics    | BTC MVRV                            | —       |
| `fear-greed`         | Alternative.me | 공포·탐욕 지수                      | —       |
| `hashrate-history`   | mempool.space  | 해시레이트 1년 일별 히스토리        | —       |
| `mining-pools`       | mempool.space  | 채굴 풀 1주 점유율 집계             | —       |
| `fred`               | FRED           | M2·CPI·금리 (10년)                  | 🔑 FRED |
| `inflation-data`     | FRED           | M2·CPI·예금금리·나스닥·주택 (1971~) | 🔑 FRED |
| `inflation-data-kr`  | BOK ECOS       | 한국 M2·CPI·예금금리                | 🔑 ECOS |

## 참고

- `market` 라우트는 Yahoo Finance와 Google Finance를 함께 사용한다(폴백 용도).
- `hashrate-history`(1년 히스토리)·`mining-pools`(1주 집계)는 느리게 변하는 데이터라 24시간 캐싱을 적용한다.
- FRED는 일부 시리즈(금 `GOLDAMGBD228NLBM`, Wilshire 5000 `WILL5000IND`)를 폐기했다. 새 시리즈를 추가하기 전 `series` 엔드포인트로 유효성을 먼저 확인할 것. `Promise.all`은 시리즈 하나만 폐기돼도 전체가 500이 된다.
