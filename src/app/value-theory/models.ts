// 가치론 페이지의 순수 계산 모델. 한 페이지에서만 쓰이므로 src/lib이 아니라 여기 둔다
// (CLAUDE.md "설명 페이지의 모델 배치").
//
// 여기 나오는 금액은 전부 지불의사다. 한계효용을 화폐로 잰 값이며, 만족 자체를
// 재는 단위는 이 프로젝트에 없다. CONTEXT.md의 한계효용·지불의사 항목 참조.

// 물 한 방울도 없는 상태에서 첫 잔의 지불의사. 마시지 못하면 죽으므로 목숨값이다.
// 상황이 달라져도 이 값은 같다. 갈리는 것은 그 다음 잔부터의 떨어지는 속도다.
export const FIRST_CUP_WON = 100_000_000;

export type Situation = 'city' | 'desert';

export const SITUATIONS: Record<Situation, { label: string; decay: number; diamondWon: number; note: string }> = {
  city: {
    label: '도시',
    decay: 0.35,
    diamondWon: 5_000_000,
    note: '수도꼭지가 옆에 있어 다음 잔이 늘 확보돼 있다. 한 잔 더 얻는 값어치가 빠르게 떨어진다.',
  },
  desert: {
    label: '사막',
    decay: 0.8,
    diamondWon: 500_000,
    note: '다음 보급이 언제일지 모른다. 이미 여러 잔을 쥐고 있어도 한 잔 더가 여전히 아쉽다.',
  },
};

// 잔 수를 한 잔 늘릴 때 늘어나는 지불의사. 앞 잔이 이미 채운 몫만큼 다음 잔의
// 값어치가 깎이므로 등비로 떨어진다.
export function waterMarginalWon(cups: number, decay: number): number {
  return FIRST_CUP_WON * decay ** (cups - 1);
}

// 첫 잔부터 지금 잔까지의 지불의사를 모두 더한 값. 한계효용과 이름이 닮았고 같은
// 화면에 나란히 놓이므로, 화면에서는 어느 기준인지를 반드시 적는다.
export function waterTotalWon(cups: number, decay: number): number {
  return FIRST_CUP_WON * ((1 - decay ** cups) / (1 - decay));
}

export const MAX_CUPS = 20;
