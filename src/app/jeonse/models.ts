// 금액은 억원. depositLoan만 비용을 만원으로 반환한다.

export function reverseJeonse(price: number, ratio: number, priceDrop: number, rentDrop: number) {
  const deposit = (price * ratio) / 100; // 2년 전 계약한 보증금. 시세와 무관하게 전액 반환 대상
  const nowPrice = price * (1 - priceDrop / 100);
  const nowMarketDeposit = deposit * (1 - rentDrop / 100); // 지금 새 임차인에게 받을 수 있는 금액
  const refundGap = Math.max(0, deposit - nowMarketDeposit); // 집주인이 현금으로 메워야 할 차액
  // 계약 당시 보증금을 지금 집값으로 나눈 값이다. 새 임차인이 내는 보증금으로 재는 시장의
  // 전세가율(아래 marketRatio)과는 분자가 달라 숫자가 크게 벌어지므로 이름을 갈라 둔다.
  const depositRatio = nowPrice > 0 ? (deposit / nowPrice) * 100 : Infinity;
  const marketRatio = nowPrice > 0 ? (nowMarketDeposit / nowPrice) * 100 : Infinity;
  // 억원 단위 1e-9 미만의 차이는 계산 경로에 따른 부동소수 오차로 본다.
  const atParity = Math.abs(deposit - nowPrice) < 1e-9;
  const underwater = atParity ? 0 : Math.max(0, deposit - nowPrice); // 집을 팔아도 모자라는 금액
  return { deposit, nowPrice, nowMarketDeposit, refundGap, depositRatio, marketRatio, underwater, atParity };
}

export function depositPriority(
  deposit: number,
  mortgage: number,
  salePrice: number,
  senior: boolean,
  moveIn: boolean,
  fixedDate: boolean,
) {
  // senior는 대항력 효력 발생과 확정일자 취득이 모두 근저당보다 앞선다는 가정이다.
  // 대항력과 우선변제권은 모두 전입신고와 점유를 전제로 한다.
  const hasOpposing = moveIn && senior;
  const canClaim = moveIn && fixedDate;
  const tenantFirst = canClaim && senior;

  // 낙찰가를 순위대로 나눈다.
  let remaining = salePrice;
  const tenantPaidFirst = tenantFirst ? Math.min(deposit, remaining) : 0;
  remaining -= tenantPaidFirst;
  const bankPaid = Math.min(mortgage, remaining);
  remaining -= bankPaid;
  const tenantPaidLater = !tenantFirst && canClaim ? Math.min(deposit, remaining) : 0;

  const distributed = tenantPaidFirst + tenantPaidLater;
  // 대항력이 있으면 못 받은 잔액을 낙찰자가 떠안는다.
  const assumed = hasOpposing ? Math.max(0, deposit - distributed) : 0;
  const recovered = distributed + assumed;
  const lost = Math.max(0, deposit - recovered);
  return { hasOpposing, canClaim, tenantFirst, bankPaid, distributed, assumed, recovered, lost };
}

export function depositLoan(depositEok: number, rate: number, monthlyRent: number) {
  const deposit = depositEok * 10000;
  const jeonseCost = (deposit * rate) / 100; // 보증금을 묶어 두며 포기하는 연 이자
  const rentCost = monthlyRent * 12;
  const conversionRate = deposit > 0 ? (rentCost / deposit) * 100 : 0;
  const gap = rentCost - jeonseCost;
  // 슬라이더 값의 곱이라 같은 금액도 부동소수 끝자리가 갈릴 수 있다. 만원의 1/1000 안쪽은 같다고 본다.
  const tie = Math.abs(gap) < 1e-3;
  return { jeonseCost, rentCost, conversionRate, gap, tie };
}

export function gapInvestment(price: number, ratio: number, change: number) {
  const deposit = (price * ratio) / 100;
  const gap = price - deposit;
  const leverage = gap > 0 ? price / gap : Infinity;
  const newPrice = price * (1 + change / 100);
  const profit = newPrice - price;
  const roe = gap > 0 ? (profit / gap) * 100 : 0;
  return { deposit, gap, leverage, newPrice, profit, roe };
}
