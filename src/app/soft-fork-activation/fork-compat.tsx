'use client';

import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, Field, SectionIntro, SegmentedControl, StatusBanner } from '@/components/simulation';
import { cn } from '@/lib/utils';

type ForkKind = 'soft' | 'hard';

const EXAMPLES: Record<
  ForkKind,
  {
    label: string;
    rule: string;
    oldSeesNew: boolean;
    newSeesOld: boolean;
    verdict: string;
  }
> = {
  soft: {
    label: '소프트포크 예시: Taproot (새 서명 검증 규칙 추가)',
    rule: '기존에는 "아무 조건이나 통과"로 보이던 스크립트에 새로운 서명 검증 조건을 추가한다. 규칙을 더 좁히는 변경이다.',
    oldSeesNew: true,
    newSeesOld: true,
    verdict:
      '구버전 노드는 새 규칙을 모르지만, 새 규칙을 지킨 블록은 구버전이 알던 (더 느슨한) 규칙도 자동으로 만족한다. 그래서 구버전 노드도 계속 새 블록을 유효하다고 받아들인다. 업그레이드하지 않아도 체인이 갈라지지 않는다.',
  },
  hard: {
    label: '하드포크 예시: 블록 크기 상한 증가',
    rule: '기존 1MvB 상한을 2MvB로 늘린다. 규칙을 더 넓히는(느슨하게 하는) 변경이다.',
    oldSeesNew: false,
    newSeesOld: true,
    verdict:
      '구버전 노드는 2MvB 블록을 "상한 초과"로 보고 거부한다. 신버전을 따르는 채굴자·노드와 구버전에 남은 노드가 서로 다른 블록을 유효하다고 판단하게 되어, 모두가 업그레이드하지 않으면 체인이 두 갈래로 완전히 갈라진다(체인 스플릿).',
  },
};

export function ForkCompat() {
  const [kind, setKind] = useState<ForkKind>('soft');
  const ex = EXAMPLES[kind];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='소프트포크 vs 하드포크: 무엇이 구버전 노드를 계속 따라오게 만들까'>
        규칙을 <b>더 좁히면(소프트포크)</b> 새 규칙을 지킨 블록은 구버전이 알던 느슨한 규칙도 자동으로 만족해서,
        업그레이드하지 않은 노드도 계속 같은 체인을 따라간다. 반대로 규칙을 <b>더 넓히면(하드포크)</b> 구버전 노드가 새
        블록을 아예 거부해버려서, 전원이 업그레이드하지 않으면 체인이 갈라진다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <Field label='예시 선택'>
          <SegmentedControl
            options={[
              { value: 'soft', label: '소프트포크' },
              { value: 'hard', label: '하드포크' },
            ]}
            value={kind}
            onChange={setKind}
          />
        </Field>

        <div className='rounded-md border p-3'>
          <p className='text-sm font-medium'>{ex.label}</p>
          <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>{ex.rule}</p>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <CompatCell label='구버전 노드가 새 규칙 블록을 유효하다고 봄' ok={ex.oldSeesNew} />
          <CompatCell label='신버전 노드가 구규칙 블록을 유효하다고 봄' ok={ex.newSeesOld} />
        </div>

        <StatusBanner tone={ex.oldSeesNew ? 'good' : 'bad'}>
          <span className='leading-relaxed font-normal'>{ex.verdict}</span>
        </StatusBanner>
      </Card>

      <ExplainCard
        title="왜 '규칙을 좁힌다'는 게 핵심 기준일까"
        preview='소프트포크는 새 규칙이 옛 규칙의 부분집합이 되도록 설계된 변경이다.'
        body={
          <>
            소프트포크는 아무 규칙 변경이나 되는 게 아니라, <b>새 규칙을 통과하는 블록은 반드시 옛 규칙도 통과한다</b>는
            부분집합 관계를 지키도록 설계된 변경만 해당한다. 이 조건 덕분에 구버전 노드는 새 규칙 자체를 검증하지
            못해도(그 부분은 그냥 모르고 지나간다) 결과적으로 항상 옳은 체인을 따라가게 된다. Taproot, SegWit, P2SH 모두
            이 원리로 설계된 소프트포크였다.
          </>
        }
      />
    </div>
  );
}

function CompatCell({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-md border p-4 text-center',
        ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5',
      )}
    >
      {ok ? (
        <CircleCheck className='size-6 text-emerald-600 dark:text-emerald-400' />
      ) : (
        <CircleX className='size-6 text-rose-600 dark:text-rose-400' />
      )}
      <span className='text-xs leading-snug'>{label}</span>
    </div>
  );
}
