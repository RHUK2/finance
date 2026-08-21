// 주소 타입의 정체를 정의하는 단 하나의 출처.
//
// 같은 네 타입을 tx-concept(수수료), script-concept(서명·검증), bip-concept(파생 경로)가
// 각자 필요로 한다. 세 곳이 각자 테이블을 들고 있으면 라벨 문자열이 조금씩 갈라지고
// 어느 타입이 어느 페이지에 있는지도 어긋난다. 정체(값·라벨·스크립트 이름·purpose·
// 주소 접두어)는 여기서만 정하고, 도메인별 수치는 각 lib이 여기에 덧붙인다.

export type AddrType = 'legacy' | 'nested' | 'native' | 'taproot';

export const ADDRESS_TYPES = [
  {
    value: 'legacy',
    label: 'Legacy (P2PKH)',
    script: 'P2PKH',
    purpose: "44'",
    prefix: '1',
    charset: 'base58',
    // 접두어를 뺀 나머지 글자 수. base58check(버전 1 + hash160 20 + 체크섬 4 = 25바이트)는
    // 보통 34자로 인코딩된다.
    bodyLen: 33,
  },
  {
    value: 'nested',
    label: 'Nested SegWit (P2SH)',
    script: 'P2SH-P2WPKH',
    purpose: "49'",
    prefix: '3',
    charset: 'base58',
    bodyLen: 33,
  },
  {
    value: 'native',
    label: 'Native SegWit (P2WPKH)',
    script: 'P2WPKH',
    purpose: "84'",
    prefix: 'bc1q',
    charset: 'bech32',
    bodyLen: 38,
  },
  {
    value: 'taproot',
    label: 'Taproot (P2TR)',
    script: 'P2TR',
    purpose: "86'",
    prefix: 'bc1p',
    charset: 'bech32',
    bodyLen: 58,
  },
] as const;

export type AddressTypeMeta = (typeof ADDRESS_TYPES)[number];

export function addressType(value: AddrType): AddressTypeMeta {
  return ADDRESS_TYPES.find((t) => t.value === value) ?? ADDRESS_TYPES[0];
}
