# ElectronアプリのmacOS署名・公証で躓いた全記録 〜キーチェーンの罠から証明書チェーンまで〜

## はじめに

ElectronアプリをmacOSで配布する際、避けて通れないのが「署名」と「公証（notarization）」です。これらがないと、ユーザーがアプリを開くときに「開発元を確認できません」という警告が表示され、使いにくいアプリになってしまいます。

この記事では、実際にElectronアプリの署名・公証を実装する過程で遭遇した数々のトラブルと、その解決方法を詳細に記録します。同じ問題で困っている開発者の助けになれば幸いです。

## 環境・前提条件

- **OS**: macOS
- **フレームワーク**: Electron Forge
- **ビルドツール**: yarn
- **証明書**: Apple Developer ID Application証明書を取得済み
- **目標**: `yarn run make` でビルド・署名・公証を一括実行

## 第1の試練：証明書があるのに "0 valid identities"

### 問題の発生

最初に遭遇したのがこの謎のエラーでした：

```bash
$ security find-identity -p codesigning
Policy: Code Signing
  Matching identities
  1) 3D6D000D23AA25D4484140C0161B4FEBE00BD1A3 "Developer ID Application: SINGULARITY SOCIETY, GENERAL INC. ASSOCIATION (J43WQWB8T7)"
     1 identities found

  Valid identities only
     0 valid identities found
```

証明書は存在しているのに、「有効な証明書は0個」と表示される不可解な状況。

### 解決のきっかけ

問題は**キーチェーンがロックされていた**ことでした。コード署名を試みた際に、初めてパスワード入力を求められ、それを入力した後：

```bash
$ security find-identity -v -p codesigning
  1) 3D6D000D23AA25D4484140C0161B4FEBE00BD1A3 "Developer ID Application: SINGULARITY SOCIETY, GENERAL INC. ASSOCIATION (J43WQWB8T7)"
     1 valid identities found
```

証明書が「有効」として認識されるようになりました！

### 学んだこと

- 証明書がインストールされていても、キーチェーンがロックされていると使用できない
- `-v`オプションの有無で結果が変わる場合は、キーチェーンの状態を疑う
- 開発環境では定期的にキーチェーンがロックされる可能性がある

## 第2の試練：中間証明書の不在

### "unable to build chain to self-signed root" エラー

キーチェーンの問題を解決した後、今度は署名実行時に以下の警告が大量に表示されました：

```
Warning: unable to build chain to self-signed root for signer "Developer ID Application: SINGULARITY SOCIETY, GENERAL INC. ASSOCIATION (J43WQWB8T7)"
```

### Appleの中間証明書が必要だった

このエラーの原因は、**Apple Developer ID中間証明書**がインストールされていないことでした。

macOSには自動的には含まれておらず、開発者が手動でインストールする必要があります：

```bash
# Apple公式サイトから中間証明書をダウンロード
curl -O https://www.apple.com/certificateauthority/DeveloperIDCA.cer
curl -O https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer

# キーチェーンにインポート
security import DeveloperIDCA.cer -k ~/Library/Keychains/login.keychain-db
security import DeveloperIDG2CA.cer -k ~/Library/Keychains/login.keychain-db
```

### 証明書チェーンの理解

証明書の信頼関係は以下のような階層構造になっています：

```
Apple Root CA（Appleルート証明書）
    ↓
Developer ID CA（中間証明書）← これが不足していた
    ↓
Developer ID Application（あなたの証明書）
```

中間証明書がないと、macOSはあなたの証明書がApple発行の正当なものか確認できません。

## 第3の試練：resource forkエラーとの格闘

### "resource fork not allowed" エラー

中間証明書をインストールした後、新しいエラーが発生：

```
out/mulmocast-app-darwin-arm64/mulmocast-app.app: resource fork, Finder information, or similar detritus not allowed
file with invalid attached data: Disallowed xattr com.apple.FinderInfo found
```

### Finderメタデータが署名を阻害

このエラーの原因は、macOSのFinderが自動的に付けるメタデータ（拡張属性）でした：

- ファイルの位置情報
- カスタムアイコン
- 色ラベルなど

### 解決方法：署名前のクリーンアップ

```bash
# 拡張属性をすべて削除
xattr -cr "${APP_PATH}"
# .DS_Storeファイルも削除
find "${APP_PATH}" -name .DS_Store -delete
```

### なぜこの問題が起きるのか

