# v1.0.13 PR Summary

v1.0.12 以降にマージされた全 PR（23件）の分類・要約。

**mulmocast CLI**: 2.4.8 → 2.6.6  
**Electron**: 40.6.1 → 41.1.1

---

## User-facing

### 新機能（New Features）

#### Image Effect UI（#1585, #1594）

- `html_tailwind` ビート向けの **Image Effect パネル** を新規追加（#1585）
  - エフェクトプリセット選択（ドロップダウン）: `zoomIn`, `zoomOut`, `moveToRight`, `moveToLeft`, `moveToTop`, `moveToBottom` の6種類
  - Materials から素材画像を選択するダイアログ（サムネイルグリッド付き）
  - パラメータ入力（数値入力フィールド）: Duration（秒）、Zoom（%）
  - Move 系エフェクト選択時に Pan Distance（%）入力フィールドが表示
  - `Set` ボタンで Beat の `image.type`, `image.html`, `image.script`, `image.animation`, `duration` を一括反映
  - テンプレートとの差分を検知し `Custom` バッジを表示
  - 対応 UI 要素: ドロップダウン（Select）、数値入力フィールド（Input type=number）、ボタン（Button）、バッジ（Badge）
- パン制御を `distance` から `from/to` 方式に変更（#1594）
  - `Pan Distance (%)` → `Move From (%)` / `Move To (%)` の2入力に変更
  - スクリプト生成を `MulmoAnimation.coverZoom()` / `coverPan()` ベースに統一
  - エフェクトごとの初期方向説明とスケール説明テキストを追加
  - 対応 UI 要素: 数値入力フィールド2つ（from/to）、ヘルプテキスト

#### Beat Navigator（#1587）

- Script Editor の TEXT / MEDIA タブに **Beat Navigator** 機能を追加
  - Beat Navigator 起動ボタン（各タブに配置）
  - ダイアログ内に Beat カードをグリッド表示（番号・サムネイル・テキスト）
  - カードクリックで該当 Beat へスクロールナビゲーション
  - タブごとのスクロールコンテナ参照で正確なスクロール位置を実現
  - 対応 UI 要素: ボタン、ダイアログ（Dialog）、スクロールエリア（ScrollArea）、カードグリッド

#### 音声生成ボタンのローディング表示（#1599）

- 音声生成ボタンに、画像・動画生成ボタンと同様のローディング表示を追加
  - スピナーアイコン（Loader2）+ 「生成中...」テキスト表示
  - beat タブと text タブの両方に対応
  - text タブでのセッション状態参照キーを `index`（数値）から `beat.id`（文字列）に修正（バグ修正を含む）

#### mulmocast ライブラリ更新（#1590 + 後続更新）

