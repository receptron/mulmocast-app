---
name: release-script
description: リリースノートとX投稿ドラフトからMulmoScript（リリースノート動画用）を生成する。/release-xpost 完了後に実行。
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion
argument-hint: "<version> (例: 1.0.11)"
---

バージョン $ARGUMENTS のリリースノート動画用 MulmoScript を生成する。

## 前提条件

- `docs/release_notes/v$ARGUMENTS/release_notes_v$ARGUMENTS.md` が作成済みであること
- `docs/release_notes/v$ARGUMENTS/xpost_v$ARGUMENTS_draft.md` が作成済みであること
- `docs/release_notes/v$ARGUMENTS/images/` にスクリーンショットが保存されていること

## 手順

### Step 1: 入力ファイルの読み込み

以下を読み込む:

1. `docs/release_notes/v<version>/release_notes_v<version>.md` — 機能の詳細
2. `docs/release_notes/v<version>/xpost_v<version>_draft.md` — 構成と画像参照
3. `docs/release_notes/v<version>/images/` — スクリーンショット一覧

### Step 2: 既存スクリプトの参照

過去のスクリプトをテンプレートとして参照する:

```bash
ls docs/release_notes/v*/release_v*_script.json
```

最新のスクリプトを読み込み、パラメータ部分（`$mulmocast` 〜 `audioParams`）をテンプレートとして使用する。

### Step 3: Beats の構成

xpost draft の構成に沿って beats を作成する:

#### 3a. タイトルスライド（2ビート構成）

バージョン番号にドットが含まれるため、`textSplit` の `.` 区切りで `v1.0.11` が分割されてしまう。これを回避するため、タイトルスライドは2ビートに分ける:

**ビート1**: バージョン番号を含む挨拶（caption分割を無効化）
```json
{
  "speaker": "Presenter",
  "text": "マルモキャスト バージョン<version読み>をリリースしました！",
  "captionParams": {
    "captionSplit": "none",
    "textSplit": { "type": "none" }
  },
  "id": "title-slide",
  "image": {
    "type": "markdown",
    "markdown": [
      "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
      "",
      "# 🎉 MulmoCast v<version> Released!",
      "## <日付>",
      "",
      "</div>"
    ]
  }
}
```

**ビート2**: サマリー（デフォルトのcaptionParamsを使用、タイトルスライドの画像を参照）

単なる機能列挙ではなく、リリースの背景・価値・ユーザーへの影響を1〜2文で伝える。動画では視聴者に文脈を与え、`mulmo markdown` で生成する記事の冒頭も充実する。

**避けるパターン**: 「このバージョンでは、○○、△△などの更新があります。」（機能名の羅列）
**良いパターン**: 変更の背景や、ユーザーにとっての意味を伝える文にする

```json
{
  "speaker": "Presenter",
  "text": "<リリースの背景・価値を伝えるサマリー>",
  "id": "title-overview",
  "image": {
    "type": "beat",
    "id": "title-slide"
  }
}
```

#### 3b. 機能紹介ビート

xpost draft の各ポスト（メインポスト + 連投ポスト）から:

1. **画像**: `images/` 内のスクリーンショットを `kind: path` で参照
2. **ナレーション**: release notes の詳細を元に日本語で作成
3. **構成**: 1機能につき1〜複数ビート（スクショの数に応じて）

**画像マッピングルール**:
画像ファイル名のプレフィックス `{ポスト番号}-{画像番号}_` でビートに自動対応:
- `01-*` → メインポストのビート
- `02-*` → 連投1のビート
- `03-*` → 連投2のビート（以降同様）
- 1ポストに複数画像がある場合、画像ごとに別ビートを作成

プレフィックスがない旧形式の画像は、xpost draft の添付メディア記述から対応を判断する。

```json
{
  "speaker": "Presenter",
  "text": "<日本語ナレーション>",
  "id": "<機能を表すID>",
  "image": {
    "type": "image",
    "source": {
      "kind": "path",
      "path": "images/<filename>.png"
    }
  }
}
```

