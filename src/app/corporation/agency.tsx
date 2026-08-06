'use client';

import { useState } from 'react';

import { ArrowDown, Briefcase, Handshake, PenLine, Scale, TriangleAlert, Users } from 'lucide-react';

import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 거래 규모(회사 자산 대비 비중)에 따라 어느 기관까지 올라가야 하는지가 달라진다.
// 상법상 이사회 결의 사항(중요한 자산의 처분·대규모 차재)과 주주총회 특별결의 사항(영업양도)을
// 자산 대비 비중이라는 하나의 축으로 단순화한 교육용 기준이다.
const BOARD_THRESHOLD = 1;
const MEETING_THRESHOLD = 10;

type Organ = {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
};

const ORGANS: Organ[] = [
  {
    id: 'meeting',
    name: '주주총회',
    role: '소유자들의 회의',
    icon: Users,
    note: '회사의 뼈대를 바꾸는 결정만 다룬다. 정관 변경, 이사 선임·해임, 합병, 영업 양도. 이 가운데 정관 변경·합병·영업양도 같은 사항은 특별결의라서 출석 의결권의 2/3, 발행주식 총수의 1/3 이상이 찬성해야 하고, 이사 선임 같은 사항은 보통결의로 족하다.',
  },
  {
    id: 'board',
    name: '이사회',
    role: '경영 의사결정과 감독',
    icon: Briefcase,
    note: '업무집행을 결정하고 대표이사를 뽑고 감시한다. 중요한 자산의 처분, 대규모 차재, 지점 설치 같은 사항은 여기서 결의해야 한다.',
  },
  {
    id: 'ceo',
    name: '대표이사',
    role: '대외적 의사표시',
    icon: PenLine,
    note: '회사를 대표해 바깥과 거래한다. 법인격은 스스로 의사를 표시할 수 없으므로 계약서에 실제로 서명하는 것은 언제나 대표이사다. 다만 자연인 개인 자격이 아니라 회사의 기관 자격으로 서명한다.',
  },
  {
    id: 'counterparty',
    name: '거래 상대방',
    role: '계약의 반대편',
    icon: Handshake,
    note: '협상 테이블에 앉은 것은 대표이사지만, 계약의 당사자가 된 것은 회사다. 대표가 바뀌어도 계약은 그대로 이어진다.',
  },
];

