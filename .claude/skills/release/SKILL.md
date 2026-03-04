---
name: release
description: リリースワークフロー全体をガイド。リリースノート作成→X投稿ドラフト→MulmoScript＋Discord投稿＋GitHub Release の順に進行。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のリリースワークフロー全体をオーケストレーションする。各フェーズをユーザー確認しながら順に進行する。

## 全体フロー

```
Phase 1: リリースノート作成        → /release-notes の手順に従う
Phase 1.5: リリース候補ビルド確認  → RC ブランチ作成 + ビルド版で最終確認
Phase 2: X投稿ドラフト作成        → /release-xpost の手順に従う
Phase 3 (直列):
  3a. GitHub Release作成          → /release-tag の手順に従う
  3b. Discord 投稿                → /discord-release の手順に従う
  3c. MulmoScript作成 + 動画生成  → /release-script の手順に従う
  3d. YouTube メタデータ作成      → /release-youtube の手順に従う
  3e. Zenn 記事作成               → /release-zenn の手順に従う
Phase 4: アーカイブ               → output を zip 化
Phase 5: リリースノート PR        → docs/release_notes/ をコミット・PR 作成
```

## 手順

### Phase 1: リリースノート作成

`.claude/skills/release-notes/SKILL.md` の手順に従い、以下を作成する:

1. `docs/release_notes/v<version>/release_notes_v<version>_pr_summary.md` — PR要約
2. `docs/release_notes/v<version>/release_notes_v<version>.md` — ユーザー向けリリースノート

**ユーザー確認ポイント**:
- PR要約のカテゴリ分類は正しいか
- リリースノートの内容は正確か

✅ 確認が取れたら Phase 1.5 へ進む。

### Phase 1.5: リリース候補ビルド確認

リリースノート確認後、ビルド版で新機能の最終確認を行う。

#### 1.5a. RC ブランチ作成

```bash
git checkout -b release/<version>-rc-1
```

#### 1.5b. package.json のバージョン更新

`package.json` の `version` を `<version>-rc-1` に変更する。

#### 1.5c. 確認チェックリスト作成

リリースノートの新機能から、Win/Mac 両方で確認すべき項目をチェックリストとして提示する:

```markdown
| # | 確認項目 | Mac | Win |
|---|---------|-----|-----|
| 1 | （新機能から抽出） | | |
| ...| | | |
```

#### 1.5d. commit してユーザーに push を依頼

```bash
git add package.json
git commit -m "chore: bump version to <version>-rc-1"
```

ユーザーに push を依頼する。

#### 1.5e. ユーザーがビルド → 確認

- ユーザーが push してビルド版を作成
- Win/Mac 両方で新機能を確認
- 問題があれば修正して rc-2, rc-3... と繰り返す

#### 1.5f. リリースブランチ作成

ビルド確認 OK 後、正式リリースブランチを作成する:

```bash
git checkout -b release/<version>
```

`package.json` の `version` を `<version>`（rc サフィックスなし）に変更する。

```bash
git add package.json
git commit -m "chore: bump version to <version>"
```

ユーザーに push を依頼する。

#### 1.5g. リリース PR の作成

ユーザーが `release/<version>` ブランチを push した後、ドラフト PR を作成（またはユーザーが作成済みの PR body を更新）する。

前回のリリース PR（例: #1545）を参考に、以下の雛形で body を設定する:

```markdown
## Actions
[GitHub Actions が全て完了しているスクリーンショットを貼る]

## Web
[Web ページのアプリダウンロードページで、バージョンが正しいことを確認するスクリーンショットを貼る]

## Version
### Mac
[Mac の About ダイアログのスクリーンショットを貼る]

### Win
[Win の About ダイアログのスクリーンショットを貼る]

## 動作確認
- chat → script
- introduction, 1 beat 生成
- 新機能の確認
  - [ ] （リリースノートの新機能から項目を抽出）
- 旧 version から新 version への自動更新
```

