---
name: release-notes
description: リリースノート作成。前回リリース以降の全PRを調査し、PR要約とリリースノートを生成する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のリリースノート（PR要約 + ユーザー向けリリースノート）を作成する。

## 出力先

`docs/release_notes/v$ARGUMENTS/`

## 手順

### Step 1: 準備

1. 出力ディレクトリを作成:
   ```bash
   mkdir -p docs/release_notes/v<version>
   ```

2. 前回リリースのタグを特定:
   ```bash
   gh release list --limit 5
   ```
   ユーザーに前回のタグを確認する。

### Step 2: PR調査（Task sub-agent に委譲）

Task sub-agent で以下を実行し、結果をファイルに書き出す:

1. 前回リリースの日付を取得:
   ```bash
   gh release view <previous-tag> --json publishedAt --jq '.publishedAt'
   ```

2. それ以降のマージ済みPRを全件取得:
   ```bash
   gh pr list --state merged --search "merged:>YYYY-MM-DD" --limit 100 --json number,title,mergedAt --jq 'sort_by(.mergedAt) | .[] | "\(.number)\t\(.mergedAt)\t\(.title)"'
   ```

3. 各PRの詳細を確認:
   ```bash
   gh pr view <number> --json title,body,labels,files
   ```

4. **mulmocast パッケージ更新がある場合、上流の変更を詳細調査する**:

   a. バージョン範囲を特定（前回リリースの mulmocast バージョン → 今回のバージョン）

   b. **前バージョンと現バージョンのコードを実際に diff して新規追加を特定する**（最重要）:
      上流のリリースノートやPRタイトルだけで「新機能」と判断してはならない。上流リリースノートには app が既に取り込み済みの機能も含まれるため、必ず実コードで差分を確認する。
      ```bash
      # 前バージョンの tarball をダウンロードして比較
      mkdir -p /tmp/mulmocast-old-<old-ver>
      cd /tmp/mulmocast-old-<old-ver>
      curl -sL https://registry.npmjs.org/mulmocast/-/mulmocast-<old-ver>.tgz | tar xzf -

      # モデル一覧の diff（provider2agent.js が動的ロードの定義元）
      diff <(grep -E "google/|xai/|bytedance/|runwayml/|kwaivgi/" /tmp/mulmocast-old-<old-ver>/package/lib/types/provider2agent.js | sort) \
           <(grep -E "google/|xai/|bytedance/|runwayml/|kwaivgi/" node_modules/mulmocast/lib/types/provider2agent.js | sort)
      ```
      この diff で追加された行のみを「新規モデル」として記載する。

   c. 上流リポジトリのリリースノートは補足情報として参照（モデル以外の機能変更を把握するため）:
      ```bash
      gh release list --repo receptron/mulmocast --limit 20
      gh release view <tag> --repo receptron/mulmocast  # 各バージョンごと
      ```

   d. app 側の対応範囲を調査し、リリースノートに記載する範囲を判断する:
      - **記載する**: app の PR で実装したもの（UI 追加、バグ修正等）
      - **記載する**: mulmocast 更新で app に自動反映されるもの（新モデルがドロップダウンに追加される等）
      - **記載しない**: MulmoScript の JSON 編集で利用可能だが app UI がないもの（`elements` 配列、`canvasSize`、オーディオミキシング等）。これらは CLI の機能であり、app のリリースノートには含めない
      - 明示的なコード変更（API 移行、新 UI 対応等）があったかを PR diff で確認

   e. PR要約にはバージョン別に構造化して記載し、「2.4.8 時点で既存」と「今回新規」を明確に区別する

5. PRをカテゴリ分類して `docs/release_notes/v<version>/release_notes_v<version>_pr_summary.md` に書き出す。

**PR要約の記述ルール**:
- UI変更を含むPRは、具体的なUI要素の種類を明記する（例: 「数値入力フィールド」「トグルスイッチ」「ドロップダウン」等）。PRの body や変更ファイルから判断できない場合は、実装コード（`.vue` ファイル等）を読んで確認する
- ユーザーに影響する変更か開発者限定の変更かを明記する（例: 「devモード限定」「開発用ボタン」等）
- リリースノート作成時に推測が不要になる程度の具体性を持たせる

**カテゴリ（ユーザー向け）**:
- 新機能（New Features）
- バグ修正（Bug Fixes） — **ユーザーに影響するバグのみ**
- UI/UX改善（UI/UX Improvements）
- 削除された機能（Removed Features）

**カテゴリ（開発者向け）** — リリースノートでは「開発者向け」セクションにまとめる:
- 開発者向けバグ修正 — devモード限定・内部ツールのバグ等、ユーザーに影響しないもの
- リファクタリング（Refactoring）
- 依存パッケージ更新（Dependencies）
- テスト（Testing）
- CI/CD

### Step 3: リリースノート作成

PR要約をもとに、ユーザー向けリリースノートを作成する:

- ファイル: `docs/release_notes/v<version>/release_notes_v<version>.md`
- **PR要約に書かれた事実のみから記述する** — PR要約にない情報を推測で追加しない
- PR要約の情報が不十分な場合（UIの種類、動作の詳細等が不明）は、実装コードを確認してから記述する
- 前回のリリースノートを参考にフォーマットを揃える
- セクション構成（該当がないセクションは省略する）:
  ```markdown
  # MulmoCast App v<version> Release Notes

  ## 新機能
  ### 機能名
  - 説明

  ## バグ修正
  - ユーザーに影響するバグ修正のみ（devモード限定のバグは「開発者向け」へ）

  ## 削除された機能
  - 削除内容

  ## 改善
  - ユーザーに影響する改善のみ

  ## 開発者向け
  - devモード限定のバグ修正
  - リファクタリング
  - 依存パッケージ更新
  - テスト・CI/CD
  - その他の内部変更
  ```

### Step 4: ユーザー確認

作成したファイルをユーザーに提示し、内容の確認・修正を依頼する。

## 参考: 過去のリリースノート

- `docs/release_notes/v1.0.9/`
- `docs/release_notes/v1.0.10/`
- `docs/release_notes/v1.0.11/`

## 重要なルール

- **PR要約は全件カバーすること** — 1件も漏らさない
- **カテゴリ分類は内容を確認して判断** — タイトルだけで判断しない
- **バグ修正はユーザー影響を判断すること** — devモード限定（開発用ボタン、内部ツール等）のバグは「開発者向け」に分類。ユーザーが通常操作で遭遇するバグのみ「バグ修正」セクションに記載
- **リファクタリング・依存更新は開発者向け** — ユーザーに見える変化がない変更は「開発者向け」にまとめる
- **過去のリリースノートのフォーマットに揃える**
- **TTSプロバイダーリストに注意** — 現在: OpenAI, ElevenLabs, Gemini, Google, Kotodama
