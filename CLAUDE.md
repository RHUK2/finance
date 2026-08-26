# CLAUDE.md

## 명령어

```bash
pnpm dev          # 개발 서버
pnpm type         # TypeScript 타입 체크
pnpm lint         # ESLint (max-warnings 10)
pnpm inspect      # type + lint 한 번에
pnpm build        # 프로덕션 빌드 (type·lint를 선행하지 않는다. inspect를 먼저 돌릴 것)
pnpm format       # Prettier 포맷
pnpm clean:caches # .next 삭제
vercel --prod     # Vercel 프로덕션 배포
```

## 아키텍처

### 데이터 흐름

```text
외부 API → Next.js Route Handler (Upstash 공유 캐시) → TanStack Query → React 컴포넌트
```

- **캐시 설정** (`src/lib/cache-config.ts`): 신선도(TTL)의 단일 출처. `ENDPOINTS` 표의 키 = TanStack Query queryKey = `/api/<key>` 경로 세그먼트. 서버 캐시 TTL과 클라이언트 `staleTime`/`refetchInterval`이 모두 여기서 파생
- **Route Handler** (`src/app/api/*/route.ts`): 외부 API를 호출하고 `cached(key, fetcher)`(`src/lib/cache.ts`, Upstash read-through + 락 기반 스탬피드 차단)로 캐싱. 클라이언트에 API 키나 외부 도메인을 노출하지 않는 프록시 역할. 공용 fetch 헬퍼는 `src/lib/fred.ts`(FRED), `src/lib/yahoo.ts`(Yahoo 시계열), `src/lib/series.ts`(`MacroSeries` 타입·변환)에 위치
- **훅** (`src/hooks/use-*.ts`): 각 훅은 `useEndpoint<T>(key)`(`src/hooks/use-endpoint.ts`) 한 줄 래퍼. 컴포넌트는 훅을 통해서만 데이터 접근
- **외부 API 의존성**: Yahoo Finance(`yahoo-finance2`, 자산·거시·원자재)와 Google Finance(`market` 라우트의 폴백 시세, 스크레이프), Alternative.me(공포지수), CoinMetrics(MVRV), Coinbase Exchange(BTC 가격 히스토리, 300일 청크 병렬 fetch), mempool.space(멤풀·채굴), FRED(미국 거시), ECOS(한국은행 통계). TTL은 `cache-config.ts` 참조
- **API 키**: `FRED_API_KEY`와 `ECOS_API_KEY` 둘뿐이다. FRED는 없으면 해당 라우트가 실패하지만 ECOS는 없어도 되며, 그때 `available: false`를 돌려주고 화면이 한국 데이터 없이 그려진다. 제공처별 함정은 문서가 아니라 해당 파일 주석에 둔다(폐기 시리즈와 `Promise.all` 전파는 `src/lib/fred.ts`, 키 부재 처리는 `api/inflation-data-kr/route.ts`)

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

`*-concept.ts` 9개 중 실제로 여러 페이지가 공유하는 건 `tx-concept`(트랜잭션·P2P·라이트닝)와 `script-concept`(스크립트 검증·멀티시그) 둘뿐이고 나머지 일곱은 한 페이지 전용이다.

새 모델은 한 페이지 전용이면 `src/app/<page>/models.ts`, 여러 페이지가 공유하면 `src/lib/`에 둔다. 기존 파일을 이 기준에 맞춰 옮기지는 않는다.

여러 도메인이 함께 쓰는 값은 별도 파일로 뺀다. `src/lib/address-types.ts`(주소 타입 정체)와 `src/lib/bcra.ts`(공격 이득 ÷ 비용 비율)가 그 예다.

`-concept.ts`는 프로토콜 그룹이 먼저 자리잡은 이름이라 그대로 두고, 새 도메인 모델은 `-models.ts`를 쓴다.

### 규제·법률·세율 수치

정책 한 번에 바뀌는 값(LTV·DSR·스트레스 가산폭·세율)은 상수만 두지 말고 기준을 함께 둔다. `src/lib/mortgage-models.ts`의 `REGULATION`이 그 형태다.

