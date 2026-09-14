'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { AttackCost } from './attack-cost';
import { FeeGap } from './fee-gap';
import { IssuanceSchedule } from './issuance-schedule';

export function SecurityBudgetView() {
  return (
    <ExplainerPage
      breadcrumb='보안 예산'
      title='보조금이 0이 되면 무엇이 비트코인을 지키는가'
      intro={
        <>
          비트코인의 보안은 공짜가 아니다. 채굴자가 전기와 장비를 태워 지켜 주는 대가로 블록 보조금과 수수료를 받고, 그
          합이 곧 네트워크가 해마다 치르는 방어비다. 그런데 보조금은 4년마다 반으로 잘려 결국 0이 된다. 남은 수수료가 그
          자리를 메울 수 있는지, 메우지 못하면 무엇이 깨지는지가 비트코인에 던져진 가장 날 선 질문이다. 발행 스케줄만
          프로토콜이 정한 진짜 값이고, 가격·수수료·공격 규모는 전부 개념 이해용 예시다.
        </>
      }
    >
      <IllustrativeDisclaimer>
        이 페이지의 수치는 예측이 아니다. 슬라이더가 보여 주는 것은 &#39;보조금·가격·수수료가 이 값이면 보안 예산과 공격
        비용이 이렇게 된다&#39;는 관계일 뿐, 그 값이 실제로 그렇게 되리라는 전망이 아니다. 특히 2140년이라는 시점은
        계산의 끝일 뿐 그때 무슨 일이 일어난다는 뜻이 아니며, 여기 쓴 기준점은 비교의 원점으로 고른 대략적인 값이지
        실측치가 아니다.
      </IllustrativeDisclaimer>

      <SimTabs
        defaultValue='issuance'
        tabs={[
          { value: 'issuance', label: '발행 스케줄', node: <IssuanceSchedule /> },
          { value: 'fee', label: '수수료의 몫', node: <FeeGap /> },
          { value: 'attack', label: '공격 비용', node: <AttackCost /> },
        ]}
      />

      <p className='text-muted-foreground text-sm/relaxed'>
        보조금이 어떻게 지급되는지(코인베이스 트랜잭션)와 난이도가 어떻게 조정되는지는{' '}
        <Link href='/block-mining' className='underline underline-offset-2'>
          블록·채굴·합의
        </Link>
        에서, 채굴에 들어가는 전기를 두고 벌어지는 논쟁은{' '}
        <Link href='/grid-battery' className='underline underline-offset-2'>
          전력망
        </Link>
        에서 다룬다.
      </p>
    </ExplainerPage>
  );
}
