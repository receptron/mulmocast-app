# MulmoCast App v1.0.11 Release Notes

## 新機能

### Azure OpenAI Service 対応 (Phase 1)
Azure OpenAI Serviceをサポートしました。Azure経由でOpenAIの画像生成・音声合成・翻訳機能を利用できます。

- 設定画面にAzure OpenAI設定セクションを追加（IMAGE/TTS/LLM各サービス用）
- サービスごとにAPI KeyとBase URLを個別設定可能
- 通常のOpenAI APIキーとAzure OpenAIキーの自動判定
- エラーメッセージにAzure固有のトラブルシューティングガイドを追加

### Vertex AI 対応（画像・動画生成）
Google Cloud Vertex AI経由の画像生成（Imagen）・動画生成（Veo）設定をUI上で扱えるようになりました。

- 設定画面にVertex AIのデフォルト値（Project ID / Location）を追加
- Image/Movie Parametersでプロバイダーが Google の場合に Vertex AI トグルを表示
- プロジェクト単位・ビート単位で異なるProject ID / Locationを個別指定可能
- トグルON時にSettingsのデフォルト値を自動入力

### 字幕分割（Caption Split）機能
字幕を句読点や記号で自動分割する機能を追加しました。

- スタイル設定に字幕分割のON/OFFトグルを追加
- 全言語対応の区切り文字セット（句読点、感嘆符、疑問符、セミコロン、改行）
- 区切り文字を全角・半角・その他にカテゴリ分けして説明表示

### UI/UX改善
- ビートタイプの初期選択が新規挿入時に直前の選択を自動適用

## バグ修正
- 破損したMulmoScriptを開いた際にアプリがクラッシュする問題を修正（空のbeatsで初期化して回復可能に）
- Voice Cloneで長いファイル名がレイアウトを崩す問題を修正
- Voice Cloneページから離脱時に音声再生が停止しない問題を修正
- CI環境でPuppeteerキャッシュの競合エラーが発生する問題を修正

## 削除された機能
- **Nijivoice TTSプロバイダーの削除**: サービス終了（2026年2月4日）に伴い、Nijivoice関連の全コードを削除。利用可能なTTSプロバイダーはOpenAI、ElevenLabs、Gemini、Google、Kotodamaです

## 改善
- Electron 40にアップグレード
- vue-router 5.0.0にアップグレード

## 開発者向け
- Electronアップグレード用QAテストスイート（25項目）とテンプレートを追加
- Vertex AI QAテストスイート（99項目）を追加
- QAテスト作成プレイブック・スキルを追加
- mulmocast パッケージを2.1.35に更新
- 各種依存パッケージの更新
