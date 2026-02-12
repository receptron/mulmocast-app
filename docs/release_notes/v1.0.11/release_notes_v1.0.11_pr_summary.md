# v1.0.11 PRまとめ (v1.0.10 → v1.0.11)

## Azure OpenAI Service 対応
| PR | タイトル | まとめ |
|---|---|---|
| #1531 | feat: Azure OpenAI Service support (Phase 1) | Azure OpenAI Serviceのサポートを追加（Phase 1）。IMAGE/TTS/LLM各サービス用のAPI Key・Base URL設定UI、環境変数の一元管理、feature単位のAPIキーチェック機能を実装。エラーメッセージにAzureトラブルシューティングのヒントも追加。 |

## Vertex AI 対応
| PR | タイトル | まとめ |
|---|---|---|
| #1544 | feat: add Vertex AI support for image and video generation | Google Cloud Vertex AI経由の画像生成（Imagen）・動画生成（Veo）設定をUI上で扱えるように。Settings・Image/Movie Parameters・ビート単位での設定に対応。99項目のQAテストスイートも追加。 |

## Nijivoice 削除
| PR | タイトル | まとめ |
|---|---|---|
| #1503 | refactor: remove nijivoice TTS provider | 2026年2月4日にサービス終了するNijivoiceの全関連コードを削除。ボイスリスト、翻訳、UI、APIキーマッピング、テストファイルなどを一括除去。 |
| #1504 | remove Niji Voice from MulmoScript (MulmoCast App) | オンボーディングガイドからNijivoiceを削除し、Gemini/Kotodamaの記述を追加。 |

## 字幕分割機能
| PR | タイトル | まとめ |
|---|---|---|
| #1515 | feat: add caption split toggle to style settings | 字幕パラメータにキャプション分割のSwitchトグルを追加。ON時に句読点・記号での自動分割を設定。全言語対応の区切り文字セット。 |
| #1521 | feat: improve caption split description with delimiter categories | 字幕分割の説明文を改善。実際の区切り文字を全角・半角・その他にカテゴリ分けして常時表示。Unicode判定による自動分類。 |

## Voice Clone UI改善
| PR | タイトル | まとめ |
|---|---|---|
| #1499 | fix: Improve voice clone UI - truncate long filenames and stop audio on page navigation | 長いファイル名でレイアウトが崩れる問題を修正。ページ遷移時の音声自動停止機能を追加。 |

## UI/UX改善
| PR | タイトル | まとめ |
|---|---|---|
| #1501 | Apply last selected beat type only to newly inserted selectors | 直前に選んだビートタイプを新規追加されたBeatSelectorにのみ自動適用。既存ボタンの表示は変更しない。 |

## バグ修正
| PR | タイトル | まとめ |
|---|---|---|
| #1514 | fix: handle corrupted MulmoScript gracefully | 破損・null状態のscript.jsonを開いた際のクラッシュを修正。空のbeats配列で初期化し、プロジェクトを回復可能に。 |

## Electron アップグレード
| PR | タイトル | まとめ |
|---|---|---|
| #1509 | electron@40.0.0 | Electronフレームワークを40.0.0にアップグレード。 |
| #1539 | test: add Electron upgrade QA test suite and documentation | Electronアップグレード用の再利用可能なQAテストスイート（25項目）とドキュメントを追加。QAプランテンプレートも新規作成。 |

## CI/ビルド修正
| PR | タイトル | まとめ |
|---|---|---|
| #1516 | fix: set PUPPETEER_CACHE_DIR before yarn install in CI | CI環境でPuppeteerキャッシュの競合エラーが発生する問題を修正。`PUPPETEER_CACHE_DIR`をyarn install前に設定するよう全CIワークフローを修正。 |

## パッケージ更新
| PR | タイトル | まとめ |
|---|---|---|
| #1519 | vue-router@5.0.0 | vue-routerを5.0.0にアップグレード。 |
| #1510 | update zod | zodパッケージの更新。 |

## 開発環境・メンテナンス
| PR | タイトル | まとめ |
|---|---|---|
| #1497 | update | 依存パッケージの更新。 |
| #1500 | update packages | 依存パッケージの更新。 |
| #1502 | update | 依存パッケージの更新。 |
| #1505 | update | 依存パッケージの更新。 |
| #1508 | update | 依存パッケージの更新。 |
| #1512 | update | 依存パッケージの更新。 |
| #1513 | update | 依存パッケージの更新。 |
| #1528 | update packages | 依存パッケージの更新。 |
| #1529 | update | 依存パッケージの更新。 |
| #1534 | update | 依存パッケージの更新。 |
| #1536 | update | 依存パッケージの更新。 |
| #1537 | chore: yarn update 2026-02-09 | 依存パッケージの更新。 |

## mulmocast パッケージ更新
| PR | タイトル | まとめ |
|---|---|---|
| #1507 | mulmocast@2.1.211 | mulmocastを2.1.211に更新。 |
| #1517 | mulmocast@2.1.27 | mulmocastを2.1.27に更新。Electron 40.1.0も含む。 |
| #1518 | mulmocast@2.1.28 | mulmocastを2.1.28に更新。 |
| #1522 | mulmocast cli up to 2.1.29 | mulmocastを2.1.29に更新。 |
| #1523 | mulmocast@2.1.30 | mulmocastを2.1.30に更新。 |
| #1525 | mulmocast@2.1.31 | mulmocastを2.1.31に更新。 |
| #1530 | update | mulmocastを2.1.35に更新。 |
