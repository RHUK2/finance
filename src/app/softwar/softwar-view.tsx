'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { SimTabs } from '@/components/simulation';

import { AbstractVsPhysical } from './abstract-vs-physical';
import { PrimordialEconomics } from './primordial-economics';

const TABS = [
  { value: 'capture', label: '추상 vs 물리', node: <AbstractVsPhysical /> },
  { value: 'nature', label: '자연의 파워 프로젝션', node: <PrimordialEconomics /> },
];

export function SoftwarView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '비트코인 소프트워' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>비트코인 소프트워: 파워 프로젝션</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              제이슨 로워리(Jason Lowery)의 <i>Softwar</i>는 비트코인을 화폐가 아닌 &#39;권력 투사 수단&#39;으로 본다.
              자연에서 생물이 물리력을 투사해 자원을 지키듯, 비트코인은 작업증명으로 와트를 부과해 디지털 자산을 지킨다.
              널리 받아들여진 정설이 아니라 논쟁 중인 주장이며, 여기서는 그 발상을 두 가지 시뮬레이션으로 직접 돌려
              본다. 수치는 개념 이해용 예시다.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue='capture' />
        </div>
      </PageMain>
    </>
  );
}
