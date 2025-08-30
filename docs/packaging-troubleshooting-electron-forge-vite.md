# Electron + Vite環境におけるPuppeteerパッケージング問題の解決レポート

## 1. はじめに：問題の概要と解決策

本レポートは、Electron + Viteで構築されたアプリケーションにおいて、パッケージ後に `Cannot find module 'puppeteer'` エラーが発生する問題の調査、原因、および解決策をまとめたものです。

### 問題

パッケージ化されたアプリケーションを起動すると、mainプロセスで `puppeteer` モジュールが見つからずクラッシュする。

### 解決策の要点

以下の対応により、問題を解決しました。

- **`puppeteer` の依存関係とChromiumの同梱**:
  - `puppeteer` をプロジェクトの直接的な本番依存（`dependencies`）に追加。
  - パッケージング前に `npx puppeteer browsers install chrome` を実行し、Chromiumをダウンロード。
  - Electron Forgeの設定で、ダウンロードしたChromium (`.local-chromium`) を `asar` アーカイブから除外（`unpack`）し、実行可能ファイルを維持。
- **`external` 依存関係の解決**:
  - Viteのビルド設定で `external` に指定した `puppeteer` や `jsdom` などの依存関係を、ビルド後のフックで `node_modules` ごと `app.asar` 内にコピーして同梱。
- **ビルドプロセスとCIの改善**:
  - CI環境でPuppeteerのキャッシュを有効化し、Chromiumのダウンロードを高速化・安定化。
  - 開発時の起動スクリプト (`yarn start`) を見直し、ネイティブモジュールの再ビルドを効率化。
- **その他**:
  - スプラッシュスクリーン画像が本番ビルドで表示されるようにパスを修正。

---

## 2. 発生した問題の詳細

パッケージ化されたアプリケーションを起動した際、mainプロセスで以下の例外が発生し、アプリケーションがクラッシュする。

```
A JavaScript error occurred in the main process
Uncaught Exception:
Error: Cannot find module 'puppeteer'
```

Requireスタックから、Viteによってバンドルされたmainプロセスのコード (`app.asar/.vite/build/main.js`) 内で `require('puppeteer')` が呼び出され、失敗していることが確認された。

---

## 3. 調査と原因分析

### 3.1. 関連する設定の確認

問題に関連する設定箇所は以下の通り。

- **Viteビルド設定 (`vite.main.config.ts`)**
  - `puppeteer`, `puppeteer-core`, `jsdom` が `build.rollupOptions.external` に指定されていた。これにより、これらのモジュールはバンドルファイルに含められず、実行時に `require()` で動的に解決される。
- **mainプロセスでの利用 (`src/main/mulmo/handler_graphai.ts`)**
  - `import puppeteer from "puppeteer";` という静的インポートが存在。これにより、アプリケーション起動時に即座に `puppeteer` モジュールの解決が試みられる。
- **Electron Fuses設定 (`forge.config.ts`)**
  - `[FuseV1Options.OnlyLoadAppFromAsar]: true` が設定されていた。これはセキュリティ強化のための設定で、Electronが `app.asar` アーカイブの外部からコードを読み込むことを禁止する。
- **依存関係 (`package.json`)**
  - `puppeteer` はプロジェクトの直接の依存ではなく、`mulmocast` パッケージの間接的な依存関係としてインストールされていた。

### 3.2. 根本原因

上記の調査から、エラーの根本原因は以下の3つの要因の組み合わせであることが判明した。

1.  **`external` 指定によるバンドル除外**: Viteが `puppeteer` をバンドルに含めないため、実行時にNode.jsのモジュール解決機構に依存する。
2.  **`OnlyLoadAppFromAsar` Fuseによる外部読み込み禁止**: Electronが `app.asar` の外にある `node_modules` からのモジュール読み込みをブロックする。
3.  **`app.asar` 内へのモジュール未配置**: パッケージングのプロセスにおいて、`external` 指定された `puppeteer` モジュールが `app.asar` アーカイブ内の適切な場所（Node.jsが解決できるパス）に同梱されていなかった。

結果として、mainプロセスは `app.asar` の中を探しても `puppeteer` を見つけられず、外を探すことも許されないため、`Cannot find module` エラーでクラッシュしていた。

---

## 4. 実施した具体的な修正内容

### 4.1. `package.json` の修正

- **`puppeteer` を直接依存に追加**:
  - `puppeteer` を `dependencies` に追加し、プロジェクトのトップレベルでバージョンを管理・固定。これにより、依存関係の解決が安定し、パッケージング対象として明確化される。

- **npmスクリプトの更新**:
  - `package`, `make:local`, `make:ci` スクリプトの先頭に `npx puppeteer browsers install chrome` を追加。これにより、ビルド前に必ずChromiumがダウンロードされ、パッケージに同梱される状態を保証する。
  - `start` スクリプトに `npx electron-rebuild` を追加（非強制）。依存関係の更新後にネイティブモジュールのABI不整合が起きるのを防ぎ、開発体験を向上させる。
  - `rebuild:native` スクリプト (`npx electron-rebuild -f`) を新設し、必要な場合のみ手動で強制リビルドを実行できるようにした。

### 4.2. `forge.config.ts` の修正

- **ChromiumのUnpack設定**:
  - `packagerConfig.asar` をオブジェクト形式に変更し、`unpack` プロパティに `"**/node_modules/puppeteer/.local-chromium/**"` を指定。
  - これにより、`puppeteer` がダウンロードするChromiumの実行可能ファイル群が `asar` アーカイブの外（`app.asar.unpacked` ディレクトリ）に展開され、実行権限が保持される。

