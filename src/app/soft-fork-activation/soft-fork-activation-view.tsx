'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { Bip8Taproot } from './bip8-taproot';
import { Bip9Signaling } from './bip9-signaling';
import { ForkCompat } from './fork-compat';

const TABS = [
  { value: 'compat', label: '소프트포크 vs 하드포크', node: <ForkCompat /> },
  { value: 'bip9', label: 'BIP9 시그널링', node: <Bip9Signaling /> },
  { value: 'bip8', label: 'BIP8·UASF와 Taproot', node: <Bip8Taproot /> },
];

export function SoftForkActivationView() {
  return (
    <ExplainerPage
      title='합의 규칙은 어떻게 바뀌는가'
      intro={
        <>
          비트코인 트랜잭션은 모든 노드가 같은 합의 규칙으로 검증하고 체인에 새긴다. 그런데 그 규칙 자체는 누가, 어떻게
          바꿀까. 관리자도 투표도 없이, 노드마다 독립적으로 소프트웨어를 업그레이드하는 것만으로 전체 네트워크의 합의
          규칙이 갈라지지 않고 바뀌는 과정을 살펴본다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='compat' />
    </ExplainerPage>
  );
}
