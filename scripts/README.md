# Scripts

このディレクトリには、開発・メンテナンス用のユーティリティスクリプトが含まれています。

## export-onboard.ts

オンボーディング用のチュートリアルデータをエクスポートするスクリプトです。

### 目的

アプリケーション内で使用されるオンボーディング(初回利用時のチュートリアル)のスクリプトを、TypeScriptファイルからJSONファイルに変換してドキュメントフォルダに出力します。

### 処理内容

1. `src/shared/onboard/` 内のTypeScriptファイルからチュートリアルデータを読み込み
2. JSONフォーマットに変換
3. `docs/introduction/` にJSONファイルとして保存

### エクスポート対象

以下の6つのチュートリアルファイルが処理されます:

- `intro01_welcome_ja` / `intro01_welcome_en` - ウェルカムチュートリアル
- `intro02_multimedia_ja` / `intro02_multimedia_en` - マルチメディア機能説明
- `intro03_advanced_ja` / `intro03_advanced_en` - 高度な機能説明

### 実行方法

```bash
npx tsx scripts/export-onboard.ts
```

### 利点

- TypeScriptで型安全にオンボーディングスクリプトを管理できる
- ドキュメントとして閲覧可能なJSONフォーマットで出力される
- アプリケーション外でもチュートリアル内容を確認できる

## check-i18n.ts

i18nメッセージのキー構造を `en` と `ja` で比較し、片方に欠けているキーを検出するスクリプトです。

### 処理内容

1. `src/renderer/i18n/en.ts` と `ja.ts` を読み込み
2. ネストしたオブジェクトのキーをドット区切りでフラット化
3. それぞれに存在しないキーを一覧出力し、差分があれば終了コード1で終了

### 実行方法

```bash
npx tsx scripts/check-i18n.ts
```

### 出力例

```
Missing in ja (2):
  - ui.common.title
  - ui.actions.create
Missing in en (1):
  - ui.common.description
```

## translate-i18n.ts

Gemini SDKを使用して、不足している翻訳を自動生成するスクリプトです。

### 目的

`check-i18n.ts` で検出された不足している翻訳キーに対して、Gemini APIを使って自動的に翻訳を生成し、該当のi18nファイルを更新します。

### 処理内容

1. `check-i18n.ts` と同じロジックで不足キーを検出
2. 不足している各キーについて、Gemini APIで翻訳を生成
3. 生成された翻訳を元のTypeScriptファイルに統合
4. ファイルを更新（フォーマット保持）

### 前提条件

Gemini APIキーが必要です。

#### ローカル環境での設定

プロジェクトルートに `.env` ファイルを作成し、以下を記載：

```bash
GEMINI_API_KEY=your_api_key_here
```

`.env` ファイルはスクリプト実行時に自動的に読み込まれます。

#### GitHub Actionsでの設定

リポジトリの Settings > Secrets and variables > Actions で以下のシークレットを設定：

- シークレット名: `GEMINI_API_KEY`
- 値: あなたのGemini APIキー

ワークフローでは環境変数として自動的に利用可能になります。

### 実行方法

```bash
# ローカル環境（.envファイルから自動読み込み）
yarn i18n:translate

# または直接実行
npx tsx scripts/translate-i18n.ts

# 環境変数で直接指定する場合
export GEMINI_API_KEY=your_api_key_here
yarn i18n:translate
```

### 動作説明

- **英語→日本語**: 英語に存在し、日本語に欠けているキーを翻訳
- **日本語→英語**: 日本語に存在し、英語に欠けているキーを翻訳
- 翻訳対象ファイル:
  - `en.ts` ↔ `ja.ts`
  - `en_notify.ts` ↔ `ja_notify.ts`

### 注意事項

- 自動翻訳のため、必ず生成後に内容を確認してください
- UIに適した簡潔な表現になるようプロンプト設計していますが、文脈によっては調整が必要な場合があります
- 翻訳生成にはAPIコストが発生します
