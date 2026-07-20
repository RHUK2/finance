'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { SimTabs } from '@/components/simulation';

import { AddressReuse } from './address-reuse';
import { ChainAnalysis } from './chain-analysis';
import { CoinJoin } from './coinjoin';

const TABS = [
  { value: 'reuse', label: '① 주소 재사용', node: <AddressReuse /> },
  { value: 'analysis', label: '② 체인분석 휴리스틱', node: <ChainAnalysis /> },
  { value: 'coinjoin', label: '③ CoinJoin', node: <CoinJoin /> },
];

export function PrivacyView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '프라이버시' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>블록체인에서 누가 무엇을 볼 수 있을까</h1>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              지금까지는 트랜잭션이 무엇을, 어떻게 검증하고 전파하고 기록하는지를 봤다. 이 페이지는 다른 질문을 던진다.
              그렇게 공개된 기록에서 누가, 얼마나 많은 걸 알아낼 수 있을까. 주소 재사용이 왜 위험한지, 분석가들이 어떤
              단서로 지갑을 추적하는지, 그리고 CoinJoin이 그 단서를 어떻게 무디게 만드는지 차례로 본다.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue='reuse' />
        </div>
      </PageMain>
    </>
  );
}
