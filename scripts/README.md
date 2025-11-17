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
