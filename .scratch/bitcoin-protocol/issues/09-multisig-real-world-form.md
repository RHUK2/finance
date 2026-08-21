# 다중서명이 실전 형태와 Taproot를 다루지 않는다

Status: resolved
Section: P1
Tags: 정정

scriptPubKey를 bare multisig(`OP_2 <pk> <pk> <pk> OP_3 OP_CHECKMULTISIG`)로 그대로 보여준다. 구조를 드러내는 데는 좋지만 실전에서는 P2SH·P2WSH로 감싸 쓴다는 점이 화면에 없다.

Taproot도 빠져 있다. 바로 앞 페이지 `script-verify`가 Taproot를 세 타입 중 하나로 비중 있게 다루는데, 다중서명 페이지로 넘어오면 Taproot가 사라진다.

## Answer

인트로에 bare multisig임을 밝히고 실전에서는 P2SH·P2WSH로 감싼다는 문장을 넣었다.

`Taproot에서는 OP_CHECKMULTISIG를 쓰지 않는다` 설명 카드를 추가했다. `OP_CHECKSIGADD`로 바뀐 점, 참가자 전원이 협조하면 키를 합쳐 단일 서명으로 보이므로 다중서명이었다는 사실조차 체인에 드러나지 않는다는 점을 담았다.
