import { acquisitionTaxRate, HOLDING_TAX_RATE, schedule } from '@/lib/mortgage-models';

// 금액 단위는 만원. 비교를 단순하게 하려고 조달 조건 몇 가지는 고정한다.
export const LOAN_RATIO = 60; // 집값 대비 대출 비중
export const LOAN_TERM = 30;
export const DEPOSIT_RATE = 3; // 묶인 돈을 예금에 뒀다면 받았을 이자
// 취득세는 가격대별 누진이라 상수로 둘 수 없다. mortgage-models가 단일 출처다.
export const MONTHLY_DEPOSIT_RATIO = 10; // 월세 보증금은 전세 보증금의 이 비율

export function cumulativeInterest(price: number, rate: number) {
  const out = [0];
  for (const r of schedule((price * LOAN_RATIO) / 100, rate, LOAN_TERM, 'equal-payment'))
    out.push(out[out.length - 1] + r.interest);
  return out;
}

export function buyOrRent(
  price: number,
  years: number,
  growth: number,
  jeonseRatio: number,
  convRate: number,
  cumInterest: number[],
) {
  const loan = (price * LOAN_RATIO) / 100;
  const equity = price - loan;

  const interest = cumInterest[years * 12];

  const acqRate = acquisitionTaxRate(price);
  const acqTax = (price * acqRate) / 100;
  const holdTax = ((price * HOLDING_TAX_RATE) / 100) * years;
  const buyOpportunity = ((equity * DEPOSIT_RATE) / 100) * years;
  const buyFixed = interest + acqTax + holdTax + buyOpportunity;

  const priceGain = price * ((1 + growth / 100) ** years - 1);
  const buyCost = buyFixed - priceGain;

  const deposit = (price * jeonseRatio) / 100;
  const jeonseCost = ((deposit * DEPOSIT_RATE) / 100) * years;

  const monthlyDeposit = (deposit * MONTHLY_DEPOSIT_RATIO) / 100;
  const monthlyRent = ((deposit - monthlyDeposit) * convRate) / 100 / 12;
  const rentCost = monthlyRent * 12 * years + ((monthlyDeposit * DEPOSIT_RATE) / 100) * years;

  // 매수가 전세보다 싸지려면 집값이 해마다 얼마나 올라야 하는가.
  // buyFixed - price*((1+g)^years - 1) = jeonseCost 를 g에 대해 푼다.
  // ratio ≤ 0이면 집값이 0이 돼도(g = −100%) 매수가 전세보다 싸다는 뜻이라 손익분기 상승률이 없다.
  const ratio = 1 + (buyFixed - jeonseCost) / price;
  const breakeven = ratio <= 0 ? null : (ratio ** (1 / years) - 1) * 100;

  return {
    deposit,
    monthlyDeposit,
    monthlyRent,
    loan,
    equity,
    interest,
    acqRate,
    acqTax,
    holdTax,
    buyOpportunity,
    priceGain,
    buyCost,
    jeonseCost,
    rentCost,
    breakeven,
  };
}
