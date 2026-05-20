# MulmoCast App v1.0.14 Release Notes

## 新機能

### 並列実行数（Concurrency）設定 UI
画像/動画/音声の同時生成数を、設定画面でのデフォルト値と、プロジェクト単位の両方で指定できるようにしました。

- **設定画面**: 「画像/動画」と「音声」それぞれのデフォルト同時生成数を指定
- **プロジェクトの Style タブ**: プロジェクトごとに上書き可能

画像/動画/音声の生成は AI モデルの API を並列に呼び出していますが、ご契約のプランによって許容されるレート（同時呼び出し数）が異なります。ご利用の環境に合わせて調整できます。

### 利用できる AI モデルの追加

#### 新しい画像生成モデル
- OpenAI **gpt-image-2**
- OpenAI **gpt-image-1-mini**（軽量版）
- Replicate 経由 **Black Forest Labs Flux 2 Pro / Flux 2 Dev**
- Replicate 経由 **Black Forest Labs Flux 1.1 Pro / Flux 1.1 Pro Ultra / Flux Pro / Flux Dev / Flux Schnell**
- Replicate 経由 **Ideogram V3 Turbo / V3 Balanced / V3 Quality**
- Replicate 経由 **Recraft V3**
- Replicate 経由 **Stable Diffusion 3.5 Large**
- Replicate 経由 **Luma Photon**

#### 新しい動画生成モデル
- Replicate 経由 **ByteDance Seedance 2.0 / Seedance 2.0 Fast**
- Replicate 経由 **Alibaba HappyHorse 1.0**
- Replicate 経由 **MiniMax Hailuo 2.3 / Hailuo 2.3 Fast**
- Replicate 経由 **PixVerse v5**

## 提供元のサポート終了に伴うモデルの削除

提供元（OpenAI / Google）側でサポートが終了したため、以下のモデルが選択肢から外れました。これらを指定していたプロジェクトでは、生成時に推奨モデルへの移行ヒントが表示されます。

- OpenAI **dall-e-3**（推奨: `gpt-image-1` または他のサポートモデル）
  - これに伴い、オンボーディングのデモ画像のデフォルトモデルも `dall-e-3` → **`gpt-image-1-mini`** に変更しました
- Google **Imagen 4.0 Generate 001 / Imagen 4.0 Ultra Generate 001 / Imagen 4.0 Fast Generate 001**（推奨: `gemini-2.5-flash-image` または `gemini-3-pro-image-preview`）

## バグ修正

- **Windows 版で HTML / Markdown / Chart / Mermaid 系のビート生成が失敗する問題を修正**
  - 症状: Windows 版でこれらのビート画像を生成すると「Could not find Chrome」エラーで失敗していました
  - 同梱の Chromium の場所がアプリ内で正しく解決されず、別のキャッシュ場所を参照してしまっていたのが原因です

## 開発者向け

- **OEM ブランディング対応**: `BRAND` 環境変数で OEM 用ブランド名を切り替えてビルド・起動できるようになりました
  - `branding/` ディレクトリにブランド設定 JSON を配置し、`BRAND=xxx yarn start` / `BRAND=xxx yarn make:local` で選択
  - 反映箇所: ウィンドウタイトル、ヘッダー、About パネル、メニュー（About / Hide）、新規プロジェクトの description、Electron Forge のパッケージ名・実行ファイル名
  - 自動 E2E テストで default + foobar の 2 ブランドの起動を検証
- **Vite v7 → v8 アップグレード**: 内部で Rollup/esbuild が Rolldown/Oxc に置き換えられたことに伴い、`rollupOptions` → `rolldownOptions` への移行、`platform: "node"` 指定の追加（`createRequire(import.meta.url)` がランタイムで `undefined` を受け取る問題の回避）
  - 副次的影響として、Windows 版で `puppeteer.launch(...)` のバンドル結果が `puppeteer` の named export `launch`（関数参照スナップショット）を呼ぶ形に変わっていた。起動時パッチは `puppeteer` の default インスタンス側 `launch` だけを差し替えていたため、同梱 Chromium への `executablePath` 注入が届かず、デフォルトキャッシュ `%USERPROFILE%\.cache\puppeteer` を参照して失敗していた → 起動時パッチで default インスタンスと named export の両方の `launch` を同時に上書きするよう修正（rc-1 検証で発覚 → rc-2 で修正）
- **TypeScript 5.9 → 6.0 アップグレード**: `ignoreDeprecations: "6.0"` 追加、sonarjs ルール 3 件の無効化、複数箇所での null/undefined safety 強化
- **`lucide-vue-next` → `@lucide/vue` へのアイコン移行**: 公式マイグレーションガイドに従い 49 Vue ファイルの import を置換
- **Zod バリデーションエラー表示の整形**: `initializeContextFromFiles` 等で発生する Zod のバリデーションエラーが、JSON ダンプから「1 issue = 1 行」の見やすいフォーマットに統一されました
  - Before: `[ { "code": "invalid_value", "path": [...], "message": "..." }, ... ]`
  - After: `   - speechParams.speakers.Announcer.provider: Invalid option: expected ...`
- **ENOENT ログのノイズ削減**: メディア処理から bubble up する `ENOENT` のフルスタックトレースを 1 行サマリーに集約（`logCaughtError` ヘルパー新設、catch ブロック 15 箇所を置換）
- **テストの lint warning 解消**: test/ 配下 8 件（`preserve-caught-error`, `no-useless-assignment`）
- **TypeScript 6 / Vite 8 / Concurrency UI 用の QA テストスイート追加**（unit test + Playwright QA）
- **qa-create skill のワークフロー強化**: 実 DOM 確認の必須化、Definition of Done 追加
- **Electron 41.1.1 → 42.0.1 へ更新**
- セキュリティパッチ: `basic-ftp`（制御文字 reject / unbounded response 防止）、`hono`（Vary 無視 / JSX CSS injection / JWT 検証）、`fast-uri`（fragment decoding）
- その他依存パッケージの定期更新（mulmocast 関連の積み上げ更新、@elevenlabs/elevenlabs-js, axios, vue, tailwindcss, playwright 等）
