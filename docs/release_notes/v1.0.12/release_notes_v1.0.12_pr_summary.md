# MulmoCast App v1.0.12 PR Summary

対象: v1.0.11 (2026-02-11) 以降にマージされた全23件のPR

## 新機能（New Features）

- #1561: Add TTS speed option for OpenAI/GCP and comprehensive speech params QA — OpenAI TTS および GCP Speech TTS に読み上げ速度（speed）パラメータを追加。プロバイダごとの min/max/step/placeholder を UI に反映。126項目の QA テストスイートも同時に新規作成
- #1574: Add gemini-3.1-flash-image-preview (Nano Banana 2) support — 画像生成モデル `gemini-3.1-flash-image-preview`（Nano Banana 2）のサポートを追加。constants・i18n（英語/日本語）に対応エントリを追加

## バグ修正（Bug Fixes）

- #1564: Fix chat clipboard copy button copying empty array instead of messages — チャット画面の開発用「メッセージをコピー」ボタンが空の `messageHistory` をコピーしていた問題を修正し、実際のチャット履歴（`props.messages`）をコピーするよう変更（Closes #1540）
- #1568: Add readClipboardText to preload and migrate QA tests to IPC — Electron 40 で非推奨の `navigator.clipboard` を IPC 経由（`readClipboardText` / `writeClipboardText`）に移行。preload API と IPC ハンドラを追加し、QA テスト3ファイルも対応（Closes #1543）

## UI/UX改善（UI/UX Improvements）

該当なし

## 削除された機能（Removed Features）

該当なし

## リファクタリング（Refactoring）

- #1566: Remove unused clipboard fallbacks and migrate to IPC in debug_log.vue — `debug_log.vue` のクリップボードコピー処理を整理。3段階フォールバック（`navigator.clipboard` → 未定義 `electronAPI.clipboard` → `execCommand`）を IPC ベースの `writeClipboardText` に統一し、未使用コードを削除（Closes #1541, #1542）

## 依存パッケージ更新（Dependencies）

- #1552: udpate — dotenv 17.2.4→17.3.1、Electron 40.3.0→40.4.0、monaco-yaml 5.4.0→5.4.1、mulmocast 2.1.35→2.1.38
- #1554: update — typescript-eslint 8.55.0→8.56.0、Electron 40.4.0→40.4.1、eslint-plugin-vue 10.7.0→10.8.0、vue-eslint-parser 10.2.0→10.4.0、elevenlabs-js 2.35.0→2.36.0、lucide-vue-next 0.563.0→0.564.0、mulmocast 2.1.38→2.1.39
- #1555: update packages — 複数のランタイム・開発依存パッケージのパッチ更新
- #1556: mulmocast@2.1.40 — mulmocast ライブラリを 2.1.40 に更新
- #1557: mulmocast@2.2.0 — mulmocast ライブラリを 2.2.0 にメジャーマイナー更新
- #1559: update — Electron 40.4.1→40.6.0、jsonc-eslint-parser 2.4.2→3.0.0、lucide-vue-next 0.574.0→0.575.0、mulmocast 2.2.0→2.2.1、puppeteer 24.37.4→24.37.5
- #1560: update — eslint 10.0.0→10.0.1、jsonc-eslint-parser 3.0.0→3.1.0、reka-ui 2.8.0→2.8.2、unicorn-magic resolution 削除
- #1562: update — vue-tsc 3.2.4→3.2.5、mulmocast 2.2.1→2.2.4
- #1565: update packages — 複数の開発・ランタイム依存パッケージのパッチ更新
- #1569: chore(deps): bump basic-ftp from 5.1.0 to 5.2.0 — Dependabot によるセキュリティパッチ更新
- #1570: chore(deps): bump rollup from 4.57.1 to 4.59.0 — Dependabot によるセキュリティパッチ更新
- #1571: chore(deps): bump hono from 4.12.0 to 4.12.3 — Dependabot によるセキュリティ修正（X-Forwarded-For 処理の脆弱性対応）を含む更新
- #1572: update — @electron/fuses 2.0.0→2.1.0、@types/node 25.3.0→25.3.2、mulmocast 2.2.6→2.4.1、resolutions に tar・fast-xml-parser・minimatch を追加
- #1575: update — @intlify/eslint-plugin-vue-i18n 4.2.0→4.3.0、@types/node 25.3.2→25.3.3、globals 17.3.0→17.4.0、elevenlabs-js 2.36.0→2.37.0、mulmocast 2.4.1→2.4.5（最終版）

## 開発者向け（Developer）

- #1550: feat: add release workflow skills and discord-release integration — リリースワークフローを Claude Code Skills として整備。`/release`・`/release-notes`・`/release-xpost`・`/release-tag`・`/discord-release` の各スキルを新規追加。v1.0.9〜v1.0.11 のリリースノート・X投稿ドラフトも追加
- #1551: feat: add release-youtube, release-zenn, release-script skills and v1.0.11 release assets — `/release-script`・`/release-youtube`・`/release-zenn` スキルを新規追加。`/release` オーケストレーターを拡張（Phase 3 に YouTube・Zenn、Phase 4 にアーカイブ追加）。v1.0.11 リリースアセット（MulmoScript・タイムスタンプ・YouTube メタデータ）も追加

## テスト（Testing）

- #1563: Add verification strictness rules and re-read policy to QA playbook — QA テスト検証の厳密さ基準（Level 1〜4）を `docs/qa_playbook.md` に追加。Level 1（truthy チェック）禁止、Level 4（ラウンドトリップ）推奨。テスト拡張時の playbook 再読ルールも追加

## CI/CD

- #1549: chore: enable CodeQL code scanning — GitHub Actions で CodeQL コードスキャンを有効化。JavaScript/TypeScript を対象に push・PR・週次スケジュールで実行
