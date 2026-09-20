#!/usr/bin/env bash
# 워크트리 안의 "추적되지 않는 공유 파일"을 기준 체크아웃으로의 심볼릭 링크로 만든다.
#
# 왜 필요한가:
#   환경 파일·Vercel 링크·로컬 설정은 git이 추적하지 않으므로 워크트리마다
#   따로 존재한다. 각자 수정되면 병합도 충돌도 알림도 없이 조용히 갈라진다.
#   실체를 하나로 만들면 갈라질 수 없다.
#
# 사용법:
#   새 워크트리를 만든 뒤 그 안에서 한 번 실행한다.
#     bash link-worktree-files.sh          내용이 같은 항목만 링크로 교체
#     bash link-worktree-files.sh --force  다른 항목도 기준 내용으로 덮어쓴다
#
#   기준 체크아웃은 `git worktree list`의 첫 항목(메인 체크아웃)을 자동으로 쓴다.
#   다른 곳을 기준으로 삼으려면 WORKTREE_LINK_BASE로 지정한다.
#
# 안전장치:
#   기본 모드는 사본 내용이 기준과 다르면 건드리지 않고 경고만 한다. 덮어쓰기 전에
#   사람이 내용을 합칠 기회를 준다. --force는 그 확인을 마친 뒤에만 쓴다.
#
# 브랜치마다 값이 달라야 하는 항목이 생기면 그 링크만 풀고 실제 파일로 되돌린다
# (rm 후 기준에서 cp). 그 상태로 다시 실행해도 내용이 다르면 건너뛰므로 덮어쓰이지 않는다.
#
# 포트는 링크 대상이 아니다:
#   워크트리마다 dev 서버 주소가 달라야 하므로 scripts/worktree-ports.mjs가 슬롯으로
#   나눠 준다. 환경 파일 하나를 공유해도 포트는 겹치지 않는다.

set -euo pipefail

BASE="${WORKTREE_LINK_BASE:-$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')}"

ITEMS=(
  .claude/settings.local.json
  .scratch
  .vercel
  .env.local
)

force=0
[ "${1:-}" = "--force" ] && force=1

here="$(pwd -P)"

if [ -z "$BASE" ] || [ ! -d "$BASE" ]; then
  echo "기준 체크아웃을 찾지 못했다. WORKTREE_LINK_BASE로 지정한다." >&2
  exit 1
fi
base="$(cd "$BASE" && pwd -P)"

if [ "$here" = "$base" ]; then
  echo "여기가 기준 체크아웃이다. 자기 자신을 링크할 수 없다." >&2
  exit 1
fi

if [ ! -e "$here/.git" ]; then
  echo "git 워크트리 안에서 실행해야 한다: $here" >&2
  exit 1
fi

linked=0
skipped=0
diverged=()

for f in "${ITEMS[@]}"; do
  src="$base/$f"
  dst="$here/$f"

  [ -e "$src" ] || continue

  if [ -L "$dst" ]; then
    printf '  %-30s 이미 링크\n' "$f"
    continue
  fi

  if [ -e "$dst" ] && ! diff -rq "$src" "$dst" >/dev/null 2>&1; then
    if [ "$force" -eq 0 ]; then
      printf '  %-30s 내용이 다름. 건너뜀 (합친 뒤 --force)\n' "$f"
      diverged+=("$f")
      skipped=$((skipped + 1))
      continue
    fi
    printf '  %-30s 내용이 다르지만 --force로 교체\n' "$f"
  fi

  rm -rf "$dst"
  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  printf '  %-30s 링크\n' "$f"
  linked=$((linked + 1))
done

echo
echo "기준: $base"
echo "링크 ${linked}개, 건너뜀 ${skipped}개"

if [ ${#diverged[@]} -gt 0 ]; then
  echo
  echo "다음 항목은 사본이 기준과 달라 그대로 두었다. 내용을 확인해 합친 뒤 --force로 다시 실행한다."
  for f in "${diverged[@]}"; do
    echo "  diff -ru \"$base/$f\" \"$here/$f\""
  done
  exit 2
fi
