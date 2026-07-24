'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { SimTabs } from '@/components/simulation';

import { HtlcRouting } from './htlc-routing';
import { OnchainComparison } from './onchain-comparison';
import { PaymentChannel } from './payment-channel';

const TABS = [
  { value: 'channel', label: '① 결제 채널', node: <PaymentChannel /> },
  { value: 'htlc', label: '② HTLC와 라우팅', node: <HtlcRouting /> },
  { value: 'compare', label: '③ 온체인과 비교', node: <OnchainComparison /> },
];

export function LightningNetworkView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '라이트닝 네트워크' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>온체인 다음: 오프체인에서 결제하기</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              지금까지의 기술 트랙은 트랜잭션 하나가 온체인에서 확정되기까지의 과정을 다뤘다. 그런데 매번 온체인
              트랜잭션을 만들면 블록 공간을 두고 경매를 벌여야 하고, 다음 블록까지 기다려야 한다. 라이트닝 네트워크는
              온체인에 발자국을 최소로 남기면서, 그 위에서 즉시·저렴하게 주고받는 결제 레이어다.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue='channel' />
        </div>
      </PageMain>
    </>
  );
}
