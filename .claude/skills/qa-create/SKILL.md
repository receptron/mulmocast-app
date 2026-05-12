---
name: qa-create
description: QA テストスイートを作成する。Playbook の知見を活用して CDP 経由の Playwright テストを生成。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

MulmoCast の QA テストスイートを作成します。

## 手順

### Step 1: Playbook と既存テストの読み込み

以下を読み込んでコンテキストに載せること:

1. **Playbook**: `docs/qa_playbook.md` — パターン・アンチパターン集
2. **既存テスト一覧**: `test/` ディレクトリの QA テストファイル名を Glob で取得
3. **テスト対象の理解**: ユーザーが指定した機能に関連するソースコードを調査

### Step 2: テスト対象の確認

ユーザーに以下を確認する:

- **対象機能**: 何をテストするか（例: 「新しい Settings セクション」「新しい UI コンポーネント」）
- **API コスト**: テスト中に外部 API を呼ぶか → ファイル名の `no_api_` プレフィックスを決定
- **スコープ**: テスト範囲（UI のみ / JSON 連携含む / Settings 含む）
- **前提条件**: アプリの状態（Pro モード必須か、特定の設定が必要か）

### Step 3: テスト設計

Playbook の「Phase 分割」に従ってテスト構成を設計する:

1. **Phase 列挙**: Setup → Core Feature → Integration → Health の順で Phase を定義
2. **テスト項目リスト**: 各 Phase のテスト項目を箇条書きで作成
3. **双方向テスト**: UI → JSON、JSON → UI の両方を含めること
4. **空値テスト**: Settings 空の状態でのテストを含めること

設計をユーザーに提示して承認を得る。

### Step 3.5: 実DOM確認（必須）

テストコード生成前に、MCP Playwright で対象画面の実 DOM を確認すること。
この skill では Playwright を直接呼ばず、`Task` で `mcp-pw` skill に委譲して確認すること。

1. 主要セレクタ候補を実 DOM 上で検証（0件/複数件なら不採用）
2. `[class*=...]` のような曖昧な部分一致セレクタは原則禁止
3. `data-testid` / `data-slot` / role + name など安定セレクタを優先
4. 採用セレクタと確認結果をテストファイル先頭コメントに記録
5. `Task` には「対象画面」「確認したいセレクタ候補」「期待する一致件数」を明示し、戻り値として「採用セレクタ」と「検証結果」を受け取る

### Step 4: テストコード生成

Playbook のパターンに従ってコードを生成する:

1. **共通インフラ**: `connectCDP`, `findAppPage`, `record`, `createConsoleMonitor` を Playbook から流用
2. **CONFIG**: テスト固有のタイミング定数を定義
3. **ヘルパー関数**: 既存テストから再利用できるヘルパーを特定し、必要に応じてコピーまたは新規作成
4. **テスト関数**: Phase ごとにテスト関数を作成
5. **メイン IIFE**: Phase の実行順序を定義、サマリ出力

### Step 5: 実行と修正（必須）

作成したテストは、push 前に必ず1回以上実行して成功確認する（`npx tsx test/{filename}.ts`）。
未実行のまま完了扱いにしない。失敗時は修正して再実行し、成功ログを確認する。

### Step 6: ドキュメント更新

1. `test/README.md` にテストの説明を追加
2. `docs/qa_playbook.md` に新しい知見があれば追記

## 重要なルール

- **Playbook を必ず先に読むこと** — 毎回 `docs/qa_playbook.md` を読み込んでからコードを書く
- **推測でセレクタを書かない** — DOM セレクタは実 DOM を見てから書く（外部契約を推測しない）
- **Monaco の扱い** — `EDITOR_SETTLE_DELAY_MS` を忘れない。JSON タブから離れる前に必ず待つ
- **テスト値のユニーク性** — `Date.now()` ベースの `runId` で毎回異なる値を使う
- **WARN を放置しない** — WARN が出たら仕様かバグかユーザーに確認する
- **新しい知見は Playbook に追記** — テスト作成中に発見したパターンは `docs/qa_playbook.md` に追加する

## 完了条件（Definition of Done）

- Step 1〜6 を完了していること
- Step 3.5 の実 DOM 確認を完了していること
- 対象 QA テストを少なくとも1回実行し成功していること
- `test/README.md` / `docs/qa_playbook.md` を必要に応じて更新していること
