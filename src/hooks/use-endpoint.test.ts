import { describe, expect, it } from 'vitest';

import { responseError, type JsonEndpointData } from './use-endpoint';

describe('responseError', () => {
  it.each([400, 404, 500, 503])('상태 코드 %s와 문자열 error를 오류에 담는다', async (status) => {
    const response = Response.json({ error: '데이터를 불러오지 못했습니다' }, { status });
    const error = await responseError('market', response);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(`Failed to fetch market (HTTP ${status}): 데이터를 불러오지 못했습니다`);
  });

  it.each([null, 42, 'text', [], {}, { error: null }, { error: 500 }, { error: { message: 'nested' } }])(
    '문자열 error가 없는 JSON은 상세 문구를 생략한다: %j',
    async (body) => {
      const error = await responseError('fred', Response.json(body, { status: 502 }));
      expect(error.message).toBe('Failed to fetch fred (HTTP 502)');
    },
  );

  it.each(['<html>Bad Gateway</html>', 'not JSON', ''])('JSON이 아닌 본문도 HTTP 상태를 유지한다: %j', async (body) => {
    const error = await responseError('economy', new Response(body, { status: 502 }));
    expect(error.message).toBe('Failed to fetch economy (HTTP 502)');
  });
});

// 타입 제약은 pnpm type의 @ts-expect-error 검사로 확인한다.
it('JSON 응답 타입은 선택 필드를 허용하고 특수 객체를 거부한다', () => {
  const payload: JsonEndpointData<{ history: { value: number }[]; note?: string }> = { history: [{ value: 1 }] };
  // @ts-expect-error Date는 HTTP JSON 응답과 같은 타입이 아니다.
  const date: JsonEndpointData<{ nested: Date }> = { nested: new Date() };
  // @ts-expect-error Map은 JSON 객체가 아니다.
  const map: JsonEndpointData<Map<string, number>> = new Map();
  expect(payload.history[0].value).toBe(1);
  expect(date.nested).toBeInstanceOf(Date);
  expect(map).toBeInstanceOf(Map);
});
