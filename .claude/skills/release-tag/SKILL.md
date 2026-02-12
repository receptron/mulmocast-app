---
name: release-tag
description: GitHub Releaseの作成。リリースノートからハイライトを抽出し、gh release createでタグを打つ。
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のGitHub Releaseを作成する。リリースノートからハイライトを抽出し、`gh release create` で実行。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/release_notes_v$ARGUMENTS.md` が作成済みであること
- リリースブランチが main にマージ済み、またはマージ可能な状態であること

## 手順

### Step 1: リリースノートの確認

リリースノートを読み込み、ハイライト（主要な新機能・変更）を抽出する:

```bash
cat docs/release_notes/v<version>/release_notes_v<version>.md
```

### Step 2: 前回のリリースタグを確認

```bash
gh release list --limit 5
```

前回のタグとの差分を確認:
```bash
git log <previous-tag>..HEAD --oneline
```

### Step 3: ハイライトの作成

リリースノートの「新機能」セクションから主要な項目をピックアップし、ハイライトを作成する。

フォーマット:
```markdown
## Highlights

- **機能名**: 英語での簡潔な説明
- **機能名**: 英語での簡潔な説明

---
```

ユーザーにハイライトの内容を確認する。

### Step 4: GitHub Release の作成

**重要**: `gh release create` の実行前に、必ずユーザーに確認すること。

```bash
gh release create "<version>" \
  --generate-notes \
  --title "<version>" \
  --notes "$(cat <<'EOF'
## Highlights

- **Feature Name**: Brief description of the feature
- **Feature Name**: Brief description of the feature

---

EOF
)"
```

**ポイント**:
- `--notes` の内容は `--generate-notes` の出力の**前に**挿入される
- `--generate-notes` は前回タグからのPR一覧を自動生成する
- ドキュメントやサンプルへのリンクがあれば含める

### Step 5: 確認

作成されたリリースを確認:
```bash
gh release view <version>
```

## 重要なルール

- **リリース作成は必ずユーザー確認後に実行** — 取り消しが面倒なため
- **タグ名はバージョン番号のみ** — 例: `1.0.11`（`v` プレフィックスなし）
- **ハイライトは英語で記述** — GitHub Release は国際的に見られるため
- **`--generate-notes` を常に使う** — PR一覧の自動生成を活用
