# MulmoCast App v1.0.13 Release Notes

## 新機能

### Image Effect UI（html_tailwind ビート向け）
`html_tailwind` アニメーションビートに **Image Effect パネル** を追加しました。

- エフェクトプリセット選択（ドロップダウン）: `zoomIn`, `zoomOut`, `moveToRight`, `moveToLeft`, `moveToTop`, `moveToBottom` の6種類
- Materials から素材画像を選択するダイアログ（サムネイルグリッド付き）
- パラメータ入力: Duration（秒）、Zoom（%）、Move From/To（%）
- `Set` ボタンで Beat の image/animation/duration を一括反映
- テンプレートとの差分を検知し `Custom` バッジを表示

### Beat Navigator
Script Editor の TEXT / MEDIA タブに **Beat Navigator** 機能を追加しました。

- Beat Navigator ボタンからダイアログを起動
- Beat カードをグリッド表示（番号・サムネイル・テキスト）
- カードクリックで該当 Beat へスクロールナビゲーション

### mulmocast ライブラリ更新（2.4.8 → 2.6.6）
上流ライブラリの更新により、以下の新機能が利用可能になりました。モデル一覧は動的ロードされるため、新モデルは自動的に UI ドロップダウンに反映されます。

#### 新しい動画生成モデル
- Google **Veo 3.1 Lite**
- Google **Veo 3.1 Fast**（Replicate 経由）
- Replicate 経由 **Grok Imagine Video**
- Replicate 経由 **Grok Imagine R2V**
- Replicate 経由 **RunwayML Gen 4.5**
- Replicate 経由 **Kling v3 Video** / **Kling v3 Omni Video**

## バグ修正

- **macOS 自動アップデートが適用されない問題を修正**: 設定画面の再起動ボタンが表示されない問題（IPC パス typo）と、アプリ終了時にアップデートが適用されない問題を修正。さらにインストールフローを `safeQuitAndInstall()` に統一し安定化

## 改善

- 音声生成ボタンにローディングスピナーを追加（画像・動画生成ボタンと統一）
- 音声生成バリデーションのエラーメッセージ文言を改善

## 開発者向け

- `handler_contents.ts`: `imagePreprocessAgent` に `imageRefs` を正しく渡すよう修正（html_tailwind の黒画面回避）
- 自動アップデートリスナーを `createWindow` 外に移動し、リスナー重複を防止
- `getImageRefs()` → `getMediaRefs()` への API 移行対応
- リリースワークフロー Skills の改善
- Beat Navigator / Image Effect の QA テスト追加（267+ テストケース）
- QA Playbook 更新（コンポーネントセットアップ、バリデーションポリシー等）
- Electron 40.6.1 → 41.1.1 に更新
- セキュリティパッチ: hono, @hono/node-server, express-rate-limit, @xmldom/xmldom
- その他依存パッケージの定期更新
