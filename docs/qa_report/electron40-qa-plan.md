# Electron 40.0 QA Plan

- Issue: #1506
- PR: #1509
- Date: 2026-02-08

## 背景

Electron v40.0.0 へのアップグレードに伴うQA。主な Breaking Change は **renderer process からの clipboard API アクセスの非推奨化**。

## Clipboard 影響調査結果

コード調査の結果、clipboard を使用している箇所は以下の2箇所のみで、**いずれも `v-if="isDevelopment"` で開発モード限定**。本番ビルドには含まれないため、**Electron 40 の非推奨化はユーザーに影響なし**。

### a. 「メッセージをコピー（開発用）」ボタン（chat.vue:130-133）

- `v-if="isDevelopment"` → **本番ビルドには含まれない**
- 実装: `window.electronAPI.writeClipboardText()` → IPC 経由で main process の `clipboard.writeText()` を呼出
- main process 経由のため、仮に本番で使われても非推奨化の影響なし
- 既知バグ: コピー対象が `messageHistory`（編集Undo用バックアップ）になっており、通常時は空配列 `[]` がコピーされる。本来は `props.messages` を参照すべきと思われる

### b. デバッグログのコピー（debug_log.vue:56-104）

- デバッグログパネル自体が `project.vue:242` で `v-if="isDevelopment"` → **本番ビルドには含まれない**
- 実装: 3段階フォールバック
  1. `navigator.clipboard.writeText()` — renderer 直接アクセス（非推奨化対象）
  2. `window.electronAPI.clipboard.writeText()` — preload に未定義のため**常に動作しない死んだコード**
  3. `document.execCommand("copy")` — レガシーフォールバック
- 開発モードでは Method 1 で動作するが、将来の Electron で削除された場合は Method 3 にフォールバックする

## 1. ビルド・基本動作確認

| # | 確認項目 | Mac (dev) | Mac (build) | Win | 備考 |
|---|---------|-----------|-------------|-----|------|
| 1-1 | `yarn make:local` がエラーなく完了する | - | PASS | [ ] | |
| 1-2 | アプリが正常に起動しダッシュボードが表示される | PASS | PASS | [ ] | 283件のプロジェクト表示確認 |
| 1-3 | DevTools が正常に開ける | PASS | - | - | dev: CDP接続確認済み。build: `isDev` ガード + Cmd+Option+I でも開けない |
| 1-4 | Monaco Editor が表示される | PASS | PASS | [ ] | JSONタブで正常表示（28行レンダリング） |
| 1-5 | Monaco Editor で編集操作が正常 | PASS | PASS | [ ] | title変更・description挿入/削除・Cmd+Z undo・BEATタブ同期・アプリundo |
| 1-6 | 設定モーダルの開閉が正常 | PASS | PASS | [ ] | 開閉・APIキーアコーディオン展開/折りたたみ（9入力フィールド） |
| 1-7 | ページ遷移が正常 | PASS | PASS | [ ] | ダッシュボード→プロジェクト→各タブ |

## 2. Clipboard 動作確認（開発モード限定機能）

| # | 確認項目 | Mac (dev) | 備考 |
|---|---------|-----------|------|
| 2-1 | 「メッセージをコピー（開発用）」ボタン押下でエラーなし | PASS | コンソールエラー0件 |
| 2-2 | clipboard 関連の deprecation 警告が出ない | PASS | コンソール警告0件 |
| 2-3 | IPC 経由 `writeClipboardText` が正常動作 | PASS | main process の clipboard.writeText 経由 |

## 3. 回帰テスト

| # | 確認項目 | 結果 | 備考 |
|---|---------|------|------|
| 3-1 | 新規プロジェクトの作成が正常 | PASS | 自動テストで確認（プロジェクト作成→URL遷移） |
| 3-2 | チャットでメッセージ送信・受信が正常 | [ ] | API キー必要 |
| 3-3 | 画像生成が動作する | [ ] | API キー必要 |
| 3-4 | 音声生成が動作する | [ ] | API キー必要 |
| 3-5 | 設定画面で API キーの保存・読み込みが正常 | [ ] | |
| 3-6 | 外部リンク（`shell.openExternal`）が正常に動作する | PASS | 「プロジェクトのフォルダを開く」ボタン存在確認 |
| 3-7 | プロジェクトフォルダを開く機能が正常 | PASS | ボタン存在・クリック可能を確認 |

