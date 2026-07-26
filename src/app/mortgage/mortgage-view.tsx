'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { BuyOrRent } from './buy-or-rent';
import { Limit } from './limit';
import { RateStress } from './rate-stress';
import { Repayment } from './repayment';

const TABS = [
  { value: 'limit', label: 'LTV·DSR 한도', node: <Limit /> },
  { value: 'repayment', label: '상환 방식', node: <Repayment /> },
  { value: 'stress', label: '금리 스트레스', node: <RateStress /> },
  { value: 'compare', label: '사느냐 빌리느냐', node: <BuyOrRent /> },
];

export function MortgageView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '주택담보대출' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>집을 사는 돈은 어디서 오는가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              전세 구조 페이지가 세입자가 맡긴 목돈을 따라갔다면, 여기서는 그 집을 산 사람이 은행에서 빌린 돈을
              따라간다. 얼마나 빌릴 수 있는지는 집과 소득을 각각 재는 두 개의 자가 정하고, 같은 돈을 빌려도 갚는 방식에
              따라 이자가 달라지며, 금리가 움직이면 부담이 인상폭보다 크게 뛴다. 마지막에는 사는 것과 빌리는 것의 비용을
              나란히 놓는다.
            </p>
          </div>

          <IllustrativeDisclaimer>
            등장하는 집값·소득·금리와 규제 비율은 구조를 보여주기 위한 예시다. LTV 한도와 스트레스 가산폭은 정책에 따라
            자주 바뀌고, DSR도 기존 대출을 모두 합산하는데 여기서는 주택담보대출 하나만 놓고 계산했다. 매수와 임차를
            비교하는 탭의 세율·기회비용도 단순화한 값이라 실제 판단 기준과는 다르다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='limit' />
        </div>
      </PageMain>
    </>
  );
}
