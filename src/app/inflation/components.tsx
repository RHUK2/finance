'use client';

import { Card } from '@/components/ui/card';
import { cn, formatMan, formatWon } from '@/lib/utils';

export type Currency = '$' | '₩';

/**
 * 나라 설정에 맞는 통화 포맷터를 고른다. 원화 쪽은 utils의 표기를 그대로 쓰고,
 * 이 함수가 하는 일은 통화와 단위를 보고 어느 것을 쓸지 고르는 것뿐이다.
 * krwInMan=true면 만원 단위로 표기한다(큰 금액의 자릿수를 줄여 가독성↑).
 *
 * 달러 쪽만 여기 남아 있는 것은 utils의 formatUsd가 `$1.2K`처럼 접미사로 줄이는
 * 컴팩트 표기라, 자릿수를 그대로 보여야 하는 이 페이지에 맞지 않기 때문이다.
 * 음수 부호 "−"(U+2212)는 formatSigned가 세운 컨벤션을 따른다.
 */
export function makeMoneyFmt(currency: Currency, krwInMan = false) {
  if (currency === '$') {
    return (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
  }
  return krwInMan ? (n: number) => formatMan(n / 10000) : formatWon;
}

export type HiTone = 'strong' | 'bad' | 'good' | 'amber';

/** 설명 문장 안에서 수치·결론을 톤 색으로 강조하는 span. */
export const hi = (text: string, tone: HiTone) => (
  <span
    className={cn(
      'font-semibold',
      tone === 'strong' && 'text-foreground',
      tone === 'bad' && 'text-rose-600 dark:text-rose-400',
      tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
      tone === 'amber' && 'text-amber-600 dark:text-amber-400',
    )}
  >
    {text}
  </span>
);

export const fmtMultiple = (n: number) => `×${n.toFixed(n >= 100 ? 0 : 1)}`;
export const fmtHours = (n: number) => `${n.toFixed(1)}시간`;

/** 데이터 없음(범위 밖·키 미설정) 자리표시 카드. */
export function EmptyCard({ label, note }: { label: string; note: string }) {
  return (
    <Card className='gap-1 p-4'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='text-muted-foreground text-xl font-semibold'>-</span>
      <span className='text-muted-foreground text-xs'>{note}</span>
    </Card>
  );
}
