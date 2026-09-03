'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { AddressReuse } from './address-reuse';
import { ChainAnalysis } from './chain-analysis';
import { CoinJoin } from './coinjoin';

const TABS = [
  { value: 'reuse', label: '주소 재사용', node: <AddressReuse /> },
  { value: 'analysis', label: '체인분석 휴리스틱', node: <ChainAnalysis /> },
  { value: 'coinjoin', label: 'CoinJoin', node: <CoinJoin /> },
];

export function PrivacyView() {
  return (
    <ExplainerPage
      breadcrumb='프라이버시'
      title='블록체인에서 누가 무엇을 볼 수 있을까'
      intro={
        <>
          지금까지는 트랜잭션이 무엇을, 어떻게 검증하고 전파하고 기록하는지를 봤다. 이 페이지는 다른 질문을 던진다.
          그렇게 공개된 기록에서 누가, 얼마나 많은 걸 알아낼 수 있을까. 주소 재사용이 왜 위험한지, 분석가들이 어떤
          단서로 지갑을 추적하는지, 그리고 CoinJoin이 그 단서를 어떻게 무디게 만드는지 차례로 본다. 이 추적이 실제
          수사에서 어떻게 쓰였는지는{' '}
          <Link href='/illicit-funds' className='underline underline-offset-2'>
            비트코인 자금추적
          </Link>{' '}
          페이지에서 다룬다. 주소·금액은 개념 이해용 예시다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='reuse' />
    </ExplainerPage>
  );
}
