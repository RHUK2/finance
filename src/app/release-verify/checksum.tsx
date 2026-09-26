'use client';

import { useEffect, useState } from 'react';

import { FileCheck2, TriangleAlert } from 'lucide-react';

import { ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { diffPositions, sha256Hex } from './models';

const ORIGINAL = '설치 파일 v1.0.0';

/** 16진수를 네 글자씩 끊어 보이면서, 기준값과 다른 자리만 칠한다. */
function HexView({ hex, diff }: { hex: string; diff?: boolean[] }) {
  return (
    <span className='font-mono text-2xs/relaxed break-all sm:text-xs' aria-label={hex}>
      {Array.from(hex, (ch, i) => (
        <span key={i} aria-hidden className={cn(diff?.[i] && 'text-bad', i % 4 === 0 && i > 0 && 'ml-1')}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function Checksum() {
  const [text, setText] = useState(ORIGINAL);
  const [base, setBase] = useState('');
  const [now, setNow] = useState('');

  useEffect(() => {
    void sha256Hex(ORIGINAL).then(setBase);
  }, []);
  useEffect(() => {
    void sha256Hex(text).then(setNow);
  }, [text]);

  const changed = text !== ORIGINAL;
  const diff = base && now ? diffPositions(now, base) : undefined;
  const diffCount = diff ? diff.filter(Boolean).length : 0;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='체크섬은 사고를 잡지 사람을 잡지 않는다'>
        체크섬은 파일 하나를 고정 길이 값으로 줄인 것이다. 아래 칸의 글자를 하나만 고쳐 보면 아래 값이 통째로 뒤집힌다.
        한 글자와 절반쯤 되는 자리가 함께 바뀌는 이 성질 덕분에, 전송 중에 비트 하나가 깨져도 값이 어긋나 곧바로
        드러난다.
      </SectionIntro>

      <Panel className='gap-3'>
        <span className='text-sm font-medium'>파일 대신 한 줄</span>
        <Input value={text} onChange={(e) => setText(e.target.value)} className='font-mono text-sm' />
        <div className='flex flex-col gap-1'>
          <span className='text-xs text-muted-foreground'>SHA-256</span>
          <HexView hex={now} diff={diff} />
        </div>
        {changed && (
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-muted-foreground'>원본 &#39;{ORIGINAL}&#39;의 SHA-256</span>
            <HexView hex={base} />
          </div>
        )}
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='바뀐 글자' value={changed ? '1자 이상' : '없음'} tone={changed ? 'accent' : undefined} />
        <Metric
          label='달라진 자리'
          value={`${diffCount} / 64`}
          tone={diffCount > 0 ? 'bad' : 'good'}
          sub='16진수 한 자리 단위'
        />
        <Metric
          label='체크섬 대조'
          value={changed ? '불일치' : '일치'}
          tone={changed ? 'bad' : 'good'}
          sub='원본 값과 비교'
        />
      </div>

      <StatusBanner icon={<TriangleAlert className='size-4' />} tone='accent'>
        그런데 여기서 대조한 원본 값은 어디서 받았나
      </StatusBanner>

      <ExplainCard
        icon={<FileCheck2 className='size-4 text-warn' />}
        title='공격자는 파일과 체크섬을 같이 바꾼다'
        preview='체크섬 목록은 대개 바이너리 바로 옆에 놓여 있다'
        body={
          <>
            <p>
              체크섬 목록은 거의 언제나 내려받는 파일 바로 옆에 놓인다. 배포 서버를 쥔 쪽은 파일을 바꾼 다음 그 파일의
              체크섬을 다시 계산해 목록도 함께 고쳐 두면 그만이다. 독자가 아무리 성실하게 대조해도 두 값은 완벽하게
              맞아떨어지고, 맞았다는 사실은 아무것도 말해 주지 않는다.
            </p>
            <p className='mt-2'>
              그러니까 체크섬이 실제로 보증하는 것은 좁다. 내려받는 동안 파일이 깨지지 않았다는 것, 디스크에서 썩지
              않았다는 것, 그리고 방금 받은 파일이 아까 그 파일과 같다는 것이다. 이것들은 의도가 없는 사고이고, 체크섬은
              사고를 거의 확실하게 잡는다. 의도를 가진 상대는 잡지 못한다. 잡으려면 공격자가 다시 계산해 낼 수 없는
              무언가가 값에 섞여 있어야 한다. 다음 탭이 그것이다.
            </p>
          </>
        }
      />
    </div>
  );
}
