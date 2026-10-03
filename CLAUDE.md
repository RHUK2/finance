# CLAUDE.md

## 명령어

```bash
pnpm dev          # 개발 서버 (워크트리 슬롯 포트로 뜬다)
pnpm ports        # 이 워크트리가 쓰는 포트 확인
pnpm type         # TypeScript 타입 체크
pnpm lint         # ESLint (에러 0이 통과 조건)
pnpm lint:prune   # 갚은 lint 빚을 동결 목록에서 회수 (동결 파일이 없으면 아무것도 하지 않는다)
pnpm test:scripts # scripts/ 의 node:test 스위트
pnpm test         # src/ 의 모델 회귀 테스트 (Vitest, src/**/*.test.ts)
pnpm inspect      # type + lint + test:scripts + test 한 번에
pnpm build        # 프로덕션 빌드 (lint는 돌지 않는다. inspect를 먼저 돌릴 것)
pnpm format       # Prettier 포맷
pnpm clean:caches # .next 삭제
vercel --prod     # Vercel 프로덕션 배포
```

## 워크트리와 로컬 설정

한 레포를 여러 체크아웃으로 동시에 굴리는 것을 전제로 한다. 추적되지 않는 로컬 파일은 워크트리마다 복제되면 조용히 갈라지고, 포트는 그대로 두면 충돌한다. 둘을 반대 방향으로 푼다: 파일은 하나로 묶고, 포트는 갈라 준다.

| 대상                  | 정본                         | 규칙                                                               |
| --------------------- | ---------------------------- | ------------------------------------------------------------------ |
| 로컬 파일 (환경·설정) | `link-worktree-files.sh`     | 기준 체크아웃의 실체 하나를 심볼릭 링크로 공유한다                 |
| dev 서버 포트         | `scripts/worktree-ports.mjs` | `3000 + 슬롯`. 기준 체크아웃이 0번, 워크트리는 이름 해시로 1번부터 |

새 워크트리를 만들면 그 안에서 한 번 실행한다. 링크 대상은 `link-worktree-files.sh`의 `ITEMS`가 정본이다.

```bash
git worktree add ../finance-<주제> -b <브랜치>
cd ../finance-<주제>
pnpm install
bash link-worktree-files.sh
```

사본이 기준과 내용이 다르면 건드리지 않고 경고만 한다. 합친 뒤 `--force`로 다시 실행한다. 이미 다른 곳을 가리키는 링크도 경고하고 건너뛴다(`--force`로 바꾼다). 브랜치마다 값이 달라야 하는 항목이 생기면 그 링크만 풀고 실제 파일로 되돌린다.

슬롯 장부는 기준 체크아웃의 `.worktree-ports.json`에 있다(gitignore). 사라진 워크트리의 항목은 읽을 때마다 회수된다. 한 번만 다른 포트로 띄우려면 `FINANCE_PORT_SLOT=<0~9>`.

## 환경변수

배포 환경의 값은 Vercel 프로젝트(`rhuk2s-projects/finance`)의 Production 환경에만 둔다. Preview·Development에는 두지 않는다. 로컬 값은 기준 체크아웃의 `.env.development.local` 하나가 갖고(워크트리의 것은 그 링크, 위 `ITEMS`), 각 제공처 콘솔(Upstash·FRED·ECOS)에서 복사해 손으로 적는다. Next는 이 파일을 `next dev`에서만 읽고, 그때 다른 환경 파일보다 먼저 읽는다. 둘을 자동으로 맞추지 않는다. Vercel의 값이 전부 Sensitive라 되읽을 수 없어서 `vercel env pull`이 자리표시자만 내려주기 때문이다. 그래서 `vercel env pull`을 돌리지 않는다. `.vercel` 링크 정보는 워크트리끼리 공유하므로(위 `ITEMS`) 워크트리마다 다시 `vercel link`를 하지 않는다.

읽는 값은 넷이다. Upstash는 Vercel 통합이 심어 주는 `KV_*` 이름으로 오고, `Redis.fromEnv()`가 `UPSTASH_REDIS_REST_URL` 다음 순위로 `KV_REST_API_URL`을 보기 때문에 그대로 동작한다(`src/lib/cache.ts`).

| 이름                                  | 없으면                                       |
| ------------------------------------- | -------------------------------------------- |
| `KV_REST_API_URL`·`KV_REST_API_TOKEN` | 캐시 계층이 죽는다. 라우트 전체가 실패한다   |
| `FRED_API_KEY`                        | `fred`·`inflation-data`가 `available: false` |
| `ECOS_API_KEY`                        | `inflation-data-kr`가 `available: false`     |

