import { afterEach, describe, expect, it, vi } from 'vitest';
import { checksumResult, diffPositions, generateSigningKey, groupHex, sha256Hex, signText, verifyText } from './models';

afterEach(() => vi.restoreAllMocks());

describe('릴리스 해시', () => {
  it('SHA-256 알려진 벡터를 계산한다', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  it('빈 문자열과 마지막 짧은 묶음, 사용자 묶음 크기를 표시한다', () => {
    expect(groupHex('')).toBe('');
    expect(groupHex('123456789')).toBe('1234 5678 9');
    expect(groupHex('12345', 2)).toBe('12 34 5');
  });
  it('칠할 첫 문자열의 길이만큼 비교하고 상대의 없는 자리도 다름으로 센다', () => {
    expect(diffPositions('', 'ab')).toEqual([]);
    expect(diffPositions('ab', '')).toEqual([true, true]);
    expect(diffPositions('abc', 'ab')).toEqual([false, false, true]);
    expect(diffPositions('ab', 'abc')).toEqual([false, false]);
    expect(diffPositions('ab', 'ac')).toEqual([false, true]);
  });
  it('digest 실패를 정상 해시로 바꾸지 않고 전파한다', async () => {
    vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(new Error('unavailable'));
    await expect(sha256Hex('abc')).rejects.toThrow('unavailable');
  });
});

describe.each(['Ed25519', 'ECDSA P-256'] as const)('%s 릴리스 서명', (algo) => {
  it('원본·목록 변조·다른 키·공격자 키 시나리오를 실제 WebCrypto로 검증한다', async () => {
    if (algo === 'ECDSA P-256') {
      const original = crypto.subtle.generateKey.bind(crypto.subtle);
      vi.spyOn(crypto.subtle, 'generateKey').mockImplementation((...args: Parameters<typeof original>) => {
        if ((args[0] as Algorithm).name === 'Ed25519') return Promise.reject(new Error('unsupported'));
        return original(...args);
      });
    }
    const dev = await generateSigningKey();
    const attacker = await generateSigningKey();
    expect(dev.algo).toBe(algo);
    expect(dev.fingerprint).toMatch(/^[0-9a-f]{32}$/);
    expect(attacker.fingerprint).not.toBe(dev.fingerprint);
    const manifest = '릴리스 v1.0.0';
    const tampered = manifest + ' 변조';
    const signature = await signText(dev, manifest);
    expect(await verifyText(dev, signature, manifest)).toBe(true);
    expect(await verifyText(dev, signature, tampered)).toBe(false);
    expect(await verifyText(attacker, signature, manifest)).toBe(false);
    expect(await verifyText(attacker, await signText(attacker, tampered), tampered)).toBe(true);
  });
});

describe('체크섬 판정 상태', () => {
  it('계산 중이거나 실패했으면 일치 여부를 판정하지 않는다', () => {
    expect(checksumResult({ status: 'pending' }, '새 입력')).toEqual({
      status: 'pending',
      ready: null,
      matches: null,
    });
    expect(checksumResult({ status: 'error', text: '새 입력' }, '새 입력')).toEqual({
      status: 'error',
      ready: null,
      matches: null,
    });
  });

  it('이전 입력의 성공과 실패는 새 입력에서 계산 중으로 취급한다', () => {
    for (const state of [
      { status: 'ready', text: '이전 입력', base: 'abc', now: 'abc' },
      { status: 'error', text: '이전 입력' },
    ] as const) {
      expect(checksumResult(state, '새 입력')).toEqual({ status: 'pending', ready: null, matches: null });
    }
  });

  it.each([
    ['abc', true],
    ['abd', false],
  ] as const)('현재 입력의 해시 %s를 대조한다', (now, matches) => {
    const state = { status: 'ready', text: '현재 입력', base: 'abc', now } as const;
    expect(checksumResult(state, '현재 입력')).toEqual({ status: 'ready', ready: state, matches });
  });
});
