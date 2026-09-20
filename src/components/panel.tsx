import * as React from 'react';

import { cn } from '@/lib/utils';

// 설명형 페이지가 쓰는 맨 패널. Card와 생김새는 같지만 패딩의 주인이 다르다.
// Card는 세로 패딩만 갖고 가로 패딩을 CardHeader·CardContent가 가져서 슬롯이 카드 끝까지
// 빠져나갈 수 있다(대시보드의 full-bleed 차트). Panel은 슬롯 없이 쓰이므로 패딩을 자기가 갖는다.
// 이 차이 때문에 한 컴포넌트로 합치면 한쪽이 반드시 호출부에서 패딩을 보정하게 된다. ADR 0010 참고.
//
// bleed는 내부가 구획을 나눠 테두리를 끝까지 긋는 패널용이다. 패딩과 간격을 0으로 두고
// 자식이 각자 p-4를 갖는다.
//
// tone은 StatusBanner와 같은 어휘(good/bad/accent)다. accent가 warn 토큰을 보는 것은
// shadcn이 --color-accent를 호버 배경에 이미 쓰고 있어서다(globals.css 주석).
const TONE = {
  good: 'bg-good-surface/5 ring-good-surface/40',
  bad: 'bg-bad-surface/5 ring-bad-surface/40',
  accent: 'bg-warn-surface/5 ring-warn-surface/40',
} as const;

function Panel({
  className,
  bleed = false,
  tone,
  ...props
}: React.ComponentProps<'div'> & { bleed?: boolean; tone?: keyof typeof TONE }) {
  return (
    <div
      data-slot='panel'
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10',
        bleed ? 'gap-0' : 'gap-4 p-4',
        tone && TONE[tone],
        className,
      )}
      {...props}
    />
  );
}

export { Panel };
