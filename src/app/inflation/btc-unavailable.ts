// 환산된 시세가 있으면 배경 요청 상태보다 우선한다.
export function btcUnavailableReason({
  hasPrices,
  isPending,
  isError,
  needsFx,
  hasFx,
}: {
  hasPrices: boolean;
  isPending: boolean;
  isError: boolean;
  needsFx: boolean;
  hasFx: boolean;
}): string | undefined {
  if (hasPrices) return undefined;
  if (isPending) return '비트코인 시세를 불러오는 중…';
  if (isError) return '비트코인 시세를 받지 못했다';
  if (needsFx && !hasFx) return '환율 데이터가 없어 비트코인 원화 시세를 계산하지 못했다';
  return '비트코인 시세 데이터가 없다';
}