export function Agency() {
  const [dealPct, setDealPct] = useState(0.4);
  const [counterpartyKnew, setCounterpartyKnew] = useState(false);

  const needsMeeting = dealPct >= MEETING_THRESHOLD;
  const needsBoard = dealPct >= BOARD_THRESHOLD;

  // ORGANS는 위에서 아래로 내려오는 결재 사슬이라, 어느 층에서 시작하는지만 정하면 나머지는 전부 거친다.
  const start = needsMeeting ? 0 : needsBoard ? 1 : 2;

  const procedure = needsMeeting ? '주주총회 특별결의' : needsBoard ? '이사회 결의' : '대표이사 전결';

  // 이사회 결의 흠결과 주주총회 특별결의 흠결은 결론이 다르다. 전자는 상대방의 선의·무중과실을
  // 보호하지만(대법원 2015다45451 전합), 영업양도처럼 특별결의가 필요한 사항은 결의가 없으면
  // 상대방이 선의라도 무효라는 것이 확립된 판례다.
  const skipOutcome = !needsBoard
    ? {
        tone: 'good' as const,
        text: '이 규모는 대표이사가 혼자 결정할 수 있는 일상적 업무 범위다. 별도의 결의 없이 서명해도 계약은 그대로 유효하다.',
      }
    : needsMeeting
      ? {
          tone: 'bad' as const,
          text: '이 규모는 회사의 뼈대를 바꾸는 일이라 결론이 다르다. 주주총회 특별결의를 거치지 않은 영업양도는 상대방이 몰랐더라도 무효다. 소유자의 뜻 자체가 없었던 것이므로 상대방의 선의로 메울 수 없고, 아래 선택은 이 구간에서는 결과를 바꾸지 못한다.',
        }
      : counterpartyKnew
        ? {
            tone: 'bad' as const,
            text: `상대방이 ${procedure}가 없었다는 걸 알았거나, 모른 데 중대한 과실이 있었다면 그 상대방에 대해서는 계약의 효력이 회사에 미치지 않는다. 계약 자체가 세상에서 사라지는 것이 아니라, 그 상대방이 회사를 붙잡을 수 없게 되는 것이다.`,
          }
        : {
            tone: 'accent' as const,
            text: `${procedure}를 빠뜨렸더라도 상대방이 그 사실을 몰랐고 모른 데 중대한 과실까지는 없었다면 계약은 유효하고, 효과는 회사에 귀속된다. 가벼운 과실이 있었더라도 상대방은 보호된다. 회사는 절차를 건너뛴 대표에게 손해배상을 물을 수 있을 뿐이다.`,
          };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='법인격은 기관을 통해서만 움직인다'>
        법인은 계약의 당사자가 될 수 있지만 스스로 의사를 표시할 수는 없다. 그래서 법은 회사의 의사를 정하는 기관과 그
        의사를 바깥에 실행하는 기관을 나눠 놓았다. 주주총회가 소유자의 뜻을, 이사회가 경영 판단을, 대표이사가 대외적
        실행을 맡는다. 거래 규모를 움직여 보면 같은 계약이라도 어느 층까지 올라가야 하는지가 달라진다.
      </SectionIntro>

      <Card className='p-4'>
        <ControlSlider
          icon={<Scale className='size-4 text-sky-500' />}
          label='거래 규모 (회사 총자산 대비)'
          value={dealPct}
          onChange={setDealPct}
          min={0.1}
          max={60}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
          hint='사무용품을 사는 일과 공장을 통째로 넘기는 일에 같은 절차를 요구할 수는 없다. 규모가 커질수록 결정 권한은 대표 개인에게서 이사회로, 다시 소유자인 주주에게로 올라간다.'
        />
      </Card>

      <div>
        {ORGANS.map((organ, i) => (
          <div key={organ.id}>
            <OrganNode organ={organ} active={i >= start} />
            {i < ORGANS.length - 1 && (
              <div className='flex justify-center py-1'>
                <ArrowDown className={cn('size-4', i >= start ? 'text-sky-500' : 'text-muted-foreground/40')} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Metric label='필요한 절차' value={procedure} tone='accent' />
        <Metric label='계약 효과가 귀속되는 곳' value='회사' sub='대표이사 개인이 아니다' />
        <Metric label='대표 개인 재산' value='무관' sub='회사에 대한 손해배상책임은 별개' tone='good' />
      </div>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <TriangleAlert className='size-4 text-amber-500' />
          대표가 절차를 건너뛰고 서명했다면
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>
          {needsMeeting
            ? '이사회 결의를 빠뜨린 경우라면 상대방이 그 흠을 알았는지에 따라 계약의 운명이 갈린다. 하지만 주주총회 특별결의가 필요한 규모에서는 그 구분이 통하지 않는다.'
            : '안쪽 절차의 흠은 회사 내부 문제다. 바깥의 상대방이 그 흠을 알았는지에 따라 계약의 운명이 갈린다.'}
        </p>
        <SegmentedControl
          options={[
            { value: false, label: '상대방이 몰랐다' },
            { value: true, label: '상대방이 알고 있었다' },
          ]}
          value={counterpartyKnew}
          onChange={setCounterpartyKnew}
        />
        <StatusBanner tone={skipOutcome.tone}>{skipOutcome.text}</StatusBanner>
      </Card>

      <ExplainCard
        icon={<Users className='size-4 text-sky-500' />}
        title='소유와 경영이 갈라지면 생기는 문제'
        preview='주주는 돈을 대고, 경영자는 그 돈을 쓴다. 둘의 이해는 완전히 겹치지 않는다.'
        body={
          <>
            <p>
              대표이사는 회사의 대리인이지 주인이 아니다. 회사 돈으로 위험을 감수하지만 손실의 대부분은 주주가 진다.
              그러니 필요 이상으로 회사를 키우거나, 자기 임기 안에 성과가 나는 쪽으로 자원을 몰거나, 회사에 이익이 될
              위험조차 피하는 선택이 나올 수 있다. 경제학에서 대리인 문제라고 부르는 상황이다.
            </p>
            <p className='mt-2'>
              그래서 회사법은 대리인을 붙잡아 둘 장치를 여럿 둔다. 이사회의 감시, 주주총회의 선임·해임권, 이사의 충실
              의무와 손해배상책임, 회사가 소를 게을리할 때 주주가 대신 나서는 대표소송. 주식보상으로 경영자의 손익을
              주주와 같은 방향으로 묶어 두는 것도 같은 목적의 처방이다.
            </p>
          </>
        }
      />
    </div>
  );
}

function OrganNode({ organ, active }: { organ: Organ; active: boolean }) {
  return (
    <Card
      className={cn(
        'gap-1 p-4 transition-colors',
        active ? 'border-sky-500/50 bg-sky-500/5' : 'border-dashed opacity-60',
      )}
    >
      <div className='flex items-center gap-2'>
        <organ.icon className={cn('size-4 shrink-0', active ? 'text-sky-500' : 'text-muted-foreground')} />
        <span className='font-semibold'>{organ.name}</span>
        <span className='text-muted-foreground text-xs'>{organ.role}</span>
        <span
          className={cn(
            'ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs',
            active ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-muted text-muted-foreground',
          )}
        >
          {active ? '거쳐야 함' : '불필요'}
        </span>
      </div>
      <p className='text-muted-foreground text-xs/relaxed'>{organ.note}</p>
    </Card>
  );
}
