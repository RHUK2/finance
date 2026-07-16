'use client';

import { Card } from '@/components/ui/card';
import { cn, formatSigned } from '@/lib/utils';

export type Currency = '$' | '₩';

/**
 * 통화 포맷터 생성. 음수는 마이너스 부호 "−" 사용(money-creation 컨벤션).
 * krwInMan=true면 원화를 만원 단위로 표기(큰 금액의 자릿수를 줄여 가독성↑).
 */
export function makeMoneyFmt(currency: Currency, krwInMan = false) {
  if (currency === '$') {
    return (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
  }
  return krwInMan ? (n: number) => `${formatSigned(n / 10000)}만원` : (n: number) => `${formatSigned(n)}원`;
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
