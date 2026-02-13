---
name: release
description: リリースワークフロー全体をガイド。リリースノート作成→X投稿ドラフト→MulmoScript＋Discord投稿＋GitHub Release の順に進行。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のリリースワークフロー全体をオーケストレーションする。各フェーズをユーザー確認しながら順に進行する。

## 全体フロー

```
Phase 1: リリースノート作成    → /release-notes の手順に従う
Phase 2: X投稿ドラフト作成    → /release-xpost の手順に従う
Phase 3 (並行):
  ├─ MulmoScript作成         → /release-script の手順に従う
  ├─ Discord 投稿            → /discord-release の手順に従う
  ├─ GitHub Release作成      → /release-tag の手順に従う
  ├─ YouTube メタデータ作成  → /release-youtube の手順に従う（/release-script 完了後）
  └─ Zenn 記事作成           → /release-zenn の手順に従う（/release-script 完了後）
Phase 4: アーカイブ           → output を zip 化
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

### Phase 3: MulmoScript + Discord 投稿 + GitHub Release（並行実行）

以下の3つを並行して実行する:

#### 3a. MulmoScript 作成

`.claude/skills/release-script/SKILL.md` の手順に従い、リリースノート動画用 MulmoScript を作成する。
確認不要（アプリ上でブラッシュアップする前提）。

#### 3b. Discord 投稿

`.claude/skills/discord-release/SKILL.md` の手順に従い、X投稿ドラフトを Discord 向けに整形して投稿する。

**ユーザー確認ポイント**:
- Discord 向けメッセージの内容は正しいか
- webhook で投稿してよいか

#### 3c. GitHub Release 作成

`.claude/skills/release-tag/SKILL.md` の手順に従い、GitHub Releaseを作成する。

**ユーザー確認ポイント**:
- ハイライトの内容は正しいか
- `gh release create` を実行してよいか

#### 3d. YouTube メタデータ作成

`.claude/skills/release-youtube/SKILL.md` の手順に従い、YouTube アップロード用メタデータを作成する。
`/release-script` のタイムスタンプファイルを使用するため、3a 完了後に実行する。

確認不要（アップロードはユーザーが手動で行う）。

#### 3e. Zenn 記事作成

`.claude/skills/release-zenn/SKILL.md` の手順に従い、MulmoScript から Zenn 記事を生成する。
`/release-script` と `/release-youtube`（YouTube URL）が必要なため、3a・3d 完了後に実行する。

確認不要（Zenn 側でプレビュー・公開はユーザーが手動で行う）。

✅ すべての確認が取れたら実行 → Phase 4 へ進む。

### Phase 4: アーカイブ

Phase 3 の全タスク完了後、output ディレクトリを zip 化してバックアップする。

#### 4a. zip 作成

```bash
cd docs/release_notes/v<version>
zip -r output/mulmocast_v<version>_output.zip output/ -x "output/mulmocast_v<version>_output.zip"
```

#### 4b. アップロード先へコピー（任意）

環境変数 `RELEASE_ARCHIVE_DIR` が設定されている場合、zip をコピーする:

```bash
if [ -n "$RELEASE_ARCHIVE_DIR" ]; then
  mkdir -p "$RELEASE_ARCHIVE_DIR"
  cp docs/release_notes/v<version>/output/mulmocast_v<version>_output.zip "$RELEASE_ARCHIVE_DIR/"
fi
```

`RELEASE_ARCHIVE_DIR` はローカルパスでも Google Drive マウントポイントでもよい。未設定の場合は zip 作成のみで完了。

✅ 完了。

## 重要なルール

- **各フェーズの完了後に必ずユーザー確認** — 次のフェーズに自動で進まない
- **各Skillの手順に忠実に従う** — オーケストレーターは手順を省略しない
- **途中で中断可能** — Phase 1 だけ実行して後日 Phase 2 を再開できる
