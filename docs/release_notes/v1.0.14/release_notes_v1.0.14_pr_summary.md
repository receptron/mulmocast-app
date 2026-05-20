# v1.0.14 PR Summary

v1.0.13 (2026-04-07) 以降にマージされた全 PR（28 件）の分類・要約。

**期間**: 2026-04-09 〜 2026-05-12
**mulmocast CLI**: 2.6.6 → 2.6.13
**Electron**: 41.1.1 → 42.0.1
**Vite**: 7.x → 8.0.12
**TypeScript**: 5.9 → 6.0
**lucide-vue-next** → **@lucide/vue** に移行

---

## User-facing

### 新機能（New Features）

#### OEM ブランディング対応（#1617）

- **`BRAND` 環境変数で OEM 用ブランド名を切替できる機能**を追加（@ystknsh）
  - `branding/` ディレクトリにブランド設定 JSON を配置し、`BRAND=xxx yarn start` / `BRAND=xxx yarn make:local` で選択
  - Vite `define` でビルド時にブランド名を注入（`__APP_BRAND__`, `__APP_BRAND_ID__`）
  - 反映箇所: ウィンドウタイトル、ヘッダー、About パネル、メニュー（About / Hide）、新規プロジェクトの description、Electron Forge パッケージ名・実行ファイル名
  - `index.html` の `<title>` を `%APP_BRAND_NAME%` プレースホルダ化
  - 自動 E2E テスト追加（default + foobar の 2 ブランドで起動→検証）

#### 並列実行数（Concurrency）設定 UI（#1628）

- **画像/動画/音声の同時実行数を Settings とプロジェクト Style タブから設定できる UI**を追加（@ystknsh, issue #1618 対応）
  - Settings ページに「並列実行のデフォルト値」セクションを新設（Collapsible カード）
    - 「画像/動画」用と「音声」用の **数値入力フィールド（Input type="number", min=1, step=1）** を 2 つ配置
    - 画像と動画は GraphAI グラフを共有するため UI 上では 1 入力に集約し、同じ値を `imageParams.concurrency` / `movieParams.concurrency` の両方に書き込む
  - 新規プロジェクト作成時にこの値が `script.imageParams/movieParams/audioParams.concurrency` に自動注入される（既存プロジェクトを開いても mutation なし）
  - プロジェクトの Style タブに「Concurrency」セクションを追加し、プロジェクト単位で上書き可能
  - `parseConcurrency` ユーティリティで空欄/0/負値/小数を正規化（小数は floor、不正値は undefined）
  - 単一 `update` イベント emit に集約して親側の race condition を回避
  - 対応 UI 要素: Card、Collapsible、Input（type=number）×2、Label

#### mulmocast ライブラリ更新（#1626, #1631, #1637 経由で 2.6.6 → 2.6.13）

- mulmocast パッケージを 2.6.6 → 2.6.13 に更新（複数 PR にまたがる積み上げ）
  - **app 側の対応**: モデル一覧は CLI 側の `provider2ImageAgent` / `provider2MovieAgent` から動的取得しているため、新モデルはコード変更なしで UI ドロップダウンに自動反映される
  - 上流の主な追加機能（v2.6.6 → v2.6.13）:
    - **Seedance 2.0** 動画モデル追加（Replicate）
    - **gpt-image-2** 画像モデル追加（OpenAI）
    - **gpt-image-1-mini** 画像モデル追加（OpenAI、軽量版）
    - 動画モデルの **`generateAudio` サポート**（seedance-2.0 / pixverse-v4.5 が音声対応、Replicate Veo は optional）
    - **画像/動画/音声の同時実行数を設定可能化**（app 側の #1628 と連動）
    - デフォルト背景色の追加
    - `tts_google_agent` で gRPC `.details` をエラーに含めて露出 + timeout 対応
    - `setMulmoErrorFormatter` 注入点の追加（#1637 で利用）

#### Onboarding デフォルト画像モデルの切替（#1638）

