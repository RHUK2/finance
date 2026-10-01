'use client';

import { useState } from 'react';
import { CircleCheck, CircleX, Users } from 'lucide-react';

import { Panel } from '@/components/panel';
import { Button } from '@/components/ui/button';
import { ExplainCard, SectionIntro, StatusBanner } from '@/components/simulation';
import { cn, shortHex } from '@/lib/utils';
import { walletAddress } from '@/lib/privacy-concept';

const INPUT_A = walletAddress('철수-지갑-utxo1');
const INPUT_B = walletAddress('철수-지갑-utxo2');
const OUTPUT_CHANGE = walletAddress('철수-지갑-잔돈');
// 결제 출력은 상점의 Taproot 주소다. 화면 라벨(bc1p...)과 맞도록 purpose 86'으로 만든다.
const OUTPUT_PAYMENT = walletAddress('상점-taproot-주소', '86');

const OUTPUTS = [
  {
    id: 'change',
    address: OUTPUT_CHANGE,
    sats: 48_800,
    type: 'Native SegWit (bc1q...)',
    typeName: 'Native SegWit',
    isChange: true,
  },
  {
    id: 'payment',
    address: OUTPUT_PAYMENT,
    sats: 400_000,
    type: 'Taproot (bc1p...)',
    typeName: 'Taproot',
    isChange: false,
  },
] as const;

// 정답 배너가 부르는 출력. 배치(좌우·위아래)는 화면 폭에 따라 바뀌므로 문구는 순서와 금액으로 가리킨다.
const CHANGE_INDEX = OUTPUTS.findIndex((o) => o.isChange);
const CHANGE_OUTPUT = OUTPUTS[CHANGE_INDEX];
const PAYMENT_OUTPUT = OUTPUTS.find((o) => !o.isChange)!;
const ORDINAL = ['첫 번째', '두 번째'];

export function ChainAnalysis() {
  const [guess, setGuess] = useState<(typeof OUTPUTS)[number]['id'] | null>(null);
  const guessedOutput = OUTPUTS.find((o) => o.id === guess);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='체인분석 휴리스틱: 잔돈 출력을 알아맞히는 법'>
        블록체인에는 &#39;이건 결제, 이건 잔돈&#39; 같은 이름표가 없다. 하지만 지갑 소프트웨어가 남기는 습관적인 흔적들
        덕분에, 분석가는 상당히 높은 확률로 어느 쪽이 잔돈인지 추측한다. 아래 트랜잭션에서 직접 맞혀보자.
      </SectionIntro>

      <Panel>
        <div>
          <span className='text-xs text-muted-foreground'>입력 (모두 같은 지갑이 서명해야 쓸 수 있다)</span>
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
          <Users className='size-4 shrink-0 text-series-1' />
          <span>
            <b>공통 입력 소유권 휴리스틱</b>: 두 입력을 한 트랜잭션에 함께 썼다는 건, 둘 다 같은 지갑의 개인키로
            서명했다는 뜻이다. 두 주소가 같은 사람 것이라는 사실이 이 순간 공개된다.
          </span>
        </div>

        <div>
          <span className='text-xs text-muted-foreground'>출력. 어느 쪽이 &#39;잔돈&#39;일까? 클릭해서 맞혀보자.</span>
          <div className='mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {OUTPUTS.map((o) => {
              const isSelected = guess === o.id;
              const revealed = guess !== null;
              const showCorrect = revealed && o.isChange;
              const showWrong = revealed && isSelected && !o.isChange;
              return (
                // 공개 뒤에도 정답·오답 표시를 또렷이 보여야 해서 disabled(흐려짐) 대신 클릭 처리에서 막는다.
                <Button
                  key={o.id}
                  variant='choice'
                  size='card'
                  onClick={() => {
                    if (!revealed) setGuess(o.id);
                  }}
                  aria-pressed={isSelected}
                  aria-disabled={revealed || undefined}
                  className={cn(
                    'flex-col items-stretch',
                    revealed && 'cursor-default hover:bg-transparent',
                    showCorrect && 'border-good-surface/40 bg-good-surface/5 aria-pressed:bg-good-surface/5',
                    showWrong && 'border-bad-surface/40 bg-bad-surface/5 aria-pressed:bg-bad-surface/5',
                  )}
                >
                  <span className='flex items-center justify-between'>
                    <span className='font-mono text-xs'>{shortHex(o.address, 18)}</span>
                    {showCorrect && <CircleCheck className='size-4 shrink-0 text-good' />}
                    {showWrong && <CircleX className='size-4 shrink-0 text-bad' />}
                  </span>
                  <span className='tabular-nums'>{o.sats.toLocaleString('ko-KR')} sat</span>
                  <span className='text-xs text-muted-foreground'>{o.type}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {guessedOutput && (
          <StatusBanner tone={guessedOutput.isChange ? 'good' : 'bad'}>
            <span className='leading-relaxed font-normal'>
              {guessedOutput.isChange ? '맞다.' : '아쉽지만 틀렸다.'} {ORDINAL[CHANGE_INDEX]} 출력(
              {CHANGE_OUTPUT.sats.toLocaleString('ko-KR')} sat, {CHANGE_OUTPUT.typeName})이 잔돈이다. 두 가지 단서가
              겹친다. (1) 입력과 <b>같은 주소 타입</b>이다. 지갑 소프트웨어는 보통 잔돈을 자기 지갑의 기본 타입으로
              만든다. (2) 금액이 <b>어중간한 leftover 값</b>이다. 반면 {PAYMENT_OUTPUT.sats.toLocaleString('ko-KR')}{' '}
              sat처럼 딱 떨어지는 금액은 사람이 의도한 결제일 가능성이 높다.
            </span>
          </StatusBanner>
        )}
      </Panel>

      <ExplainCard
        title='이 휴리스틱들이 100% 정확하지는 않다'
        preview='지갑이 일부러 잔돈을 다른 주소 타입으로 만들거나, 결제 금액을 일부러 어중간하게 잡으면 추측이 틀린다.'
        body={
          <>
            &#39;공통 입력 소유권&#39;과 &#39;잔돈 출력 추정&#39;은 확률적 추정일 뿐 증명이 아니다. 지갑이 일부러 잔돈
            타입을 결제 타입과 맞추거나(&#39;동일 타입 잔돈 회피&#39;), 결제 금액을 일부러 어중간하게 만들면 분석가의
            추측이 빗나간다. 하지만 대부분의 지갑이 기본 설정 그대로 쓰이기 때문에, 실제로는 이 휴리스틱만으로도
            체인분석 업체들이 상당히 정확하게 지갑을 추적한다.
          </>
        }
      />
    </div>
  );
}
