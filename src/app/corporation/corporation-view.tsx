'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { Agency } from './agency';
import { LegalPerson } from './legal-person';
import { LimitedLiability } from './limited-liability';
import { Shares } from './shares';

const TABS = [
  { value: 'person', label: '법인격', node: <LegalPerson /> },
  { value: 'agency', label: '대리인·기관', node: <Agency /> },
  { value: 'shares', label: '주식 발행·매입', node: <Shares /> },
  { value: 'liability', label: '유한책임', node: <LimitedLiability /> },
];

export function CorporationView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '법인' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>법인은 어떻게 하나의 주체가 되는가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              법인은 사람에 빗댄 표현이 아니라 실제로 권리와 의무를 가지는 법적 주체다. 회사 이름으로 땅을 사고 계약을
              맺지만, 몸이 없어 대표이사라는 대리인을 통해서만 움직인다. 자기 지분을 조각내 팔기도 하고 되사기도 하며,
              망했을 때 손실은 그 인격의 재산에서 멈춘다. 네 갈래로 나눠 직접 만져 보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            등장하는 자본금·출자금·주식 수와 금액은 흐름을 보여주기 위한 예시다. 거래 규모에 따라 이사회 결의나 주주총회
            특별결의가 필요해지는 기준도 상법의 여러 요건을 자산 대비 비중이라는 하나의 축으로 단순화한 것이라, 실제
            사안의 판단 기준과는 다르다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='person' />
        </div>
      </PageMain>
    </>
  );
}