새 변수를 넣을 때는 양쪽에 다 넣는다. 배포 쪽은 `vercel env add <NAME> production`, 로컬 쪽은 기준 체크아웃의 `.env.development.local`에 직접 적는다. `vercel --prod`는 `.gitignore`를 읽지 않으므로 로컬 환경 파일·`.scratch` 등이 배포 소스로 올라가지 않게 `.vercelignore`가 막는다. 로컬 전용 파일을 새로 두면 거기에도 적는다.

응답 보안 헤더(`nosniff`·`X-Frame-Options`·`Referrer-Policy`, `poweredByHeader: false`)는 `next.config.ts`가 갖는다. HSTS는 Vercel이 붙인다.

로컬도 프로덕션 Upstash 데이터베이스를 그대로 쓴다. 사용자가 한 명뿐인 사이트라 데이터베이스를 나눠 관리할 값어치가 없다. 대신 캐시 키가 `cache:<key>`·`lock:<key>`라 환경 구분이 없어서(`src/lib/cache.ts`), 로컬에서 응답 형태를 바꾸고 그 키의 `shape`를 올리지 않으면 로컬이 쓴 값을 프로덕션이 그대로 내보낸다. 응답 형태를 건드리는 작업은 dev 서버를 띄우기 전에 `shape`부터 올린다. 버전이 다르면 서로를 miss로 보고 덮어쓸 뿐 깨지지 않는다.

## 아키텍처

### 데이터 흐름

```text
외부 API ──> 로더 (Upstash 공유 캐시)
               ├──> Route Handler /api/<key> ──> TanStack Query ──> React 컴포넌트
               └──> prefetchEndpoints (서버 컴포넌트) ──> dehydrate ──> 같은 TanStack Query 캐시
```

- 캐시 설정(`src/lib/cache-config.ts`): 신선도(`ttl`)와 응답 형태 버전(`shape`)의 단일 출처. `ENDPOINTS` 표의 키 = TanStack Query queryKey = `/api/<key>` 경로 세그먼트. 서버 캐시 TTL과 클라이언트 `staleTime`/`refetchInterval`이 모두 여기서 파생. 응답 모양을 바꾸면(필드 이름 변경·추가·단위 변경) 그 키의 `shape`를 올린다. 버전이 다른 캐시 항목은 miss로 본다(규칙은 파일 머리 주석)
- 로더(`src/lib/loaders/<key>.ts`): 키마다 `load<Key>()` 하나와 응답 타입(`<Key>Data`)을 갖는다. 외부 API를 호출하고 `cached(key, fetcher)`(`src/lib/cache.ts`, Upstash read-through + 락 기반 스탬피드 차단)로 캐싱. 갱신이 실패하면 캐시에 남은 마지막 값을 계속 내보내고, 캐시가 비어 있을 때만 실패한다. 모두 `import 'server-only'`라 클라이언트 번들에 들어가지 않는다
- Route Handler(`src/app/api/*/route.ts`): `serveEndpoint(key, load<Key>, 문구)`(`src/lib/loaders/serve.ts`) 한 줄로 로더를 감싸는 클라이언트용 프록시. 로더가 실패하면 500. 클라이언트에 API 키나 외부 도메인을 노출하지 않는다
- 서버 prefetch(`src/lib/prefetch.ts`): 페이지 서버 컴포넌트(대시보드 다섯과 `inflation`)의 `prefetchEndpoints(keys)`가 `LOADERS`(`src/lib/loaders/index.ts`)로 같은 로더를 직접 부른다. HTTP로 자기 라우트를 다시 부르지 않으므로 라우트와 prefetch가 같은 `cached` 한 벌을 읽는다. 첫 줄의 `connection()`이 페이지를 요청 시점 렌더로 둔다
- 공용 fetch 헬퍼는 `src/lib/fred.ts`(FRED), `src/lib/yahoo.ts`(Yahoo 시계열), `src/lib/series.ts`(`MacroSeries` 타입·변환)에 위치
- 훅(`src/hooks/use-*.ts`): 각 훅은 `useEndpoint<T>(key)`(`src/hooks/use-endpoint.ts`) 한 줄 래퍼. 컴포넌트는 훅을 통해서만 데이터 접근
- 외부 API 의존성: Yahoo Finance(`yahoo-finance2`, 주식·거시·원자재), Alternative.me(공포지수), CoinMetrics(MVRV), Coinbase Exchange(BTC 가격 히스토리, 300일 청크 병렬 fetch), mempool.space(멤풀·채굴), FRED(미국 거시), ECOS(한국은행 통계). TTL은 `cache-config.ts` 참조
- 야후 일봉(`fetchYahooSeries`)을 읽는 로더가 넷인 것은 화면이 넷이기 때문이 아니라 페이지마다 내려보낼 심볼이 다르기 때문이다. `stocks`·`strategy`·`economy`·`commodities`가 모두 `fetchYahooSeries`로 일봉을 받고(기간은 로더가 정한다. 거시·원자재는 최근 2년, `stocks`는 2020-01-01부터, `strategy`는 2020-08-01부터. 뒤의 둘은 담아야 할 사건이 날짜로 정해져 있어 고정 시작일이다), `market`만 실시간 시세를 받는다(야후 `yf.quote` 일괄 호출, BTC는 `bitcoin-historical`과 같은 Coinbase)
- 일봉 히스토리는 24시간, 끝점만 5분이다. 장중에 움직이는 건 마지막 봉 하나라서 시계열 전체를 5분마다 다시 받지 않고, `market`(300초)의 시세를 화면이 히스토리 끝에 얹는다(`withLivePoint`·`withLive`, `src/lib/series.ts`). 차트에는 히스토리를 `lines`로, 시세를 `MacroChart`의 `live`로 따로 넘긴다. 시세를 `lines`에 섞으면 5분마다 차트가 다시 만들어져 확대해 둔 화면이 풀린다. 시세 대상은 `stocks`·`strategy`의 `SYMBOLS`에서 파생되므로 종목을 더할 때 `market`은 따로 고치지 않는다. 비트코인 차트 페이지의 네 지표(메이어·푸엘·레인보우·파이사이클)는 일봉 지표라 시세를 얹지 않는다
- API 키: `FRED_API_KEY`와 `ECOS_API_KEY` 둘뿐이고 둘 다 없어도 된다. 키를 읽는 세 로더(`fred`·`inflation-data`·`inflation-data-kr`)가 모두 키가 없으면 `cached`를 거치지 않고 `available: false`를 돌려주고, 화면은 그 데이터 없이 그려진다(`economy`의 `FredGate`, `inflation`의 안내 카드). 셋 중 어느 하나만 필수인 것이 아니므로 새 키 기반 로더를 만들 때도 이 분기를 넣는다. 제공처별 함정은 문서가 아니라 해당 파일 주석에 둔다(폐기 시리즈와 `Promise.all` 전파는 `src/lib/fred.ts`, 키 부재를 500으로 만들지 않는 이유는 `src/lib/loaders/inflation-data-kr.ts`)

