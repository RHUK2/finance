# 주소 타입 정의를 한 곳으로 모은다

Status: resolved
Section: P1
Tags: 중복, 일관성

같은 주소 타입을 `lib/tx-concept.ts`와 `lib/script-concept.ts`가 각자 테이블로 들고 있다.

|              | `ADDR_TYPES`                        | `SCRIPT_ADDR_TYPES`                  |
| ------------ | ----------------------------------- | ------------------------------------ |
| 타입 수      | 4 (legacy, nested, native, taproot) | 3 (nested 없음)                      |
| 담는 값      | `purpose`, `inputVb`, `outputVb`    | `sigAlgo`, `unlockField`, `sigBytes` |
| taproot 라벨 | `Taproot (P2TR)`                    | `Taproot (P2TR, key-path)`           |
| 조회 함수    | `addrMeta`                          | `addrMeta`                           |

두 파일이 같은 이름 `addrMeta`를 export한다. Nested SegWit이 한쪽에만 있어 독자가 `트랜잭션 해부`에서 본 타입이 `스크립트·서명 검증`에서 사라진다. 라벨 문자열도 부분적으로만 일치해 같은 것을 가리킨다는 보장이 코드에 없다.

## 할 일

- 주소 타입의 정체(값·라벨·purpose)를 한 곳에서 정의한다
- 수수료 정보(vByte)와 서명 정보(sigAlgo·sigBytes)는 각 lib이 그 정의에 덧붙이는 구조로 만든다
- `addrMeta` 이름 충돌을 없앤다
- Nested SegWit을 `script-verify`에서도 다룰지, 아니면 왜 빠졌는지 화면에서 밝힐지 정한다

## Answer

`src/lib/address-types.ts`를 만들어 주소 타입의 정체(값·라벨·스크립트 이름·purpose·주소 접두어·본문 길이)를 한 곳에서 정의한다. 세 lib이 여기에 도메인 수치만 덧붙인다.

```text
address-types.ts   ADDRESS_TYPES  ← 정체 (4종)
  ├ tx-concept     + inputVb · outputVb
  ├ script-concept + sigAlgo · unlockField · sigBytes  (3종, nested 제외)
  └ bip-concept    PURPOSES 를 여기서 파생
```

`script-concept.addrMeta`를 `scriptAddrMeta`로 바꿔 `tx-concept.addrMeta`와의 이름 충돌을 없앴다.

Nested SegWit은 `script-verify`에서 계속 뺀다. 검증이 Native SegWit과 같고 P2SH 래퍼 한 겹이 더해질 뿐이라 스택 실행을 처음 배우는 자리에 넣으면 단계만 늘고 배울 게 없다. 대신 그 이유를 화면(③ 탭 인트로)과 코드 주석에 밝혔다.

주소 길이 오류도 함께 잡았다. P2PKH 본문이 32자(총 33자)였는데 실제 P2PKH는 보통 34자다. 33자로 고쳐 총 34자가 된다. 나머지 셋(P2SH 34, P2WPKH 42, P2TR 62)은 원래 정확했다.
