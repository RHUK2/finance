// 유한책임 예시. 금액은 억원이다.
export const CAPITAL = 50;
export const PERSONAL = 30;

export function limitedLiability(assets: number, debts: number, isCorp: boolean, pierced: boolean) {
  const shortfall = Math.max(0, debts - assets);
  const personalBurden = !isCorp || pierced ? Math.min(shortfall, PERSONAL) : 0;
  const creditorRecovered = Math.min(assets, debts) + personalBurden;
  const creditorLoss = shortfall - personalBurden;
  const shareholderRecovered = Math.max(0, assets - debts);
  const shareholderLoss = Math.max(0, CAPITAL - shareholderRecovered);
  const personalLossNote = isCorp
    ? personalBurden > 0
      ? '벽이 뚫렸다'
      : '회사 밖으로 번지지 않는다'
    : personalBurden > 0
      ? '사업주 개인 재산으로 갚는다'
      : '이번에는 빚을 사업 재산으로 모두 갚았다';
  return {
    shortfall,
    personalBurden,
    creditorRecovered,
    creditorLoss,
    shareholderRecovered,
    shareholderLoss,
    personalLossNote,
  };
}
