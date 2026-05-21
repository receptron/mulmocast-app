---
name: release
description: リリースワークフロー全体をガイド。ドラフト一括作成 → リリース PR マージ → 公開アクション一括実行 → 後処理の順に進行。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs
argument-hint: "<version> (例: 1.0.14)"
---

バージョン $ARGUMENTS のリリースワークフロー全体をオーケストレーションする。各フェーズをユーザー確認しながら順に進行する。

**設計思想**: 公開アクション（X 投稿、Discord webhook、GitHub Release publish、YouTube/Zenn 公開）は最後にまとめて実行する。先に**全てのドラフトを揃えて**から、リリース PR マージ後に一気に公開する。これにより順序ミス・差し戻し・部分公開を防ぐ。

## 全体フロー

```
Phase 1:   リリースノート作成         → /release-notes の手順
Phase 1.5: リリース候補ビルド確認     → RC ブランチ + ビルド版で最終確認

# ── Phase 2: ドラフト一括作成（公開アクションなし） ──
Phase 2a: X 投稿ドラフト + スクショ    → /release-xpost
Phase 2b: MulmoScript + 動画生成       → /release-script
Phase 2c: Discord メッセージ draft     → /discord-release（webhook 投稿せず保存のみ）
Phase 2d: YouTube メタデータ           → /release-youtube
Phase 2e: Zenn 記事                    → /release-zenn
Phase 2f: GitHub Release --draft 作成  → /release-tag（--draft 付き）

# ── Phase 3: リリース PR マージ ──
Phase 3:   release/<version> → main マージ + main 最新化

# ── Phase 4: 公開アクション一括実行 ──
Phase 4a:  X 手動投稿 → URL 控える
Phase 4b:  GitHub Release を draft → published に切替
Phase 4c:  Discord webhook 投稿（X URL 込み）
Phase 4d:  YouTube 動画アップロード（手動）
Phase 4e:  Zenn 記事公開（手動）

# ── 後処理 ──
Phase 5:   アーカイブ                  → output を zip 化
Phase 6:   リリースノート PR
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
- 問題があれば修正して rc-2, rc-3... と繰り返す（rc ごとにブランチを切る: `release/<version>-rc-N`）
- rc 中に発見した修正は **main 向けの `fix/...` PR** で別途レビューしてマージし、その後 main から次の RC ブランチを切り直すこと（rc ブランチ上で直接修正を積まない）

#### 1.5f. リリースブランチ作成

ビルド確認 OK 後、正式リリースブランチを最終 RC から作成する:

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

✅ 確認が取れたら Phase 2 へ進む（リリース PR はまだマージしない）。

---

### Phase 2: ドラフト一括作成

**重要**: このフェーズでは **公開アクション（X 投稿、Discord webhook、GitHub Release publish、YouTube/Zenn 公開）を一切実行しない**。全てドラフトとして保存・準備するだけ。

依存関係:
- 2b は 2a の draft が必要（xpost テキストから動画台本を作る）
- 2c, 2d, 2e は 2b の MulmoScript / タイムスタンプが必要
- 2f は独立して並列実行可能

#### Phase 2a: X 投稿ドラフト作成

`.claude/skills/release-xpost/SKILL.md` の手順に従い、以下を作成する:

1. `docs/release_notes/v<version>/xpost_v<version>_draft.md` — X投稿ドラフト
2. `docs/release_notes/v<version>/images/` — スクリーンショット

**ユーザー確認ポイント**:
- 投稿構成は適切か
- 各投稿の文字数は280以内か
- スクリーンショットは正しいか

**実投稿はしない**（Phase 4a で実行）。

#### Phase 2b: MulmoScript 作成 + 動画生成

`.claude/skills/release-script/SKILL.md` の手順に従い、リリースノート動画用 MulmoScript を作成し、PDF・動画を生成する。
問題があればユーザーと修正を繰り返す。

#### Phase 2c: Discord メッセージ ドラフト

`.claude/skills/discord-release/SKILL.md` の手順に従い、X投稿ドラフトを Discord 向けに整形する。

**重要**: メッセージはファイルに保存するのみ。**webhook 投稿はしない**（Phase 4c で X URL を含めて投稿）。

#### Phase 2d: YouTube メタデータ作成

`.claude/skills/release-youtube/SKILL.md` の手順に従い、YouTube アップロード用メタデータを作成する。
Phase 2b のタイムスタンプファイルを使用する。

確認不要（アップロードは Phase 4d でユーザーが手動実行）。

#### Phase 2e: Zenn 記事作成

`.claude/skills/release-zenn/SKILL.md` の手順に従い、MulmoScript から Zenn 記事を生成する。
Phase 2b・2d の成果物が必要。

確認不要（公開は Phase 4e でユーザーが手動実行）。

#### Phase 2f: GitHub Release --draft 作成

`.claude/skills/release-tag/SKILL.md` の手順に従い、GitHub Release **draft** を作成する。

**重要**: `gh release create` には **`--draft` フラグを必ず付ける**。タグはまだ public にしない。

```bash
gh release create v<version> --draft --title "v<version>" --notes-file <release-notes-path>
```

✅ 全ドラフトが揃ったら Phase 3 へ進む。

---

### Phase 3: リリース PR マージ

GitHub Release の最終 publish が最新の main を指すようにするため、リリース PR をマージしてから Phase 4 へ進む。

1. ユーザーにリリース PR（`release/<version>` → `main`）のマージを依頼する
2. マージ後、main ブランチに切り替えて最新化してもらう: `git checkout main && git pull origin main`

✅ main が最新になったら Phase 4 へ進む。

---

### Phase 4: 公開アクション一括実行

**重要**: ここから公開アクションを順番に実行する。順序を守ること（特に X 投稿 URL を Discord で使うため、X が先）。

#### Phase 4a: X 手動投稿

ユーザーが X にドラフトの内容を手動で投稿する。

1. ユーザーに X への投稿を依頼する
2. 投稿後、X 投稿 URL を控えてもらう（Phase 4c の Discord 投稿で使用）

#### Phase 4b: GitHub Release を published に切替

Phase 2f で作成した draft Release を public にする:

```bash
gh release edit v<version> --draft=false
```

タグ名と package.json の version が一致していることを確認してから実行。

#### Phase 4c: Discord webhook 投稿

Phase 2c で作成した Discord メッセージに、Phase 4a の X 投稿 URL を埋め込んで webhook で投稿する。

`.claude/skills/discord-release/SKILL.md` の手順に従う（**今度は webhook 投稿まで実行する**）。

#### Phase 4d: YouTube 動画アップロード

ユーザーが Phase 2b で生成した動画と Phase 2d のメタデータを使って手動でアップロード。

#### Phase 4e: Zenn 記事公開

ユーザーが Phase 2e で生成した記事をプレビューして公開。

✅ 全ての公開アクションが完了したら Phase 5 へ進む。

---

### Phase 5: アーカイブ

Phase 4 の全アクション完了後、output ディレクトリを zip 化してバックアップする。

#### 5a. zip 作成

`.bak` ファイル（`sed -i.bak` の自動バックアップ等）は zip に含めない。

```bash
cd docs/release_notes/v<version>
zip -r output/mulmocast_v<version>_output.zip output/ \
  -x "output/mulmocast_v<version>_output.zip" \
  -x "*.bak"
