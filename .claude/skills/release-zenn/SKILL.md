---
name: release-zenn
description: MulmoScript から Zenn 記事を生成する。/release-script 完了後に実行。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS の Zenn 記事を MulmoScript から生成する。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/release_v<version>_script.json` が作成済みであること
- `docs/release_notes/v$ARGUMENTS/youtube_v$ARGUMENTS_ja.md` と `_en.md` に YouTube URL が記録済みであること
- 環境変数 `ZENN_CONTENT_DIR` が設定されていること（zenn-content リポジトリのパス）

## 手順

### Step 1: 環境変数の確認

```bash
echo "${ZENN_CONTENT_DIR:?ZENN_CONTENT_DIR is not set}"
```

設定されていない場合は **STOP** してユーザーに設定を依頼する。

### Step 2: mulmo markdown で原文生成

```bash
mulmo markdown docs/release_notes/v<version>/release_v<version>_script.json -o docs/release_notes/v<version>/output/
```

生成物: `docs/release_notes/v<version>/output/release_v<version>_script.md`

### Step 3: 過去の記事を参照

```bash
ls "$ZENN_CONTENT_DIR/articles/"*mulmocast-release*.md
```

最新の記事を読み込み、構造（フロントマター、:::message、見出し構成、動画リンク）をテンプレートとして使用する。

### Step 4: YouTube URL の取得

```bash
grep -A2 '## URL' docs/release_notes/v<version>/youtube_v<version>_ja.md
grep -A2 '## URL' docs/release_notes/v<version>/youtube_v<version>_en.md
```

### Step 5: 記事の編集

`mulmo markdown` の出力を以下のルールで編集する（`docs/mulmocast-article-guide.md` 準拠）:

#### 5a. div タグの除去

`<div style='display: flex; ...'>...</div>` ブロックをすべて除去する。中の見出しの扱い:

| スライド種別 | 判別方法 | 見出しの扱い |
|-------------|---------|-------------|
| タイトルスライド | `# 🎉 MulmoCast v...` を含む | 中の `#` 見出しを記事の h1 として残す |
| クロージングスライド | `# Thank You!` を含む | div ごと削除（ナレーションテキストのみ残す） |
| その他の markdown スライド | 上記以外 | ナレーションテキストと内容が重複する場合は div ごと削除 |

**注意**: 同じスライドが `type: beat` 参照で複数回出力される場合がある（例: タイトルスライドが2回）。重複する div はすべて削除する。

#### 5b. クレジット画像の除去

`mulmo_credit.png` を参照する画像行を除去する。

#### 5c. 画像パスの変更

画像ディレクトリ名: `release_v<version>_script`（バージョンのドットをアンダースコアに変換）

```
変更前: ![Beat 3](../images/settings_azure_openai.png)
変更後: ![settings_azure_openai](/images/release_v<version>_script/settings_azure_openai.png)
```

- alt テキストは `Beat N` ではなくファイル名ベースに変更する
- パスは `/images/release_v<version>_script/ファイル名.png` 形式

#### 5d. :::message 注釈の追加

フロントマターの直後に以下を追加:

```markdown
:::message
**この記事について**

この記事は、[MulmoCast](https://mulmocast.com)を活用して、MulmoScriptから動画とテキストを同時生成したガイドです。動画とテキストの両方で同じ内容をご覧いただけます。動画で見たい方は記事内のリンクからご覧ください。
:::
```

#### 5e. 機能ごとの見出し追加

ナレーションの番号付け（「1：」「2：」等）を `## 1. 機能名` の見出しに変換する。

#### 5f. 「動画で見る」セクションの追加

記事末尾に YouTube リンクを追加:

```markdown
## 動画で見る

**日本語版**
https://youtu.be/<JA_URL>

**英語版**
https://youtu.be/<EN_URL>
```

#### 5g. フロントマターの設定

```yaml
---
title: "MulmoCast v<version> リリース"
emoji: "🎉"
type: "idea"
topics: [mulmocast, <リリース固有のトピック3〜4個>]
published: true
publication_name: singularity
---
```

### Step 6: 画像のコピー

```bash
mkdir -p "$ZENN_CONTENT_DIR/images/release_v<version>_script/"
cp docs/release_notes/v<version>/images/*.png "$ZENN_CONTENT_DIR/images/release_v<version>_script/"
```

### Step 7: 記事ファイルの保存

```bash
date '+%Y-%m-%d'  # ファイル名用の日付を取得
```

保存先: `$ZENN_CONTENT_DIR/articles/<YYYY-MM-DD>-mulmocast-release_v<version>.md`

バージョンのドットをアンダースコアに変換（例: `1.0.11` → `v1_0_11`）。

### Step 8: プレビュー確認

zenn-content ディレクトリでプレビューサーバーを起動する:

```bash
cd "$ZENN_CONTENT_DIR" && npx zenn preview
```

プレビュー URL をユーザーに伝え、ブラウザで確認してもらう:

```
http://localhost:8000/articles/<YYYY-MM-DD>-mulmocast-release_v<version>
```

ユーザーの確認が取れるまで待つ。修正依頼があれば対応する。

### Step 9: 完了報告

生成した記事のファイルパス、コピーした画像数を報告する。

## 重要なルール

- **`ZENN_CONTENT_DIR` は環境変数から取得** — ハードコード禁止
- **`mulmo markdown` の出力をベースに編集** — ゼロから書かない
- **ナレーションテキストは原則そのまま使用** — TTS 用の文がそのまま記事本文になる
- **div タグ・クレジット画像は必ず除去** — Zenn では不要
- **過去の記事構造に合わせる** — フロントマター、:::message、見出し構成を統一