- **オンボーディングのデフォルト画像生成モデルを `dall-e-3` → `gpt-image-1-mini` に変更**（@ystknsh）
  - `src/shared/onboard/*.ts` 全 6 ファイルで `imageParams.model` を更新（mulmocast 2.6.13 の最軽量モデル）
  - `quality: "auto"` は gpt-image-1 ファミリーで有効なため据え置き
  - intro03 の「OpenAI 上位モデル」訴求文言を `gpt-image-1` → `gpt-image-2` に昇格
  - intro03 末尾の Organization 認証注意書きは事実関係未確認のため `gpt-image-1` のまま意図的に維持
  - `docs/introduction/*.json` スナップショットを `scripts/export-onboard.ts` で再生成し、`scripts/verify-export-onboard.ts` で TS↔JSON 一致を確認

### バグ修正（Bug Fixes）

- **Windows 版で HTML/Markdown/Chart/Mermaid ビート生成が `Could not find Chrome` で失敗する問題を修正**（rc-1 検証で発覚 → rc-2 で修正）
  - 起点は #1601（Vite 7→8）。Vite 8 は内部バンドラを Rollup から Rolldown に切り替え、同時に `commonjsOptions: { transformMixedEsModules: true }` を撤去した（Vite 8 で no-op）
  - その結果、ESM の `mulmocast/lib/utils/html_render.js` の `import puppeteer from "puppeteer"; puppeteer.launch(...)` が、バンドル後は puppeteer の **named export `launch`（関数参照スナップショット、`exports.launch = puppeteer.launch` で代入される）** を呼ぶ形に変わった
  - 既存の `src/main/main.ts` ランタイムパッチは default インスタンスの `launch` だけを差し替えていたため、同梱 Chromium への `executablePath` 注入が届かず、デフォルトキャッシュ `%USERPROFILE%\.cache\puppeteer` を見にいって失敗
  - 修正: `src/main/main.ts` のパッチで default インスタンスと `require("puppeteer").launch`（named export）の両方を同時に上書き
  - 1.0.13（Vite 7 + `transformMixedEsModules`）では default 経由に揃っていたため顕在化していなかった

### UI/UX 改善（UI/UX Improvements）

- **Zod バリデーションエラー表示の整形**（#1637, @isamu）
  - mulmocast 2.6.13 で導入された `setMulmoErrorFormatter` 注入点に既存の `formatZodError` ヘルパーを登録
  - `initializeContextFromFiles` 内で出る Zod validation エラーが、他箇所と同じ「1 issue = 1 行」の見やすいフォーマットに統一される
  - Before: `[ { "code": "invalid_value", "path": [...], "message": "..." }, ... ]`（JSON ダンプ）
  - After: `   - speechParams.speakers.Announcer.provider: Invalid option: expected ...`（1 issue 1 行）

### 削除された機能（Removed Features）

なし

---

## Developer-facing

### 開発者向けバグ修正・改善

- **ENOENT ログのノイズ削減**（#1632, @isamu）
  - メディアファイル系の処理（`downLoadReferenceImage` 等）から bubble up する `ENOENT` のフルスタックトレースを 1 行サマリーに集約
  - 新規ヘルパー `logCaughtError(error)` を `src/main/mulmo/error_utils.ts` に追加
  - `handler.ts` / `handler_contents.ts` / `handler_generator.ts` の catch ブロック内 `GraphAILogger.log(error)` 計 15 箇所を置換
  - ENOENT 以外は従来通りフルスタック出力（異常の手がかりを残すため）
  - 開発者のコンソール体験改善・デバッグ効率向上が目的（ユーザー UI 上に直接出るものではない）

- **lint warning の解消（test/ 配下、開発者向け）**（#1619, @ystknsh）
  - `preserve-caught-error` 6 件: catch した error を `new Error(..., { cause: error })` で包み直し
  - `no-useless-assignment` 2 件: `exitCode` の常に上書きされる初期値を削除
  - 対象: `test/automated_serial_generation_e2e_test.ts`, `test/manual_no_api_electron_upgrade_qa.ts`, `test/manual_no_api_vertex_ai_qa.ts`, `test/manual_run_switch_language.ts`

### リファクタリング（Refactoring）

