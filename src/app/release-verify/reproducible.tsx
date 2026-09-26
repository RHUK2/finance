'use client';

import { useEffect, useState } from 'react';

import { Boxes, CheckCircle2, XCircle } from 'lucide-react';

import { ExplainCard, Field, SectionIntro, SegmentedControl, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { cn } from '@/lib/utils';

import { groupHex, sha256Hex } from './models';

type Case = 'clean' | 'ci' | 'source';

const OPTIONS: { value: Case; label: string }[] = [
  { value: 'clean', label: '정상' },
  { value: 'ci', label: '빌드 서버 오염' },
  { value: 'source', label: '소스에 들어감' },
];

const BUILDERS = ['배포자', '빌더 A', '빌더 B', '빌더 C'];

const NOTE: Record<Case, string> = {
  clean: '넷이 같은 소스에서 각자 빌드했고 결과가 바이트 단위로 같다.',
  ci: '배포자의 빌드 서버만 오염됐다. 소스는 깨끗하므로 나머지 셋은 원래 바이트를 얻는다.',
  source: '백도어가 소스 자체에 들어갔다. 넷 다 같은 소스를 빌드하므로 결과도 넷 다 같다.',
};

export function Reproducible() {
  const [c, setC] = useState<Case>('clean');
  const [base, setBase] = useState('');
  const [evil, setEvil] = useState('');

  useEffect(() => {
    void Promise.all([sha256Hex('소스 v1.0.0'), sha256Hex('소스 v1.0.0 + 백도어')]).then(([a, b]) => {
      setBase(a);
      setEvil(b);
    });
  }, []);

  const hashOf = (i: number) => {
    if (c === 'clean') return base;
    if (c === 'source') return evil;
    return i === 0 ? evil : base;
  };
  const caught = c === 'ci';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='개발자를 믿지 않고도 확인하는 방법'>
        앞 탭까지의 검증은 전부 배포자가 정직하다는 전제 위에 있다. 개인키를 쥔 쪽은 자기가 만든 어떤 파일에도 진짜
        서명을 붙일 수 있기 때문이다. 재현 가능한 빌드는 그 전제를 치운다. 같은 소스에서 누가 빌드해도 바이트 단위로
        같은 결과가 나온다면, 소스에 없는 것이 바이너리에 들어 있는지를 제3자가 잡아낼 수 있다.
      </SectionIntro>

      <Panel className='gap-3'>
        <Field label='어디가 오염됐는가'>
          <SegmentedControl options={OPTIONS} value={c} onChange={setC} />
        </Field>
        <p className='text-sm/relaxed text-muted-foreground'>{NOTE[c]}</p>

        <div className='flex flex-col gap-2'>
          {BUILDERS.map((name, i) => {
            const h = hashOf(i);
            const odd = h !== hashOf(1);
            return (
              <div key={name} className='flex items-center gap-2 text-sm'>
                <span className='w-14 shrink-0 text-xs'>{name}</span>
                <span
                  className={cn(
                    'flex-1 truncate rounded-md px-2 py-1 font-mono text-2xs',
                    odd ? 'bg-bad-surface/10 text-bad' : 'bg-muted',
                  )}
                >
                  {groupHex(h.slice(0, 24))}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <StatusBanner
        icon={caught ? <CheckCircle2 className='size-4' /> : <XCircle className='size-4' />}
        tone={c === 'clean' ? 'good' : caught ? 'good' : 'bad'}
      >
        {c === 'clean'
          ? '넷이 일치한다. 배포된 바이너리가 이 소스에서 나왔다'
          : caught
            ? '배포자의 결과만 어긋난다. 여기서 잡힌다'
            : '넷이 일치한다. 그래도 백도어는 들어 있다'}
      </StatusBanner>

      <ExplainCard
        icon={<Boxes className='size-4 text-warn' />}
        title='재현이 가능하다는 말과 남이 해 봤다는 말은 다르다'
        preview='지켜 주는 것은 후자다'
        body={
          <>
            <p>
              재현 가능한 빌드를 지원한다는 문장은 흔하다. 그런데 그것은 가능하다는 말이지 누가 실제로 해 봤다는 말이
              아니다. 아무도 해 보지 않았다면 위 화면의 빌더 A·B·C는 존재하지 않고, 남는 것은 배포자 한 줄뿐이라 앞
              탭에서 멈췄던 자리로 되돌아간다.
            </p>
            <p className='mt-2'>
              그래서 실제로 갈리는 축은 독립 재현 기록이다. 서로 다른 사람이 각자 빌드해 같은 바이트를 얻었다는 사실이
              서명과 함께 공개된 곳에 회차마다 쌓이는가. 그런 기록이 없으면 재현은 각자 해 보고 각자 확인하는 일로
              남는다.
            </p>
            <p className='mt-2'>
              세 번째 경우도 정직하게 보아야 한다. 백도어가 소스에 들어가면 재현 가능한 빌드는 통과한다. 그게 정확히
              재현 가능한 빌드가 보증하는 바이기 때문이다. 바이너리가 소스와 일치한다는 것이지, 소스가 정직하다는 것이
              아니다. 다음 탭이 이 사정거리를 표 하나로 정리한다.
            </p>
          </>
        }
      />
    </div>
  );
}