Appleの署名システムは、これらのメタデータを**セキュリティリスク**と見なします：
- 署名後に改ざんされる可能性
- 悪意のあるコードを隠す場所になりうる

そのため、署名前に徹底的にクリーンアップする必要があります。

## 第4の試練：ビルドプロセスの選択

### yarn run package vs yarn run make

当初は以下のような2段階プロセスを考えていました：

1. `yarn run package` でビルド（署名なし）
2. 手動でコード署名

しかし、これには問題がありました：

- resource forkが生成される
- 複数のバイナリを個別に署名する必要がある
- 署名の整合性が保てない

### Electron Forgeでの一括処理

最終的に、Electron Forgeの設定で署名を含めることにしました：

```typescript
// forge.config.ts
export default {
  packagerConfig: {
    asar: true,
    extraResource: [/* ... */],
    icon: "./images/macoro.png",
    osxSign: process.env.CODESIGN_IDENTITY ? {
      identity: process.env.CODESIGN_IDENTITY,
      hardenedRuntime: true,
      entitlements: "entitlements.plist",
      entitlementsInherit: "entitlements.plist",
    } as any : undefined,
    osxNotarize: {
      appleId: process.env.AC_APPLE_ID!,
      appleIdPassword: process.env.AC_PASSWORD!,
      teamId: process.env.AC_TEAM_ID!,
    },
  },
  // ...
};
```

### 環境変数での制御

```typescript
osxSign: process.env.CODESIGN_IDENTITY ? {
  // 署名設定
} : undefined,
```

この設定により：
- 環境変数があるときだけ署名を実行
- `yarn run package`（開発用）は署名なし
- `yarn run make`（リリース用）は署名・公証あり

### entitlements.plistの必要性

Electronアプリには特別な権限設定が必要です：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- V8 JavaScriptエンジンのJITコンパイラを有効化 -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
</dict>
</plist>
```

これがないと、ElectronアプリがmacOSのHardened Runtimeで正常に動作しません。

### package.jsonでの環境変数読み込み

```json
{
  "scripts": {
    "make": "bash -c 'set -a && source .env && set +a && electron-forge make'"
  }
}
```

これにより、`.env`ファイルから自動的に認証情報を読み込みます。

## 第5の試練：GitHub Actions対応

### ローカル成功、CI失敗の罠

ローカルでは署名・公証が成功したのに、GitHub Actionsでは失敗：

```
mulmocast-app.app: code has no resources but signature indicates they must be present
Signature=adhoc
TeamIdentifier=not set
```

"adhoc"署名は自己署名を意味し、正しい証明書が使われていないことを示しています。

### GitHub Actionsでの証明書管理

CI環境では、証明書を.p12ファイルとして保存し、毎回インポートする必要があります：

#### 1. 証明書を.p12形式でエクスポート

macOSのキーチェーンアクセスで：
1. Developer ID Application証明書を右クリック
2. 「書き出す...」を選択
3. .p12形式で保存、パスワードを設定

#### 2. GitHub Secretsの設定

```bash
# Base64エンコード
base64 -i certificate.p12 -o certificate.base64
```

GitHub Secretsに以下を追加：
- `APPLE_CERTIFICATE`: certificate.base64の内容
- `APPLE_CERTIFICATE_PASSWORD`: .p12のパスワード
- `APPLE_ID`: Apple ID
- `APPLE_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Team ID
- `APPLE_CODESIGN_IDENTITY`: 証明書の完全名

#### 3. GitHub Actionsワークフロー

```yaml
- name: Import Apple Certificate
  env:
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  run: |
    echo $APPLE_CERTIFICATE | base64 --decode > certificate.p12
    security create-keychain -p actions temp.keychain
    security unlock-keychain -p actions temp.keychain
    security import certificate.p12 -k temp.keychain -P $APPLE_CERTIFICATE_PASSWORD -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple: -s -k actions temp.keychain
    security list-keychain -d user -s temp.keychain login.keychain

- name: Build, sign and notarize
  env:
    AC_APPLE_ID: ${{ secrets.APPLE_ID }}
    AC_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    AC_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    CODESIGN_IDENTITY: ${{ secrets.APPLE_CODESIGN_IDENTITY }}
  run: yarn run make
```

## 成功の確認方法

署名・公証が成功したかは以下のコマンドで確認できます：

```bash
spctl -a -vvv -t install path/to/your/app.app
```

成功時の出力：
```
path/to/your/app.app: accepted
source=Notarized Developer ID
origin=Developer ID Application: YOUR CERTIFICATE NAME
```

