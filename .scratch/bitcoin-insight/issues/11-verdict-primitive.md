# 판정 문구를 숫자용 Metric으로 표시한다

Status: resolved
Section: S1
Tags: 일관성

`softwar/abstract-vs-physical`이 `판정: 탈취됨 / 방어됨`을 `Metric`으로 렌더했다. `Metric`은 `tabular-nums`에 `text-xl`로 숫자를 보여 주는 자리인데 텍스트 판정이 들어가 있었다.

## Answer

`StatusBanner`로 바꿨다. tone 어휘(good/bad/accent)는 `Metric`과 공유하므로 색은 그대로다. `attack-game`의 결론 카드도 손으로 짠 `Card` + `cn` 조합이던 것을 `StatusBanner`로 통일했다.
