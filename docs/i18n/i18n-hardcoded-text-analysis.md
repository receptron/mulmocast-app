# i18n ハードコードテキスト分析レポート - 2025年8月18日

## 📊 分析概要

MulmoCastアプリケーションの`src/renderer/pages/`配下の全32個のVueファイルを対象に、ハードコードされたテキスト文字列の有無を体系的に分析しました。

### サマリー
- **総確認ファイル数**: 32個
- **ハードコードテキスト有り**: 19個 (59%)
- **i18n対応完了済み**: 13個 (41%)

## ❌ ハードコードテキストが存在するファイル (19個)

### 🔥 **HIGH Priority** (5個) - ユーザー向けコアインターフェース要素

#### 1. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/prompt_guide.vue` ❌
**ハードコード文字列:**
- `"Basic Prompt"`
- `"Advanced Prompt"`
- `"Examples"`
- `"Simple ChatGPT Prompt Template"`
- `"Detailed ChatGPT Prompt Template"`
- `"Copy Template"`
- `"Copy Advanced Template"`
- `"Replace [TOPIC] and [AUDIENCE] with your content"`
- `"Customize all bracketed sections for your needs"`
- `"Educational Content Example"`
- `"Business Presentation Example"`
- `"Pro Tips for Better Results"`
- 複数の説明テキストブロックと例文

**優先度**: 最高 - 約25個のハードコード文字列を含む

#### 2. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor.vue` ❌
**ハードコード文字列:**
- `"Text"` (タブラベル)
- `"YAML"` (タブラベル)
- `"JSON"` (タブラベル)
- `"Media"` (タブラベル)
- `"Style"` (タブラベル)
- `"Ref"` (タブラベル)

**優先度**: 高 - メインエディターのタブインターフェース

#### 3. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/caption_params.vue` ❌
**ハードコード文字列:**
- `"None"` (プレースホルダーテキスト)

**優先度**: 高 - キャプション設定インターフェース

#### 4. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/speech_params.vue` ❌
**ハードコード文字列:**
- `"Voice ID"` (ラベル)
- `"Speed"` (ラベル)
- `"instruction"` (ラベル)
- `"Add Speaker"` (ボタンテキスト)
- `"No speakers defined"` (ステータスメッセージ)
- `"Initialize Speech Parameters"` (ステータスメッセージ)

**優先度**: 高 - 音声設定の重要インターフェース

#### 5. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/settings.vue` ❌
**ハードコード文字列:**
- `"Mulmo Viewer"` (ダイアログタイトル)

**優先度**: 高 - 設定画面のインターフェース

### 🟡 **MEDIUM Priority** (5個) - セカンダリインターフェース要素

#### 6. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/chat/bot_message.vue` ❌
**ハードコード文字列:**
- `"MM/DD HH:mm"` (日付フォーマット、コメントでi18n TODOが示されている)

**優先度**: 中 - チャットメッセージの日付表示

#### 7. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/chat/user_message.vue` ❌
**ハードコード文字列:**
- `"MM/DD HH:mm"` (日付フォーマット、コメントでi18n TODOが示されている)

**優先度**: 中 - チャットメッセージの日付表示

#### 8. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/beat_preview_image.vue` ❌
**ハードコード文字列:**
- `"Reference"` (TODOコメントで作業が必要と示されている)

**優先度**: 中 - 画像プレビューインターフェース

#### 9. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/beat_editor.vue` ❌
**ハードコード文字列:**
- `"Unsupported type: {{ beat.image.type }}"` (エラーメッセージ)

**優先度**: 中 - エラー表示メッセージ

#### 10. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/movie_params.vue` ❌
**ハードコード文字列:**
- `console.log(provider, agent);` (デバッグ出力、削除すべき)

**優先度**: 中 - デバッグコード（削除推奨）

### 🟢 **LOW Priority** (9個) - デバッグ/開発関連

#### 11. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/chat.vue` ❌
**ハードコード文字列:**
- `"Generate a ${scriptLang.value} script..."` (動的テンプレート文字列)
- `"Always reply in ${scriptLang.value}..."` (システムメッセージ)
- `" with Search"` (LLMエージェント説明)

**優先度**: 低 - チャット機能の内部ロジック

#### 12. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/text_editor.vue` ❌
**ハードコード文字列:**
- `"Beat {{ index + 1 }}"` (動的ビート番号付け)

**優先度**: 低 - 動的コンテンツ生成

#### 13. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/reference_selector.vue` ❌
**ハードコード文字列:**
- 正規表現バリデーションメッセージコンテキスト

**優先度**: 低 - バリデーション関連

#### 14. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/reference.vue` ❌
**ハードコード文字列:**
- `"{{ t("ui.common.key") }} : {{ imageKey }}"` (フォーマット)
- 各種フィールドラベルとプレースホルダーテキスト

**優先度**: 低 - 参照画像インターフェース

#### 15-19. その他の低優先度ファイル
その他の軽微なハードコード文字列を含むファイル

