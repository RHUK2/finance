# 캐스케이드 시각화를 공용 컴포넌트로 추출한다

Status: resolved
Section: S1
Tags: 중복

`adoption-cascade`와 `hodl-dilemma`의 렌더 블록이 약 60줄 동일하다.

```text
Card
├─ RoundControls (props 8개 동일)
├─ 축 라벨 좌/우 (낮음 ↔ 높음)
├─ AgentGrid orientation='column' highlight=...
├─ 격자 읽는 법 설명문
├─ Legend 행 + 오른쪽 끝 보조 설명
└─ Sparkline cursor=round heightClass='h-12'
Metric 그리드 3칸
완료 배너
```

ADR-0001이 두 시뮬레이션의 모델 구조가 같다고 이미 기록했다. 시각화가 같은 것은 그 결과다.

## 할 일

- `src/components/simulation.tsx`에 공용 컴포넌트를 추가한다. 축 라벨, 격자 상태, 설명문, 범례, 스파크라인, 지표를 props로 받는다
- `softwar/primordial-economics`도 같은 프리미티브를 쓰지만 정렬 축이 임계값이 아니라 투사력이고 격자 읽는 법이 다르다. 포함 여부는 실물을 보고 판단한다
- ADR-0001에 시각화 공유가 모델 공유에서 따라온다는 점을 덧붙일지 검토한다

## Answer

`CascadeStage`를 `src/components/simulation.tsx`에 추가하고 `adoption-cascade`·`hodl-dilemma`·`primordial-economics` 셋이 쓰도록 했다. `primordial-economics`는 정렬·축 라벨·읽는 법·궤적이 없어 그대로는 들어갈 수 없었으므로 함께 고쳤다(티켓 08). ADR-0001에 이 확장을 기록했다.
