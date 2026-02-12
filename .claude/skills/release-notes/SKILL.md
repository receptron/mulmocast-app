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
   ```
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

4. PRをカテゴリ分類して `docs/release_notes/v<version>/release_notes_v<version>_pr_summary.md` に書き出す。

**カテゴリ例**:
- 新機能（New Features）
- バグ修正（Bug Fixes）
- UI/UX改善（UI/UX Improvements）
- 削除された機能（Removed Features）
- 依存パッケージ更新（Dependencies）
- 開発者向け（Developer）
- テスト（Testing）
- CI/CD
- リファクタリング（Refactoring）

### Step 3: リリースノート作成

PR要約をもとに、ユーザー向けリリースノートを作成する:

- ファイル: `docs/release_notes/v<version>/release_notes_v<version>.md`
- 前回のリリースノートを参考にフォーマットを揃える
- セクション構成:
  ```markdown
  # MulmoCast App v<version> Release Notes

  ## 新機能
  ### 機能名
  - 説明

  ## バグ修正
  - 修正内容

  ## 削除された機能
  - 削除内容

  ## 改善
  - 改善内容

  ## 開発者向け
  - 開発者向けの変更
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
- **過去のリリースノートのフォーマットに揃える**
- **TTSプロバイダーリストに注意** — 現在: OpenAI, ElevenLabs, Gemini, Google, Kotodama