### 비트코인 지표 모델 (`src/lib/bitcoin-models.ts`)

차트에 쓰이는 수학 모델이 모두 여기 집결. 외부 API 없이 순수 계산:

- `powerLawPrice(days)`: BTC 공정가치 추정 (로그 회귀)
- `RAINBOW_BANDS`: Power Law 기반 9단계 밸류에이션 밴드 (0.18x ~ 20.13x)
- `mvrvZScore(rows)`, `movingAverage`, `rollingVolatility`: 지표 시계열 계산
- 모델 상수(PL_A, PL_B), 반감기 데이터(HALVINGS), 프로토콜 상수(`BLOCKS_PER_HALVING`, `RETARGET_INTERVAL`)는 이 파일에서 관리

### 설명 페이지의 모델 배치

설명·시뮬레이션 페이지의 순수 계산 모델은 두 자리에 나뉘어 있다. 관례가 그룹별로 갈렸을 뿐 원칙에 따른 구분이 아니므로, 새 모델을 어디에 둘지는 아래 기준으로 정한다.

| 위치                          | 쓰는 곳                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `src/app/<page>/models.ts`    | 그 페이지 전용 모델. 한 페이지에서만 쓰이면 여기                                       |
| `src/lib/<domain>-models.ts`  | 도메인 계산 모델 (`bitcoin-models`·`inflation-models`·`mortgage-models`)               |
| `src/lib/<domain>-concept.ts` | 비트코인 프로토콜 그룹 (tx·script·block·chain·bip·p2p·privacy·lightning·soft-fork 9개) |

`*-concept.ts` 9개 중 실제로 여러 페이지가 공유하는 건 `tx-concept`(트랜잭션·P2P·라이트닝)와 `script-concept`(스크립트 검증·멀티시그) 둘뿐이고 나머지 일곱은 한 페이지 전용이다. 다만 `bip-concept`의 `illustrativeHex`·`illustrativeAddress`는 그럴듯한 가짜 생성기라 `src/lib/`의 다른 concept·주소 파일이 가져다 쓴다. 바꾸면 그 페이지들의 시연 해시·주소가 함께 바뀐다.

새 모델은 한 페이지 전용이면 `src/app/<page>/models.ts`, 여러 페이지가 공유하면 `src/lib/`에 둔다. 기존 파일을 이 기준에 맞춰 옮기지는 않는다.

