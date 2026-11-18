'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { Agency } from './agency';
import { LegalPerson } from './legal-person';
import { LimitedLiability } from './limited-liability';
import { Shares } from './shares';

const TABS = [
  { value: 'person', label: '법인격', node: <LegalPerson /> },
  { value: 'agency', label: '기관', node: <Agency /> },
  { value: 'shares', label: '주식 발행·매입', node: <Shares /> },
  { value: 'liability', label: '유한책임', node: <LimitedLiability /> },
];

export function CorporationView() {
  return (
    <ExplainerPage
      title='법인은 어떻게 하나의 주체가 되는가'
      intro={
        <>
          법이 인정하는 인격은 자연인만이 아니다. 등기라는 절차로 인격을 부여받은 법인이 자기 이름으로 권리를 갖고
          의무를 진다. 다만 자연인과 달리 스스로 뜻을 표시할 수단이 없어 대표이사라는 기관을 통해서만 움직이고, 자기
          지분을 조각내 팔기도 하고 되사기도 하며, 망했을 때 책임은 그 인격의 재산에서 멈춘다. 네 갈래로 나눠 직접 만져
          보자. 등장하는 자본금·출자금·주식 수와 금액은 흐름을 보여주기 위한 예시다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='person' />
    </ExplainerPage>
  );
}