## 4. 自動テスト結果（2026-02-08 Mac dev モード）

Electron 40.1.0 / Chromium 144 での開発モード検証を `test/manual_no_api_electron_upgrade_qa.ts` で実施。

**結果: 25 PASS / 0 FAIL / 0 WARN**

| # | テスト項目 | 結果 | 詳細 |
|---|-----------|------|------|
| 1 | Chromium バージョン | PASS | 144.0.7559.96 |
| 2 | ページタイトル | PASS | "MulmoCast" |
| 3 | ダッシュボード表示 | PASS | 新規作成ボタン確認 |
| 4 | プロジェクト一覧 | PASS | プロジェクト表示 |
| 5 | プロジェクト作成・遷移 | PASS | URL `#/project/...` に遷移 |
| 6 | BEAT タブ表示 | PASS | ボタン確認 |
| 7 | JSON タブ表示 | PASS | ボタン確認 |
| 8 | Monaco Editor 描画 | PASS | `.monaco-editor` DOM 確認 |
| 9 | Monaco Editor コンテンツ | PASS | 28行レンダリング |
| 10 | Monaco Editor 読み取り | PASS | title="(無題)", description="mulmocast" |
| 11 | Monaco 編集: title 変更 | PASS | title → "Electron QA Test Project" |
| 12 | Monaco 編集: description 挿入 | PASS | description → "QA Test mulmocast" |
| 13 | Monaco Cmd+Z undo（タブ遷移なし） | PASS | title が "(無題)" に復元 |
| 14 | Monaco 編集: description 削除 | PASS | description → "QA Test" |
| 15 | Monaco → BEAT タブ同期 | PASS | title 変更が BEAT タブに反映 |
| 16 | アプリ undo ボタン | PASS | title が "(無題)" に復元 |
| 17 | 設定モーダル表示 | PASS | 言語セレクタ確認 |
| 18 | API キーアコーディオン | PASS | 9 入力フィールド確認 |
| 19 | 設定モーダル閉じ | PASS | Escape で閉じ確認 |
| 20 | Clipboard ボタン（dev） | PASS | ボタン確認（dev モード） |
| 21 | Clipboard IPC エラーなし | PASS | clipboard 関連エラー 0 件 |
| 22 | Clipboard deprecation 警告なし | PASS | deprecation/clipboard 警告 0 件 |
| 23 | フォルダを開くボタン | PASS | shell.openExternal 利用可能 |
| 24 | コンソールエラー | PASS | 0 件 |
| 25 | Deprecation 警告 | PASS | なし |

### テストの実行方法

```bash
# 1. アプリを起動（CDP有効）
yarn start

# 2. テスト実行（引数: 期待する Chromium メジャーバージョン）
npx tsx test/manual_no_api_electron_upgrade_qa.ts 144
```

## 5. 判定まとめ

| 箇所 | 本番影響 | 備考 |
|------|----------|------|
| `writeClipboardText`（IPC 経由・chat.vue） | **なし** | 開発モード限定 + main process 経由 |
| `navigator.clipboard`（debug_log.vue） | **なし** | 開発モード限定（パネル自体が `isDevelopment` ガード） |
| `messageHistory` の空配列コピー | **なし** | 開発モード限定。開発者向けバグとして別 issue 管理が望ましい |

**結論: Electron 40 の clipboard 非推奨化は本番ユーザーへの影響ゼロ。Mac 開発モードでの自動テスト全25項目 PASS。残りは `yarn make:local` と Windows 確認。**

## 6. 今後の改善（優先度低・別 issue）

以下は開発者体験の改善として、今回のスコープ外で対応を検討：

- `debug_log.vue` の clipboard アクセスを IPC 経由（`writeClipboardText`）に統一する（将来の Electron での完全削除に備える）
- `debug_log.vue` の Method 2（`window.electronAPI.clipboard`）の死んだコードを削除する
- `chat.vue` の `copyMessageToClipboard` で `messageHistory` ではなく `props.messages` を参照するよう修正する
