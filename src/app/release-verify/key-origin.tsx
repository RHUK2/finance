'use client';

import { useState } from 'react';

import { Repeat, Route } from 'lucide-react';

import { ExplainCard, MarkTable, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { CHANNEL_DETAIL, CHANNEL_HEADERS, CHANNEL_ROWS } from './models';

// 순환 논리 도식. 이 그림은 말로 하면 안 와닿고 그리면 한눈에 우스꽝스러워지는 종류라
// 그림값을 한다. 색은 currentColor와 테마 토큰만 써서 라이트·다크에서 같이 읽힌다.
function CircularLogic() {
  const boxes = [
    { x: 4, label: '배포 사이트' },
    { x: 184, label: '거기서 받은 공개키' },
    { x: 364, label: '검증 통과' },
  ];
  return (
    <svg viewBox='0 0 520 150' className='h-auto w-full text-foreground' role='img' aria-label='순환 논리 도식'>
      {boxes.map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={18} width={152} height={44} rx={6} className='fill-muted stroke-border' strokeWidth={1} />
          <text x={b.x + 76} y={45} textAnchor='middle' fontSize={12} fill='currentColor'>
            {b.label}
          </text>
        </g>
      ))}
      {[160, 340].map((x) => (
        <g key={x}>
          <line x1={x} y1={40} x2={x + 20} y2={40} stroke='currentColor' strokeWidth={1.5} />
          <path d={`M ${x + 24} 40 l -6 -4 v 8 z`} fill='currentColor' />
        </g>
      ))}
      <path
        d='M 440 62 C 440 118, 80 118, 80 62'
        fill='none'
        stroke='currentColor'
        strokeWidth={1.5}
        strokeDasharray='5 4'
      />
      <path d='M 80 58 l -4 6 h 8 z' fill='currentColor' />
      <text x={260} y={116} textAnchor='middle' fontSize={12} className='fill-rose-600 dark:fill-rose-400'>
        통과의 근거가 다시 이 사이트다
      </text>
      <text x={260} y={138} textAnchor='middle' fontSize={11} fill='currentColor' opacity={0.6}>
        서버를 쥔 쪽은 파일과 키를 함께 바꾸면 그만이다
      </text>
    </svg>
  );
}

export function KeyOrigin() {
  const [selected, setSelected] = useState('site');
  const detail = CHANNEL_DETAIL[selected];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='검증은 신뢰를 없애지 않는다. 옮길 뿐이다'>
        앞 탭이 남긴 질문은 하나다. 검증에 쓴 공개키를 나는 어디서 받았는가. 흔한 답은 파일을 받은 그 사이트다. 그러면
        사슬이 제자리로 돌아온다.
      </SectionIntro>

      <Card className='p-4'>
        <CircularLogic />
      </Card>

      <MarkTable
        title='공개키를 어디서 받는가'
        icon={<Route className='size-4 text-emerald-500' />}
        headers={CHANNEL_HEADERS}
        rows={CHANNEL_ROWS}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-2 p-4'>
        <span className='text-sm font-semibold'>{detail.title}</span>
        <p className='text-sm/relaxed text-muted-foreground'>{detail.body}</p>
      </Card>

      <StatusBanner icon={<Repeat className='size-4' />} tone='accent'>
        어느 채널도 혼자서는 충분하지 않다. 값하는 것은 동시에 장악하기 어려운 조합이다
      </StatusBanner>

      <ExplainCard
        icon={<Repeat className='size-4 text-amber-500' />}
        title='힘든 것은 첫 한 번뿐이다'
        preview='최초 신뢰를 세우고 나면 다음부터는 이미 믿는 것이 대신 검증해 준다'
        body={
          <>
            <p>
              공개키를 처음 받아들이는 판단을 최초 신뢰라 부른다. 사람이 여러 독립 채널을 대조해야 하는 것은 이 한
              번뿐이다. 여기서 잘못 믿으면 그 뒤의 모든 검증이 조용히 통과한다. 절차는 완벽하게 돌아가고 결과는 계속
              초록색인데 처음부터 남의 키를 믿고 있는 상태다.
            </p>
            <p className='mt-2'>
              대신 두 번째부터는 값이 싸진다. 이미 믿고 있는 것이 다음 것을 검증해 주기 때문이다. 이미 설치된 구버전이
              새 릴리스의 서명을 확인해 주고, 이미 깔린 펌웨어가 다음 펌웨어의 서명을 확인해 준다. 둘은 서로 다른 사례가
              아니라 같은 구조이고, 이것을 신뢰 이월이라 부른다.
            </p>
            <p className='mt-2'>
              그래서 사슬의 안전은 첫 칸을 넘지 못한다. 이월이 편리해질수록 첫 칸의 무게가 커지는데, 정작 그 첫 칸은
              대개 가장 무심하게 지나간다. 새 기기를 손에 쥔 날, 처음 설치하는 날이다.
            </p>
          </>
        }
      />
    </div>
  );
}
