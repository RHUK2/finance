'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { August2026 } from './august-2026';
import { CoinSeparation } from './coin-separation';
import { AS_OF } from './models';
import { ReplayAttack } from './replay-attack';
import { WhyTwoChains } from './why-two-chains';

const TABS = [
  { value: 'why', label: '왜 두 체인이 남는가', node: <WhyTwoChains /> },
  { value: 'replay', label: '리플레이 공격', node: <ReplayAttack /> },
  { value: 'separation', label: '코인 분리', node: <CoinSeparation /> },
  { value: 'august', label: '2026년 8월', node: <August2026 /> },
];

export function ChainSplitView() {
  return (
    <ExplainerPage
      breadcrumb='체인 분기·리플레이'
      title='체인이 갈리면 내 코인에 무슨 일이 나는가'
      intro={
        <>
          재구성은 두 체인 중 하나가 밀려 사라지는 일이다. 분기는 둘 다 남는 일이다. 둘 다 남으면 같은 개인키가 양쪽
          잔고를 지배하게 되고, 한 번의 서명이 양쪽에서 돈을 빼는 리플레이가 열린다. 왜 갈라진 체인이 사라지지 않는지,
          왜 복사한 트랜잭션이 그대로 통하는지, 그걸 끊으려면 무엇이 필요한지를 차례로 본다. 2026년 8월 비트코인에서
          성격이 정반대인 두 분기가 2주 간격으로 일어났고, 마지막 탭에서 그 사례를 다룬다.
        </>
      }
    >
      <IllustrativeDisclaimer>
        잔고·금액과 분리 방법은 원리를 보여 주기 위한 개념 시연이며 실행 절차가 아니다. 실제 분기 상황에서 어떻게 해야
        하는지는 자신이 쓰는 지갑과 거래소의 공지를 따라야 한다. 마지막 탭의 사건 수치는 {AS_OF} 기준이다.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='why' />
    </ExplainerPage>
  );
}
