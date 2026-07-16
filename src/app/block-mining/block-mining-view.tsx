'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { BlockHeaderView } from './block-header';
import { DifficultyConsensus } from './difficulty-consensus';
import { MiningSim } from './mining-sim';

const TABS = [
  { value: 'header', label: '① 블록 헤더 해부', node: <BlockHeaderView /> },
  { value: 'mining', label: '② 채굴 시뮬레이션', node: <MiningSim /> },
  {
    value: 'consensus',
    label: '③ 난이도 조정·합의',
    node: <DifficultyConsensus />,
  },
];

export function BlockMiningView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: '블록·채굴·합의' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>검증된 트랜잭션은 어떻게 체인에 새겨질까</h1>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              스크립트·서명 검증에서 확인된 트랜잭션들은 곧바로 체인에 붙지 않는다. 채굴자가 그 트랜잭션들을 블록 헤더로
              요약하고, 목표 이하의 해시가 나올 때까지 nonce를 바꿔가며 계산 경쟁을 벌인 끝에 승자의 블록이 체인에
              이어진다. 헤더를 뜯어보고, 직접 채굴해 보고, 난이도가 스스로 조정되며 체인이 하나로 합의되는 과정을 따라가
              보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            여기서 계산되는 블록 해시는 흐름을 보여주기 위한 <b>그럴듯한 가짜 값</b>이다(실제 SHA-256d 대신 결정적 시드
            함수 사용). 헤더 구조, 목표 비교 규칙, 난이도 조정 공식, 최장 체인 규칙은 실제와 같다.
          </IllustrativeDisclaimer>

          <SimTabs tabs={TABS} defaultValue='header' />
        </div>
      </PageMain>
    </>
  );
}
