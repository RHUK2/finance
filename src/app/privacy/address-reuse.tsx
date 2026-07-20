'use client';

import { useState } from 'react';
import { Link2, ScanEye } from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  ExplainCard,
  IllustrativeDisclaimer,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { shortHex } from '@/lib/utils';
import { walletAddress } from '@/lib/privacy-concept';

const PAYMENTS = [
  { from: '커피숍', sats: '4,500' },
  { from: '월급', sats: '2,100,000' },
  { from: '중고거래', sats: '85,000' },
  { from: '기부', sats: '12,000' },
];

export function AddressReuse() {
  const [mode, setMode] = useState<'reuse' | 'fresh'>('reuse');

  const addresses = PAYMENTS.map((p, i) =>
    mode === 'reuse' ? walletAddress('민수-지갑') : walletAddress(`민수-지갑-${i}`),
  );
  const uniqueCount = new Set(addresses).size;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='주소를 재사용하면 무슨 일이 벌어질까'>
        비트코인 주소는 은행 계좌번호가 아니라 <b>영수증에 찍히는 청구서 번호</b>에 가깝다. 같은 주소로 계속 돈을
        받으면, 그 주소가 찍힌 모든 트랜잭션이 블록체인 위에서 &#39;같은 사람&#39;으로 누구나 알아볼 수 있게 묶인다.
        결제마다 새 주소를 쓰면 이 연결이 끊긴다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <SegmentedControl
          options={[
            { value: 'reuse', label: '같은 주소 재사용' },
            { value: 'fresh', label: '결제마다 새 주소' },
          ]}
          value={mode}
          onChange={setMode}
        />

        <div className='flex flex-col gap-2'>
          {PAYMENTS.map((p, i) => (
            <div key={p.from} className='flex items-center justify-between gap-3 rounded-md border p-3 text-sm'>
              <span className='w-20 shrink-0 text-sm font-medium'>{p.from}</span>
              <span className='text-muted-foreground flex-1 truncate font-mono text-xs'>
                {shortHex(addresses[i], 20)}
              </span>
              <span className='w-24 shrink-0 text-right tabular-nums'>{p.sats} sat</span>
            </div>
          ))}
        </div>

        <StatusBanner
          tone={mode === 'reuse' ? 'bad' : 'good'}
          icon={
            mode === 'reuse' ? (
              <Link2 className='size-4 shrink-0 text-rose-600 dark:text-rose-400' />
            ) : (
              <ScanEye className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
            )
          }
        >
          {mode === 'reuse'
            ? `주소가 ${uniqueCount}개뿐이다. 커피숍·월급·중고거래·기부가 전부 같은 사람 것이라는 게 누구에게나 드러난다.`
            : `주소가 ${uniqueCount}개, 전부 다르다. 이 4건이 같은 사람 것인지 겉보기로는 알 수 없다.`}
        </StatusBanner>
      </Card>

      <IllustrativeDisclaimer>
        주소 문자열은 개념 시연용 가짜 값이다. 실제 HD 지갑(지갑 키 생성 페이지에서 다룬 시드 파생 구조)은 결제마다 같은
        시드에서 새 주소를 자동으로 파생해, 사용자가 신경 쓰지 않아도 기본적으로 &#39;결제마다 새 주소&#39; 방식으로
        동작한다.
      </IllustrativeDisclaimer>

      <ExplainCard
        title='그런데 주소를 나눠도 완전히 안전하진 않다'
        preview='같은 트랜잭션 안에서 여러 주소를 함께 입력으로 쓰는 순간, 그 주소들이 한 지갑 것이라는 정보가 새어나간다.'
        body={
          <>
            주소를 아무리 나눠 써도, 그중 여러 개를 <b>한 트랜잭션의 입력으로 함께 쓰는 순간</b> 그 입력들이 전부 같은
            지갑 소유라는 정보가 공개된다(다음 탭에서 다룰 &#39;공통 입력 소유권&#39; 휴리스틱). 주소 재사용 방지는
            프라이버시의 시작일 뿐, 지출 패턴 자체가 만드는 흔적까지 지워주진 않는다.
          </>
        }
      />
    </div>
  );
}