여러 도메인이 함께 쓰는 값은 별도 파일로 뺀다. `src/lib/address-types.ts`(주소 타입 정체), `src/lib/bcra.ts`(공격 이득 ÷ 비용 비율), `src/lib/market-baselines.ts`(여러 탭이 쓰는 시장 기준값, `Fact` 모양)가 그 예다.

`-concept.ts`는 프로토콜 그룹이 먼저 자리잡은 이름이라 그대로 두고, 새 도메인 모델은 `-models.ts`를 쓴다.

### 규제·법률·세율 수치

정책 한 번에 바뀌는 값(LTV·DSR·스트레스 가산폭·세율)은 상수만 두지 말고 기준을 함께 둔다. `src/lib/mortgage-models.ts`의 `REGULATION`이 그 형태다.

- 값과 기준(`dsrNote`, `stressNote`)을 한 객체에 담아 단일 출처로 만든다. 같은 값을 두 파일에 적으면 규제가 바뀔 때 한쪽만 고쳐 같은 페이지의 두 탭이 다르게 계산한다
- 화면에 값을 쓰면 기준도 함께 쓴다. 코드 주석에만 두지 않는다. 날짜 없는 규제 수치는 조용히 틀린 문서가 된다
- 가격대별 누진처럼 구간이 있으면 상수 대신 함수로 둔다(`acquisitionTaxRate`)

### 차트 (`src/hooks/use-chart.ts`)

`useChart` 훅이 모든 lightweight-charts 인스턴스를 관리:

- `setup` 콜백으로 시리즈 추가. 훅 내부에서 `setupRef`에 저장해 effect 재실행 없이 최신 클로저 유지
- `deps` 변경 시 차트를 완전히 destroy 후 재생성. 따라서 `lines` 같은 deps로 들어가는 배열/객체는 반드시 `useMemo`로 참조를 고정할 것 (인라인 리터럴이면 매 렌더마다 차트가 재생성됨)
- `resetView()`: y축 auto-scale 복원 + x축 전체 범위 fit. 옵션 `resetRef`에 ref를 넘기면 훅이 페이지 단위 "모든 차트 리셋"용으로 채워 줌
- `addZoneLines(series, zones)`: 기준선(대시 price line) 일괄 추가 헬퍼
- 모든 차트 컴포넌트는 `useChart`만 사용하고 lightweight-charts를 직접 import하지 않음. 시리즈 생성자(`LineSeries`, `AreaSeries` 등)와 타입은 `use-chart.ts`가 재수출하므로 거기서 import
- 캔버스는 CSS 토큰을 읽지 못하므로 선·기준선 색은 hex를 직접 적지 않고 `use-chart.ts`의 팔레트에서 고른다: 판정 `CHART_TONE`(`-surface` 값), 계열 `CHART_SERIES`, 바탕 가격선 `CHART_MUTED`, 여러 색 위에 겹치는 선 `chartInk(isDark)`. `globals.css` 토큰의 손 사본이라 토큰을 바꾸면 함께 바꾼다. 척도(무지개 밴드, 공포·탐욕)와 `BTC_COLOR`만 예외다. DOM(범례·SVG·아이콘)은 팔레트가 아니라 토큰 클래스를 쓴다

차트 카드의 조작 규약은 `useChart`와 `MacroChart`·`IndicatorCard`·`ChartContainer` 넷이 나눠 갖는다.

| 어디             | 무엇                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `useChart`       | `handleScroll.vertTouchDrag: false`. 깨운 차트 위에서도 세로 스크롤은 페이지에 흘려보낸다. 확대는 핀치      |
| `ChartContainer` | 한 번 눌러 깨우기 전에는 조작을 받지 않는다. 막는 것은 의도하지 않은 첫 조작이고, 바깥을 누르면 다시 잠긴다 |
| `IndicatorCard`  | 설명은 접힘이 기본. 제목 줄 오른쪽은 `action` 슬롯(기간 탭)이 갱신시각 자리를 대신 쓴다                     |
| `MacroChart`     | 기간 탭(1개월·6개월·1년·전체, 기본 전체)과 커서 값 표시. 좁혔을 때만 구간 수익률이 전일 대비 옆에 붙는다    |

기간 탭은 라우트가 내려보낸 구간을 좁히기만 한다. 더 긴 기간이 필요하면 탭이 아니라 로더가 정한 기간(최근 몇 년 또는 고정 시작일)을 고친다. 커서 값을 보이려면 `formatValue`를 넘긴다. 통화·자릿수는 호출부가 알고 있으므로 `MacroChart`가 짐작하지 않는다. 선이 여럿인 차트는 첫 선의 값만 읽는다(헤드라인이 가리키는 것과 같은 선).

### 레이아웃

