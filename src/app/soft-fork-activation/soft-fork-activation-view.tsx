'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { SimTabs } from '@/components/simulation';

import { Bip8Taproot } from './bip8-taproot';
import { Bip9Signaling } from './bip9-signaling';
import { ForkCompat } from './fork-compat';

const TABS = [
  { value: 'compat', label: '① 소프트포크 vs 하드포크', node: <ForkCompat /> },
  { value: 'bip9', label: '② BIP9 시그널링', node: <Bip9Signaling /> },
  { value: 'bip8', label: '③ BIP8·UASF와 Taproot', node: <Bip8Taproot /> },
];

export function SoftForkActivationView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '소프트포크 활성화' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>합의 규칙은 어떻게 바뀌는가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              지금까지는 정해진 규칙 위에서 트랜잭션이 어떻게 검증되고 체인에 새겨지는지를 봤다. 그런데 그 규칙 자체는
              누가, 어떻게 바꿀까. 관리자도 투표도 없이, 노드마다 독립적으로 소프트웨어를 업그레이드하는 것만으로 전체
              네트워크의 합의 규칙이 갈라지지 않고 바뀌는 과정을 살펴본다.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue='compat' />
        </div>
      </PageMain>
    </>
  );
}
