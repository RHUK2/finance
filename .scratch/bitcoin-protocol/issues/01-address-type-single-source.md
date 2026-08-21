# 주소 타입 정의를 한 곳으로 모은다

Status: needs-triage
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
