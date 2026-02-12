---
name: release-xpost
description: X投稿ドラフト作成。リリースノートからXスレッド用の投稿を生成し、文字数チェック・スクリーンショット撮影を行う。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のX（Twitter）スレッド用の投稿ドラフトを作成する。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/release_notes_v$ARGUMENTS.md` が作成済みであること
- スクリーンショット撮影にはアプリが `yarn start` で起動中であること

## 出力先

- `docs/release_notes/v<version>/xpost_v<version>_draft.md`
- `docs/release_notes/v<version>/images/` （スクリーンショット）

## 手順

### Step 1: 過去のX投稿を参照

過去2バージョンのX投稿を読み込み、フォーマット・トーンを把握する:

```bash
ls docs/release_notes/*/xpost_*.md
```

各ファイルを読んで、構成パターンを確認する。

### Step 2: 投稿構成の決定

リリースノートの内容をもとに、スレッドの構成を提案する:

- **メインポスト**: 最も重要な新機能（📢 で始める）
- **連投ポスト**: 各機能を1投稿ずつ
- **最終ポスト**: その他改善 + ハッシュタグ `#MulmoCast #AIvideo #AI動画`

ユーザーに構成を確認する。

### Step 3: ドラフト作成

以下のフォーマットで作成:

```markdown
# X Thread Draft for v<version>

## メタ情報
- **作成者**: @mulmocast (MulmoCast)
- **スレッド件数**: N 件（予定）

## メインポスト
📢 MulmoCast v<version> released!
[英語の説明]
[日本語の説明]

### 添付メディア
![説明](images/filename.png)

---

## 連投ポスト

### 1. ポスト
[内容]

#### 添付メディア
![説明](images/filename.png)

---
```

### Step 4: 文字数チェック

**X投稿の文字数ルール**:
- CJK/全角文字 = 2
- その他（英数字、半角記号、スペース、改行）= 1
- URL = 23（t.co短縮）
- 上限 = 280

以下のPythonスクリプトで全投稿をチェック:

```python
# X weighted count: CJK/fullwidth = 2, others = 1, total limit = 280
weighted = 0
for ch in post:
    cp = ord(ch)
    if (0x1100 <= cp <= 0x115F or 0x2E80 <= cp <= 0x303E or
        0x3040 <= cp <= 0x33BF or 0x3400 <= cp <= 0x4DBF or
        0x4E00 <= cp <= 0x9FFF or 0xA960 <= cp <= 0xA97C or
        0xAC00 <= cp <= 0xD7A3 or 0xF900 <= cp <= 0xFAFF or
        0xFE10 <= cp <= 0xFE6F or 0xFF01 <= cp <= 0xFF60 or
        0xFFE0 <= cp <= 0xFFE6 or
        0x1F000 <= cp <= 0x1FFFF or
        0x20000 <= cp <= 0x2FA1F):
        weighted += 2
    else:
        weighted += 1
```

**超過した場合**: 英語テキストを短縮する（日本語は意味が変わりやすいので英語を優先的に削る）。

### Step 5: スクリーンショット撮影

アプリが起動中の場合、Playwright MCP でスクリーンショットを撮影する。

1. **言語を英語に切り替える**: Settings → Language → English
2. 対象画面に移動
3. `browser_take_screenshot` でキャプチャ
4. `docs/release_notes/v<version>/images/` に保存

**注意**:
- `browser_snapshot` は大量のトークンを消費するため使わない
- `browser_evaluate` や `browser_run_code` で要素操作する
- `browser_navigate` は使わない（アプリが既に開いている前提）

### Step 6: ユーザー確認

ドラフトをユーザーに提示し、以下を確認:
- 各投稿の内容は正確か
- スクリーンショットは適切か
- 文字数は280以内か

## 参考: 過去のX投稿

- `docs/release_notes/v1.0.9/xpost_v1.0.9.md`
- `docs/release_notes/v1.0.10/xpost_v1.0.10.md`
- `docs/release_notes/v1.0.11/xpost_v1.0.11_draft.md`

## 重要なルール

- **文字数は必ずスクリプトで検証** — 目視で数えない
- **スクリーンショットは英語UIで撮影** — 撮影前に言語切替を確認
- **日英バイリンガル** — 各投稿に英語と日本語の両方を含める
- **URLのカウントは23** — t.co短縮を考慮
- **絵文字のカウント** — 絵文字は通常2としてカウントされる（Unicode範囲 0x1F000-0x1FFFF）
