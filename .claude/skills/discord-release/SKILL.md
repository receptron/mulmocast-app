---
name: discord-release
description: X投稿ドラフトから Discord 向けメッセージを生成し webhook で投稿する。/release-xpost 完了後に実行。
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS の X投稿ドラフトを Discord 向けに整形し、webhook で投稿する。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/xpost_v$ARGUMENTS_draft.md` が作成済みであること
- 環境変数 `DISCORD_WEBHOOK_URL` が設定されていること
- GitHub Release が作成済み（並行実行の場合は URL を後から追加しても可）

## 手順

### Step 1: 環境変数の確認

```bash
source .env 2>/dev/null
echo "${DISCORD_WEBHOOK_URL:?DISCORD_WEBHOOK_URL is not set}"
```

`.env` ファイルから読み込みを試み、それでも設定されていない場合は **STOP** してユーザーに設定を依頼する。

### Step 2: X投稿ドラフトの読み込み

```bash
cat docs/release_notes/v<version>/xpost_v<version>_draft.md
```

### Step 3: Discord 向けメッセージの整形

X投稿ドラフトから以下のルールで機械的に変換する:

1. **メインポスト + 連投ポストを1つのメッセージに統合**
2. **添付メディア行を除去**（`![...](...)`、`#### 添付メディア` 行）
3. **メタ情報セクションを除去**（`## メタ情報` ブロック）
4. **区切り線 `---` を除去**
5. **セクション見出し（`## メインポスト`、`### N. ポスト`）を除去**
6. **冒頭にヘッダーを追加**: `MulmoCast（デスクトップアプリ）v<version> リリースしました！`
7. **X 投稿 URL を冒頭ヘッダーの直後に追加**（ユーザーから取得）
8. **英語/日本語の重複行はスラッシュ区切りで1行に統合**: `English text / 日本語テキスト`
9. **GitHub Release URL を末尾に追加**（取得可能な場合）

```bash
gh release view <version> --json url -q .url
```

### Step 3.5: X 投稿 URL の確認

X 投稿 URL が引数やコンテキストで提供されていない場合、ユーザーに確認する。
冒頭ヘッダーの直後に配置する。

### Step 4: ユーザー確認

整形したメッセージをユーザーに提示し、内容の確認を取る。

**確認ポイント**:
- X 投稿 URL が含まれているか
- 内容に抜け漏れはないか
- 2000文字以内に収まっているか（Discord embed の description 上限）

### Step 5: Discord webhook で投稿

**重要**: ユーザー確認後に実行すること。

```bash
RELEASE_URL=$(gh release view <version> --json url -q .url 2>/dev/null || echo "")

JSON=$(jq -n \
  --arg title "MulmoCast v<version>" \
  --arg url "$RELEASE_URL" \
  --arg desc "$MESSAGE" \
  '{embeds: [{title: $title, url: $url, description: $desc, color: 5814783}]}')

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$JSON" \
  "$DISCORD_WEBHOOK_URL")
```

### Step 6: 結果確認

- HTTP 204 → 成功
- それ以外 → エラー内容を確認してユーザーに報告

## 重要なルール

- **`DISCORD_WEBHOOK_URL` は環境変数から取得** — ハードコード禁止
- **JSON は必ず `jq` で構築** — 文字列結合で JSON を組み立てない
- **description は 2000文字以内** — 超える場合は末尾を切り詰める
- **投稿前にユーザー確認必須** — webhook 投稿は取り消せないため
- **ハッシュタグは除去** — X向けのハッシュタグ行（`#MulmoCast` 等）は Discord では不要