- **Vite v7 → v8 アップグレード**（#1601, @isamu）
  - Vite 8 は内部で Rollup/esbuild を Rolldown/Oxc に置き換え
  - `rollupOptions` → `rolldownOptions` に移行（Vite 8 で deprecated）
  - `vite.main.config.ts` に **`platform: "node"`** を追加 — Rolldown は CJS 出力時に `import.meta.url` を `{}.url` に変換してしまうため、`createRequire(import.meta.url)` が `undefined` を受け取りランタイムエラーになる問題を回避
  - `commonjsOptions` を削除（Vite 8 では no-op）
  - `esbuild` を明示的な devDependency として追加（`vite-plugin-monaco-editor` が必要とするため）

- **TypeScript 5.9 → 6.0 アップグレード**（#1604, @isamu）
  - `tsconfig.common.json` に `ignoreDeprecations: "6.0"` を追加（`baseUrl` / `moduleResolution: "node"` が TS 7.0 で削除予定のため）
  - sonarjs ルール 3 つを無効化（TS 6 の厳格な型推論による誤検出）: `sonarjs/argument-type`, `sonarjs/different-types-comparison`, `sonarjs/function-return-type`
  - 各所で null/undefined safety チェックを追加
  - CodeRabbit のレビューサマリーによれば、メディアファイル処理と voice cloning でランタイムクラッシュの可能性があった箇所を予防的に修正

- **`lucide-vue-next` → `@lucide/vue` 移行**（#1614, @isamu）
  - 公式マイグレーションガイドに従い、49 Vue ファイルの import を `lucide-vue-next` → `@lucide/vue` に置換
  - `lucide-vue-next` は 1.0.0 で停止し、`@lucide/vue` が今後の本流
  - API は 100% 互換、削除されたブランドアイコン（Github 等）は本プロジェクトで未使用のため影響なし

### 依存パッケージ更新（Dependencies）

mulmocast 関連を含む依存更新 PR が 16 件（#1612, #1615, #1616, #1620, #1621, #1622, #1624, #1625, #1626, #1629, #1631, #1633, #1634, #1635, #1636, #1639）。主な内訳:

| PR | パッケージ | バージョン | 備考 |
|----|-----------|-----------|------|
| #1612 | 複数 | electron 41.1.1→41.2.0, vite 8.0.3→8.0.8, reka-ui 2.9.3→2.9.5, vue-i18n 11.3.0→11.3.2, playwright 1.58.2→1.59.1, @typescript-eslint 8.58.0→8.58.1, dotenv 17.4.0→17.4.1 | 定期更新 |
| #1615 | `fast-xml-parser` | 5.5.9 → 5.5.11 | 単独パッチ |
| #1616 | `@elevenlabs/elevenlabs-js`, `@lucide/vue`, `adm-zip` | 2.39.0→2.42.0, 1.7.0→1.8.0, 0.5.16→0.5.17 | minor/patch |
| #1620 | `basic-ftp` | 5.2.1 → 5.2.2 | セキュリティ修正（制御文字 reject） |
| #1621 | `@types/node`, `prettier` | 25.5.2→25.6.0, 3.8.1→3.8.2 | 定期更新 |
| #1622 | 多数 | yarn upgrade --dev --minor + --patch + dedupe | 定期更新（@aws-sdk 等の transitive deps） |
| #1624 | 複数 | tailwindcss 4.2.2→4.2.4, vite 8.0.8→8.0.9, vue-tsc 3.2.6→3.2.7, @tailwindcss/vite 4.2.2→4.2.4, **mulmocast 2.6.6→2.6.8**, vue 3.5.32→3.5.33, vue-router 5.0.4→5.0.6 | 定期更新 |
| #1625 | `electron` | 41.2.0 → 41.3.0 | Electron 更新 |
| #1626 | `mulmocast` 他 | **2.6.6 → 2.6.9**（mulmocast 本体）| Seedance 2.0 / gpt-image-2 / 同時実行数設定可能化 / Google TTS gRPC details の追加（ユーザー向け機能を含む） |
| #1629 | 複数 | electron 41.3.0→41.5.0, vite 8.0.9→8.0.10, @elevenlabs/elevenlabs-js 2.42.0→2.45.0, @lucide/vue 1.8.0→1.14.0, **mulmocast 2.6.9→2.6.10**, vue-i18n 11.3.2→11.4.0 | 定期更新 |
| #1631 | 複数 | electron 41.5.0→42.0.1, tailwindcss 4.2.4→4.3.0, vite 8.0.10→8.0.11, vue-tsc 3.2.7→3.2.8, @elevenlabs/elevenlabs-js 2.45.0→2.46.0, @tailwindcss/vite 4.2.4→4.3.0, **mulmocast 2.6.10→2.6.12**, reka-ui 2.9.5→2.9.7, vue 3.5.33→3.5.34, vue-i18n 11.4.0→11.4.2 | 定期更新 |
| #1633 | `fast-uri` | 3.1.0 → 3.1.2 | セキュリティ修正（malformed fragment decoding） |
| #1634 | `axios` | 1.15.0 → 1.16.0 | minor bump（QUERY HTTP method, ECONNREFUSED 定数, fetch adapter で `maxBodyLength`/`maxContentLength` を enforce 等） |
| #1635 | `hono` | 4.12.14 → 4.12.18 | セキュリティ修正 3 件（Cache Middleware の Vary 無視, JSX CSS injection, JWT 時刻クレーム検証） |
| #1636 | `basic-ftp` | 5.3.0 → 5.3.1 | セキュリティ修正（unbounded control response 防止） |
| #1639 | `playwright`, `vite` | 1.59.1→1.60.0, 8.0.11→8.0.12 | 定期更新 |