- 값과 기준(`dsrNote`, `stressNote`)을 한 객체에 담아 단일 출처로 만든다. 같은 값을 두 파일에 적으면 규제가 바뀔 때 한쪽만 고쳐 같은 페이지의 두 탭이 다르게 계산한다
- 화면에 값을 쓰면 기준도 함께 쓴다. 코드 주석에만 두지 않는다. 날짜 없는 규제 수치는 조용히 틀린 문서가 된다
- 가격대별 누진처럼 구간이 있으면 상수 대신 함수로 둔다(`acquisitionTaxRate`)

### 차트 (`src/hooks/use-chart.ts`)

`useChart` 훅이 모든 lightweight-charts 인스턴스를 관리:

- `setup` 콜백으로 시리즈 추가 — 훅 내부에서 `setupRef`에 저장해 effect 재실행 없이 최신 클로저 유지
- `deps` 변경 시 차트를 완전히 destroy 후 재생성 — 따라서 `lines` 같은 deps로 들어가는 배열/객체는 반드시 `useMemo`로 참조를 고정할 것 (인라인 리터럴이면 매 렌더마다 차트가 재생성됨)
- `resetView()`: y축 auto-scale 복원 + x축 전체 범위 fit. 옵션 `resetRef`에 ref를 넘기면 훅이 페이지 단위 "모든 차트 리셋"용으로 채워 줌
- `addZoneLines(series, zones)`: 기준선(대시 price line) 일괄 추가 헬퍼
- 모든 차트 컴포넌트는 `useChart`만 사용하고 lightweight-charts를 직접 import하지 않음 — 시리즈 생성자(`LineSeries`, `AreaSeries` 등)와 타입은 `use-chart.ts`가 재수출하므로 거기서 import

### 자산 테이블 (`src/components/assets-table.tsx`)

모바일/데스크탑이 완전히 다른 렌더링 경로:

- **데스크탑**: TanStack Table (`useReactTable`) — `globalFilter` + `getSortedRowModel` 사용
- **모바일**: `mobileSorted` useMemo로 직접 렌더링 — TanStack Table을 거치지 않으므로 `globalFilter`를 별도로 적용해야 함 (이미 적용됨)

### 레이아웃

`SidebarProvider → AppSidebar + SidebarInset(children)` 구조. `AppHeader`는 각 페이지에서 직접 렌더링:

- 모바일: breadcrumb 현재 페이지명이 드롭다운으로 동작해 페이지 이동 가능
- 데스크탑: 일반 breadcrumb

### 페이지 두 갈래

사이트에는 성격이 다른 두 부류가 있고 껍데기 규약도 갈린다. 한쪽 관례를 다른 쪽에 옮기면 그 페이지가 자기 형제들과 어긋난다.

```text
데이터 대시보드   h1 없음 · 전폭 · 합니다체
  자산 현황 · 경제 차트 · 원자재 차트 · 비트코인 차트 · 비트코인 네트워크

설명형 페이지     h1 · max-w-5xl · 해라체
  나머지 전부
```

데이터를 보여 주는 화면은 존대, 개념을 설명하는 화면은 평서다. `/bitcoin`과 `/mempool`에 h1이 없는 것은 빠뜨린 게 아니라 대시보드 부류의 규약이다.

어느 쪽인지는 개수를 세지 말고 껍데기로 판별한다. h1과 `max-w-5xl`이 있으면 설명형, 없으면 대시보드다. 대시보드는 위에 나열한 다섯뿐이고 늘어날 일이 드물다.

설명형 페이지를 만들거나 손볼 때는 아래를 따른다.

| 항목                     | 규칙                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 페이지 골격              | `AppHeader` + `PageMain` + `max-w-5xl` + h1 + 인트로 `p.text-sm/relaxed`                                          |
| h1                       | 단정형 또는 질문형 한 문장. 논지가 논쟁적이면 인트로 첫 문장에서 주장의 출처를 밝힌다                             |
| 탭                       | 내용이 실제로 갈릴 때만 쓴다. 억지로 만들지 않는다                                                                |
| 탭 라벨                  | 실제 순서가 있으면 번호 접두사, 병렬 관점이면 번호 없이 명사구                                                    |
| `SectionIntro`           | 탭·섹션마다 하나. 탭 없는 페이지도 섹션 구분에 쓴다. 제목을 `CardTitle`로 짜지 않는다(`<div>`라 제목 의미가 없다) |
| 가상 수치 고지           | 인트로 마지막에 한 문장. 실데이터 탭이 섞인 페이지는 해당 탭의 `SectionIntro`에만 넣는다                          |
| `IllustrativeDisclaimer` | 실제 위험 예측이나 투자 판단으로 오독될 여지가 큰 페이지                                                          |
| 지표 그리드              | 기본 `grid-cols-2 sm:grid-cols-3`. 서로 접을 수 없는 독립 지표가 넷일 때만 4열                                    |
| tone 어휘                | `good` / `bad` / `accent` 셋만. 값이 좋아지는데 tone이 나빠지지 않도록 실제 비교 결과에 맞춘다                    |
| 같은 화면의 두 숫자      | 이름이 닮았는데 정의가 다르면 이름을 갈라 두고, 어느 기준인지를 화면에 적는다                                     |

