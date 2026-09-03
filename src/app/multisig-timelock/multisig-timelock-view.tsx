'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { MultisigLab } from './multisig-lab';
import { TimelockLab } from './timelock-lab';

const TABS = [
  { value: 'multisig', label: '다중서명', node: <MultisigLab /> },
  { value: 'timelock', label: '타임락', node: <TimelockLab /> },
];

export function MultisigTimelockView() {
  return (
    <ExplainerPage
      breadcrumb='멀티시그·타임락'
      title='서명 하나로는 부족하거나, 너무 이를 때'
      intro={
        <>
          스크립트·서명 검증에서 본 잠금은 &#39;키 하나, 언제든&#39;이 기본값이었다. 하지만 실전에서는 &#39;키 여러 개
          중 일부&#39;가 필요하거나(다중서명), &#39;정해진 때가 되어야만&#39; 풀리는 조건(타임락)이 필요할 때가 많다. 두
          조건을 직접 조작하며 언제 지출이 허용되는지 확인해 보자.
        </>
      }
    >
      <IllustrativeDisclaimer>
        여기서 보이는 공개키·스크립트는 흐름을 보여주기 위한 예시 표기다. 정족수 비교(다중서명)와 블록 높이 비교(타임락)
        로직 자체는 실제 검증 규칙과 같지만, 실제 secp256k1 서명 검증이나 컨센서스 코드를 그대로 재현한 것은 아니다.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='multisig' />
    </ExplainerPage>
  );
}
