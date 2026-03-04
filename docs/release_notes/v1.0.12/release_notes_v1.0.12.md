# MulmoCast App v1.0.12 Release Notes

## 新機能

### TTS読み上げ速度（Speed）オプション
OpenAI TTS および Google Cloud TTS で読み上げ速度を調整できるようになりました。

- Speech Parameters に速度入力フィールドを追加
- プロバイダごとの範囲制限に対応（OpenAI: 0.25〜4.0、GCP: 0.25〜2.0）
- UI にプロバイダ固有の min/max/step/placeholder を反映

### Gemini 3.1 Flash 画像生成（Nano Banana 2）対応
Google の新しい画像生成モデル `gemini-3.1-flash-image-preview`（Nano Banana 2）をサポートしました。

- 画像生成モデル選択に Nano Banana 2 を追加

## 開発者向け
- チャット画面の「メッセージをコピー」ボタンが空配列をコピーしていた問題を修正
- Electron 40 で非推奨の `navigator.clipboard` API を IPC 経由に移行
- debug_log.vue のクリップボードコピー処理を IPC ベースに統一し、未使用のフォールバックコードを削除
- QA Playbook に検証の厳密さ基準（Level 1〜4）と再読ルールを追加
- GitHub Actions で CodeQL コードスキャンを有効化（JavaScript/TypeScript 対象）
- リリースワークフローを Claude Code Skills として整備（`/release`, `/release-notes`, `/release-xpost`, `/release-tag`, `/discord-release`, `/release-script`, `/release-youtube`, `/release-zenn`）
- mulmocast パッケージを 2.4.5 に更新
- Electron 40.3.0 → 40.6.0 に更新
- その他依存パッケージの更新（rollup, hono セキュリティパッチ含む）
