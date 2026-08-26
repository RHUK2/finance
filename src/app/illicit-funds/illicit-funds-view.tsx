'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { CashVsChain } from './cash-vs-chain';
import { LaunderingTrail } from './laundering-trail';
import { RealCases } from './real-cases';

const TABS = [
  { value: 'cash', label: '현금 vs 체인', node: <CashVsChain /> },
  { value: 'trail', label: '세탁 경로 추적', node: <LaunderingTrail /> },
  { value: 'cases', label: '실제 사례', node: <RealCases /> },
];

export function IllicitFundsView() {
  return (
    <ExplainerPage
      breadcrumb='비트코인 자금추적'
      title='범죄 자금에게 비트코인은 좋은 도구일까'
      intro={
        <>
          &#39;비트코인은 익명이라 범죄에 쓰인다&#39;는 말은 절반만 맞다. 비트코인은 익명(anonymous)이 아니라
          가명(pseudonymous)이고, 그 가명 장부는 전 세계 누구나 볼 수 있으며 영원히 지워지지 않는다. 현금은 쓰는 순간
          흔적이 사라지지만 비트코인은 쓰는 순간 증거가 만들어진다. 이 페이지는 그 차이가 실제 수사에서 어떻게
          작동하는지 본다. 프라이버시 기법 자체는{' '}
          <Link href='/privacy' className='underline underline-offset-2'>
            프라이버시
          </Link>{' '}
          페이지에서 따로 다룬다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='cash' />
    </ExplainerPage>
  );
}
