# 이슈 트래커: GitHub

이 저장소의 이슈와 스펙은 GitHub 이슈(`RHUK2/finance`)로 관리한다. 모든 조작은 `gh` CLI로 한다.

## 규칙

- 이슈 만들기: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc으로 넘긴다
- 이슈 읽기: `gh issue view <번호> --json number,title,body,labels,comments`
- 이슈 목록: `gh issue list --state open --json number,title,body,labels,comments` 에 `--label`, `--state` 필터를 붙인다
- 하위 이슈: `gh issue create --parent <부모> ...` 또는 나중에 `gh issue edit <부모> --add-sub-issue <자식>`. 쓸 수 없으면 자식 본문 맨 위에 `Part of #<부모>`를 적는다
- 막는 이슈: `gh issue create --blocked-by <번호>` 또는 `gh issue edit <자식> --add-blocked-by <막는 이슈>`. 쓸 수 없으면 본문 맨 위에 `Blocked by: #<번호>`를 적는다. 막는 이슈가 모두 닫혀야 시작할 수 있다
- 코멘트: `gh issue comment <번호> --body "..."`
- 라벨: `gh issue edit <번호> --add-label "..."` / `--remove-label "..."`
- 닫기: `gh issue comment`로 이유를 남긴 뒤 `gh issue close <번호>`

저장소는 `git remote -v`에서 정해진다. 포크가 아니므로 `gh repo view --json nameWithOwner`가 `RHUK2/finance`인지 첫 `gh issue create` 전에 한 번 확인한다.

## 공개 저장소 주의

저장소가 공개라 이슈 본문은 누구나 읽는다. 화면 문구·경계값·테스트 공백 같은 코드 품질 항목은 그대로 쓰되, 키·토큰·배포 환경 값은 적지 않는다.

## PR을 triage 대상으로 보는가

없음. 이 저장소는 외부 PR을 기능 요청으로 다루지 않는다.

## 스킬이 "이슈 트래커에 발행"이라고 할 때

GitHub 이슈를 만든다.

## 스킬이 "해당 티켓을 가져온다"고 할 때

위 "이슈 읽기"대로 읽는다.

## 로컬에 남는 것

AI 작업 산출물(전수조사 보고서, flow 상태, 교차 리뷰 장부)은 이슈가 아니다. 커밋하지 않는 로컬 작업 폴더 `.scratch/`에 둔다. 오래 남겨야 할 내용만 아래로 옮긴다.

| 남길 것                           | 옮길 곳                  |
| --------------------------------- | ------------------------ |
| 다시 열어야 할 후속 작업          | GitHub 이슈              |
| 모델·구조 판단과 그 근거          | `docs/adr/`              |
| 프로젝트가 고른 용어              | `GLOSSARY.md`            |
| 코드 규약                         | `CLAUDE.md`              |
| 원문과 대조해 맞은 수치·연도·규격 | `docs/fact-check-log.md` |
