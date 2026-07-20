'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { GossipSim } from './gossip-sim';
import { IbdSync } from './ibd-sync';
import { MempoolPolicy } from './mempool-policy';

const TABS = [
  { value: 'gossip', label: '① 가십 프로토콜', node: <GossipSim /> },
  { value: 'policy', label: '② 멤풀 수용 정책', node: <MempoolPolicy /> },
  { value: 'ibd', label: '③ 초기 블록 동기화', node: <IbdSync /> },
];

export function P2pNetworkView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: 'P2P 네트워크 전파' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>서명된 트랜잭션은 어떻게 채굴자에게 닿을까</h1>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              스크립트·서명 검증을 통과한 트랜잭션도 저절로 블록에 실리지 않는다. 이웃 노드에게 하나씩 넘겨지며 네트워크
              전체로 퍼지고(가십), 그 과정에서 각 노드는 자기 수수료 기준을 통과한 것만 받아준다(멤풀 수용 정책). 새로
              참여하는 노드는 이 모든 역사를 처음부터 내려받아야 하는데, 그 과정도 순서가 있다(초기 블록 동기화). 세
              가지를 차례로 따라가 보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            여기 시뮬레이션은 전파·수수료·동기화의 <b>원리와 규칙</b>을 보여주기 위한 단순화다. 전파 그래프는 실제
            무작위 P2P 그래프 대신 격자로, 동기화 속도는 실제 네트워크 대역폭 대신 일정한 라운드 단위로 근사했다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='gossip' />
        </div>
      </PageMain>
    </>
  );
}
