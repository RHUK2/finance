# CLAUDE.md

## 명령어

```bash
pnpm dev          # 개발 서버 (매번 .next 캐시 삭제 후 시작)
pnpm type         # TypeScript 타입 체크
pnpm lint         # ESLint (max-warnings 10)
pnpm build        # 프로덕션 빌드 (prebuild로 type + lint 선행)
pnpm format       # Prettier 포맷
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
- **외부 API 의존성**: Yahoo Finance(`yahoo-finance2`, 자산·거시·원자재), Alternative.me(공포지수), CoinMetrics(MVRV), Coinbase Exchange(BTC 가격 히스토리, 300일 청크 병렬 fetch), mempool.space(멤풀·채굴), FRED(미국 거시), ECOS(한국은행 통계). TTL은 `cache-config.ts` 참조

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
| `src/app/<page>/models.ts`    | 비트코인 인사이트 그룹 (게임이론·소프트워·변동성)                                      |
| `src/lib/<domain>-concept.ts` | 비트코인 프로토콜 그룹 (tx·script·block·chain·bip·p2p·privacy·lightning·soft-fork 9개) |

`*-concept.ts` 9개 중 실제로 여러 페이지가 공유하는 건 `tx-concept`(트랜잭션·P2P·라이트닝)와 `script-concept`(스크립트 검증·멀티시그) 둘뿐이고 나머지 일곱은 한 페이지 전용이다.

새 모델은 한 페이지 전용이면 `src/app/<page>/models.ts`, 여러 페이지가 공유하면 `src/lib/`에 둔다. 기존 파일을 이 기준에 맞춰 옮기지는 않는다.

여러 도메인이 함께 쓰는 값은 별도 파일로 뺀다. `src/lib/address-types.ts`(주소 타입 정체)와 `src/lib/bcra.ts`(공격 이득 ÷ 비용 비율)가 그 예다.

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

## 컨벤션

- **새 자산 추가**: `src/app/api/market/route.ts`의 `SYMBOLS` 배열에 항목 추가
- **새 API 엔드포인트 추가**: `src/lib/cache-config.ts`의 `ENDPOINTS`에 키·TTL 추가 → 라우트에서 `cached(key, ...)` 사용 → 훅은 `useEndpoint<T>(key)` 한 줄
- **새 차트 추가**: `useChart` 훅 사용, `src/lib/bitcoin-models.ts`에 모델 함수 추가
- **UI 컴포넌트**: shadcn(`pnpm dlx shadcn@latest add <component>`)으로 추가, `src/components/ui/`에 위치. BTC 브랜드 색은 `BTC_COLOR`(`src/lib/utils.ts`) 사용
- **커밋 메시지**: `{type}: {한국어 설명}` 형식 (`feat` / `fix` / `refactor` / `chore` 등)

## Agent skills

### 이슈 트래커

이슈·스펙은 이 저장소의 `.scratch/<feature>/` 아래 마크다운 파일로 관리한다. `docs/agents/issue-tracker.md` 참조.

### Triage 라벨

기본 5개 역할 라벨(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)을 그대로 사용한다. `docs/agents/triage-labels.md` 참조.

### 도메인 문서

단일 컨텍스트 구조: 루트 `CONTEXT.md` + `docs/adr/`. `docs/agents/domain.md` 참조.
