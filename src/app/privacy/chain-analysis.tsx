'use client';

import { useState } from 'react';
import { CircleCheck, CircleX, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, SectionIntro, StatusBanner } from '@/components/simulation';
import { cn, shortHex } from '@/lib/utils';
import { walletAddress } from '@/lib/privacy-concept';

const INPUT_A = walletAddress('철수-지갑-utxo1');
const INPUT_B = walletAddress('철수-지갑-utxo2');
const OUTPUT_CHANGE = walletAddress('철수-지갑-잔돈');
const OUTPUT_PAYMENT = walletAddress('상점-taproot-주소');

const OUTPUTS = [
  { id: 'left', address: OUTPUT_CHANGE, sats: 48_800, type: 'Native SegWit (bc1q...)', isChange: true },
  { id: 'right', address: OUTPUT_PAYMENT, sats: 400_000, type: 'Taproot (bc1p...)', isChange: false },
] as const;

export function ChainAnalysis() {
  const [guess, setGuess] = useState<'left' | 'right' | null>(null);
  const guessedOutput = OUTPUTS.find((o) => o.id === guess);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='체인분석 휴리스틱: 잔돈 출력을 알아맞히는 법'>
        블록체인에는 &#39;이건 결제, 이건 잔돈&#39; 같은 이름표가 없다. 하지만 지갑 소프트웨어가 남기는 습관적인 흔적들
        덕분에, 분석가는 상당히 높은 확률로 어느 쪽이 잔돈인지 추측한다. 아래 트랜잭션에서 직접 맞혀보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div>
          <span className='text-muted-foreground text-xs'>입력 (모두 같은 지갑이 서명해야 쓸 수 있다)</span>
          <div className='mt-1 flex flex-col gap-1.5'>
            {[INPUT_A, INPUT_B].map((addr, i) => (
              <div key={addr} className='flex items-center justify-between rounded-md border p-2 text-xs'>
                <span className='font-mono'>{shortHex(addr, 20)}</span>
                <span className='text-muted-foreground'>{i === 0 ? '150,000 sat' : '300,000 sat'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2 rounded-md border p-3 text-sm'>
          <Users className='size-4 shrink-0 text-amber-600 dark:text-amber-400' />
          <span>
            <b>공통 입력 소유권 휴리스틱</b>: 두 입력을 한 트랜잭션에 함께 썼다는 건, 둘 다 같은 지갑의 개인키로
            서명했다는 뜻이다. 두 주소가 같은 사람 것이라는 사실이 이 순간 공개된다.
          </span>
        </div>

        <div>
          <span className='text-muted-foreground text-xs'>출력. 어느 쪽이 &#39;잔돈&#39;일까? 클릭해서 맞혀보자.</span>
          <div className='mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {OUTPUTS.map((o) => {
              const isSelected = guess === o.id;
              const revealed = guess !== null;
              const showCorrect = revealed && o.isChange;
              const showWrong = revealed && isSelected && !o.isChange;
              return (
                <button
                  key={o.id}
                  onClick={() => setGuess(o.id)}
                  disabled={revealed}
                  className={cn(
                    'flex flex-col gap-1 rounded-md border p-3 text-left text-sm transition-colors',
                    !revealed && 'hover:bg-muted cursor-pointer',
                    showCorrect && 'border-emerald-500/40 bg-emerald-500/5',
                    showWrong && 'border-rose-500/40 bg-rose-500/5',
                  )}
                >
                  <span className='flex items-center justify-between'>
                    <span className='font-mono text-xs'>{shortHex(o.address, 18)}</span>
                    {showCorrect && <CircleCheck className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />}
                    {showWrong && <CircleX className='size-4 shrink-0 text-rose-600 dark:text-rose-400' />}
                  </span>
                  <span className='tabular-nums'>{o.sats.toLocaleString('ko-KR')} sat</span>
                  <span className='text-muted-foreground text-xs'>{o.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {guessedOutput && (
          <StatusBanner tone={guessedOutput.isChange ? 'good' : 'bad'}>
            <span className='leading-relaxed font-normal'>
              {guessedOutput.isChange ? '맞다.' : '아쉽지만 틀렸다.'} 왼쪽(48,800 sat, Native SegWit)이 잔돈이다. 두
              가지 단서가 겹친다. (1) 입력과 <b>같은 주소 타입</b>이다. 지갑 소프트웨어는 보통 잔돈을 자기 지갑의 기본
              타입으로 만든다. (2) 금액이 <b>어중간한 leftover 값</b>이다. 반면 400,000 sat처럼 딱 떨어지는 금액은
              사람이 의도한 결제일 가능성이 높다.
            </span>
          </StatusBanner>
        )}
      </Card>

      <ExplainCard
        title='이 휴리스틱들이 100% 정확하지는 않다'
        preview='지갑이 일부러 잔돈을 다른 주소 타입으로 만들거나, 결제 금액을 일부러 어중간하게 잡으면 추측이 틀린다.'
        body={
          <>
            &#39;공통 입력 소유권&#39;과 &#39;잔돈 출력 추정&#39;은 확률적 추정일 뿐 증명이 아니다. 지갑이 일부러 잔돈
            타입을 결제 타입과 맞추거나(&#39;동일 타입 잔돈 회피&#39;), 결제 금액을 일부러 어중간하게 만들면 분석가의
            추측이 빗나간다. 하지만 대부분의 지갑이 기본 설정 그대로 쓰이기 때문에, 실제로는 이 휴리스틱만 으로도
            체인분석 업체들이 상당히 정확하게 지갑을 추적한다.
          </>
        }
      />
    </div>
  );
}
