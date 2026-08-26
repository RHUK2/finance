'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { CrackSpread } from './crack-spread';
import { HedgeLedger } from './hedge-ledger';
import { LiquidationCascade } from './liquidation-cascade';
import { PerpetualFunding } from './perpetual-funding';

const TABS = [
  { value: 'ledger', label: '헤지 장부', node: <HedgeLedger /> },
  { value: 'crack', label: '크랙 스프레드', node: <CrackSpread /> },
  { value: 'cascade', label: '강제청산 연쇄', node: <LiquidationCascade /> },
  { value: 'perp', label: '무기한선물·펀딩비', node: <PerpetualFunding /> },
];

export function FuturesHedgingView() {
  return (
    <ExplainerPage
      breadcrumb='선물·헤징'
      title='위험은 사라지지 않고 이전된다'
      intro={
        <>
          이 사이트의 원자재 차트가 그리는 금·원유·옥수수는 전부 선물 가격이다. 그런데 선물이 무엇인지는 어디서도
          설명하지 않았다. 선물은 미래의 가격을 맞히는 도박처럼 보이지만, 그 시장을 만든 쪽은 가격을 맞히려는 사람이
          아니라 맞히지 않아도 되게 만들려는 사람이었다. 헤저가 가격 위험을 벗는 순간 그 위험은 증발하지 않고 반대편
          장부로 건너간다. 받은 쪽이 감당하지 못하면 위험은 다시 시장 전체로 돌아온다. 네 갈래로 나눠 직접 만져 보자.
        </>
      }
    >
      <IllustrativeDisclaimer>
        등장하는 유가·계약가·증거금 배수·펀딩 요율은 구조를 보여주기 위한 예시다. 실제 시세를 가져오지 않으며, 정제
        수율과 증거금 규정도 요점이 묻히지 않게 단순화했다. 이 페이지는 어떤 포지션도 권하지 않고, 실제 거래의 손익이나
        청산 조건을 계산하는 데 쓸 수 없다.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='ledger' />
    </ExplainerPage>
  );
}
