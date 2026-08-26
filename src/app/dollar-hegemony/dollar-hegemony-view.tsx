'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { DemandSource } from './demand-source';
import { ExitCalculus } from './exit-calculus';
import { FACTS } from './models';
import { InflationExport } from './inflation-export';
import { WonPosition } from './won-position';

const TABS = [
  { value: 'demand', label: '수요원의 교체', node: <DemandSource /> },
  { value: 'exit', label: '이탈의 계산', node: <ExitCalculus /> },
  { value: 'export', label: '인플레이션 수출', node: <InflationExport /> },
  { value: 'won', label: '원화의 위치', node: <WonPosition /> },
];

export function DollarHegemonyView() {
  const { reserveShare, federalDebt } = FACTS;

  return (
    <ExplainerPage
      breadcrumb='달러 패권'
      title='달러는 왜 최악인데도 대체되지 않는가'
      intro={
        <>
          달러 체제가 구조적으로 지속 불가능하다는 주장은 건전화폐 쪽 서술에서 오래 반복돼 왔고, 근거로 드는 수치도
          틀리지 않았다. 미국 연방정부 총부채는 {federalDebt.value}조 달러를 넘었고({federalDebt.asOf}{' '}
          {federalDebt.source} 기준) 실물 담보는 1971년에 사라졌다. 그런데 그로부터 반세기가 지나도록 체제는 그대로고
          세계 외환보유고의 {(reserveShare.value * 100).toFixed(1)}%는 여전히 달러다({reserveShare.asOf}{' '}
          {reserveShare.source} 기준). 그러니 언제 무너지느냐를 묻기 전에 왜 아직 안 무너졌느냐를 먼저 물어야 한다. 답은
          달러가 좋아서가 아니라 나가는 값이 남는 값보다 비싸기 때문이고, 그 셈은 계산할 수 있다. 네 갈래로 나눠 직접
          밀어 보자.
        </>
      }
    >
      <IllustrativeDisclaimer>
        등장하는 등급·가중치·전가 계수·금리 반응은 구조를 보여주기 위한 예시다. 실명으로 나오는 국가의 이탈 유인 비율은
        어느 기관의 추정치도 아니고, 그 나라가 무엇을 할지에 대한 예측도 아니다. 계산이 말리는데도 움직인 사례가 이미
        있다. 이 페이지는 어떤 통화나 자산도 권하지 않는다.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='demand' />
    </ExplainerPage>
  );
}
