'use client';

import { useState } from 'react';

import { Percent, Ruler, TrendingDown, TriangleAlert } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { modifiedDuration, rateShock, type Bond } from './models';

const FACE = 1_000_000;

// 표면금리와 시장금리를 같게 둔 액면 채권 셋. 만기만 다르므로 같은 금리 충격에
// 가격이 얼마나 다르게 반응하는지가 만기 하나로만 갈린다.
const LADDER = [2, 10, 30];

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtSignedPct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`;

export function Duration() {
  const [years, setYears] = useState(10);
  const [couponRate, setCouponRate] = useState(0.03);
  const [delta, setDelta] = useState(0.01);

  const ytm = 0.03;
  const bond: Bond = { face: FACE, couponRate, years, ytm };
  const md = modifiedDuration(bond);
  const shock = rateShock(bond, delta);

  const ladder = LADDER.map((y) => {
    const b: Bond = { face: FACE, couponRate, years: y, ytm };
    return { years: y, loss: Math.abs(rateShock(b, delta).actualPct) };
  });
  const maxLoss = Math.max(...ladder.map((l) => l.loss), 0.01);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 1%p라도 채권마다 다르게 아프다'>
        금리가 오르면 채권 가격이 떨어진다는 것까지는 앞 탭에서 봤다. 그럼 얼마나 떨어지나. 답은 돈을 언제 돌려받느냐에
        달려 있다. 회수가 멀수록 할인이 오래 작용해 더 크게 흔들린다. 그 회수 시점의 무게중심을 년 단위로 잰 것이
        듀레이션이고, 금리 1%p에 가격이 몇 % 움직이는지를 거의 그대로 알려 준다. 시장금리 3%에 액면 발행된 채권을
        기준으로 둔다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Ruler className='size-4 text-sky-500' />}
          label='잔존 만기'
          value={years}
          onChange={setYears}
          min={1}
          max={30}
          step={1}
          format={(v) => `${v}년`}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='표면금리'
          value={couponRate}
          onChange={setCouponRate}
          min={0}
          max={0.1}
          step={0.005}
          format={fmtPct}
          hint='이자를 많이 줄수록 원금 회수가 앞당겨져 듀레이션이 짧아진다. 0%(할인채)일 때 듀레이션은 만기와 같다.'
        />
        <ControlSlider
          icon={<TrendingDown className='size-4 text-rose-500' />}
          label='금리 변동폭'
          value={delta}
          onChange={setDelta}
          min={-0.03}
          max={0.03}
          step={0.0025}
          format={(v) => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(2)}%p`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='수정 듀레이션' value={`${md.toFixed(2)}년`} sub='금리 1%p당 가격 민감도' />
        <Metric
          label='실제 가격 변화'
          value={fmtSignedPct(shock.actualPct)}
          tone={shock.actualPct >= 0 ? 'good' : 'bad'}
          sub={`${Math.round(shock.before).toLocaleString('ko-KR')} → ${Math.round(shock.after).toLocaleString('ko-KR')}원`}
        />
        <Metric
          label='듀레이션 근사'
          value={fmtSignedPct(shock.approxPct)}
          sub={`실제와 ${Math.abs(shock.convexityGap).toFixed(2)}%p 차이`}
        />
      </div>

      <StatusBanner
        tone={Math.abs(shock.convexityGap) < 0.1 ? undefined : 'accent'}
        icon={<TriangleAlert className='size-4 shrink-0' />}
      >
        <span className='leading-relaxed font-normal'>
          {/* 볼록성 때문에 실제 가격은 언제나 직선 근사보다 위에 있다. 그래서 오를 때는 근사보다
              덜 빠지고 내릴 때는 근사보다 더 오른다. 이 차이의 부호가 뒤집히는 일은 없다. */}
          {Math.abs(shock.convexityGap) < 0.1
            ? '변동폭이 작아 듀레이션 근사가 실제와 거의 같다. 이 구간에서는 직선으로 봐도 된다.'
            : `실제는 근사보다 ${delta >= 0 ? '덜 빠진다' : '더 오른다'}. 가격과 금리의 관계가 직선이 아니라 아래로 볼록한 곡선이라, 근사는 언제나 보유자에게 불리한 쪽으로 빗나가고 금리가 크게 움직일수록 그 차이가 벌어진다(볼록성).`}
        </span>
      </StatusBanner>

      <Card className='gap-3 p-4'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>만기만 다른 세 채권</span>
          <span className='text-muted-foreground text-xs'>
            금리 {delta >= 0 ? '+' : '−'}
            {Math.abs(delta * 100).toFixed(2)}%p일 때 가격 변동폭
          </span>
        </div>
        {ladder.map((l) => (
          <CostBar
            key={l.years}
            label={`${l.years}년물`}
            value={l.loss}
            max={maxLoss}
            className={delta >= 0 ? 'bg-rose-500' : 'bg-emerald-500'}
            format={(v) => `${v.toFixed(1)}%`}
          />
        ))}
        <p className='text-muted-foreground text-xs'>
          표면금리가 같아도 만기가 길면 같은 금리 충격에 몇 배로 흔들린다. 2022년에 채권이 안전자산이 아니었다는 말이
          나온 것은 이 때문이다. 부도가 난 것이 아니라 금리가 빠르게 오르는 동안 장기물 가격이 주식만큼 빠졌다.
        </p>
      </Card>

      <ExplainCard
        icon={<Ruler className='size-4 text-sky-500' />}
        title='듀레이션은 왜 만기보다 짧은가'
        preview='만기 전에 받는 이자가 원금 회수의 일부를 앞당기기 때문이다.'
        body='만기 10년 채권이라도 돈을 10년 뒤에 한 번에 받는 것은 아니다. 해마다 이자가 들어오고, 그만큼 투자금 회수는 앞당겨진다. 각 현금흐름이 들어오는 시점을 그 현재가치로 가중해 평균 낸 것이 맥컬리 듀레이션이고, 그래서 이자를 주는 채권은 언제나 만기보다 짧다. 이자를 한 푼도 주지 않는 할인채(제로쿠폰)만이 듀레이션과 만기가 같다. 표면금리 슬라이더를 0으로 내리면 그 일치가 보인다.'
      />
      <ExplainCard
        icon={<TrendingDown className='size-4 text-rose-500' />}
        title='만기까지 들고 가면 손해가 아닌 것 아닌가'
        preview='개인에게는 대체로 맞지만, 시가평가를 하는 기관에는 그 사이의 평가손이 실제 위험이다.'
        body='액면 상환을 약속한 국채라면 만기까지 들고 갈 수 있는 사람에게 중간의 가격 하락은 장부상의 일이다. 문제는 그 사이에 돈이 필요해지는 경우다. 2023년 미국의 지역은행 파산이 그 사례다. 예금 인출이 몰리자 장기 국채를 만기 전에 팔아야 했고, 금리 상승으로 이미 값이 빠진 상태라 장부상의 손실이 실현됐다. 부도 위험이 없는 채권에도 금리 위험은 따로 있다는 것이 듀레이션이 말하는 바다.'
      />
    </div>
  );
}
