# 설명형 페이지의 맨 패널을 Card에서 갈라 Panel로 둔다

`Card`는 212곳에서 쓰였는데 `CardHeader`는 3곳, `CardTitle`은 2곳, `CardContent`는 14곳에서만 함께 쓰였다. 나머지 195곳은 슬롯 없이 `<Card className='gap-N p-4'>`로 쓰인다. 세어 보면 압도적 다수인 쪽이 이름을 못 가진 채 매번 `p-4`로 자기를 설명하고 있었다.

`p-4`가 게으름이 아니라는 것이 갈라야 하는 이유다. `card.tsx`의 base는 `py-(--card-spacing)`만 갖고 가로 패딩은 `CardHeader`·`CardContent`가 `px-(--card-spacing)`으로 공급한다. 슬롯을 안 쓰면 가로 패딩이 0이므로 호출부가 `p-4`로 채워야 한다. 즉 기본값을 4로 내려도 195곳의 `p-4`는 사라지지 않는다.

그렇다고 base를 `p-(--card-spacing)`으로 바꿀 수도 없다. 그러면 슬롯을 쓰는 17곳이 Card 패딩과 슬롯 패딩으로 이중이 되고, 무엇보다 `<CardContent bleed>`로 차트를 카드 끝까지 빼는 대시보드 넷이 깨진다. 슬롯형은 "패딩이 슬롯에 있어야 내용이 빠져나갈 수 있다"를, 맨 패널은 "패딩이 컨테이너에 있어야 한다"를 요구한다. 정반대라 한 컴포넌트가 둘 다 될 수 없다.

그래서 `src/components/panel.tsx`를 새로 두고 195곳을 옮겼다. `Panel`은 패딩·간격·모양·기본 표면을 소유하고, 호출부는 `gap`과 배치와 그 인스턴스의 강조만 넘긴다. `bleed`는 내부가 구획을 나눠 테두리를 끝까지 긋는 패널용이고, `tone`은 `StatusBanner`와 같은 어휘(good/bad/accent)를 쓴다.

이 선은 CLAUDE.md의 "페이지 두 갈래"와 대체로 겹치지만 정확히 겹치지는 않는다. `money-creation`과 `inflation`은 설명형인데 대시보드식 슬롯을 쓴다. 판별 기준은 페이지 성격이 아니라 슬롯을 쓰는가다.

## 버린 대안

`Card`의 기본 spacing만 4로 내리기. 처음에 고른 길인데 위에서 적은 이유로 틀렸다. 세로만 바뀌고 가로는 여전히 호출부가 채운다.

`no-restyle`의 contract으로 `p-4`를 Card에 허용하기. 오늘 0건이 되지만 195곳이 같은 보정을 반복하는 사실은 그대로 남는다. 린트를 켜 두고 안 지키는 상태다.

`Card`를 그대로 두고 `Panel`을 `src/components/ui/`에 넣기. 그 디렉터리는 vendored 컴포넌트를 upstream 원본으로 유지하는 자리라 뜻이 망가지고, shadcn 재설치 때 휩쓸린다.

## 따라오는 것

`src/components/ui/` 넷이 upstream과 갈라진다. 그 디렉터리가 순정이라는 전제는 `eslint.config.mjs`의 ignore 주석이 적고 있었는데, 이제 예외가 생겼다. 갈라진 곳은 다음 넷이다.

| 파일          | 바꾼 것                                 | 왜                                                     |
| ------------- | --------------------------------------- | ------------------------------------------------------ |
| `card.tsx`    | `CardTitle` 기본을 대시보드 제목 값으로 | 호출부 둘이 같은 값을 덮고 있었다                      |
| `card.tsx`    | `CardContent`에 `bleed`                 | 차트 full-bleed 넷이 `p-0`으로 패딩을 되돌리고 있었다  |
| `button.tsx`  | `sm`의 gap을 1.5로, `shape='pill'` 추가 | `size='sm'` 호출부가 전부 gap을 덮었고, 원형 버튼이 넷 |
| `sidebar.tsx` | `SidebarHeader` 여백을 4로              | 이 앱의 유일한 사이드바 머리글이 그 값을 덮고 있었다   |
| `tabs.tsx`    | 루트 gap 4, 트리거 세로 여백·행간       | `SimTabs`가 줄바꿈되는 라벨을 담느라 매번 덮고 있었다  |

전부 "호출부가 기본값을 덮고 있었다"는 같은 형태다. 덮는 쪽이 유일하거나 압도적이면 기본값이 틀린 것이라고 보고 기본값을 고쳤다. shadcn을 다시 받을 때 이 표가 재적용 목록이다.

`tone` 색이 테마 토큰이 된다. `--color-good`·`--color-bad`·`--color-warn`과 각각의 `-surface`를 `globals.css`에 선언했다. `no-raw-colors`가 요구하는 형태이고, 덕분에 동결된 빚이 704건에서 665건으로 줄었다. 토큰 이름만 `accent` 대신 `warn`인 것은 shadcn이 `--color-accent`를 호버 배경에 이미 쓰고 있어서다. 화면 어휘(`tone='accent'`)는 CLAUDE.md 그대로 둔다.
