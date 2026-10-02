'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { HtlcRouting } from './htlc-routing';
import { OnchainComparison } from './onchain-comparison';
import { PaymentChannel } from './payment-channel';

const TABS = [
  { value: 'channel', label: '결제 채널', node: <PaymentChannel /> },
  { value: 'htlc', label: 'HTLC와 라우팅', node: <HtlcRouting /> },
  { value: 'compare', label: '온체인과 비교', node: <OnchainComparison /> },
];

export function LightningNetworkView() {
  return (
    <ExplainerPage
      title='매번 온체인에 쓰지 않고도 어떻게 결제할 수 있나'
      intro={
        <>
          비트코인 트랜잭션은 보통 온체인에서, 블록에 담겨 확정된다. 그런데 매번 온체인 트랜잭션을 만들면 블록 공간을
          두고 경매를 벌여야 하고, 다음 블록까지 기다려야 한다. 라이트닝 네트워크는 온체인에 발자국을 최소로 남기면서,
          그 위에서 즉시·저렴하게 주고받는 결제 레이어다. 채널 잔고와 송금액, 수수료는 개념 이해용 예시다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='channel' />
    </ExplainerPage>
  );
}
