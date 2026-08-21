# 고지 방식이 그룹 안에 셋이었다

Status: resolved
Section: P1
Tags: 일관성

```text
공용 IllustrativeDisclaimer   8개 페이지
로컬 복제 배너                 wallet-keys  (티켓 06)
페이지 하단 각주               transactions
```

`transactions`의 각주는 위치도 문제였다. "① 탭은 Native SegWit 주소를 가정한다"는 ① 탭에서 수수료가 어느 기준으로 계산되는지를 정하는 정보인데, 페이지 맨 아래에 있어 그 탭을 볼 때는 보이지 않는다.

## Answer

`transactions`의 각주를 `IllustrativeDisclaimer`로 바꿔 탭 위로 올렸다. 문구도 그룹 규칙("실제로는 X인데 여기서는 Y로 줄였다")에 맞춰 무엇이 근사이고 무엇이 실제와 같은지 나눠 적었다.

Native SegWit 가정은 ① 탭의 `SectionIntro`로 옮기고 "주소 타입에 따라 얼마나 달라지는지는 ④ 탭에서 본다"로 연결했다.