- mulmocast パッケージを 2.4.8 → 2.6.6 に更新
  - **app 側の対応**: モデル一覧は `provider2MovieAgent` / `provider2ImageAgent` で動的ロードされるため、新モデルはコード変更なしで UI ドロップダウンに自動反映される。明示的なコード変更は `getImageRefs()` → `getMediaRefs()` の API 移行（#1590）のみ
  - 上流の新機能（バージョン別）:

    **v2.5.0** — Animation Runtime 改善
    - Animation JS を独立ファイルに抽出（テスタビリティ向上）
    - `[data-animation]` 属性による宣言的アニメーション（script 不要）
    - **`coverPan()` / `coverZoom()`** アニメーションヘルパー（Ken Burns エフェクト用）→ app の Image Effect UI (#1585, #1594) で活用
    - per-image `canvasSize` オプション（アスペクト比の個別指定）

    **v2.6.0** — Swipe-style Declarative Animation
    - html_tailwind ビートに `elements` 配列を追加（`html` フィールドとの排他、`html` が optional に）
    - Transition アニメーション: opacity, rotate, scale, translate
    - Loop アニメーション: wiggle, vibrate, bounce, pulse, blink, spin, shift
    - JSON ベースのアニメーション定義（HTML 記述不要）

    **v2.6.1–2.6.2** — バグ修正
    - `moviePrompt` + 空 `text` のビートが前の動画を途中カットする問題を修正

    **v2.6.6** — 新モデル・オーディオミキシング
    - **新しい動画生成モデル**（2.4.8 に存在しなかったもの）:
      - Google **Veo 3.1 Lite**（$0.05/秒、lastFrame 補間対応）
      - Google **Veo 3.1 Fast**（Replicate 経由）
      - Replicate 経由 **Grok Imagine Video** (`xai/grok-imagine-video`) / **Grok Imagine R2V** (`xai/grok-imagine-r2v`, 参照画像対応)
      - Replicate 経由 **RunwayML Gen 4.5**
      - Replicate 経由 **Kling v3**（参照画像対応）
    - **2.4.8 時点で既存**（今回新規ではない）:
      - Veo 3.1（無印）、SeedDream 4、Seedance 1 Lite/Pro、mmaudio（サウンドエフェクト）、omni-human（リップシンク）
    - **参照画像サポート**: Grok R2V, Kling v3 で `reference_images` パラメータ対応（app 側の参照画像アップロード機能は既存）
    - **オーディオミキシング**: `movieVolume`, `ttsVolume`, `ducking` パラメータ追加（app UI は未実装、MulmoScript 直接編集で利用可能）
    - Veo 2.0/3.0 の duration 修正 + `supportsDuration` capability
    - animation config に `movie` オプション追加（CDP screencast）
    - 動画ファイル参照（`type: "movie"`）

### バグ修正（Bug Fixes）

#### 自動アップデート修正（#1595, #1596）

- **設定画面の再起動ボタンが表示されない問題を修正**（#1595）: renderer 側の IPC パス typo（`/upadteInstall` → `/updateInstall`）を修正
- **macOS でアプリ終了時にアップデートが適用されない問題を修正**（#1595）: `before-quit` イベントでダウンロード済みアップデートがあれば `autoUpdater.quitAndInstall()` を呼ぶように変更
- **自動アップデートインストールフローの安定化**（#1596）:
  - `event.preventDefault()` が終了シーケンスをブロックしていた問題を修正
  - `safeQuitAndInstall()` 関数に統一（全3箇所の `quitAndInstall()` 呼び出しをガード付きに統一）
  - アップデート状態を `UpdateStatus` ステートマシン（`none` → `downloaded` → `installing`）で管理するよう変更

### UI/UX改善（UI/UX Improvements）

- 生成音声バリデーション文言の改善（#1587 の副次的変更）: ボタン文言とエラーメッセージ内 action 文言を分離し、`generateAudioAction` を利用するよう変更
- 音声生成ボタンにローディングスピナーを追加（#1599）: 生成中の状態が視覚的にわかるように

### 削除された機能（Removed Features）

なし

---

## Developer-facing

### 開発者向けバグ修正

- `handler_contents.ts`: `imagePreprocessAgent` に `imageRefs` を正しく渡すよう修正（html_tailwind の黒画面回避）。per-beat 内の不要な再取得を削減（#1585）

### リファクタリング（Refactoring）

- `auto-update` リスナーを `createWindow` 外に移動し、ウィンドウ再作成時のリスナー重複を防止（#1595）
- `safeQuitAndInstall()` への統一と `UpdateStatus` ステートマシン導入（#1596）
- `getImageRefs()` → `getMediaRefs()` への移行、`beatImage` の型注釈を `Record<string, string>` に明示化（#1590）
- リリースワークフロー Skills の改善（#1579, #1580）
  - `release-script`: デリミタ文字分割ルール追加、タイムスタンプ抽出スクリプト追加
  - `release`: Phase 5（リリースノート PR 作成）追加
  - `release-zenn`: `.env` 自動読み込み対応
  - CodeRabbit レビューコメント対応（ステップ参照番号修正等）

### 依存パッケージ更新（Dependencies）

| PR | パッケージ | バージョン | 備考 |
|----|-----------|-----------|------|
| #1581 | `@hono/node-server` | 1.19.9 → 1.19.10 | セキュリティ修正（Serve Static の `%2F` バイパス） |
| #1582 | `hono` | 4.12.3 → 4.12.5 | セキュリティ修正3件（SSE injection, Cookie injection, Serve Static bypass） |
| #1583 | `express-rate-limit` | 8.2.1 → 8.3.0 | セキュリティ修正（IPv4-mapped IPv6 対応） |
| #1584 | 複数パッケージ | - | 定期更新: electron 40.6.1→40.8.0, eslint, @elevenlabs/elevenlabs-js, @tato30/vue-pdf 等 |
| #1586 | 複数パッケージ | - | 定期更新: @typescript-eslint 8.57.0, eslint-plugin-sonarjs 4.0.2, vue 3.5.30, reka-ui 2.9.1 等 |
| #1589 | 複数パッケージ | - | 定期更新: @vitejs/plugin-vue 6.0.5, dayjs 1.11.20, dompurify 3.3.3 等 |
| #1590 | `mulmocast` | 2.4.8 → 2.6.2 | ライブラリ本体更新（ユーザー向け機能追加を含む） |
| #1591 | `mulmocast` + 他 | mulmocast 微更新 | electron 40.8.0→41.0.2 |
| #1592 | 複数パッケージ | - | 定期更新: @elevenlabs/elevenlabs-js 2.39.0, @typescript-eslint 8.57.1, @tato30/vue-pdf 2.0.2 等 |
| #1597 | 複数パッケージ | - | 定期更新: @typescript-eslint 8.58.0, eslint 10.1.0, fast-xml-parser 5.5.9 等 |
| #1598 | 複数パッケージ | - | 定期更新: tailwindcss 4.2.2, vue-tsc 3.2.6, @tailwindcss/vite 4.2.2 等 |
| #1600 | `@xmldom/xmldom` | 0.8.11 → 0.8.12 | セキュリティ修正（CDATA XML injection 防止） |
| #1602 | 複数パッケージ | - | 定期更新: mulmocast 2.6.5→2.6.6, @types/node 25.5.2, dotenv 17.4.0, reka-ui 2.9.3 等 |
| #1603 | `electron` + 他 | electron 41.0.2→41.1.1 | Electron 更新 + @electron/fuses 2.1.1, eslint 10.2.0 |

### テスト（Testing）

- Beat Navigator QA テスト追加（#1587）: `test/manual_no_api_beat_navigator_qa.ts`
  - 30 beats のテストスクリプト作成 → PDF Handout 生成 → MEDIA/TEXT タブでのナビゲーション検証
  - 32 PASS / 0 FAIL / 0 WARN
- Image Effect QA テスト追加（#1585）: `test/manual_no_api_image_effect_qa.ts`
  - 4プロジェクト（canvas 縦横 × 画像 縦横）で6エフェクトを検証
  - 235 PASS / 0 FAIL / 0 WARN
- Image Effect QA テスト更新（#1594）: from/to 方式対応
  - 239 PASS / 0 FAIL / 0 WARN
- 生成オプションの checkbox/label に `data-testid` を追加（#1587）: 言語設定に依存しない安定したテスト基盤
- QA Playbook 更新（#1585）: コンポーネントセットアップ、バリデーションポリシー、エディタ操作、ファイルアップロード手順の追加

### CI/CD

なし

### ドキュメント（Documentation）

- v1.0.12 リリースノート関連ファイルの追加（#1578）: PR 要約、リリースノート、X 投稿ドラフト、MulmoScript、YouTube メタデータ、タイムスタンプ
- `test/README.md` 更新（#1587, #1585）: Beat Navigator QA / Image Effect QA の説明追加

---

## 全 PR 一覧（23件）

| # | PR | タイトル | カテゴリ | エンドユーザー影響 |
|---|-----|---------|---------|-----------------|
| 1 | #1578 | docs: add release notes for v1.0.12 | ドキュメント | なし |
| 2 | #1579 | chore: improve release workflow skills | リファクタリング（Skills） | なし |
| 3 | #1580 | fix: address CodeRabbit review comments on PR #1579 | リファクタリング（Skills） | なし |
| 4 | #1581 | chore(deps): bump @hono/node-server 1.19.9 → 1.19.10 | 依存パッケージ更新（セキュリティ） | なし |
| 5 | #1582 | chore(deps): bump hono 4.12.3 → 4.12.5 | 依存パッケージ更新（セキュリティ） | なし |
| 6 | #1583 | chore(deps): bump express-rate-limit 8.2.1 → 8.3.0 | 依存パッケージ更新（セキュリティ） | なし |
| 7 | #1584 | Update package20260309 | 依存パッケージ更新 | なし |
| 8 | #1585 | Add image effect UI for html_tailwind animation beats | 新機能 + テスト | あり |
| 9 | #1586 | update | 依存パッケージ更新 | なし |
| 10 | #1587 | Add Beat Navigator with robust cross-tab QA coverage | 新機能 + テスト | あり |
| 11 | #1589 | Update package20260316 | 依存パッケージ更新 | なし |
| 12 | #1590 | feat: update mulmocast to 2.6.2 | 新機能 + 依存パッケージ更新 | あり |
| 13 | #1591 | update | 依存パッケージ更新 | なし（Electron 41.0.2 へ更新） |
| 14 | #1592 | update | 依存パッケージ更新 | なし |
| 15 | #1594 | feat(image-effect): switch pan controls to from/to | 新機能（UI改善） | あり |
| 16 | #1595 | fix: repair auto-update on macOS (typo + quit-install) | バグ修正 | あり |
| 17 | #1596 | fix: stabilize auto-update install flow on app quit (macOS) | バグ修正 + リファクタリング | あり |
| 18 | #1597 | update | 依存パッケージ更新 | なし |
| 19 | #1598 | updatge | 依存パッケージ更新 | なし |
| 20 | #1599 | Add loading spinner to audio generate button | UI/UX改善 | あり |
| 21 | #1600 | chore(deps): bump @xmldom/xmldom 0.8.11 → 0.8.12 | 依存パッケージ更新（セキュリティ） | なし |
| 22 | #1602 | update | 依存パッケージ更新 | なし（mulmocast 2.6.6 へ更新） |
| 23 | #1603 | electron@41.1.1 | 依存パッケージ更新 | なし（Electron 41.1.1 へ更新） |
