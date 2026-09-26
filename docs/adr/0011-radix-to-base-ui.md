# Radix를 버리고 Base UI로 간다

지금 Radix가 막고 있는 것은 없었다. 이 전환은 선제적 정합성 맞추기다. Base UI는 Radix를 만든 사람들이 Floating UI·Material UI 팀과 함께 만든 후계 성격의 라이브러리이고, shadcn CLI가 `init --base radix|base`로 양쪽을 1급 지원하면서 레지스트리의 새 컴포넌트가 Base UI 쪽으로 먼저 간다. 미루면 우리 `ui/`가 레지스트리에서 점점 멀어지고, 그때는 컴포넌트 하나를 받을 때마다 손으로 번역해야 한다.

`components.json`의 `style`을 `radix-vega`에서 `base-vega`로 바꾸고 16개를 `add --overwrite`로 다시 받았다. 테마 토큰은 두 style이 완전히 동일해서 `globals.css`는 건드리지 않았다. 차이는 의존성 하나(`radix-ui` → `@base-ui/react`)뿐이다.

## 버린 대안

Radix 유지. 오늘 비용이 0이고 내일도 한동안 0이다. 다만 그 0이 계속 0인 이유가 "레지스트리에서 아무것도 새로 받지 않는다"라서, 받는 순간 한꺼번에 청구된다.

호출부를 지키는 shim. `asChild`를 받아 `render`로 번역하는 껍데기를 `ui/`에 남기면 앱 코드를 안 건드린다. 그런데 이 전환의 목적이 upstream과 붙어 있으려는 것인데 shim은 정확히 그 반대로 영구 드리프트를 만든다.

codemod. `asChild` → `render`가 단순 rename이 아니라(자식이 prop으로 올라가고 텍스트는 children에 남는다) 대상이 6곳뿐이라 손으로 했다.

## 따라오는 것

`asChild`가 사라진다. Base UI는 `render` prop과 `useRender` 훅을 쓴다. `<Button asChild><Link href='/x'>텍스트</Link></Button>`이 `<Button render={<Link href='/x' />}>텍스트</Button>`가 된다. 앱 코드에서 고친 곳은 여섯이다(`app-header`·`app-sidebar` 둘·`mobile-nav-drawer`·`theme-toggle`·`simulation`).

데이터 속성 이름이 바뀐다. Radix의 `data-state="open"`이 Base UI에서는 `data-open`·`data-closed`다. 타입 체크도 빌드도 통과하지만 CSS 선택자는 조용히 죽으므로, 앱 코드에서 `group-data-[state=open]/…`을 쓰던 세 곳(사이드바 그룹 화살표, `ExplainCard`의 미리보기 숨김과 화살표 회전)을 `group-data-open/…`으로 고쳤다. 이런 종류는 `grep`으로 찾아야 하고 테스트가 잡아 주지 않는다.

`vaul`이 사라진다. Q4를 정할 때 "Base UI에는 drawer 대응물이 없으니 vaul을 남긴다"고 봤는데 틀렸다. `base-vega`의 `drawer`는 `@base-ui/react/drawer`를 쓴다. 그래서 재설치가 vaul 래퍼를 갈아 놓았고, 아무도 안 쓰게 된 `vaul`을 지웠다. 그 결과 `@radix-ui/*`가 lockfile에서 완전히 사라졌다. vaul이 `@radix-ui/react-dialog`를 끌고 있었기 때문에, 원래 계획은 "직접 의존만 제거, lockfile에는 남는다"였는데 실제로는 흔적 없이 끝났다.

`Select.Value`가 라벨이 아니라 값을 그린다. Radix에서는 선택된 `SelectItem`의 children을 그렸는데 Base UI는 값 자체를 그리고, 라벨을 보이려면 `Select.Root`에 `items`를 준다. 다섯 곳 모두 트리거가 `native`·`256` 같은 원시 값을 보이고 있었다. 앞의 데이터 속성과 함께, 타입도 빌드도 SSR HTML도 통과하는데 눌러 봐야 드러나는 부류다. 이 전환에서 브라우저 검증이 선택이 아닌 이유다.

`Select`의 `onValueChange`가 `string | null`을 준다. 값을 비울 수 있는 API라서다. 빈 값을 허용하지 않는 셀렉트 셋(`assets-table`·`key-tree` 둘)에서 `(v) => v && setX(v)`로 좁혔다.

`Slider`의 `onValueChange`가 `number | readonly number[]`를 준다. 범위 슬라이더를 같은 컴포넌트로 지원하기 때문이다. `simulation.tsx`의 슬라이더는 모두 단일 썸이라 `sliderValue()` 헬퍼 한 군데서 좁힌다.

드리프트 감사는 `src/components/ui/`만 보면 부족하다. 재설치가 `src/hooks/use-mobile.ts`도 덮었는데, 우리 것은 `useSyncExternalStore`로 다시 쓴 버전이었다(레지스트리 버전은 effect 안에서 `setState`를 불러 `react-hooks/set-state-in-effect`에 걸린다). 다음에 재설치할 때는 `shadcn add`가 건드리는 파일 전체를 `git status`로 보고 시작한다.

ADR 0010의 드리프트 표는 그대로 유효하다. `button.tsx`(`shape` 변형·`sm` gap)·`card.tsx`(`CardTitle` 타이포그래피·`CardContent` `bleed`)·`sidebar.tsx`(`SidebarHeader` 여백·`isMobile` 타입)·`tabs.tsx`(루트 gap·트리거 세로 여백)를 재적용했다. 여기에 `use-mobile.ts`를 더한다.