加えて #1637（feat: install MulmoErrorFormatter）で `mulmocast` を 2.6.12 → **2.6.13** に bump（ユーザー向け UX 改善側に分類済み）。
#1638（onboarding gpt-image-1-mini 切替）も mulmocast 2.6.13 に連動した変更（こちらも新機能側に分類）。

最終的に mulmocast は v1.0.13 リリース時点の **2.6.6** から **2.6.13** へ到達。

### テスト（Testing）

- **TypeScript 6 / Vite 8 アップグレード検証用 QA テストスイートを追加**（#1613, @ystknsh）
  - `test/manual_no_api_typescript6_qa.ts` (24 テスト) — `safeParse` → `parse` 変更、null チェック追加箇所、Voice Clone ページの `getErrorCause` / `name ?? ""` 等の検証
  - `test/manual_no_api_vite8_qa.ts` (16 テスト) — `rolldownOptions` + `platform: "node"` の動作確認、全主要ルート遷移、HMR WebSocket 接続、`ERR_INVALID_ARG_VALUE` / `createRequire` エラー検出
  - 両テスト 24/24 + 16/16 PASS

- **Concurrency UI 用 unit test + Playwright QA テスト追加**（#1628）
  - `test/test_concurrency.ts` — `parseConcurrency` の boundary を網羅（109 tests pass）
  - `test/manual_no_api_concurrency_qa.ts` — Playwright QA suite（API コストなし、CDP 経由）

### CI/CD

なし

### ドキュメント / Skill 整備（Documentation）

- **v1.0.13 リリースノート一式の追加**（#1611, @ystknsh）
  - PR 要約、リリースノート、X 投稿ドラフト、MulmoScript、タイムスタンプ、YouTube メタデータ
  - リリーススキル改善: Phase 2.5/2.7 追加、Discord 投稿のトピック区切りルール、YouTube タイムスタンプ粒度、アーカイブ URL 対応
  - `mp4`/`gif` を release notes images から gitignore

- **qa-create skill のワークフロー強化 + lint --fix 適用**（#1630, @ystknsh）
  - `.claude/skills/qa-create/SKILL.md` を更新
    - Step 3.5: 実 DOM 確認（必須）を追加
    - Step 5 を「実行と修正（必須）」に変更（push 前の実行成功を明記）
    - 「推測でセレクタを書かない」ルールを追加
    - Definition of Done を追加
  - 副次的に `src/main/mulmo/handler_media.ts` の不要な eslint-disable コメントを `yarn lint --fix` で削除

---

## 全 PR 一覧（28 件）

