'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { ExplainCard, SectionIntro, SimTabs } from '@/components/simulation';
import { Badge } from '@/components/ui/badge';
import { BTC_COLOR, cn } from '@/lib/utils';

import { GOVERNANCE_EVENTS, MARKET_EVENTS, type EventTag, type TimelineEvent } from './events';

const TAG_STYLE: Record<EventTag, string> = {
  논쟁: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
  분열: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
  업그레이드: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  사건: 'text-muted-foreground border-border',
  이정표: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
  채택: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  붕괴: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
  제도: 'text-sky-600 dark:text-sky-400 border-sky-500/30',
};

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className='border-border/60 relative flex flex-col gap-5 border-l-2 pl-6'>
      {events.map((e, i) => (
        <li key={i} className='relative'>
          <span
            className={cn(
              // 라인 중심(pl-6 + border 절반)에 dot 중심을 맞춤: left로 라인까지 이동 후 -translate-x-1/2로 dot 폭 절반 보정
              'ring-background absolute top-1 left-[calc(-1.5rem-1px)] size-3 -translate-x-1/2 rounded-full ring-4',
              e.ongoing ? 'animate-pulse' : 'bg-muted-foreground',
            )}
            style={e.ongoing ? { backgroundColor: BTC_COLOR } : undefined}
          />
          <div className='flex flex-col gap-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-semibold tabular-nums'>{e.year}</span>
              <Badge variant='outline' className={TAG_STYLE[e.tag]}>
                {e.tag}
              </Badge>
              {e.ongoing && (
                <Badge
                  variant='outline'
                  style={{
                    color: BTC_COLOR,
                    borderColor: `${BTC_COLOR}55`,
                    backgroundColor: `${BTC_COLOR}1a`,
                  }}
                >
                  진행 중
                </Badge>
              )}
            </div>
            <ExplainCard title={e.title} preview={e.summary} body={e.body} />
          </div>
        </li>
      ))}
    </ol>
  );
}

const TABS = [
  {
    value: 'governance',
    label: '거버넌스 전쟁',
    node: (
      <div className='flex flex-col gap-4'>
        <SectionIntro title='프로토콜은 어떻게 (안) 바뀌는가'>
          비트코인의 진짜 전장은 &#39;누가, 어떻게 프로토콜을 바꿀 수 있는가&#39;다. 사토시가 넣은 1MB 한도부터 지금
          진행 중인 OP_RETURN 상한 논쟁까지, 데이터 한 줄을 두고 커뮤니티가 쪼개지고 합의가 코드가 아니라 사람 위에
          있음을 확인해 온 사건들.
        </SectionIntro>
        <Timeline events={GOVERNANCE_EVENTS} />
      </div>
    ),
  },
  {
    value: 'market',
    label: '시장·채택',
    node: (
      <div className='flex flex-col gap-4'>
        <SectionIntro title='세상이 비트코인을 어떻게 받아들였는가'>
          백서 한 장에서 시작해 피자 두 판, 거품과 붕괴, 국가의 법정화폐 채택, 그리고 현물 ETF까지. 가격·문화·제도
          편입이 얽히며 변방의 실험이 제도권 자산으로 옮겨 온 흐름.
        </SectionIntro>
        <Timeline events={MARKET_EVENTS} />
      </div>
    ),
  },
];

export function BitcoinHistoryView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '비트코인 역사' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>비트코인 역사: 두 개의 타임라인</h1>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              같은 역사를 두 렌즈로 본다. 하나는 프로토콜이 어떻게 (안) 바뀌어 왔는가라는 거버넌스의 전장, 다른 하나는
              세상이 비트코인을 어떻게 받아들였는가라는 시장·채택의 서사. 각 항목을 눌러 자세히 볼 수 있다.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue='governance' />
        </div>
      </PageMain>
    </>
  );
}