### 4.3. `vite.main.config.ts` の修正

- **`external` 依存のコピー処理を追加**:
  - Viteのカスタムプラグインを利用し、`closeBundle` フック（ビルド完了後）で `external` 指定された依存関係（`puppeteer`, `jsdom` 等）を `node_modules` から `.vite/build/node_modules` へ再帰的にコピーする処理を追加。
  - これにより、`app.asar` 内に `external` なモジュールが同梱され、`OnlyLoadAppFromAsar` が有効な状態でも `require()` で解決できるようになる。
- **アセットのコピー処理を修正**:
  - スプラッシュ画像 (`mulmocast_credit.png`) が本番ビルドでも表示されるよう、ビルド時に `.vite/build/images/` へコピーする処理を追加。

### 4.4. CI (GitHub Actions) の修正

- **Puppeteerキャッシュの導入**:
  - `actions/cache` を利用して `PUPPETEER_CACHE_DIR` をキャッシュするステップを追加。CI実行時に毎回Chromiumをダウンロードするのを防ぎ、ビルド時間を短縮・安定化させる。

---

## 5. 今後の運用ガイドライン

- **`external` 依存の取り扱い**:
  - mainプロセスで `puppeteer` や `jsdom` のようなNode.jsネイティブ依存を持つライブラリを使用する場合、Viteの `external` に指定し、かつビルド後のフックで `app.asar` 内にコピーする現在の方式を維持する。
- **`puppeteer` とChromium**:
  - `puppeteer` を利用する場合、`forge.config.ts` の `asar.unpack` 設定は必須。
  - ビルド・パッケージング前には `npx puppeteer browsers install chrome` の実行が必要。
- **Rendererでの利用禁止**:
  - `puppeteer` や `jsdom` は、Rendererプロセス（Vueコンポーネントなど）から直接 `import` しない。必ずIPC通信を介してmainプロセスに処理を依頼する。
- **ネイティブモジュールと開発体験**:
  - 開発時の起動は `yarn start` を使用する。依存関係更新直後のみネイティブモジュールの再ビルドに時間がかかるが、2回目以降は高速に起動する。
  - 強制的なフルリビルドが必要な場合のみ `yarn rebuild:native` を実行する。
- **アセットの追加**:
  - `splash.html` やその他UIから参照される画像などの静的アセットは、`vite.main.config.ts` のコピー処理に追加し、ビルド成果物に含める必要がある。

---

## 【付録】技術詳細：Electron/Viteにおける外部依存の取り扱い

### A1. 基本原則

- **実行場所の分離**:
  - `puppeteer`, `puppeteer-core`, `jsdom` など、Node.js環境に依存するモジュールは **mainプロセスでのみ** 使用する。Rendererプロセス（ブラウザ環境）では `import` しない。
- **`external` の役割**:
  - mainプロセスのバンドル時には、これらの重いライブラリや `electron` 本体を `external` に指定し、バンドルサイズを削減する。
- **`asar` との連携**:
  - `external` に指定したモジュールは、実行時に解決できるよう `app.asar` 内に `node_modules` として同梱する必要がある。
  - `puppeteer` のように実行可能ファイルを含む場合、`asar.unpack` でアーカイブ外に展開する。
- **IPC通信**:
  - Rendererプロセスからこれらの機能を利用したい場合は、必ずpreloadスクリプトを介したIPC通信でmainプロセスに処理を依頼する。

### A2. `dev`環境で動作し、`prod`環境で失敗する理由

- **開発環境 (`yarn start`)**: Vite開発サーバーが起動し、Electronはバンドルされていない生のソースコードを直接実行する。`require('puppeteer')` はプロジェクトルートの `node_modules` を直接参照できるため、問題なく動作する。
- **本番環境 (`yarn package`)**: ソースコードはViteによってバンドル・変換され、`app.asar` という単一アーカイブに固められる。モジュール解決の仕組みが開発時と全く異なり、`external` や `asar` の設定が正しくないと、前述のモジュール解決失敗につながる。

### A3. `external` 指定の正しい理解

- `external` は「バンドル処理から除外する」という意味。
- 除外されたモジュールは、実行時に `require()` や `import` によって、Node.jsの標準的なモジュール解決ルール（`node_modules` を探す）に従って読み込まれる。
- そのため、`external` を使用する場合は、**配布されるアプリケーション内に参照先の `node_modules` が含まれている**ことが絶対条件となる。

### A4. トラブルシューティング・チェックリスト

- **`Cannot find module '...'`**:
  - `external` に指定したモジュールが `app.asar` 内に同梱されているか？
  - **対策**: `asar extract` コマンドで中身を確認。Viteのビルド後フックなどで `node_modules` をコピーする仕組みが正しく機能しているか確認する。
- **Chromiumが起動しない / `spawn ENOENT`**:
  - `puppeteer` の `.local-chromium` ディレクトリが `asar` 内に固められていないか？
  - **対策**: `forge.config.ts` の `asar.unpack` 設定を確認する。`app.asar.unpacked` ディレクトリにChromiumが展開されているか確認する。
- **Rendererのビルドエラー (`fs` がない等)**:
  - Rendererプロセス用のコードで `puppeteer` や `jsdom` を `import` していないか？
  - **対策**: mainプロセス側に処理を移し、IPC通信で呼び出すように修正する。