| # | PR | タイトル | カテゴリ | エンドユーザー影響 |
|---|-----|---------|---------|-----------------|
| 1 | #1601 | feat: upgrade Vite from v7 to v8 | リファクタリング（依存メジャー） | なし（ビルド基盤） |
| 2 | #1604 | feat: upgrade TypeScript from 5.9 to 6.0 | リファクタリング（依存メジャー） | なし（ビルド基盤） |
| 3 | #1611 | Add release notes for v1.0.13 | ドキュメント | なし |
| 4 | #1612 | udpate | 依存パッケージ更新 | なし |
| 5 | #1613 | test: add QA test suites for TypeScript 6 and Vite 8 upgrades | テスト | なし |
| 6 | #1614 | refactor: migrate from lucide-vue-next to @lucide/vue | リファクタリング | なし |
| 7 | #1615 | update | 依存パッケージ更新（fast-xml-parser） | なし |
| 8 | #1616 | chore: bump @elevenlabs/elevenlabs-js, @lucide/vue, adm-zip | 依存パッケージ更新 | なし |
| 9 | #1617 | Add OEM app branding support | 新機能 | あり（OEM 配布向け） |
| 10 | #1619 | Fix lint warnings in test files | 開発者向け改善 | なし |
| 11 | #1620 | chore(deps): bump basic-ftp from 5.2.1 to 5.2.2 | 依存パッケージ更新（セキュリティ） | なし |
| 12 | #1621 | update | 依存パッケージ更新 | なし |
| 13 | #1622 | chore: yarn-update patch/minor + dedupe | 依存パッケージ更新 | なし |
| 14 | #1624 | update | 依存パッケージ更新（mulmocast 2.6.8 含む） | なし（モデル選択肢の自動更新あり） |
| 15 | #1625 | update | 依存パッケージ更新（Electron 41.3.0） | なし |
| 16 | #1626 | chore: bump mulmocast to 2.6.9 | 依存パッケージ更新（mulmocast 本体） | あり（Seedance 2.0 / gpt-image-2 / 同時実行数等） |
| 17 | #1628 | feat: concurrency settings UI for image/movie/audio generation | 新機能 | あり |
| 18 | #1629 | update | 依存パッケージ更新（mulmocast 2.6.10 含む） | なし（モデル選択肢の自動更新） |
| 19 | #1630 | chore: harden qa-create skill workflow and apply lint --fix | ドキュメント / Skill | なし |
| 20 | #1631 | update | 依存パッケージ更新（Electron 42.0.1, mulmocast 2.6.12 含む） | なし（モデル選択肢の自動更新） |
| 21 | #1632 | fix: reduce ENOENT log noise to one-line "file ... not found" | 開発者向け改善（ログ整理） | なし |
| 22 | #1633 | chore(deps): bump fast-uri from 3.1.0 to 3.1.2 | 依存パッケージ更新（セキュリティ） | なし |
| 23 | #1634 | chore(deps): bump axios from 1.15.0 to 1.16.0 | 依存パッケージ更新 | なし |
| 24 | #1635 | chore(deps): bump hono from 4.12.14 to 4.12.18 | 依存パッケージ更新（セキュリティ） | なし |
| 25 | #1636 | chore(deps): bump basic-ftp from 5.3.0 to 5.3.1 | 依存パッケージ更新（セキュリティ） | なし |
| 26 | #1637 | feat: install MulmoErrorFormatter to use formatZodError | UI/UX 改善 + 依存（mulmocast 2.6.13） | あり（エラーログ表示改善） |
| 27 | #1638 | feat: switch onboarding default image model to gpt-image-1-mini (mulmocast 2.6.13) | 新機能（onboarding） | あり |
| 28 | #1639 | Update package20260512 | 依存パッケージ更新 | なし |

### カテゴリ別件数

- 新機能: 4 件（#1617, #1626, #1628, #1638）
- UI/UX 改善: 1 件（#1637）
- バグ修正（ユーザー影響）: 0 件
- リファクタリング: 3 件（#1601, #1604, #1614）
- 開発者向け改善: 2 件（#1619, #1632）
- テスト: 1 件（#1613）
- ドキュメント / Skill: 2 件（#1611, #1630）
- 依存パッケージ更新: 15 件（#1612, #1615, #1616, #1620, #1621, #1622, #1624, #1625, #1629, #1631, #1633, #1634, #1635, #1636, #1639）

**合計: 4 + 1 + 0 + 3 + 2 + 1 + 2 + 15 = 28 件 ✅**
