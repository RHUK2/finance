'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';

import { AddressCompare } from './address-compare';
import { FeeCalc } from './fee-calc';
import { TxStructure } from './tx-structure';
import { UtxoModel } from './utxo-model';

const TABS = [
  { value: 'utxo', label: 'UTXO 고르기', node: <UtxoModel /> },
  { value: 'structure', label: '트랜잭션 구조', node: <TxStructure /> },
  { value: 'fee', label: '크기와 수수료', node: <FeeCalc /> },
  { value: 'compare', label: '주소 타입별 수수료', node: <AddressCompare /> },
];

export function TransactionsView() {
  return (
    <ExplainerPage
      title='비트코인은 어떻게 돈을 보낼까?'
      intro={
        <>
          지갑에서 만든 주소로 코인이 들어오면, 그 코인은 &#39;잔액&#39;이 아니라 액면가가 정해진 <b>동전(UTXO)</b>{' '}
          묶음으로 쌓인다. 송금이란 이 UTXO들을 골라 새 UTXO로 다시 찍어내는 일이고, 그때 내는 수수료는 보내는 금액이
          아니라 <b>트랜잭션의 크기(vByte)</b>로 정해진다. UTXO를 고르고, 크기가 수수료가 되고, 주소 타입이 수수료를
          좌우하는 과정을 직접 만져보자. 입력·출력 vByte는 타입별 대표 근사값이라 서명 길이에 따라 실제로는 ±1~2 vB
          달라지지만, 수수료 = vByte × sat/vB라는 계산식과 잔돈이 생기는 방식은 실제와 같다.
        </>
      }
    >
      <SimTabs tabs={TABS} defaultValue='utxo' />
    </ExplainerPage>
  );
}
