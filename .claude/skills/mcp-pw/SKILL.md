---
name: mcp-pw
description: Playwright MCP でElectronアプリを操作する。スクリーンショット撮影・UI操作・デバッグ。
allowed-tools: mcp__electron-playwright__browser_take_screenshot, mcp__electron-playwright__browser_evaluate, mcp__electron-playwright__browser_run_code, mcp__electron-playwright__browser_tabs, mcp__electron-playwright__browser_click, mcp__electron-playwright__browser_snapshot, mcp__electron-playwright__browser_wait_for, mcp__electron-playwright__browser_console_messages, Read, Bash, AskUserQuestion
---

Playwright MCP 経由で起動中の Electron アプリ（`yarn start`、CDP port 9222）を操作する。

## 前提条件

- アプリが `yarn start` で起動中であること（CDP ポート 9222）
- Playwright MCP が接続可能であること

## 禁止事項

### 絶対に使ってはいけないもの

1. **`browser_navigate`** — Electron アプリのページを壊す。アプリは既にページを開いている
2. **`browser_snapshot` を安易に使わない** — DOM ツリー全体を出力するため、数万トークンを消費する。代わりに `browser_evaluate` や `browser_run_code` を使う

### やってはいけない操作

3. **`page.goto('about:blank')`** — アプリから離脱してしまう。もし誤って離脱したら `page.goBack()` で戻る
4. **要素のテキストで直接 `locator.click`** — strict mode violation（2要素以上マッチ）になりやすい。`.first()` を付けるか、より具体的なセレクタを使う

## 推奨パターン

### スクリーンショット撮影

```javascript
// 単純にスクリーンショットを撮る
// → browser_take_screenshot を使う
```

### UI要素のクリック

```javascript
// ❌ 悪い例: テキストだけでクリック
await page.locator('text=Vertex AI').click();

// ✅ 良い例: より具体的なセレクタ + first()
await page.locator('button', { hasText: 'Vertex AI' }).first().click();

// ✅ 良い例: data属性で絞り込み
await page.locator('button[data-state="closed"]', { hasText: 'Vertex AI' }).click();
```

### Settings モーダルを開く

```javascript
// Settings ボタンをクリック
await page.locator('button', { hasText: /^Settings$/ }).click();
await page.waitForTimeout(500);
```

### アコーディオンを開く

```javascript
// 閉じているアコーディオンを開く
const accordion = page.locator('button[data-state="closed"]', { hasText: 'セクション名' });
if (await accordion.count() > 0) {
  await accordion.first().click();
  await page.waitForTimeout(300);
}
```

### DOM の状態確認（snapshot の代わり）

```javascript
// ❌ 悪い例: browser_snapshot（巨大な出力）
// ✅ 良い例: 必要な部分だけ取得
const text = await page.locator('.target-class').textContent();
const count = await page.locator('button').count();
const visible = await page.locator('#element-id').isVisible();
```

### 言語切り替え

```javascript
// Settings → Language で切り替え
await page.locator('button', { hasText: /^Settings$/ }).click();
await page.waitForTimeout(500);
// Language セレクタを操作
// （具体的なセレクタはアプリの実装による）
```

## トラブルシューティング

| 症状 | 原因 | 対処法 |
|------|------|--------|
| ページが真っ白 | `browser_navigate` を使った | `page.goBack()` で戻る |
| strict mode violation | 複数要素がマッチ | `.first()` を付けるか、セレクタを具体化 |
| クリックが効かない | 要素が非表示/アニメーション中 | `waitForTimeout(500)` を入れる |
| snapshot が巨大 | DOM ツリー全体を出力 | `browser_evaluate` で必要部分だけ取得 |
| タブが見つからない | CDPポートが違う | `browser_tabs` でタブ一覧を確認 |

## 重要なルール

- **アプリの状態を壊さない** — navigate/goto は禁止
- **コンテキストを節約** — snapshot より evaluate を優先
- **要素操作は慎重に** — strict mode violation に注意
- **待ち時間を入れる** — UI操作後は `waitForTimeout` でアニメーション完了を待つ
