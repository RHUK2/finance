'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { BondAnatomy } from './bond-anatomy';
import { Duration } from './duration';
import { WhoBuys } from './who-buys';
import { YieldCurve } from './yield-curve';

export function BondsRatesView() {
  return (
    <ExplainerPage
      title='금리가 오르면 왜 채권값이 떨어지는가'
      intro={
        <>
          이 사이트의{' '}
          <Link href='/economy' className='underline underline-offset-2'>
            경제 차트
          </Link>
          는 연준 기준금리와 수익률 곡선 스프레드를 그린다. 그런데 그 금리가 무엇의 금리이고 스프레드가 왜 중요한지는
          어디서도 설명하지 않았다. 채권은 미래의 현금흐름을 지금 사는 계약이고, 금리는 그 계약에 붙는 할인율이다. 이
          둘이 반대로 움직이는 것은 시장의 심리가 아니라 산수의 결과다. 채권 한 장을 뜯어보는 데서 시작해 국채를 사는
          쪽의 속내까지 네 갈래로 따라가 보자. 액면·쿠폰·만기를 비롯한 모든 수치는 개념 이해용 예시다.
        </>
      }
    >
      <SimTabs
        defaultValue='anatomy'
        tabs={[
          { value: 'anatomy', label: '채권 한 장', node: <BondAnatomy /> },
          { value: 'duration', label: '듀레이션', node: <Duration /> },
          { value: 'curve', label: '수익률 곡선', node: <YieldCurve /> },
          { value: 'holders', label: '국채 보유 주체', node: <WhoBuys /> },
        ]}
      />
    </ExplainerPage>
  );
}
