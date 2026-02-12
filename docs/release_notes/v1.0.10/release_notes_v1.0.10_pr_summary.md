# v1.0.10 PRまとめ (v1.0.9 → v1.0.10)

## Voice Clone 関連
| PR | タイトル | まとめ |
|---|---|---|
| #1432 | Voice clone | ElevenLabs Voice Clone機能を新規追加。ドラッグ&ドロップでの音声アップロード、クローンボイスの作成・削除・名前変更、プレビュー再生に対応。ヘッダーナビゲーションとルーティングも追加。 |
| #1453 | voiceCloning | クローンボイスをスピーカー選択に統合。スタンダードボイスとクローンボイスを一覧から選択可能に。ボイス名のフォールバック処理も改善。 |
| #1452 | voice clone error | Voice Cloneのエラーハンドリングを追加。APIエラー時の処理を改善。 |
| #1465 | Fix voice clone error handling and add click-to-upload functionality | Voice Clone操作後にUIが更新されない問題、エラーメッセージが空白で表示される問題を修正。クリックでファイル選択ダイアログを開く機能も追加。 |
| #1494 | feat: Add user-friendly error handling for ElevenLabs voice clone quota limit | ElevenLabs音声クローン上限エラー時にユーザーフレンドリーなメッセージとElevenLabs管理画面へのリンクボタンを表示。 |
| #1495 | Add i18n support for ElevenLabs voice cloning subscription error | #1494のエラーメッセージを日本語/英語に対応。 |

## ElevenLabs TTS 拡張
| PR | タイトル | まとめ |
|---|---|---|
| #1485 | Add ElevenLabs speech options support (speed, stability, similarity_boost) | ElevenLabsに速度・安定性・類似度のパラメータを追加。グローバル設定とビート単位での上書きに対応。ツールチップで各パラメータの説明を表示。 |

## Gemini TTS 拡張
| PR | タイトル | まとめ |
|---|---|---|
| #1461 | feat: Add instruction field support for Gemini TTS and per-beat speech options | Gemini TTSのinstruction(読み上げスタイル)フィールドをサポート。OpenAIに加えてGeminiでも指定可能に。ビート単位での音声オプション上書き機能も追加。 |

## チャット設定
| PR | タイトル | まとめ |
|---|---|---|
| #1472 | save CHAT_CONVERSATION_MODE and CHAT_TEMPLATE_INDEX | チャット会話モードとテンプレート選択の設定がセッションを跨いで保持されるように。 |
| #1483 | Save chat settings per project with hybrid fallback to global defaults | プロジェクト単位でのチャット設定保存に対応。プロジェクト設定 → グローバル設定 → デフォルトの優先順位で読み込むハイブリッド方式を実装。 |

## BGM機能
| PR | タイトル | まとめ |
|---|---|---|
| #1449 | Stop BGM playback when leaving the BGM management page | BGM管理ページから離脱時にBGM再生を自動停止するよう修正。オーディオ要素のリソースも適切に解放。 |
| #1460 | bundle bgm | バンドル機能でaudioParamsが未指定の場合にデフォルトBGMを自動初期化。バンドルディレクトリパスの処理も改善。 |

## UI/UX改善
| PR | タイトル | まとめ |
|---|---|---|
| #1469 | llm create mulmo script title | LLMによるスクリプト生成時にタイトルも同時生成するよう改善。beats と title の両方を返すように変更。 |
| #1487 | add style info | スクリプトエディタにスタイルサマリー表示を追加(Pro向け)。スピーチプロバイダー、画像/動画モデル、BGM、キャンバスサイズを一覧表示。 |
| #1448 | Add BGM Generation and Voice Cloning features to ElevenLabs API key settings | 設定画面のElevenLabs APIキー説明に「BGM生成」「音声クローン」を追加。Gemini APIキーに「TTS」を追加。 |
| #1445 | refactor audioPreviewUrl | オーディオプレビューURLの処理をリファクタリング。 |

## i18n (国際化)
| PR | タイトル | まとめ |
|---|---|---|
| #1473 | Add automated i18n translation script using Gemini API | 欠落している翻訳キーをGemini APIで自動生成するスクリプトを追加。セキュリティ検証、リトライ処理、フォーマット保持機能を含む。 |
| #1459 | feat(i18n): update check-i18n script for split files, add multiLingual key, and fix typo | i18nチェックスクリプトを分割ファイル対応に更新。multiLingualキーの追加とtypo修正。 |

## 開発環境・メンテナンス
| PR | タイトル | まとめ |
|---|---|---|
| #1456 | node 24 | CI環境をNode.js 24.xに更新。 |
| #1454 | update packages | 依存パッケージの更新。 |
| #1455 | update packages | 依存パッケージの更新。 |
| #1490 | update | パッケージ更新。 |
| #1492 | update | パッケージ更新。 |
| #1447 | update | パッケージ更新。 |
| #1491 | Bump qs from 6.14.0 to 6.14.1 | qsパッケージのセキュリティアップデート (Dependabot)。 |

## mulmocast パッケージ更新
| PR | タイトル | まとめ |
|---|---|---|
| #1450 | mulmocast@2.1.8 | mulmocastを2.1.8に更新。 |
| #1463 | mulmocast@2.1.11 | mulmocastを2.1.11に更新。 |
| #1464 | mulmocast@2.1.12 | mulmocastを2.1.12に更新。 |
| #1468 | mulmocast@2.1.13 | mulmocastを2.1.13に更新。 |
| #1471 | mulmocast@2.1.15 | mulmocastを2.1.15に更新。 |