スクリーンショットの貼り付けはユーザーが行うため、プレースホルダーは `[説明文]` の形式で記述する（HTML コメントは MD で非表示になるため使わない）。

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

### Phase 3: GitHub Release → Discord → MulmoScript → YouTube → Zenn（直列実行）

以下を順番に実行する。バックグラウンド agent はファイル書き込み権限を得られないため、すべてフォアグラウンドで実行すること。

#### 3a. GitHub Release 作成

`.claude/skills/release-tag/SKILL.md` の手順に従い、GitHub Releaseを作成する。

**ユーザー確認ポイント**:
- ハイライトの内容は正しいか
- `gh release create` を実行してよいか

#### 3b. Discord 投稿

`.claude/skills/discord-release/SKILL.md` の手順に従い、X投稿ドラフトを Discord 向けに整形して投稿する。

**ユーザー確認ポイント**:
- Discord 向けメッセージの内容は正しいか
- webhook で投稿してよいか

#### 3c. MulmoScript 作成 + 動画生成

`.claude/skills/release-script/SKILL.md` の手順に従い、リリースノート動画用 MulmoScript を作成し、PDF・動画を生成する。
問題があればユーザーと修正を繰り返す。

#### 3d. YouTube メタデータ作成

`.claude/skills/release-youtube/SKILL.md` の手順に従い、YouTube アップロード用メタデータを作成する。
3c のタイムスタンプファイルを使用する。

確認不要（アップロードはユーザーが手動で行う）。

#### 3e. Zenn 記事作成

`.claude/skills/release-zenn/SKILL.md` の手順に従い、MulmoScript から Zenn 記事を生成する。
3c・3d の成果物が必要。

確認不要（Zenn 側でプレビュー・公開はユーザーが手動で行う）。

✅ すべて完了したら Phase 4 へ進む。

### Phase 4: アーカイブ

Phase 3 の全タスク完了後、output ディレクトリを zip 化してバックアップする。

#### 4a. zip 作成

```bash
cd docs/release_notes/v<version>
zip -r output/mulmocast_v<version>_output.zip output/ -x "output/mulmocast_v<version>_output.zip"
```

#### 4b. アップロード先へコピー（任意）

```bash
source .env 2>/dev/null || true
```

環境変数 `RELEASE_ARCHIVE_DIR` が設定されている場合、zip をコピーする:

```bash
if [ -n "${RELEASE_ARCHIVE_DIR:-}" ]; then
  mkdir -p "$RELEASE_ARCHIVE_DIR"
  cp docs/release_notes/v<version>/output/mulmocast_v<version>_output.zip "$RELEASE_ARCHIVE_DIR/"
fi
```

`RELEASE_ARCHIVE_DIR` はローカルパスでも Google Drive マウントポイントでもよい。

**未設定の場合**: ユーザーに「`RELEASE_ARCHIVE_DIR` が設定されていないため、zip のコピーをスキップします。アーカイブ先を設定する場合は `.env` に `RELEASE_ARCHIVE_DIR=/path/to/dir` を追加してください」と伝える。

✅ 完了したら Phase 5 へ進む。

### Phase 5: リリースノート PR

`docs/release_notes/v<version>/` を GitHub にコミット・PR 作成する。

#### 5a. ブランチ作成

```bash
git checkout -b docs/release-notes-v<version>
```

#### 5b. コミット

`output/` ディレクトリは `.gitignore` 済みのため、そのまま `git add` すればよい。

```bash
git add docs/release_notes/v<version>/
git commit -m "docs: add release notes for v<version>"
```

#### 5c. ユーザーに push を依頼

ユーザーに push を依頼し、push 後に PR を作成する。

PR タイトル: `Add release notes for v<version>`
PR ベースブランチ: `main`

✅ 完了。

## 重要なルール

- **各フェーズの完了後に必ずユーザー確認** — 次のフェーズに自動で進まない
- **各Skillの手順に忠実に従う** — オーケストレーターは手順を省略しない
- **途中で中断可能** — Phase 1 だけ実行して後日 Phase 2 を再開できる
