# AGENTS.md

어떤 규약·용어·이슈가 어디에 있는지 정하는 라우팅 문서다. 규칙은 각 정본이 갖고 이 파일은 경로만 갖는다. 하네스가 갈려도(Claude Code·Codex 등) 같은 문서를 읽게 하려는 것이다.

## 정본

| 대상                          | 정본                               |
| ----------------------------- | ---------------------------------- |
| 코드 규약·아키텍처            | `CLAUDE.md`                        |
| 용어                          | `CONTEXT.md`                       |
| 모델·구조 판단과 그 근거      | `docs/adr/`                        |
| 원문과 대조한 수치·연도       | `docs/fact-check-log.md`           |
| 명령어                        | `package.json`의 `scripts`         |
| 워크트리 포트                 | `scripts/worktree-ports.mjs`       |
| 워크트리가 공유하는 로컬 파일 | `link-worktree-files.sh`의 `ITEMS` |
| 동결된 lint 빚                | `eslint-suppressions.json`         |

커밋 전에 `pnpm inspect`를 돌린다. CI가 없어 이것이 유일한 게이트다.

## Agent skills

| 스킬          | 이 레포의 대응                                  | 정본                           |
| ------------- | ----------------------------------------------- | ------------------------------ |
| Issue tracker | 로컬 마크다운 `.scratch/<feature>/` (gitignore) | `docs/agents/issue-tracker.md` |
| Triage labels | 기본 다섯 라벨을 그대로 쓴다                    | `docs/agents/triage-labels.md` |
| Domain docs   | 단일 컨텍스트. 루트 `CONTEXT.md` + `docs/adr/`  | `docs/agents/domain.md`        |
