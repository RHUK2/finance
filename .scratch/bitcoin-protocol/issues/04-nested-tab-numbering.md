# 번호 체계가 한 화면에서 중첩된다

Status: resolved
Section: P2
Tags: 일관성

`p2p-network/mempool-policy`는 탭 라벨이 `② 멤풀 수용 정책`인데, 그 안에서 `SectionIntro`가 다시 `① 신규 트랜잭션 수용 판정`, `② RBF: 멈춰 있는 tx를 수수료로 밀어내기`로 번호를 매긴다. 한 화면에 두 층의 번호가 겹쳐 어느 쪽 ②를 말하는지 모호해진다.

## 할 일

- 탭 안의 `SectionIntro` 번호를 걷어낸다. 탭 번호만 남긴다
- 그룹 전체에서 같은 중첩이 또 있는지 확인한다

## Answer

`mempool-policy`의 `SectionIntro` 두 개에서 번호를 뺐다. 탭 번호만 남는다.

그룹 전체를 훑어 같은 중첩이 또 있는지 확인했고, 이 한 곳뿐이었다.
