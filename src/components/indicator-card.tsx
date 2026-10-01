'use client';

import { ChevronDown, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 지표·거시 차트 카드의 공용 껍데기. 제목 + 갱신시각 / 헤드라인(현재값) / 차트 / 설명의
// 4단 구조를 모든 차트가 공유하므로 여기 한 곳에서만 유지한다.
// 차트 인스턴스는 각 컴포넌트가 useChart로 직접 만들고, 그 결과 노드를 chart로 넘긴다.
//
// 설명은 접어 둔다. 늘 펼쳐 두면 카드마다 서너 줄을 차지해, 차트가 열둘인 페이지에서는
// 설명이 화면의 절반을 먹고 차트끼리 멀어진다. 처음 한 번 읽으면 되는 글이라 기본은
// 접힘이고, 접힌 동안에도 카드 높이가 흔들리지 않게 트리거 줄이 자리를 지킨다.

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
  /**
   * 첫 데이터가 없는 채로 요청이 실패했다. ready가 false일 때만 본다. 스켈레톤을 두면 끝나지 않는
   * 로딩으로 읽혀 장애인지 느린 것인지 가를 수 없다. 이전 데이터가 있으면(재조회 실패) 호출부가
   * 넘기지 않는다. 옛 값을 그대로 보이는 쪽이 낫다.
   */
  error?: boolean;
  /** 현재값·상태 배지 등. ready여도 계산이 불가하면 null을 넘길 수 있다. */
  headline?: React.ReactNode;
  /** 제목 줄 오른쪽 컨트롤(기간 탭 등). 갱신시각 자리를 대신 쓴다. */
  action?: React.ReactNode;
  headlineSkeletonClass?: string;
  height: keyof typeof SKELETON_HEIGHT;
  chart: React.ReactNode;
  description?: React.ReactNode;
};

export function IndicatorCard({
  title,
  updatedLabel,
  ready,
  error,
  headline,
  action,
  headlineSkeletonClass = 'h-9 w-20',
  height,
  chart,
  description,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          {/* 대시보드에는 h1이 없어 카드 제목이 페이지의 제목 단계다. CardTitle은 div라
              제목 의미가 없으므로 안에 h2를 둔다(preflight가 크기·굵기를 inherit로 되돌려 모양은 같다) */}
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          {action ??
            (updatedLabel && (
              // 상대시간은 서버 렌더와 하이드레이션 사이에 분이 넘어가면 텍스트가 어긋난다.
              <span className='text-xs text-muted-foreground' suppressHydrationWarning>
                {updatedLabel}
              </span>
            ))}
        </div>
        {ready ? headline : error ? null : <Skeleton className={headlineSkeletonClass} />}
      </CardHeader>
      <CardContent bleed>
        {ready ? (
          chart
        ) : error ? (
          <div
            role='status'
            className={`flex w-full items-center justify-center border-y px-6 text-center text-xs text-muted-foreground ${SKELETON_HEIGHT[height]}`}
          >
            데이터를 받지 못했습니다. 잠시 뒤 다시 시도합니다.
          </div>
        ) : (
          <Skeleton className={`w-full rounded-none ${SKELETON_HEIGHT[height]}`} />
        )}
        {description ? (
          <Collapsible>
            <CollapsibleTrigger
              aria-label={`${title} 설명`}
              className='group/desc flex items-center gap-1 px-6 pt-3 pb-4 text-xs text-muted-foreground hover:text-foreground'
            >
              <Info className='size-3' />
              설명
              <ChevronDown className='size-3 transition-transform group-data-panel-open/desc:rotate-180' />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className='bg-muted/50 px-6 pt-3 pb-4 text-xs text-muted-foreground'>{description}</p>
            </CollapsibleContent>
          </Collapsible>
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
