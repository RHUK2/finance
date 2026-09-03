'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { MaturationCurve } from './maturation-curve';
import { TwoRegime } from './two-regime';
import { VolatilityEngine } from './volatility-engine';

const TABS = [
  { value: 'regime', label: '두 갈래 운명', node: <TwoRegime /> },
  { value: 'engine', label: '변동성의 정체', node: <VolatilityEngine /> },
  { value: 'maturation', label: '성숙 곡선', node: <MaturationCurve /> },
];

export function BitcoinVolatilityView() {
  return (
    <ExplainerPage
      breadcrumb='비트코인 변동성'
      title='변동성 = 체제 전환 확률의 가격'
      intro={
        <>
          비트코인은 왜 이렇게 심하게 출렁일까? 시장은 매일 &#39;비트코인이 결국 진짜 화폐로 자리 잡을까&#39;를 두고
          성공 확률을 새로 매긴다. 그 확률이 조금만 바뀌어도 가격은 크게 움직인다. 즉 변동성은 결함이 아니라, 이 질문에
          대한 시장의 답이 실시간으로 흔들리는 모습이다. 앞의 두 탭은 이 발상을 시뮬레이션으로 돌려 보고, 마지막 탭은
          실제 데이터로 확인한다. 여기서 쓰는 가격 모델은 &#39;왜 출렁이는가&#39;에 답하는 것이지 적정 가격을 계산하는
          모델이 아니다.
        </>
      }
    >
      <IllustrativeDisclaimer>
        여기 찍히는 <b>성공 시 가격</b>·<b>실패 시 가격</b>·<b>현재 함의 가격</b>은 성공 확률 하나로만 계산한 개념
        시연용 값이다. 실시세를 함께 보여 주지만 그것은 지금 시세가 이 모델에서 어떤 확률을 함의하는지를 되짚기 위한
        것이지, 목표가나 적정 가격을 말하는 것이 아니다. <b>투자 판단의 근거로 삼지 말 것.</b>
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='regime' />
    </ExplainerPage>
  );
}