### 시뮬레이션 공용 프리미티브 (`src/components/simulation.tsx`)

인터랙티브 설명 페이지(게임이론·소프트워·변동성·전력망·인플레이션 등)가 공유하는 UI: `SimTabs`, `ControlSlider`, `SegmentedControl`, `Metric`/`StatCard`, `StatusBanner`, `Legend`, `Sparkline`, `CostBar`, `StackedBar`, `MarkTable`, `AgentGrid`, `RoundControls`, `CascadeStage`, `ExplainCard`, `SectionIntro`, `IllustrativeDisclaimer`, `Field`. 새 시뮬레이션 페이지는 로컬 복제 대신 여기서 import.

고르는 기준이 헷갈리는 것들:

| 상황                                  | 쓸 것                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 값 카드                               | `Metric`이 기본. `StatCard`는 `useCountUp` 애니메이션 변형이라 값이 단계마다 크게 점프하는 워크스루에만 쓴다. 슬라이더로 연속해서 변하는 값에는 쓰지 않는다 |
| 판정·결론 한 줄                       | `Metric`이 아니라 `StatusBanner`                                                                                                                            |
| 총량 하나가 여러 몫으로 갈리는 그림   | `StackedBar`. 총량이 없는 개별 크기 비교는 `CostBar`                                                                                                        |
| 여러 대상을 같은 잣대로 재는 표       | `MarkTable`. 고른 행의 설명은 표 아래에 따로 그린다                                                                                                         |
| 지금 조건에서 결과를 못 바꾸는 컨트롤 | 숨기지 말고 `disabled`. 다른 조건에서 살아난다는 사실이 설명의 일부다                                                                                       |

`SimTabs`와 `ExplainCard`는 접힌 내용을 DOM에 두지 않는다. 어떤 링크나 프리미티브가 쓰였는지 세려면 브라우저가 아니라 소스를 봐야 한다. 렌더된 화면만 보고 "이 페이지에는 없다"고 판단하면 틀린다.

## 컨벤션

- **새 자산 추가**: `src/app/api/market/route.ts`의 `SYMBOLS` 배열에 항목 추가
- **새 API 엔드포인트 추가**: `src/lib/cache-config.ts`의 `ENDPOINTS`에 키·TTL 추가 → 라우트에서 `cached(key, ...)` 사용 → 훅은 `useEndpoint<T>(key)` 한 줄
- **새 차트 추가**: `useChart` 훅 사용, `src/lib/bitcoin-models.ts`에 모델 함수 추가
- **UI 컴포넌트**: shadcn(`pnpm dlx shadcn@latest add <component>`)으로 추가, `src/components/ui/`에 위치. BTC 브랜드 색은 `BTC_COLOR`(`src/lib/utils.ts`) 사용
- **커밋 메시지**: `{type}: {한국어 설명}` 형식 (`feat` / `fix` / `refactor` / `chore` 등)

## Agent skills

- **이슈 트래커**: 이슈·스펙은 `.scratch/<feature>/` 아래 마크다운 파일로 관리한다(gitignore되어 로컬에만 남는다). 규약은 `docs/agents/issue-tracker.md`
- **Triage 라벨**: `needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix` 다섯을 그대로 쓴다. 이슈 파일 상단 `Status:` 줄에 적는다
- **도메인 문서**: 단일 컨텍스트 구조로 루트 `CONTEXT.md` + `docs/adr/`. 규약은 `docs/agents/domain.md`
