'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { AttackScope } from './attack-scope';
import { ConfirmationSafety } from './confirmation-safety';
import { ReorgRace } from './reorg-race';

const TABS = [
  { value: 'race', label: '① 재구성 경주', node: <ReorgRace /> },
  { value: 'confirmations', label: '② 확인 수와 안전', node: <ConfirmationSafety /> },
  { value: 'scope', label: '③ 51%의 실제 범위', node: <AttackScope /> },
];

export function ChainReorgView() {
  return (
    <ExplainerPage
      breadcrumb='체인 재구성·파이널리티'
      title='트랜잭션은 언제 &#39;확정&#39;되는가'
      intro={
        <>
          블록에 실렸다고 트랜잭션이 영원히 확정되는 건 아니다. 더 긴(작업량이 많은) 체인이 나타나면 지금 체인은 통째로
          버려질 수 있다(재구성). 왜 그런 일이 일어나는지, 확인 수가 왜 그 위험을 줄여주는지, 51% 해시레이트를 쥔
          공격자가 실제로 무엇을 할 수 있고 없는지를 차례로 살펴본다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='race' />
    </ExplainerPage>
  );
}
