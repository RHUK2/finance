'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { Causation } from './causation';
import { Imputation } from './imputation';
import { MiningCost } from './mining-cost';
import { WaterDiamond } from './water-diamond';

const TABS = [
  { value: 'paradox', label: '① 물과 다이아몬드', node: <WaterDiamond /> },
  { value: 'imputation', label: '② 가치의 역류', node: <Imputation /> },
  { value: 'causation', label: '③ 인과가 반대다', node: <Causation /> },
  { value: 'mining', label: '④ 채굴비용은 바닥이 아니다', node: <MiningCost /> },
];

export function ValueTheoryView() {
  return (
    <ExplainerPage
      breadcrumb='가치론'
      title='가치는 만든 쪽이 아니라 쓰는 쪽이 정한다'
      intro={
        <>
          물건의 값어치가 그것을 만드는 데 든 노동에서 온다는 생각은 애덤 스미스와 리카도를 거쳐 마르크스에게 이어졌다.
          1871년부터 몇 해 사이에 카를 멩거, 윌리엄 제번스, 레옹 발라 세 사람이 각자 따로 정반대의 설명을 내놓았다.
          값어치는 물건 안에 담겨 있는 것이 아니라 그것을 한 단위 더 얻는 사람의 사정에서 생긴다는 것이다. 이 설명은
          스미스가 스스로 던져 놓고 풀지 못한 물과 다이아몬드의 역설을 풀고, 밭이나 기계처럼 아무도 소비하지 않는 재화의
          값이 어디서 오는지까지 뒤집어 설명한다. 종이 화폐에{' '}
          <Link href='/money-creation' className='underline underline-offset-2'>
            내재가치가 없다
          </Link>
          고 말할 수 있는 근거도 여기에 있다. 마지막에는 그 뒤집힌 인과를 비트코인 채굴비용에 대 본다. 조작할 수 있는
          수량과 금액은 구조를 보여주기 위한 예시다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='paradox' />
    </ExplainerPage>
  );
}
