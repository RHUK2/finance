'use client';

import { useState } from 'react';
import { Banknote, Bitcoin, DollarSign } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, SectionIntro, StatCard, StatusBanner } from '@/components/simulation';
import { BTC_COLOR, formatUsd } from '@/lib/utils';

// 미화 100달러권 실측치: 1장 = 1.0 g, 156.1 × 66.3 × 0.1093 mm ≈ 1.13 cm³.
const NOTE_VALUE = 100;
const NOTE_GRAMS = 1;
const NOTE_CM3 = 15.61 * 6.63 * 0.01093;
const SUITCASE_KG = 23; // 위탁 수하물 1개 기준 중량

// 슬라이더 0~100을 $1M ~ $1B로 로그 매핑한다.
const amountOf = (t: number) => 1e6 * Math.pow(10, (t / 100) * 3);

const fmtNum = (n: number) => Math.round(n).toLocaleString('ko-KR');

export function CashVsChain() {
  const [t, setT] = useState(40);
  const amount = amountOf(t);

  const notes = amount / NOTE_VALUE;
  const kg = (notes * NOTE_GRAMS) / 1000;
  const liters = (notes * NOTE_CM3) / 1000;
  const suitcases = Math.ceil(kg / SUITCASE_KG);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 금액을 옮긴다면: 현금 다발 vs 온체인 이체'>
        범죄 수익을 다루는 쪽이 실제로 부딪히는 첫 번째 문제는 &#39;익명성&#39;이 아니라 &#39;물리학&#39;이다. 현금은
        무겁고 부피가 크며 국경에서 걸린다. 비트코인은 그 문제를 완전히 없앤다. 대신 다른 문제를 만든다. 금액을 바꿔가며
        양쪽의 대가를 비교해 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<DollarSign className='size-4' />}
          label='옮길 금액'
          value={t}
          onChange={setT}
          format={(v) => formatUsd(amountOf(v))}
          hint='$1M부터 $1B까지 로그 스케일'
        />

        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <Card className='gap-3 p-4'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <Banknote className='size-4 text-emerald-600 dark:text-emerald-400' />
              현금 (100달러권)
            </span>
            <div className='grid grid-cols-2 gap-2'>
              <StatCard label='지폐 장수' value={notes} format={(n) => `${fmtNum(n)}장`} />
              <StatCard label='무게' value={kg} format={(n) => `${fmtNum(n)} kg`} />
              <StatCard label='부피' value={liters} format={(n) => `${fmtNum(n)} L`} />
              <StatCard
                label={`캐리어 (${SUITCASE_KG}kg 기준)`}
                value={suitcases}
                format={(n) => `${fmtNum(n)}개`}
                tone='bad'
              />
            </div>
            <p className='text-muted-foreground text-xs/relaxed'>
              대부분의 나라에서 일정 금액(미국·EU는 1만 달러/유로 상당) 이상의 현금을 신고 없이 반출입하면 그 자체로
              범죄다. 물리적 검색에 걸릴 위험이 부피에 비례해 커진다.
            </p>
          </Card>

          <Card className='gap-3 p-4'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <Bitcoin className='size-4' style={{ color: BTC_COLOR }} />
              비트코인 (온체인 이체)
            </span>
            <div className='grid grid-cols-2 gap-2'>
              <Metric label='무게' value='0 kg' />
              <Metric label='부피' value='0 L' />
              <Metric label='이체 시간' value='~10분' sub='금액과 무관' />
              <Metric label='국경 통제' value='없음' tone='good' />
            </div>
            <p className='text-muted-foreground text-xs/relaxed'>
              금액이 100만 달러든 10억 달러든 트랜잭션 크기는 수백 바이트로 같고, 수수료도 금액이 아니라 바이트 수에
              비례한다. 여기까지만 보면 압도적으로 유리하다.
            </p>
          </Card>
        </div>

        <StatusBanner tone='accent'>
          <span className='leading-relaxed font-normal'>
            그런데 그 &#39;0 kg&#39;에는 대가가 붙는다. 현금 {fmtNum(kg)} kg를 옮긴 기록은 어디에도 남지 않지만, 같은
            금액의 온체인 이체는 <b>전 세계 수만 개 노드에 영수증이 복제되어 영구히 남는다.</b> 수사기관은 사건 발생
            시점이 아니라 <b>몇 년 뒤에도</b> 그 영수증을 처음부터 다시 읽을 수 있다.
          </span>
        </StatusBanner>
      </Card>

      <ExplainCard
        title='현금은 여전히 자금세탁의 주력이다'
        preview='체인에 기록이 남지 않는 채널이 훨씬 크고, 수사기관 입장에서 훨씬 어렵다.'
        body={
          <>
            UN 마약범죄사무소(UNODC)는 전 세계에서 세탁되는 자금 규모를 세계 GDP의 2~5%로 추정한다. 그 대부분은 현금,
            무역 송장 조작(TBML), 차명 계좌, 부동산·미술품 같은 전통적 채널을 통한다. 이런 채널의 공통점은{' '}
            <b>기록이 흩어져 있거나 아예 없다는 것</b>이다. 수사기관은 영장을 들고 관할별로 은행·세관·법인등기를 하나씩
            뒤져야 하고, 국경을 넘으면 사법공조 절차에 몇 달이 걸린다. 반면 비트코인 원장에는 영장도 국제공조도 필요
            없다. 노드를 하나 띄우면 2009년부터의 모든 거래가 손안에 들어온다. 범죄 자금에게 최악의 성질이다.
          </>
        }
      />
    </div>
  );
}
