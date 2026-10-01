// 판정 어휘(tone) → 토큰 클래스 표. 공용 컴포넌트(Panel·Metric·StatusBanner·CascadeStage)가
// 모두 여기서 고른다.
//
// accent가 warn 토큰을 보는 것은 shadcn이 --color-accent를 호버 배경에 이미 쓰고 있어서다
// (globals.css 판정 색 주석). 이 매핑을 컴포넌트마다 따로 적으면 투명도나 토큰 이름을 바꿀 때
// 한쪽만 고쳐 같은 tone이 화면마다 다른 색이 된다. Tailwind는 소스에 그대로 적힌 문자열만 훑으므로
// 클래스는 조립하지 않고 통째로 적는다.

export type Tone = 'good' | 'bad' | 'accent';

/** 글자·아이콘. 모드별 명도를 갖는 본문용 토큰 */
export const TONE_TEXT: Record<Tone, string> = {
  good: 'text-good',
  bad: 'text-bad',
  accent: 'text-warn',
};

/** 테두리를 ring으로 긋는 상자(Panel) */
export const TONE_RING_SURFACE: Record<Tone, string> = {
  good: 'bg-good-surface/5 ring-good-surface/40',
  bad: 'bg-bad-surface/5 ring-bad-surface/40',
  accent: 'bg-warn-surface/5 ring-warn-surface/40',
};

/** 테두리를 border로 긋는 상자(StatusBanner) */
export const TONE_BORDER_SURFACE: Record<Tone, string> = {
  good: 'border-good-surface/40 bg-good-surface/5',
  bad: 'border-bad-surface/40 bg-bad-surface/5',
  accent: 'border-warn-surface/40 bg-warn-surface/5',
};
