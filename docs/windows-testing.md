# Windows Test Checklist for MulmoCast / MulmoCast 向け Windows テストチェックリスト

MulmoCast is primarily developed and verified on macOS, but several code paths differ on Windows builds. The following checklist summarizes the minimum manual verification you should run on a Windows machine before shipping a release build.
MulmoCast は主に macOS 上で開発・検証されていますが、Windows ビルドでは異なるコードパスが存在します。以下のチェックリストは、リリースビルドを出荷する前に Windows マシンで実施すべき手動確認の最小セットをまとめたものです。

## 1. Build and Installer Validation / ビルドとインストーラーの検証
- Run `yarn run make:ci:win` to build the Windows artifacts and confirm the Squirrel installer (`.exe`) and ZIP outputs are produced. This script mirrors the CI build and ensures Puppeteer downloads its Chromium binary into the expected `chromium/chrome` directory tree bundled with the app.【F:package.json†L15-L24】【F:src/main/main.ts†L40-L78】
- Windows 向け成果物を生成するために `yarn run make:ci:win` を実行し、Squirrel インストーラー（`.exe`）と ZIP の出力が得られることを確認します。このスクリプトは CI ビルドを再現し、Puppeteer がアプリに同梱される想定の `chromium/chrome` ディレクトリに Chromium バイナリをダウンロードすることを保証します。【F:package.json†L15-L24】【F:src/main/main.ts†L40-L78】
- Install the generated Squirrel package and verify shortcuts/uninstall hooks run correctly. The app calls `electron-squirrel-startup` on first launch, so the installation should create Start Menu and desktop entries and support clean removal.【F:src/main/main.ts†L5-L7】【F:src/main/main.ts†L98-L110】
- 生成された Squirrel パッケージをインストールし、ショートカットやアンインストールのフックが正しく動作することを確認します。初回起動時にアプリは `electron-squirrel-startup` を呼び出すため、インストールではスタートメニューとデスクトップのエントリが作成され、クリーンな削除が可能である必要があります。【F:src/main/main.ts†L5-L7】【F:src/main/main.ts†L98-L110】

## 2. First-Run and Window Behavior / 初回起動とウィンドウ挙動
- Confirm the splash screen shows and closes, and the main window opens with the correct icon (`.ico` on Windows).【F:src/main/main.ts†L112-L166】
- スプラッシュ画面が表示されて閉じること、そしてメインウィンドウが適切なアイコン（Windows では `.ico`）で開くことを確認します。【F:src/main/main.ts†L112-L166】
- Resize and move the window, then relaunch the app to ensure the saved window bounds are restored from `window-state.json`.【F:src/main/main.ts†L136-L170】【F:src/main/utils/windw_state.ts†L6-L35】
- ウィンドウをリサイズおよび移動し、アプリを再起動して `window-state.json` に保存されたウィンドウサイズと位置が復元されることを確認します。【F:src/main/main.ts†L136-L170】【F:src/main/utils/windw_state.ts†L6-L35】

## 3. Renderer Features that Depend on Native Integrations / ネイティブ連携に依存するレンダラー機能
- Exercise flows that rely on Puppeteer/Chromium (e.g., Mulmo content generation) to confirm the runtime patch successfully picks up the packaged executable path on Windows.【F:src/main/main.ts†L24-L78】
- Puppeteer/Chromium に依存するフロー（例: Mulmo コンテンツ生成）を実行し、ランタイムパッチが Windows で同梱された実行ファイルのパスを正しく検出できることを確認します。【F:src/main/main.ts†L24-L78】
- Trigger actions that download or open external links to ensure they open in the default Windows browser rather than spawning new Electron windows.【F:src/main/main.ts†L171-L214】
- 外部リンクをダウンロードまたは開くアクションを起動し、新しい Electron ウィンドウではなく Windows の既定ブラウザで開くことを確認します。【F:src/main/main.ts†L171-L214】

## 4. Update Flow / アップデートフロー
- Verify `update-electron-app` can reach the update endpoint and that the notification dialog renders the release notes text (Windows uses `releaseNotes` as the message body).【F:src/main/main.ts†L18-L23】【F:src/main/update.ts†L1-L36】
- `update-electron-app` がアップデートエンドポイントに到達し、通知ダイアログがリリースノートのテキストを表示することを確認します（Windows では `releaseNotes` が本文として使用されます）。【F:src/main/main.ts†L18-L23】【F:src/main/update.ts†L1-L36】
- If auto-update artifacts are available, confirm `autoUpdater.quitAndInstall()` restarts the app after accepting the restart button.【F:src/main/update.ts†L23-L35】
- 自動アップデート用の成果物が利用可能な場合、再起動ボタンを受け入れた後に `autoUpdater.quitAndInstall()` がアプリを再起動することを確認します。【F:src/main/update.ts†L23-L35】

