'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 지표·거시 차트 카드의 공용 껍데기. 제목 + 갱신시각 / 헤드라인(현재값) / 차트 / 설명 문단의
// 4단 구조를 모든 차트가 공유하므로 여기 한 곳에서만 유지한다.
// 차트 인스턴스는 각 컴포넌트가 useChart로 직접 만들고, 그 결과 노드를 chart로 넘긴다.

// Tailwind는 런타임 값으로 임의 크기 클래스를 만들 수 없어 높이별 클래스를 표로 둔다.
// 키는 useChart에 넘기는 height와 같은 값을 쓸 것.
const SKELETON_HEIGHT = {
  240: 'h-[240px]',
  280: 'h-[280px]',
  320: 'h-[320px]',
} as const;

type Props = {
  title: string;
  updatedLabel?: string;
  /** 데이터 도착 여부. false면 헤드라인·차트 자리를 스켈레톤으로 채운다. */
  ready: boolean;
  /** 현재값·상태 배지 등. ready여도 계산이 불가하면 null을 넘길 수 있다. */
  headline?: React.ReactNode;
  headlineSkeletonClass?: string;
  height: keyof typeof SKELETON_HEIGHT;
  chart: React.ReactNode;
  description?: React.ReactNode;
};

export function IndicatorCard({
  title,
  updatedLabel,
  ready,
  headline,
  headlineSkeletonClass = 'h-9 w-20',
  height,
  chart,
  description,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
          {updatedLabel && <span className='text-muted-foreground text-xs'>{updatedLabel}</span>}
        </div>
        {ready ? headline : <Skeleton className={headlineSkeletonClass} />}
      </CardHeader>
      <CardContent className='p-0'>
        {ready ? chart : <Skeleton className={`w-full rounded-none ${SKELETON_HEIGHT[height]}`} />}
        {description ? (
          <p className='bg-muted/50 text-muted-foreground px-6 pt-3 pb-4 text-xs'>{description}</p>
        ) : (
          <div className='h-4' />
        )}
      </CardContent>
    </Card>
  );
}

export type IndicatorStatus = {
  label: string;
  variant: React.ComponentProps<typeof Badge>['variant'];
};

// 소수 2자리 현재값 + 상태 배지 헤드라인. MVRV·Mayer·Puell이 같은 모양을 쓴다.
export function ScoreHeadline({ value, status }: { value: number; status: IndicatorStatus }) {
  return (
    <div className='flex items-end gap-2'>
      <span className='text-3xl font-bold'>{value.toFixed(2)}</span>
      <Badge variant={status.variant} className='mb-1'>
        {status.label}
      </Badge>
    </div>
  );
}
