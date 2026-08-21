# 이슈 트래커: 로컬 마크다운

이 저장소의 이슈와 스펙은 `.scratch/` 아래 마크다운 파일로 관리한다.

`.scratch/`는 `.gitignore`에 있어 저장소에 커밋되지 않는다. 작업 중 메모이므로 로컬에만 둔다. 오래 남아야 하는 것은 아래로 옮긴다.

| 남길 것                           | 옮길 곳                  |
| --------------------------------- | ------------------------ |
| 모델·구조 판단과 그 근거          | `docs/adr/`              |
| 프로젝트가 고른 용어              | `CONTEXT.md`             |
| 코드 규약                         | `CLAUDE.md`              |
| 원문과 대조해 맞은 수치·연도·규격 | `docs/fact-check-log.md` |

티켓이 닫힐 때 그 안에 오래 갈 내용이 있으면 위 문서로 옮기고 티켓에는 남기지 않는다. 로컬 파일은 다른 기기·워크트리·클론에서 보이지 않는다.

## 규칙

- 기능 하나당 디렉터리 하나: `.scratch/<feature-slug>/`
- 스펙 파일은 `.scratch/<feature-slug>/spec.md`
- 구현 이슈는 티켓당 파일 하나, `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, `01`부터 번호 매김. 하나로 합친 티켓 파일은 만들지 않는다
- Triage 상태는 각 이슈 파일 상단의 `Status:` 줄에 기록한다 (역할 문자열은 `triage-labels.md` 참조)
- 코멘트와 대화 이력은 파일 하단 `## Comments` 제목 아래에 덧붙인다

## 스킬이 "이슈 트래커에 발행"이라고 할 때

`.scratch/<feature-slug>/` 아래에 새 파일을 만든다 (디렉터리가 없으면 생성).

## 스킬이 "해당 티켓을 가져온다"고 할 때

참조된 경로의 파일을 읽는다. 보통 사용자가 경로나 이슈 번호를 직접 넘긴다.

## Wayfinding 동작

`/wayfinder`가 사용한다. 맵 파일 하나에 티켓당 자식 파일 하나가 붙는 구조다.

- 맵: `.scratch/<effort>/map.md`. Notes / Decisions-so-far / Fog 본문을 담는다
- 자식 티켓: `.scratch/<effort>/issues/NN-<slug>.md`, `01`부터 번호 매김, 본문에 질문을 담는다. `Type:` 줄에 티켓 종류(`research` / `prototype` / `grilling` / `task`), `Status:` 줄에 `claimed` / `resolved`를 기록한다
- 블로킹: 상단의 `Blocked by: NN, NN` 줄. 나열된 파일이 모두 `resolved`면 해제된다
- 프런티어: `.scratch/<effort>/issues/`를 훑어 열려 있고, 블로킹이 없고, 아직 claim되지 않은 파일을 찾는다. 번호가 빠른 쪽이 우선
- Claim: 작업 시작 전에 `Status: claimed`로 바꾸고 저장한다
- Resolve: `## Answer` 제목 아래에 답을 덧붙이고 `Status: resolved`로 바꾼 뒤, `map.md`의 Decisions-so-far에 요약과 링크를 남긴다
