---
name: release-youtube
description: YouTube アップロード用のメタデータ（タイトル・説明文）を生成する。/release-script 完了後に実行。
allowed-tools: Read, Write, Glob, Grep, Bash
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS の YouTube アップロード用メタデータ（英語版・日本語版）を生成する。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/release_notes_v$ARGUMENTS.md` が作成済みであること
- `docs/release_notes/v$ARGUMENTS/release_v<version>_script.json` が作成済みであること

## 出力先

- `docs/release_notes/v<version>/youtube_v<version>_en.md` — 英語版
- `docs/release_notes/v<version>/youtube_v<version>_ja.md` — 日本語版

## 手順

### Step 1: 入力ファイルの読み込み

1. `docs/release_notes/v<version>/release_notes_v<version>.md` — 機能の詳細
2. 過去の YouTube メタデータを参照:

```bash
ls docs/release_notes/v*/youtube_*.md
```

### Step 2: タイムスタンプの取得

`/release-script` が生成したタイムスタンプファイルを確認する:

```
docs/release_notes/v<version>/timestamps_v<version>.md
```

**ファイルがある場合**: そのまま使用する。

**ファイルがない場合**: `output/release_v<version>_script_studio.json` から計算する。

1. `_studio.json` の `beats` 配列から各ビートの `startAt`（秒）を取得
2. ビートのインデックスはスクリプトの `beats` 配列と1対1対応
3. タイトルスライド（2ビート構成）とクロージングスライド（2ビート構成）は最初のビートの `startAt` を使用して1項目にまとめる
4. 秒を `M:SS` 形式に変換（例: 69.192s → `1:09`）

**注意**: `_studio.json` は最後に実行した `mulmo movie` の言語のデータしか持たない。JA/EN 両方のタイムスタンプが必要な場合は、JA 生成 → 読み取り → EN 生成 → 読み取り の順で実行する。

### Step 3: 英語版メタデータの作成

以下のフォーマットで作成する:

````markdown
# YouTube Upload Info - MulmoCast v<version> (English)

## Title

```
MulmoCast v<version> - <主要機能キーワード（英語）> | Release Notes
```

## Description

```
MulmoCast v<version> released!

MulmoCast is a desktop app that creates AI-powered multimedia presentations with images, audio, and video from simple scripts.

Main updates:
<機能名>
- <英語で1〜2行の説明>

<機能名>
- <英語で1〜2行の説明>

...

Timestamps:
<EN タイムスタンプ>

Download here: https://mulmocast.com/
Playlist: MulmoCast Release Note
- English: https://www.youtube.com/playlist?list=PLKMD35BnZ8xGQYsIuRmd2ebqTYTvnbWEf
- Japanese: https://www.youtube.com/playlist?list=PLKMD35BnZ8xGlmg9-f7WBUIOWBg5hCTNk

#MulmoCast #AI #video #release
```

## Playlist

```
MulmoCast Release Note
```

## Thumbnail

beat 1（タイトルスライド）の画像を使用
````

### Step 4: 日本語版メタデータの作成

英語版と同じ構造で日本語版を作成する:

- **タイトル**: `MulmoCast v<version> - <主要機能キーワード（日本語）> | リリースノート`
- **本文**: 日本語で機能説明 + アプリ紹介文 + JA タイムスタンプ
- **プレイリスト・ハッシュタグ・サムネイル**: 英語版と同じ

### Step 5: 保存

各ファイルを保存し、ファイルパスを報告する。ユーザー確認は不要。

### Step 6: アップロード後の URL 記録

YouTube へのアップロード完了後、ユーザーに各言語の動画 URL を教えてもらい、メタデータファイルに `## URL` セクションとして追記する。

```markdown
## URL

```
https://youtu.be/XXXXXXXXX
```
```

## Description のルール

- **アプリ紹介文を含める** — 新規視聴者向けに MulmoCast の概要を1文で記載
- **機能名は見出しとして独立行** — 箇条書きの前に機能名を置く
- **説明は簡潔に** — 各機能1〜2行
- **バグ修正や開発者向け変更は省略** — ユーザー向けの主要機能のみ
- **削除された機能も含める** — ユーザーに影響があるため
- **タイムスタンプを含める** — 言語別の `M:SS` 形式タイムスタンプ
- **URL は固定** — mulmocast.com とプレイリスト URL は毎回同じ
- **ハッシュタグは固定 + リリース固有** — 固定: EN `#MulmoCast #AI #video #release` / JA `#MulmoCast #AI #動画生成 #リリース`。加えて、そのリリースの主要機能に関連するタグを2〜3個追加する（例: `#AzureOpenAI #VertexAI #TTS`）

## Thumbnail のルール

- **beat 1（タイトルスライド）の画像を使用** — `output/images/` 内の title-slide 画像