`source=Notarized Developer ID`が表示されれば完璧です！

## 最終的な設定ファイル

### forge.config.ts

```typescript
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [".vite/build/ffmpeg", "node_modules/mulmocast/assets", "node_modules/mulmocast/scripts"],
    icon: "./images/macoro.png",
    osxSign: process.env.CODESIGN_IDENTITY ? {
      identity: process.env.CODESIGN_IDENTITY,
      hardenedRuntime: true,
      entitlements: "entitlements.plist",
      entitlementsInherit: "entitlements.plist",
    } as any : undefined,
    osxNotarize: {
      appleId: process.env.AC_APPLE_ID!,
      appleIdPassword: process.env.AC_PASSWORD!,
      teamId: process.env.AC_TEAM_ID!,
    },
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ["darwin"]), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
```

### .env（ローカル用）

```bash
# Apple公証用認証情報
AC_APPLE_ID="your-apple-id@example.com"
AC_PASSWORD="your-app-specific-password"
AC_TEAM_ID="YOUR_TEAM_ID"

# 署名用証明書
CODESIGN_IDENTITY="Developer ID Application: YOUR CERTIFICATE NAME (TEAM_ID)"

# .p12パスワード（CI用）
CSC_KEY_PASSWORD="your-p12-password"
```

### GitHub Actions ワークフロー

```yaml
name: Build, Notarize, and Release for macOS

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-and-release:
    runs-on: macos-14
    
    strategy:
      matrix:
        node-version: [22.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Import Apple Certificate
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        run: |
          echo $APPLE_CERTIFICATE | base64 --decode > certificate.p12
          security create-keychain -p actions temp.keychain
          security unlock-keychain -p actions temp.keychain
          security import certificate.p12 -k temp.keychain -P $APPLE_CERTIFICATE_PASSWORD -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple: -s -k actions temp.keychain
          security list-keychain -d user -s temp.keychain login.keychain

      - name: Build, Sign, and Notarize
        env:
          AC_APPLE_ID: ${{ secrets.APPLE_ID }}
          AC_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          AC_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CODESIGN_IDENTITY: ${{ secrets.APPLE_CODESIGN_IDENTITY }}
        run: yarn run make
        
      - name: Upload Artifact for Debugging
        uses: actions/upload-artifact@v4
        with:
          name: macOS-release-files
          path: out/make/
```

## まとめと学んだ教訓

### 主要な学び

1. **キーチェーンの状態確認が最重要**
   - 証明書があっても、ロックされていると使用不可
   - 開発時は定期的にロックされる

2. **中間証明書は必須**
   - macOSには自動インストールされない
   - Apple公式サイトからダウンロードが必要

3. **Finderメタデータは署名の敵**
   - 署名前の徹底的なクリーンアップが必要
   - `xattr -cr`と`.DS_Store`削除は基本

4. **ビルドプロセスの統合が重要**
   - 後から手動署名するより、ビルド時署名が確実
   - 環境変数での条件分岐で開発・リリースを使い分け

5. **CI/CDは別世界**
   - ローカル成功 ≠ CI成功
   - 証明書の.p12エクスポートとSecretsが必須

### おすすめのワークフロー

1. **開発時**: `yarn run package`（署名なし、高速）
2. **リリース前確認**: ローカルで`yarn run make`（署名・公証あり）
3. **本番リリース**: GitHub Actionsで自動ビルド・配布

### 時間短縮のコツ

- 公証には5-15分かかるため、開発中は署名なしビルドを使用
- GitHub Actionsは公証完了まで待つため、リリース時のみ使用
- 証明書の問題は早期に解決しておく（有効期限の確認も重要）

### さらなる改善点

今回は基本的な署名・公証を実装しましたが、以下の改善も可能です：

- **自動リリース**: GitHub Releaseの自動作成
- **マルチプラットフォーム**: Windows、Linuxの署名対応
- **テスト統合**: 署名後の自動テスト実行
- **通知機能**: Slack/Discordへのビルド完了通知

ElectronアプリのmacOS署名・公証は一筋縄ではいきませんが、一度設定すれば安定して動作します。この記事が同じ問題で悩む開発者の助けになれば幸いです。

## 参考リンク

- [Apple Developer Documentation - Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Electron Forge Documentation](https://www.electronforge.io/)
- [Apple Certificate Authority](https://www.apple.com/certificateauthority/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)