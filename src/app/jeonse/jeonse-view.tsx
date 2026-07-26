'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { DepositLoan } from './deposit-loan';
import { DepositPriority } from './deposit-priority';
import { GapInvestment } from './gap-investment';
import { ReverseJeonse } from './reverse-jeonse';

const TABS = [
  { value: 'loan', label: '보증금의 정체', node: <DepositLoan /> },
  { value: 'gap', label: '전세가율·갭투자', node: <GapInvestment /> },
  { value: 'reverse', label: '역전세·깡통전세', node: <ReverseJeonse /> },
  { value: 'priority', label: '보증금 회수 순위', node: <DepositPriority /> },
];

export function JeonseView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '전세 구조' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>전세는 어떤 거래인가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              전세는 집을 빌리는 계약인 동시에 임차인이 임대인에게 목돈을 무이자로 빌려주는 대출이다. 이 두 성격이 겹쳐
              있어서 금리가 움직이면 전세와 월세의 유불리가 뒤바뀌고, 보증금은 집을 사는 지렛대가 되며, 집값이 빠지면
              손실이 임차인에게로 흘러간다. 네 갈래로 나눠 직접 만져 보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            등장하는 보증금·매매가·낙찰가와 하락률은 구조를 보여주기 위한 예시다. 경매 배당은 순위가 어떻게 작동하는지
            드러내려고 근저당과 임차인 둘만 남겨 단순화했고, 소액임차인 최우선변제나 당해세처럼 실제 배당에서 앞서는
            항목은 넣지 않았다. 실제 사안의 판단 기준과는 다르다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='loan' />
        </div>
      </PageMain>
    </>
  );
}