데스크탑 길잡이는 사이드바 하나다. 상단 헤더가 없다.

- 데스크탑: `AppSidebar`가 layout에 걸린다. 위에 거르는 칸, 가운데 그룹별 전체 목록, 아래 테마 토글. 헤더가 담던 셋을 전부 들였다
- 상단 헤더를 두지 않는 이유는 같은 일(현재 위치·검색·테마)을 두 곳이 나눠 갖게 되고 본문이 세로 48px을 잃기 때문이다. 되살리려면 그 둘을 먼저 풀어야 한다
- 모바일: 사이드바를 그리지 않는다(`md:flex`). 하단 고정 바의 현재 페이지명을 누르면 드로어로 전체 목록이 열린다. 각 페이지가 `MobileNavDrawer`를 직접 렌더링한다
- 중단점은 CSS로 가른다(`md:flex`·`md:hidden`). JS로 판정하면 서버 HTML과 첫 페인트가 어긋나 본문이 튄다(커밋 03b0f31)
- 페이지 이름의 단일 출처는 `src/lib/nav.ts`다. 사이드바도 하단 바도 `NAV_GROUPS` 하나에서 나온다. 문서 제목은 layout이 경로를 몰라 줄 수 없으므로 각 `page.tsx`가 `export const metadata = pageMetadata('<경로>')`로 준다
- 사이드바의 거르는 칸은 목록을 그 자리에서 줄이는 입력이지 따로 뜨는 검색창이 아니다. 같은 목록을 두 가지 방법으로 찾게 만들지 않는다
- 그룹을 접었다 펴는 기능은 두지 않는다. 목록의 자리가 화면마다 같아야 어디쯤에 무엇이 있는지를 몸이 기억한다
- 맨 위로 버튼은 모바일에서 하단 바 안에, 데스크탑에서 오른쪽 아래에 뜬다. 모바일에서 떠 있게 두면 워크스루의 이전·다음 알약과 겹쳐서, 예전에는 그 페이지들이 버튼을 끄는 prop을 켜고 있었다. 바 안으로 들이면서 그 prop이 사라졌으니 되살리지 않는다
- 하단 바의 윗 테두리 자리에 읽기 진행 막대를 겹쳐 그린다. 새 층이 아니라 테두리를 쓰는 것이라 화면에 더해지는 높이가 0이다

### 페이지 두 갈래

사이트에는 성격이 다른 두 부류가 있고 껍데기 규약도 갈린다. 한쪽 관례를 다른 쪽에 옮기면 그 페이지가 자기 형제들과 어긋난다.

```text
데이터 대시보드   h1 없음 · 전폭 · 합니다체
  비트코인 차트(/) · 주식 차트 · 경제 차트 · 원자재 차트 · 비트코인 네트워크

설명형 페이지     h1 · max-w-5xl · 해라체
  나머지 전부
```

데이터를 보여 주는 화면은 존대, 개념을 설명하는 화면은 평서다. `/`와 `/mempool`에 h1이 없는 것은 빠뜨린 게 아니라 대시보드 부류의 규약이다.

어느 쪽인지는 개수를 세지 말고 껍데기로 판별한다. `ExplainerPage`(`src/components/explainer-page.tsx`)를 쓰면 설명형, `MobileNavDrawer`와 `PageMain`을 직접 쓰면 대시보드다. 대시보드는 위에 나열한 다섯뿐이고 늘어날 일이 드물다.

사이드바 그룹도 이 선을 따른다. 대시보드 다섯이 `실시간 데이터` 한 그룹이고 나머지는 전부 설명형이라 그 안에서만 주제로 갈린다(ADR 0008). 새 페이지를 `src/lib/nav.ts`에 넣을 때 어느 그룹인지는 소재가 아니라 이 부류가 먼저 정한다.

설명형 페이지를 만들거나 손볼 때는 아래를 따른다.