#### 3c. クロージングスライド（2ビート構成）

タイトルスライドと同様に、バージョン番号を含む文を分離する。

**ビート1**: その他の改善・案内
```json
{
  "speaker": "Presenter",
  "text": "その他、軽微な改善を行いました。\n起動中のアプリに更新通知が届きます。\nダウンロードは公式サイトから行えます。",
  "id": "thank-you-slide",
  "image": {
    "type": "markdown",
    "markdown": [
      "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
      "",
      "# Thank You!",
      "",
      "## MulmoCast v<version>",
      "",
      "### Happy Creating!",
      "</div>"
    ]
  }
}
```

**ビート2**: バージョン番号を含む締め（caption分割を無効化、Thank Youスライドの画像を参照）
```json
{
  "speaker": "Presenter",
  "text": "マルモキャスト バージョン<version読み>をお楽しみください！",
  "captionParams": {
    "captionSplit": "none",
    "textSplit": { "type": "none" }
  },
  "id": "thank-you-closing",
  "image": {
    "type": "beat",
    "id": "thank-you-slide"
  }
}
```

### Step 4: ナレーションテキストのルール

- **言語**: 日本語
- **読み方**: バージョン番号は「バージョン1.0.11」→「バージョン いってん ぜろ てん いちいち」のように自然な読みに
- **トーン**: ニュースキャスターのような明瞭でプロフェッショナルな読み上げ
- **長さ**: 1ビートあたり1〜2文（長すぎない）
- **番号付け**: 機能ごとに「1：」「2：」と番号を振る（「。」は `textSplit` の区切り文字のため使わない）
- **字幕改行**: `\n` で字幕の表示行を制御する。1行あたり約25〜30文字を目安に、意味の切れ目で `\n` を入れる。`\n` は `textSplit` の区切り文字なので字幕分割ポイントになる
- **内容**: release notes の詳細情報を元に、要約しつつわかりやすく

### Step 5: テンプレートパラメータ

以下は固定値（テンプレート）:

```json
{
  "$mulmocast": { "version": "1.1", "credit": "closing" },
  "canvasSize": { "width": 1280, "height": 720 },
  "speechParams": {
    "speakers": {
      "Presenter": {
        "displayName": { "ja": "ナレーター" },
        "voiceId": "shimmer",
        "speechOptions": {
          "instruction": "Speak clearly and professionally like a news announcer reading release notes. Use a neutral, informative tone with clear enunciation."
        },
        "provider": "openai"
      }
    }
  },
  "imageParams": { "provider": "openai", "images": {} },
  "movieParams": { "provider": "mock", "model": "", "transition": { "type": "fade", "duration": 1 } },
  "soundEffectParams": { "provider": "replicate" },
  "textSlideParams": { "cssStyles": ["h3 {margin-left: 20px; margin-top: 20px}"] },
  "captionParams": {
    "lang": "ja",
    "captionSplit": "estimate",
    "textSplit": {
      "type": "delimiters",
      "delimiters": ["。", "．", ".", "！", "!", "？", "?", "；", ";", "、", ",", "\n"]
    }
  },
  "audioParams": {
    "padding": 0.3,
    "introPadding": 1,
    "closingPadding": 0.8,
    "outroPadding": 1,
    "bgm": { "kind": "path", "path": "../bgm/20251217031931-8c55b232.mp3" },
    "bgmVolume": 0.1,
    "audioVolume": 1,
    "suppressSpeech": false
  }
}
```

### Step 6: JSON の組み立てと保存

テンプレートパラメータ + `title` + `description` + `lang` + `beats` を組み立て、以下に保存:

```
docs/release_notes/v<version>/release_v<version>_script.json
```

**ファイル名ルール**: バージョンのドットをアンダースコアに変換（例: `1.0.11` → `release_v1_0_11_script.json`）

### Step 7: PDF ハンドアウトの生成

MulmoScript から PDF ハンドアウトを生成する。

