'use client';

import { useState } from 'react';

import { Banknote, House, Landmark, Percent, Wallet } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

// 금액 단위는 만원. 보증금만 억 단위 슬라이더로 받고 내부에서 만원으로 환산한다.
const fmtMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;
const fmtEok = (n: number) => `${n.toFixed(1)}억`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export function DepositLoan() {
  const [depositEok, setDepositEok] = useState(4);
  const [rate, setRate] = useState(3.5);
  const [monthlyRent, setMonthlyRent] = useState(120);

  const deposit = depositEok * 10000;
  const jeonseCost = (deposit * rate) / 100; // 보증금을 묶어 두며 포기하는 연 이자
  const rentCost = monthlyRent * 12;
  const conversionRate = deposit > 0 ? (rentCost / deposit) * 100 : 0;
  const gap = rentCost - jeonseCost;
  const barMax = Math.max(jeonseCost, rentCost, 1);

  const banner =
    gap > 0
      ? {
          tone: 'good' as const,
          icon: <House className='size-4 shrink-0' />,
          text: `전월세전환율 ${fmtPct(conversionRate)}가 시장금리 ${fmtPct(rate)}보다 높다. 같은 집에 사는 값을 월세로 치르면 연 ${fmtMan(gap)}을 더 낸다. 임차인은 전세를 고른다.`,
        }
      : {
          tone: 'accent' as const,
          icon: <Wallet className='size-4 shrink-0' />,
          text: `전월세전환율 ${fmtPct(conversionRate)}가 시장금리 ${fmtPct(rate)}보다 낮다. 보증금을 은행에 넣고 월세를 내는 편이 연 ${fmtMan(-gap)} 이득이다. 금리가 오르면 전세 수요가 월세로 옮겨 가는 이유다.`,
        };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='보증금은 임대인이 받은 무이자 대출이다'>
        전세는 집을 빌리는 계약이지만 돈의 흐름만 떼어 보면 임차인이 임대인에게 목돈을 무이자로 빌려주는 거래다.
        임차인은 이자 대신 거주권을 받고, 임대인은 이자 없는 돈을 손에 쥔다. 그래서 전세의 진짜 값은 임차인이 포기한
        이자이고, 이것을 월세로 환산한 비율이 전월세전환율이다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Banknote className='size-4 text-sky-500' />}
          label='전세보증금'
          value={depositEok}
          onChange={setDepositEok}
          min={1}
          max={10}
          step={0.5}
          format={fmtEok}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='시장금리'
          value={rate}
          onChange={setRate}
          min={0}
          max={8}
          step={0.1}
          format={fmtPct}
          hint='보증금을 은행에 넣어 두었다면 받았을 이자율. 전세대출을 썼다면 그 대출 금리로 읽어도 된다.'
        />
        <ControlSlider
          icon={<Wallet className='size-4 text-amber-500' />}
          label='같은 집의 월세'
          value={monthlyRent}
          onChange={setMonthlyRent}
          min={20}
          max={400}
          step={5}
          format={fmtMan}
          hint='비교를 단순하게 하려고 월세 보증금은 없다고 본다.'
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Metric label='전세의 연 비용' value={fmtMan(jeonseCost)} sub='포기한 이자' tone='accent' />
        <Metric label='월세의 연 비용' value={fmtMan(rentCost)} sub='통장에서 나가는 돈' tone='bad' />
        <Metric
          label='전월세전환율'
          value={fmtPct(conversionRate)}
          sub={`시장금리 ${fmtPct(rate)}`}
          tone={conversionRate > rate ? 'bad' : 'good'}
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='전세로 살 때 1년치 값'
          value={jeonseCost}
          max={barMax}
          className='bg-sky-500'
          format={fmtMan}
          sub={`보증금 ${fmtEok(depositEok)}을 묶어 두며 포기한 이자`}
        />
        <CostBar
          label='월세로 살 때 1년치 값'
          value={rentCost}
          max={barMax}
          className='bg-amber-500'
          format={fmtMan}
          sub={`월 ${fmtMan(monthlyRent)} × 12개월`}
        />
        <CostBar
          label='임대인이 보증금에서 얻는 연 수익'
          value={jeonseCost}
          max={barMax}
          className='bg-emerald-500'
          format={fmtMan}
          sub='임차인이 포기한 이자가 그대로 임대인에게 간다'
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <ExplainCard
        icon={<Landmark className='size-4 text-sky-500' />}
        title='왜 한국에만 전세가 있나'
        preview='은행이 대출을 잘 안 해 주던 시절, 임대인은 임차인에게서 직접 돈을 빌렸다.'
        body={
          <>
            <p>
              전세는 제도가 만든 것이 아니라 자금 사정이 만든 관행이다. 고성장·고금리 시기에 임대인은 은행 대출을 받기
              어려웠고, 받더라도 이자가 비쌌다. 임차인에게 목돈을 받아 그 돈을 굴리면 이자 없이 자금을 조달하는
              셈이었다. 임차인 쪽에서도 매달 나가는 돈 없이 목돈만 맡기면 되니 저축을 이어 갈 수 있었다. 양쪽 모두
              금리가 높을수록 이득이 커지는 구조였다.
            </p>
            <p className='mt-2'>
              그래서 금리가 내려가면 전세의 경제적 근거가 약해진다. 임대인이 보증금을 굴려 얻을 이자가 줄어들면 차라리
              월세를 받으려 하고, 그 결과가 월세 전환과 반전세다. 반대로 금리가 오르면 전세대출 이자가 월세를 웃돌면서
              임차인이 월세로 옮겨 간다. 어느 쪽이든 전환율과 금리의 차이가 사람들을 움직인다.
            </p>
          </>
        }
      />
    </div>
  );
}