| 항목                     | 규칙                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 페이지 골격              | `ExplainerPage`에 `title`·`intro`를 넘긴다. h1·`max-w-5xl`·인트로 클래스를 직접 쓰지 않는다. 페이지 이름은 넘기지 않는다. 데스크탑 사이드바와 모바일 하단 바가 경로로 `src/lib/nav.ts`에서 끌어오므로 이름의 단일 출처는 거기다                                                                                                                                                                                           |
| h1                       | 단정형 또는 질문형 한 문장. 등식 모양 제목(`A = B`)도 단정문으로 본다. 논지가 논쟁적이면 인트로 첫 문장에서 주장의 출처를 밝힌다                                                                                                                                                                                                                                                                                          |
| 탭                       | 내용이 실제로 갈릴 때만 쓴다. 억지로 만들지 않는다                                                                                                                                                                                                                                                                                                                                                                        |
| 탭 라벨                  | 번호 접두사 없이 명사구. 순서는 본문이 "앞 탭"·"다음 탭"으로 말하므로 라벨에 겹쳐 적지 않는다                                                                                                                                                                                                                                                                                                                             |
| `SectionIntro`           | 탭·섹션마다 하나. 탭 없는 페이지도 섹션 구분에 쓴다. 제목을 `CardTitle`로 짜지 않는다(`<div>`라 제목 의미가 없다)                                                                                                                                                                                                                                                                                                         |
| 가상 수치 고지           | 인트로 마지막에 한 문장. 실데이터 탭이 섞인 페이지는 해당 탭의 `SectionIntro`에만 넣는다                                                                                                                                                                                                                                                                                                                                  |
| `IllustrativeDisclaimer` | 실제 위험 예측이나 투자 판단으로 오독될 여지가 큰 페이지와, ADR 0007의 그럴듯한 가짜·작은 진짜 값 고지에만 쓴다(ADR 0007의 "둘이 함께 쓴다"는 그 두 고지가 이 카드 하나를 나눠 쓴다는 뜻이지 쓰임을 더 넓히지 않는다). 모델 단순화 고지(시간을 라운드로 끊음, 노드 수를 줄임 등)는 카드에 두지 않고 해당 탭 `SectionIntro` 끝 문장이나 본문에 둔다. 실데이터 페이지는 이름이 맞지 않으므로 같은 내용을 자체 문단으로 둔다 |
| 지표 그리드              | 기본 `grid-cols-2 sm:grid-cols-3`. 모바일은 언제나 2열이다. 4열은 서로 접을 수 없는 독립 지표가 넷이거나, 넷이 한 줄로 이어지는 파생 사슬이라 그 사슬을 보이는 것이 논지일 때만. 4열은 `grid-cols-2 lg:grid-cols-4`로 쓴다(3열을 거치면 넷이 3+1로 갈린다)                                                                                                                                                                |
| tone 어휘                | `good` / `bad` / `accent` 셋만. 값이 좋아지는데 tone이 나빠지지 않도록 실제 비교 결과에 맞춘다                                                                                                                                                                                                                                                                                                                            |
| 같은 화면의 두 숫자      | 이름이 닮았는데 정의가 다르면 이름을 갈라 두고, 어느 기준인지를 화면에 적는다                                                                                                                                                                                                                                                                                                                                             |
| 다른 페이지 링크         | 그 자리에서 화면을 잘못 읽지 않게 막을 때만 문장 안에 건다(주장의 한계, 가상 수치 옆의 실데이터 위치). "이 주제는 저기서 다룬다"는 경계 표시, 다음에 읽을 것, 새 페이지를 알리는 역링크는 두지 않는다. 페이지를 찾는 일은 사이드바가 한다. 탭이나 페이지 끝에 링크만 모은 문단을 따로 두지 않는다                                                                                                                         |
| 설계 해명·오해 반박      | 화면 문구는 독자가 화면을 보며 떠올릴 질문에만 답한다. 왜 이렇게 만들었는지(무엇을 뺐는지, 왜 고정했는지, 왜 이렇게 부르는지)와 대화 중 나온 질문에 대한 답("흔한 오해 하나를 짚어 둔다", "헷갈리면 안 된다")은 커밋 메시지나 ADR에 둔다. 모델의 단순화 고지는 설계 해명이 아니므로 화면에 둔다. 가상 수치 고지는 인트로나 `IllustrativeDisclaimer`에 한 번만 쓰고 본문 괄호로 되풀이하지 않는다                          |

### 시뮬레이션 공용 프리미티브 (`src/components/simulation.tsx`)

인터랙티브 설명 페이지(게임이론·소프트워·변동성·전력망·인플레이션 등)가 공유하는 UI: `SimTabs`, `ControlSlider`, `SegmentedControl`, `Metric`/`StatCard`, `StatusBanner`, `Legend`, `Sparkline`, `CostBar`, `StackedBar`, `MarkTable`, `RoundControls`, `CascadeStage`, `ExplainCard`, `SectionIntro`, `IllustrativeDisclaimer`, `Field`, `StepPanel`. 새 시뮬레이션 페이지는 로컬 복제 대신 여기서 import. 페이지 껍데기는 여기가 아니라 `ExplainerPage`다.

`ControlSlider`의 치수와 터치 규약은 손끝 기준으로 잡혀 있다. 되돌리기 쉬우니 근거를 같이 둔다. 값은 `src/components/ui/slider.tsx`에 있고 ADR 0010의 재적용 목록에 올라 있어, 같은 슬라이더를 쓰는 `RoundControls`의 탐색 막대에도 걸린다.

