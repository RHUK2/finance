'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { GossipSim } from './gossip-sim';
import { IbdSync } from './ibd-sync';
import { MempoolPolicy } from './mempool-policy';

const TABS = [
  { value: 'gossip', label: '가십 프로토콜', node: <GossipSim /> },
  { value: 'policy', label: '멤풀 수용 정책', node: <MempoolPolicy /> },
  { value: 'ibd', label: '초기 블록 동기화', node: <IbdSync /> },
];

export function P2pNetworkView() {
  return (
    <ExplainerPage
      breadcrumb='P2P 네트워크 전파'
      title='서명된 트랜잭션은 어떻게 채굴자에게 닿을까'
      intro={
        <>
          스크립트·서명 검증을 통과한 트랜잭션도 저절로 블록에 실리지 않는다. 이웃 노드에게 하나씩 넘겨지며 네트워크
          전체로 퍼지고(가십), 그 과정에서 각 노드는 자기 수수료 기준을 통과한 것만 받아준다(멤풀 수용 정책). 새로
          참여하는 노드는 이 모든 역사를 처음부터 내려받아야 하는데, 그 과정도 순서가 있다(초기 블록 동기화). 세 가지를
          차례로 따라가 보자.
        </>
      }
    >
      <IllustrativeDisclaimer>
        세 시뮬레이션 모두 시간을 라운드 단위로 끊어 보여준다. 실제로는 전파도 동기화도 네트워크 대역폭과 지연에 따라
        연속으로 일어난다. 각 탭이 무엇을 더 줄였는지는 탭 안에서 따로 밝힌다.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='gossip' />
    </ExplainerPage>
  );
}