```

#### 5b. アップロード先へコピー（任意）

```bash
source .env 2>/dev/null || true
```

環境変数 `RELEASE_ARCHIVE_DIR` が設定されている場合:

- **ローカルパスの場合**（`http://` / `https://` で始まらない）: zip をコピーする
  ```bash
  mkdir -p "$RELEASE_ARCHIVE_DIR"
  cp docs/release_notes/v<version>/output/mulmocast_v<version>_output.zip "$RELEASE_ARCHIVE_DIR/"
  ```
- **URL の場合**（`http` で始まる）: zip のパスとアップロード先 URL をユーザーに表示し、手動アップロードを案内する

**未設定の場合**: ユーザーに「`RELEASE_ARCHIVE_DIR` が設定されていないため、zip のコピーをスキップします」と伝える。

✅ 完了したら Phase 6 へ進む。

---

### Phase 6: リリースノート PR

`docs/release_notes/v<version>/` を GitHub にコミット・PR 作成する。

#### 6a. ブランチ作成

```bash
git checkout -b docs/release-notes-v<version>
```

#### 6b. コミット

`output/` ディレクトリは `.gitignore` 済みのため、そのまま `git add` すればよい。

```bash
git add docs/release_notes/v<version>/
git commit -m "docs: add release notes for v<version>"
```

#### 6c. ユーザーに push を依頼

ユーザーに push を依頼し、push 後に PR を作成する。

PR タイトル: `Add release notes for v<version>`
PR ベースブランチ: `main`

✅ 完了。

---

## 重要なルール

- **各フェーズの完了後に必ずユーザー確認** — 次のフェーズに自動で進まない
- **各Skillの手順に忠実に従う** — オーケストレーターは手順を省略しない
- **Phase 2 では公開アクションを一切実行しない** — X 投稿、Discord webhook、GitHub Release publish、YouTube/Zenn 公開はすべて Phase 4 まで持ち越す
- **Phase 4 の順序を守る** — X 投稿 URL を Discord で使うため、4a → 4c の順序は必須
- **途中で中断可能** — Phase 1 だけ実行して後日 Phase 2 を再開できる
- **rc 中の修正は main 向け fix PR で** — rc ブランチ上で直接コミットを積まず、main → fix/... → main の正規ルートでレビュー後、次の RC ブランチを main から切り直す
