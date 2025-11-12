# MulmoCast 1.0.4 リリースノート（開発者向け）

リリース日: 2025年11月12日

## 📦 主要な依存関係の更新

### メジャーアップデート
- **Zod: 3.x → 4.1.12** (#1178)
  - バリデーションライブラリをメジャーアップグレード
  - Zod 3向けのコードをすべて削除
  - 新しいZod 4 APIに対応
  - テストケースを追加 (`test/test_zod_error.ts`)

- **MulmoCast: 1.x → 2.0.0** (#1177)
  - コアエンジンをメジャーアップグレード
  - `handler_common.ts`, `handler_generator.ts` の更新

### パッケージの更新
- **punycode を明示的な依存関係として追加** (#1203)
  - ビルドエラーを解決
  - `vite.main.config.ts` に設定を追加

- その他多数のパッケージを最新版に更新 (#1172, #1153, #1154)

## 🐛 バグ修正

### 重要なバグ修正
- **起動時のクラッシュを修正** (#1213)
  - `src/main/main.ts`: 起動フローの修正
  - `src/main/settings_manager.ts`: 設定の初期化処理を改善

### エラーハンドリングの改善
- **APIエラーターゲットの優先順位付けを追加** (#1204)
  - `src/renderer/lib/error.ts`: `convCauseToErrorMessage` 関数の改善
  - より適切なエラーメッセージを表示
  - テストケースを追加

## 🔧 設定管理の改善

### 設定タイプのクリーンアップ (#1214, #1215)
- `src/main/settings_manager.ts`: 設定管理ロジックのリファクタリング
- `src/renderer/pages/settings.vue`: 設定UIの改善
- `src/types/index.ts`: 新しい型定義を追加
- デフォルト設定の改善

### 変更されたファイル
- `src/main/ipc_handler.ts`: IPC ハンドラーの型安全性向上
- `src/main/main.ts`: 設定読み込みロジックの簡素化
- `src/preload/preload.ts`: 不要なAPIを削除
- `src/types/electron.d.ts`: 型定義のクリーンアップ

## 🏗️ アーキテクチャの改善

### TypeScript型定義の強化
- **API Key型の更新** (#1188)
- **ElectronAPI型の改善** (#1190)
- **tsconfig.jsonをプロジェクトルートに移動** (#1194)
- **型の不整合を修正** (#1189, #1196)

### コードベースの整理
- **グローバル定数の整理** (#1182)
- **コールバック関数の型定義改善** (#1186)
- **MulmoCastインポートの修正** (#1198)

## 🌍 国際化 (i18n) の改善

- **Beat設定の翻訳を修正** (#1184)
- **エラーメッセージの翻訳を改善** (#1171)
- **言語切り替えの改善** (#1197)

## ✨ 新機能

### UI/UX改善
- **メディアモーダルのダウンロード機能を追加** (#1176)
  - `src/renderer/components/llm_settings.vue`: LLMモデル設定の改善
  - `src/renderer/pages/project/chat.vue`: チャットUIの改善

- **メニューの更新** (#1172, #1173, #1174)
  - アプリケーションメニューの整理
  - アバウト画面の追加

### 開発体験の向上
- **デフォルトテストコンテキストの追加** (#1195)
- **オンボーディングプロジェクトの修正** (#1181)
- **Zodエラーテストの追加** (#1179)

## 📊 統計

- **マージされたPR数**: 34個
- **コミット数**: 124個（v1.0.3以降）
- **変更されたファイル**: 主要ファイル約50個

## 🔍 主な変更ファイル

### Main Process
- `src/main/main.ts`
- `src/main/ipc_handler.ts`
- `src/main/settings_manager.ts`
- `src/main/mulmo/handler_common.ts`
- `src/main/mulmo/handler_generator.ts`

### Renderer Process
- `src/renderer/lib/error.ts`
- `src/renderer/pages/settings.vue`
- `src/renderer/components/llm_settings.vue`
- `src/renderer/pages/project/chat.vue`

### Types
- `src/types/index.ts`
- `src/types/electron.d.ts`

### Configuration
- `package.json`
- `vite.main.config.ts`
- `tsconfig.json` (ルートに移動)

### Tests
- `test/test_zod_error.ts` (新規追加)

## 🚀 ビルド & デプロイ

- パッケージング処理の改善
- ビルドエラーの修正
- 依存関係の最適化

## 📝 開発ノート

### マイグレーションガイド

#### Zod 3 → Zod 4
Zod 4では一部APIが変更されています。詳細はZodの公式マイグレーションガイドを参照してください。

#### 設定管理の変更
設定の型定義が強化されました。`src/types/index.ts` で新しい型定義を確認してください。

### 既知の問題

現時点で重大な既知の問題はありません。

## 🔗 関連リンク

- [MulmoCast Library v2.0.0](https://github.com/receptron/mulmocast)
- [Zod v4 リリースノート](https://github.com/colinhacks/zod/releases)
- [プロジェクトリポジトリ](https://github.com/receptron/mulmocast-app)

## 👥 貢献者

このリリースに貢献してくださったすべての開発者に感謝します。
