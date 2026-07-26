'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { Hybrid } from './hybrid';
import { Leverage } from './leverage';
import { TaxShield } from './tax-shield';
import { Waterfall } from './waterfall';

const TABS = [
  { value: 'leverage', label: '부채와 자본', node: <Leverage /> },
  { value: 'tax', label: '이자의 세금 방패', node: <TaxShield /> },
  { value: 'waterfall', label: '청산 순위', node: <Waterfall /> },
  { value: 'hybrid', label: '중간에 낀 증권', node: <Hybrid /> },
];

export function CapitalStructureView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '자본구조' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>회사에 들어간 돈은 누구 것인가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              법인 페이지에서 주주는 언제나 맨 뒤에 선다고 했다. 그 줄의 앞쪽에는 누가 서 있고, 어느 자리에 돈을
              넣느냐가 무엇을 바꾸는지 보자. 빌린 돈은 결과의 진폭을 키우고, 이자는 세금을 줄이며, 회사가 무너지면
              정해진 순서대로 손실이 배분된다. 채권과 주식 사이에 걸친 증권도 결국 이 순서에서 자기 자리를 고른 결과다.
            </p>
          </div>

          <IllustrativeDisclaimer>
            등장하는 자산·부채·영업이익과 세율은 구조를 보여주기 위한 예시다. 법인세는 이익이 날 때만 단일 세율로 매기는
            것으로 단순화했고, 결손금 이월공제나 이자 손금산입 한도는 넣지 않았다. 청산 순위도 자산을 한 덩어리로 놓고
            위에서부터 채우는 방식이라, 담보권을 절차 밖에서 행사하는 실제 파산·회생 절차와는 다르다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='leverage' />
        </div>
      </PageMain>
    </>
  );
}