| 무엇                             | 왜                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 손잡이 24px, 트랙 12px           | shadcn 기본값(16px·6px)은 모바일에서 조준이 어렵고 빗맞으면 값이 튄다                                                               |
| Control 높이 44px                | 닿는 면을 손잡이가 아니라 줄이 갖는다. 손잡이에 가짜 여백을 붙이면 슬라이더를 쌓았을 때 위아래 줄이 서로 겹친다                     |
| `touch-pan-y` (not `touch-none`) | none이면 슬라이더 위에서 세로로 넘기려는 손짓까지 먹어 페이지가 스크롤되지 않는다                                                   |
| −/+ 버튼                         | 360px 폭에서 0~100이면 한 칸이 3.6px이라 끌기만으로는 원하는 값을 못 맞춘다. 로그에서도 눈금 하나를 옮겨 끌기와 한 칸 크기를 맞춘다 |

재생 배선은 `src/hooks/use-round-engine.ts`에 셋 있다. 고르는 기준은 궤적의 끝이 미리 정해져 있는가다.

| 훅                                     | 쓰는 경우                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `useRoundEngine(step, speedMs)`        | 끝을 모르는 시뮬레이션. 살아 있는 상태를 한 스텝씩 밀며 진행 중에 종료 조건을 판단한다 |
| `useTrajectory(last, speedMs)`         | 끝이 정해져 있고 라운드 번호에서 값을 계산해 내는 것 (가십 전파·IBD·HTLC)              |
| `useTrajectoryPlayer(frames, speedMs)` | 끝이 정해져 있고 궤적이 프레임 배열로 나오는 것. 결정론적 캐스케이드 등                |

뒤의 둘은 `round`/`last`/`done`/`step`/`seek`/`engine`을 돌려주고, `useTrajectoryPlayer`는 거기에 `frame`을 얹은 것이라 `CascadeStage`에 그대로 넘길 수 있다. 뒤의 둘을 쓸 자리에서 `useRoundEngine`을 직접 쓰면 종료 판정 세 줄을 손으로 복제하게 된다. 파라미터를 바꿔 궤적을 다시 계산할 때 처음부터 보여 주려면 호출부에서 `key`로 리마운트한다.

고르는 기준이 헷갈리는 것들:

| 상황                                  | 쓸 것                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 값 카드                               | `Metric`이 기본. `StatCard`는 `useCountUp` 애니메이션 변형이라 값이 단계마다 크게 점프하는 워크스루에만 쓴다. 슬라이더로 연속해서 변하는 값에는 쓰지 않는다. 워크스루의 한 단계에만 슬라이더가 붙으면 페이지 성격을 따라 `StatCard`를 유지한다(`money-creation`). 한 화면에서 둘을 섞지 않는 것이 먼저다 |
| 판정·결론 한 줄                       | `Metric`이 아니라 `StatusBanner`. 판정 아래 근거 한 줄이 붙으면 상자를 따로 짜지 않고 `detail`로 넘긴다                                                                                                                                                                                                  |
| 아직 값이 없는 칸                     | `Metric value={null}`(흐린 `-`). 자리표시 문자를 칸마다 따로 적지 않는다                                                                                                                                                                                                                                 |
| 총량 하나가 여러 몫으로 갈리는 그림   | `StackedBar`. 0이 된 몫도 범례에 남겨야 하면 `keepEmpty`. 총량이 없는 개별 크기 비교는 `CostBar`(라벨 앞 `icon`, 값 뒤 보조 값 `aside`. 값 0이면 폭 0)                                                                                                                                                   |
| 여러 대상을 같은 잣대로 재는 표       | `MarkTable`. 고른 행의 설명은 표 아래에 따로 그린다                                                                                                                                                                                                                                                      |
| 지금 조건에서 결과를 못 바꾸는 컨트롤 | 숨기지 말고 `disabled`. 다른 조건에서 살아난다는 사실이 설명의 일부다                                                                                                                                                                                                                                    |

`Field`는 Base UI Field라 안에 둔 입력·`Select`·`SegmentedControl`은 라벨과 자동으로 이어진다. 등록할 입력이 없는 원시 버튼 묶음은 `role='group'`과 `aria-labelledby`로 스스로 이름을 갖는다.

`SimTabs`와 `ExplainCard`는 접힌 내용을 DOM에 두지 않는다. 어떤 링크나 프리미티브가 쓰였는지 세려면 브라우저가 아니라 소스를 봐야 한다. 렌더된 화면만 보고 "이 페이지에는 없다"고 판단하면 틀린다.

## 컨벤션

