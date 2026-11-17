import type { useEndpoint } from '@/hooks/use-endpoint';
import type { FearGreedData } from '@/lib/loaders/fear-greed';
import type { MvrvData } from '@/lib/loaders/mvrv';

// pnpm type에 포함되는 타입 전용 검증이다. 훅을 실행하지 않는다.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
type AcceptMvrv<T extends MvrvData | undefined> = T;

type FearGreedResult = ReturnType<typeof useEndpoint<'fear-greed'>>['data'];
type MvrvResult = ReturnType<typeof useEndpoint<'mvrv'>>['data'];

export type FearGreedMatches = Assert<Equal<FearGreedResult, FearGreedData | undefined>>;
export type MvrvMatches = Assert<Equal<MvrvResult, MvrvData | undefined>>;

// @ts-expect-error 공포·탐욕 응답을 MVRV 응답으로 대입할 수 없어야 한다.
export type RejectFearGreedAsMvrv = AcceptMvrv<FearGreedResult>;
