'use client';

import Link from 'next/link';
import { CalendarCheck, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, Legend, SectionIntro } from '@/components/simulation';
import { cn } from '@/lib/utils';

const TIMELINE = [
  { date: '2018', label: 'Taproot(BIP340-342) 제안', tone: 'muted' as const },
  { date: '2021.05', label: 'Speedy Trial 시그널링 시작 (3개월 시한)', tone: 'accent' as const },
  { date: '2021.06', label: '지지율 90% 돌파 → LOCKED_IN', tone: 'good' as const },
  { date: '2021.11', label: '활성화(ACTIVE), 실제 네트워크 규칙이 됨', tone: 'good' as const },
];

export function Bip8Taproot() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='BIP8: 지지율이 부족해도 타임아웃이 되면 강제로 켠다'>
        BIP9는 임계값을 못 넘기면 그냥 실패한다. BIP8은 여기에 <b>LOT(Lock-in On Timeout)</b> 옵션을 더했다.
        타임아웃까지 임계값을 못 넘겨도, LOT=true로 설정된 소프트포크는 그 시점에 <b>강제로 LOCKED_IN</b>된다. 노드
        운영자들이 &#39;채굴자가 계속 미루면 우리가 규칙을 정한다&#39;고 미리 선언하는 셈이라, 이런 방식을{' '}
        <b>UASF(User-Activated Soft Fork)</b>라고 부른다.
      </SectionIntro>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <Users className='size-4 text-sky-600 dark:text-sky-400' />
          BIP9 vs BIP8: 지지율이 끝까지 부족하면?
        </span>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='rounded-md border p-3'>
            <p className='text-sm font-medium'>BIP9 (LOT 없음)</p>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              타임아웃까지 95%를 못 넘기면 그냥 <b>FAILED</b>. 채굴자 다수가 반대(혹은 무관심)하면 활성화 자체가
              무산된다.
            </p>
          </div>
          <div className={cn('rounded-md border p-3', 'border-emerald-500/40 bg-emerald-500/5')}>
            <p className='text-sm font-medium'>BIP8 (LOT=true)</p>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              타임아웃 시점에 강제로 <b>LOCKED_IN</b>. 이 규칙을 지키지 않는 채굴자의 블록은 노드가 거부하므로, 결국
              채굴자도 따라오게 된다. 힘의 축이 채굴자에서 노드(사용자)로 옮겨간다.
            </p>
          </div>
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <CalendarCheck className='size-4 text-amber-600 dark:text-amber-400' />
          실제 사례: Taproot 활성화 타임라인
        </span>
        <div className='flex flex-col gap-2'>
          {TIMELINE.map((t) => (
            <div key={t.date} className='flex items-center gap-3 text-sm'>
              <span className='text-muted-foreground w-20 shrink-0 tabular-nums'>{t.date}</span>
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  t.tone === 'good' && 'bg-emerald-500',
                  t.tone === 'accent' && 'bg-amber-500',
                  t.tone === 'muted' && 'bg-muted-foreground/40',
                )}
              />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
        <div className='flex flex-wrap gap-4 pt-1 text-xs'>
          <Legend className='bg-muted-foreground/40' label='제안 단계' />
          <Legend className='bg-amber-500' label='시그널링 중' />
          <Legend className='bg-emerald-500' label='확정·활성화' />
        </div>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          Taproot는 Speedy Trial이라는 3개월짜리 짧은 BIP9식 시그널링으로 시작했고, 지지율이 빠르게 90%를 넘기며 채굴자
          다수의 동의로 정상 활성화됐다. UASF의 &#39;강제 켜기&#39;가 실제로 발동되진 않았지만, 그 가능성 자체가
          채굴자들이 굳이 반대할 이유를 없앴다는 평가를 받는다.
        </p>
      </Card>

      <ExplainCard
        title='이 규칙을 실제로 검증하는 곳은 어디였나'
        preview='활성화된 Taproot 규칙이 스크립트·서명 검증에서 어떻게 쓰이는지 이어서 보자.'
        body={
          <>
            여기서 활성화된 Taproot 규칙(Schnorr 서명, 새 스크립트 경로)이 실제로 어떻게 검증되는지는{' '}
            <Link href='/script-verify' className='underline underline-offset-2'>
              스크립트·서명 검증
            </Link>{' '}
            페이지에서 다뤘다. 소프트포크는 &#39;규칙이 어떻게 바뀌는가&#39;를, 그 페이지는 &#39;바뀐 규칙이 실제로
            무엇을 검증하는가&#39;를 보여준다.
          </>
        }
      />
    </div>
  );
}