- 새 종목 추가: 로더의 `SYMBOLS`와 화면의 표 둘 다 고친다. 주식은 `src/lib/loaders/stocks.ts`의 `SYMBOLS` + `src/app/stocks/stocks-view.tsx`의 `STOCKS`(훅의 응답 타입은 로더의 `StocksData`에서 파생된다), 스트래티지 증권은 `src/lib/loaders/strategy.ts`. 심볼을 더하기 전에 야후에서 그 티커가 살아 있는지 확인한다. 하나가 죽으면 `fetchYahooSeries`의 `Promise.all`이 실패해 그 키가 갱신되지 않는다. 캐시에 값이 없으면 500, 있으면 마지막 성공 값이 계속 나가 갱신시각만 늘어난다(`src/lib/yahoo.ts`)
- 새 API 엔드포인트 추가: `src/lib/cache-config.ts`의 `ENDPOINTS`에 키·`ttl`·`shape: 0` 추가 → `src/lib/loaders/<key>.ts`에 `import 'server-only'`, 응답 타입과 `load<Key>()`(안에서 `cached(key, ...)`) → `src/lib/loaders/index.ts`의 `LOADERS`에 등록(`satisfies`라 빠뜨리면 타입 오류) → 라우트는 `serveEndpoint` 한 줄 → 훅은 응답 타입을 `import type`으로 받아 `useEndpoint<T>(key)` 한 줄
- 새 차트 추가: `useChart` 훅 사용, `src/lib/bitcoin-models.ts`에 모델 함수 추가
- UI 컴포넌트: shadcn(`pnpm dlx shadcn@latest add <component>`)으로 추가, `src/components/ui/`에 위치. BTC 브랜드 색은 `BTC_COLOR`(`src/lib/utils.ts`) 사용
- 상자: 설명형 페이지의 맨 패널은 `Panel`(`src/components/panel.tsx`), 대시보드의 슬롯 카드는 `Card`다. 가르는 기준은 페이지 성격이 아니라 `CardHeader`·`CardContent`를 쓰는가다. `Panel`에 `p-4`를 다시 적지 않는다. 자기가 갖고 있다(ADR 0010)
- 색은 두 축: 생색(`emerald-500` 등)을 직접 쓰지 않는다. 어느 축인지는 "좋고 나쁨의 뜻이 있는가"로 가른다
  - 판정: `good`·`bad`·`warn`. 글자·아이콘은 `text-good`(모드별 명도), 면은 `bg-good-surface`·`ring-good-surface`(고정 채도). `tone` prop의 `accent`가 `warn` 토큰을 보는 것은 shadcn의 `--color-accent`와 이름이 겹쳐서다
  - 계열: `series-1`~`4`. 여럿을 구분하려고 쓰는 색이라 좋고 나쁨의 뜻이 없다. 스파크라인·비용막대·누적막대·SVG 점과 선, 주제를 나타내는 아이콘이 여기서 고른다. 주제에 비용·위험 같은 뜻이 붙어 있어도 주제 아이콘은 계열이다. 값에 따라 모양·색이 바뀌는 아이콘은 판정을 따른다
  - 등락: `up`(빨강)·`down`(파랑). 두 축의 예외로, 시세 헤드라인의 전일 대비·구간 수익률(`MacroChart`)에만 쓴다. 한국 시세 관례라 방향만 뜻하고 좋고 나쁨은 뜻하지 않는다. 판정 색을 쓰지 않는 것은 VIX·달러/원처럼 오르면 대개 나쁜 소식인 자산이 있어서다
  - tone → 토큰 클래스 표는 `src/components/tone.ts` 한 곳이다(`TONE_TEXT`·`TONE_RING_SURFACE`·`TONE_BORDER_SURFACE`). 페이지에서 tone으로 글자를 칠할 때도 로컬 표를 만들지 않고 여기서 고른다
- 통화·비율 표기: `src/lib/utils.ts`의 `formatMan`·`formatWon`·`formatEok`·`formatEokFromMan`·`formatEokFromWon`·`formatPct`, 시세는 `formatUsdPrice`·`formatKrwPrice`(기호 접두, 천 단위 구분자, 소수 자릿수 고정)를 쓴다. `formatUsd`는 `$1.2K`처럼 줄여 찍는 다른 함수다. 로컬에 `fmtEok` 같은 걸 다시 만들지 않는다. 억으로 찍는 함수가 셋인 것은 입력 단위가 페이지마다 다르기 때문이고, 이름 뒤 `From`이 입력 단위다. 자릿수만 다르면 인자로 넘긴다
- 커밋 메시지: `{type}: {한국어 설명}` 형식 (`feat` / `fix` / `refactor` / `chore` 등)

규약·용어·이슈 문서가 각각 어디에 있는지는 `AGENTS.md`가 정한다.
