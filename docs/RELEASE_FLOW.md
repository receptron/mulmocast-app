# ブランチ戦略とリリースフロー

## ブランチ構成

| ブランチ | 用途 | package.json バージョン例 |
|:---|:---|:---|
| `main` | 次バージョンの開発を継続（新機能・改善） | `1.3.0-alpha.*` |
| `release/x.y` | 現在リリース予定の安定化用ブランチ。QAで見つかったバグはここで修正 | `x.y.0-rc.1` など |

## 運用フロー

1. **リリースブランチ作成**
   - `main` から `release/x.y` を作成
   - `package.json` を `x.y.0-rc.1` に設定
   - タグ `vX.Y.0-rc.1` を打つ

2. **QA・修正フェーズ**
   - QAでバグが出たら `release/x.y` で修正
   - `-rc.2`, `-rc.3` … とバージョンを上げてタグ付け

3. **GA リリース**
   - 問題なければ `x.y.0` として GA タグ（例: `v1.2.0`）を打ち、本番配信
   - `release/x.y` の最終状態を `main` に back-merge して開発ラインにも反映

4. **並行開発**
   - `main` は並行して次版開発を進める

## バージョンと配信

| タグタイプ | 例 | 配信先 | 説明 |
|:---|:---|:---|:---|
| RC タグ | `v1.2.0-rc.3` | dev バケット | CI が自動アップロード |
| GA タグ | `v1.2.0` | prod バケット | CI が自動アップロード |

### GitHub CI の動作
- タグ名に `-rc` があるかどうかで自動振分
- タグ名と `package.json` の `version` が一致しているか確認

## Minor リリース後の運用

- Minor リリース後、問題・微調整があれば patch バージョンで対応
- パッチバージョン例: `v1.2.1`, `v1.2.2`
- **パッチバージョンも RC あり**

## フォルダ構成（S3/CloudFront）

### Dev 環境
```
s3://dev/
  releases/
    darwin/arm64/
      RELEASES.json
      MulmoCast-darwin-arm64-<version>.zip
    win/x64/
      RELEASES
      Setup.exe
      MulmoCast-<version>-full.nupkg
      MulmoCast-<version>-delta.nupkg
```

### Prod 環境
```
s3://prod/
  releases/
    darwin/arm64/
      RELEASES.json
      MulmoCast-darwin-arm64-<version>.zip
    win/x64/
      RELEASES
      Setup.exe
      MulmoCast-<version>-full.nupkg
      MulmoCast-<version>-delta.nupkg
```