```bash
npm install -g mulmocast@latest
mulmo pdf --pdf_mode handout docs/release_notes/v<version>/release_v<version>_script.json -o docs/release_notes/v<version>/output
```

**ファイル名ルール**: スクリプトのファイル名に合わせる（例: `release_v1_0_11_script.json`）

### Step 8: PDF の確認後、日本語版動画の生成

PDF ハンドアウトの生成結果をユーザーに報告し、PDF が OK であれば動画を生成する。

```bash
mulmo movie docs/release_notes/v<version>/release_v<version>_script.json -o docs/release_notes/v<version>/output -l ja -c ja
```

生成後、`output/release_v<version>_script_studio.json` から JA タイムスタンプを抽出・保存する（Step 10 で使用）。

### Step 9: 英語版動画の生成

日本語版が OK であれば、英語版も生成する（MulmoCast の翻訳機能で自動翻訳される）。

```bash
mulmo movie docs/release_notes/v<version>/release_v<version>_script.json -o docs/release_notes/v<version>/output -l en -c en
```

生成後、`output/release_v<version>_script_studio.json` から EN タイムスタンプを抽出する（Step 10 で使用）。

**注意**: `_studio.json` は `mulmo movie` 実行ごとに上書きされる。そのため JA 生成後に JA タイムスタンプを読み取ってから EN を生成すること。

### Step 10: 翻訳テキストの確認

英語版動画生成後、`output/release_v<version>_script_lang.json` を確認する。

MulmoCast の翻訳機能は「マルモキャスト」を誤訳することがある（例: 「MarmoCast」「MarmCast」）。以下を実行:

1. `_lang.json` を読み込む
2. 「MulmoCast」以外の表記（`MarmoCast`、`MarmCast`、`MarumoCast` 等）を検索
3. すべて「MulmoCast」に置換する
4. 置換した場合は英語版動画を再生成する

### Step 11: タイムスタンプファイルの保存

Step 8・9 で抽出した JA/EN タイムスタンプを以下に保存する:

```
docs/release_notes/v<version>/timestamps_v<version>.md
```

**タイムスタンプ抽出ルール**:

1. `_studio.json` の `beats` 配列から各ビートの `startAt`（秒）を取得
2. ビートのインデックスはスクリプトの `beats` 配列と1対1対応
3. タイトルスライド（2ビート構成）とクロージングスライド（2ビート構成）は**最初のビートの `startAt` を使用**して1項目にまとめる
4. 秒を `M:SS` 形式に変換（例: 69.192s → `1:09`）
5. 各ビートに言語に応じたラベルを付ける（JA: 日本語、EN: 英語）

**フォーマット例**:

```markdown
## JA Timestamps

0:00 はじめに
0:16 Azure OpenAIサービス対応
0:32 Vertex AI 設定
...

## EN Timestamps

0:00 Introduction
0:14 Azure OpenAI Service
0:31 Vertex AI Settings
...
```

このファイルは `/release-youtube` スキルが参照する。

### Step 12: 完了報告

生成した MulmoScript のファイルパス、ビート数、PDF・動画（日本語版・英語版）の出力先を報告する。

## 重要なルール

- **画像は `kind: path` で参照** — ローカルスクリーンショットを使用（X の URL は使わない）
- **ナレーションは日本語** — TTS 用のテキストとして自然な日本語で記述
- **テンプレートパラメータは原則固定** — 変更が必要な場合はユーザーに確認
- **BGM パスが動作しない場合は調整** — MulmoCast のパス解決に依存するため
- **ユーザー確認は不要** — アプリ上でブラッシュアップする前提のため、生成後そのまま保存する

## コンテキスト効率メモ

このスキルは12ステップ・約300行あり、読み込みだけでコンテキストを消費する。現時点では反復的な修正→再生成のワークフロー（ナレーション調整、caption パラメータ変更等）があるため `context: fork` による Sub-agent 化は困難。次回リリースで手順が安定したら Sub-agent 化を検討する。