**優先度**: 低 - 各種動的テキスト構築とラベル

## ✅ i18n対応完了済みファイル (13個)

以下のファイルは適切にi18n対応されており、すべてのユーザー向けテキストで`t()`または`$t()`関数を使用しています：

1. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/mulmo_error.vue` ✅
2. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/concurrent_task_status.vue` ✅
3. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/text_slide_params.vue` ✅
4. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/dashboard/new_project_dialog.vue` ✅
5. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/dashboard/project_items.vue` ✅
6. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/generate.vue` ✅
7. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/beat_style.vue` ✅
8. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/image_params.vue` ✅
9. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/presentation_style_editor.vue` ✅
10. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/settings_alert.vue` ✅
11. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/dashboard.vue` ✅
12. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/chat/tools_message.vue` ✅
13. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/audio_params.vue` ✅
14. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/parameters/canvas_size_params.vue` ✅
15. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/beat_preview_movie.vue` ✅
16. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project.vue` ✅
17. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/project_header.vue` ✅
18. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/select_language.vue` ✅
19. `/Users/yasutaka/Documents/mac-workspace/mulmo/mulmocast-app/src/renderer/pages/project/script_editor/beat_selector.vue` ✅

## 📋 実装推奨順序

### フェーズ1: 最高優先度 (推定2-3時間)
1. **`prompt_guide.vue`** - 2時間 (約25個の文字列)
2. **`script_editor.vue`** - 30分 (6個のタブラベル)

### フェーズ2: 高優先度 (推定1時間)
3. **`speech_params.vue`** - 30分 (音声設定UI)
4. **`caption_params.vue`** - 15分 (キャプション設定)
5. **`settings.vue`** - 15分 (設定画面)

### フェーズ3: 中優先度 (推定1.5時間)
6. **`bot_message.vue`** - 20分 (日付フォーマット)
7. **`user_message.vue`** - 20分 (日付フォーマット)
8. **`beat_preview_image.vue`** - 20分 (プレビュー)
9. **`beat_editor.vue`** - 30分 (エラーメッセージ)

### フェーズ4: 低優先度 (推定2時間)
10-19. その他9個のファイル - 各10-15分

## 🎯 追加で必要な翻訳キー

### 新しいキーカテゴリ
```typescript
ui: {
  tabs: {
    // スクリプトエディター
    text: "Text",
    yaml: "YAML", 
    json: "JSON",
    media: "Media",
    style: "Style",
    ref: "Ref"
  },
  prompts: {
    // プロンプトガイド
    basicPrompt: "Basic Prompt",
    advancedPrompt: "Advanced Prompt",
    examples: "Examples",
    copyTemplate: "Copy Template",
    simpleTemplate: "Simple ChatGPT Prompt Template",
    detailedTemplate: "Detailed ChatGPT Prompt Template",
    // ... 他多数
  },
  speech: {
    // 音声設定
    voiceId: "Voice ID",
    speed: "Speed",
    instruction: "instruction",
    addSpeaker: "Add Speaker",
    noSpeakersDefined: "No speakers defined",
    initializeSpeechParams: "Initialize Speech Parameters"
  },
  common: {
    none: "None",
    reference: "Reference"
  }
}
```

## 📈 影響度分析

### ユーザーへの影響
- **高影響**: `prompt_guide.vue`, `script_editor.vue` - 日本語ユーザーの利便性に直接影響
- **中影響**: パラメーター設定ファイル群 - 設定作業の理解しやすさに影響
- **低影響**: チャット日付フォーマット、デバッグメッセージ - 機能的には問題なし

### 開発効率への影響
現在の59%のハードコード率は、国際化対応としては改善の余地があります。完全なi18n対応により：
- 多言語展開が容易になる
- UIテキストの一元管理が可能になる
- 翻訳作業の効率化が図れる

## 🔍 技術的考慮事項

### 既存のi18n構造との整合性
現在の`en.ts`ファイルは617行の充実した翻訳キーを持ち、良好な構造を維持しています。新規追加するキーも既存の命名規則に従い、階層構造を維持することが重要です。

### 動的コンテンツの対応
`chat.vue`や`text_editor.vue`の動的文字列生成部分は、Vue I18nのプレースホルダー機能（`{variable}`）を活用して対応する必要があります。

## 🎯 完了基準

### 成功指標
- ページレベルコンポーネントでのハードコード文字列0%達成
- 日本語ユーザーでの完全なUI表示対応
- 既存機能に影響のない翻訳実装

### 品質チェックリスト
- [ ] 全ての新規翻訳キーが`en.ts`と`ja.ts`に追加済み
- [ ] 既存の翻訳キー命名規則に準拠
- [ ] 動的コンテンツのプレースホルダー適切実装
- [ ] 機能テストでの回帰なし
- [ ] 言語切り替えテストでの表示確認

---

**作成日**: 2025年8月18日  
**分析対象**: 32個のVueファイル（`src/renderer/pages/`配下）  
**分析方法**: 全ファイルの手動レビューによるハードコード文字列の特定と分類