'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { AddressScriptCompare } from './address-script-compare';
import { ScriptStack } from './script-stack';
import { SignatureLab } from './signature-lab';

const TABS = [
  { value: 'signature', label: '① 서명 만들기', node: <SignatureLab /> },
  { value: 'stack', label: '② 스크립트 실행', node: <ScriptStack /> },
  {
    value: 'compare',
    label: '③ 주소 타입별 비교',
    node: <AddressScriptCompare />,
  },
];

export function ScriptVerifyView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '스크립트·서명 검증' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>동전은 어떻게 잠기고, 서명은 어떻게 그 잠금을 풀까</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              트랜잭션 해부에서 본 UTXO는 아무나 못 쓰게 스크립트로 <b>잠겨</b> 있다. 그 잠금을 푸는 열쇠가 개인키로
              만든 <b>서명</b>이고, 노드는 그 서명이 진짜인지를 스택 위에서 한 줄씩 실행하며 확인한다. 메시지에 서명을
              만들고, 그 서명이 스택에서 검증되는 과정을 단계별로 따라가 보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            여기서 만들어지는 개인키·공개키·서명·해시는 흐름을 보여주기 위한 <b>그럴듯한 가짜 값</b>이다. 실제 암호
            연산(secp256k1 ECDSA/Schnorr, SHA-256, RIPEMD-160)을 단순화했다.{' '}
            <b>절대 실제 지갑이나 자금에 사용하지 말 것.</b> 스크립트 실행 순서와 스택 규칙(②)만 실제와 같다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='signature' />
        </div>
      </PageMain>
    </>
  );
}
