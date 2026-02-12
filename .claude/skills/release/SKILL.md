---
name: release
description: リリースワークフロー全体をガイド。リリースノート作成→X投稿ドラフト→Discord投稿＋GitHub Release の順に進行。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のリリースワークフロー全体をオーケストレーションする。各フェーズをユーザー確認しながら順に進行する。

## 全体フロー

```
Phase 1: リリースノート作成    → /release-notes の手順に従う
Phase 2: X投稿ドラフト作成    → /release-xpost の手順に従う
Phase 3 (並行):
  ├─ Discord 投稿            → /discord-release の手順に従う
  └─ GitHub Release作成      → /release-tag の手順に従う
```

## 手順

### Phase 1: リリースノート作成

`.claude/skills/release-notes/SKILL.md` の手順に従い、以下を作成する:

1. `docs/release_notes/v<version>/release_notes_v<version>_pr_summary.md` — PR要約
2. `docs/release_notes/v<version>/release_notes_v<version>.md` — ユーザー向けリリースノート

**ユーザー確認ポイント**:
- PR要約のカテゴリ分類は正しいか
- リリースノートの内容は正確か

✅ 確認が取れたら Phase 2 へ進む。

### Phase 2: X投稿ドラフト作成

`.claude/skills/release-xpost/SKILL.md` の手順に従い、以下を作成する:

1. `docs/release_notes/v<version>/xpost_v<version>_draft.md` — X投稿ドラフト
2. `docs/release_notes/v<version>/images/` — スクリーンショット

**ユーザー確認ポイント**:
- 投稿構成は適切か
- 各投稿の文字数は280以内か
- スクリーンショットは正しいか

✅ 確認が取れたら Phase 3 へ進む。

### Phase 3: Discord 投稿 + GitHub Release（並行実行）

以下の2つを並行して実行する:

#### 3a. Discord 投稿

`.claude/skills/discord-release/SKILL.md` の手順に従い、X投稿ドラフトを Discord 向けに整形して投稿する。

**ユーザー確認ポイント**:
- Discord 向けメッセージの内容は正しいか
- webhook で投稿してよいか

#### 3b. GitHub Release 作成

`.claude/skills/release-tag/SKILL.md` の手順に従い、GitHub Releaseを作成する。

**ユーザー確認ポイント**:
- ハイライトの内容は正しいか
- `gh release create` を実行してよいか

✅ 両方の確認が取れたら実行 → 完了。

## 重要なルール

- **各フェーズの完了後に必ずユーザー確認** — 次のフェーズに自動で進まない
- **各Skillの手順に忠実に従う** — オーケストレーターは手順を省略しない
- **途中で中断可能** — Phase 1 だけ実行して後日 Phase 2 を再開できる