## 5. Regression Pass / 回帰確認
- **Dashboard & project management / ダッシュボードとプロジェクト管理**: Launch the packaged build, ensure the project list loads, create a new project, delete an existing one, and confirm dashboard sort/view preferences persist via `settings.set`. This validates that all `window.electronAPI.project.*` routes remain callable on Windows and that settings writes succeed on NTFS paths.【F:src/renderer/lib/project_api.ts†L7-L35】【F:src/renderer/pages/dashboard.vue†L151-L318】
  - パッケージ済みビルドを起動し、プロジェクト一覧が読み込まれること、新規プロジェクトの作成と既存プロジェクトの削除が行えることを確認します。さらに、ダッシュボードの並び順や表示設定が `settings.set` により保持され、Windows でも `window.electronAPI.project.*` の各ルートが呼び出せること、および NTFS 上で設定の書き込みが成功することを検証します。【F:src/renderer/lib/project_api.ts†L7-L35】【F:src/renderer/pages/dashboard.vue†L151-L318】
- **Project loading & persistence / プロジェクト読み込みと保存**: Open an existing project and verify metadata, script content, and media assets load without path separator issues. Make edits (script text, chat messages, tab changes), trigger auto-saves, and reopen the project to confirm persisted updates round-trip correctly through IPC.【F:src/renderer/pages/project.vue†L311-L520】
  - 既存プロジェクトを開き、メタデータ・スクリプト内容・メディアアセットがパス区切り文字の差異による問題なく読み込まれることを確認します。スクリプト本文やチャットメッセージ、タブ切り替えなどを編集して自動保存を発火させ、再度プロジェクトを開いて IPC 経由で永続化された更新が正しく往復することを確かめます。【F:src/renderer/pages/project.vue†L311-L520】
- **Script tools & localization workflows / スクリプトツールと多言語ワークフロー**: Generate beat audio, run translations, and update multilingual text to verify every `mulmoHandler` invocation works with packaged paths and that translated assets are stored/reloaded properly.【F:src/renderer/pages/project/script_editor/text_editor.vue†L127-L197】
  - ビート音声を生成し、翻訳を実行し、多言語テキストを更新して、すべての `mulmoHandler` 呼び出しがパッケージ済みパスで正しく動作し、翻訳済みアセットが適切に保存・再読み込みされることを検証します。【F:src/renderer/pages/project/script_editor/text_editor.vue†L127-L197】
- **Media generation & downloads / メディア生成とダウンロード**: Exercise movie/audio generation, ensure progress notifications render, and download artifacts (images, audio, reference media) to confirm binary transfers via `mulmoHandler` stay intact in production builds.【F:src/renderer/pages/project.vue†L463-L520】【F:src/renderer/pages/project/generate.vue†L53-L87】【F:src/renderer/components/product/tabs/utils.ts†L5-L33】
  - 映像・音声の生成を実行し、進行状況の通知が表示されること、および画像・音声・参照メディアなどの成果物をダウンロードして、`mulmoHandler` 経由のバイナリ転送が本番ビルドでも健全に保たれていることを確認します。【F:src/renderer/pages/project.vue†L463-L520】【F:src/renderer/pages/project/generate.vue†L53-L87】【F:src/renderer/components/product/tabs/utils.ts†L5-L33】
- **IPC wiring sanity check / IPC 配線の健全性確認**: Monitor long-running jobs to ensure `onProgress` events and navigation requests continue to flow from the main process into the renderer, signalling that the preload-exposed APIs remain trusted after code signing.【F:src/preload/preload.ts†L6-L33】【F:src/renderer/app.vue†L41-L85】
  - 長時間実行するジョブを監視し、`onProgress` イベントやナビゲーション要求がメインプロセスからレンダラーに継続的に届き、コード署名後も preload で公開された API が信頼されたままであることを示すか確認します。【F:src/preload/preload.ts†L6-L33】【F:src/renderer/app.vue†L41-L85】

Document the results of each step in your release checklist so regressions can be tracked across Mac and Windows builds.
各ステップの結果をリリースチェックリストに記録し、Mac と Windows の両ビルドで回帰を追跡できるようにしてください。
