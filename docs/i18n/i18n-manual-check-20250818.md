# i18n 手動確認結果 - 2025年8月18日

## 📊 確認概要

**確認方法**: 32個のpages/*.vueファイルを1つずつ手動で`Read`ツールを使用して確認
**確認対象**: `src/renderer/pages/**/*.vue` の全ファイル
**確認日時**: 2025年8月18日

### サマリー
- **総ファイル数**: 32個
- **ハードコード有り**: 11個 (34.4%)
- **i18n対応済み**: 21個 (65.6%)

## ❌ ハードコードテキストが存在するファイル (11個)

### 🔥 **HIGH Priority** (1個) - 大量のハードコード

#### 1. `pages/project/prompt_guide.vue`
**ハードコード文字列** (約25個):
- Line 4: `"Basic Prompt"`
- Line 6: `"Advanced Prompt"`
- Line 8: `"Examples"`
- Line 18: `"Simple ChatGPT Prompt Template"`
- Line 33: `"Copy Template"`
- Line 36: `"Replace [TOPIC] and [AUDIENCE] with your content"`
- Line 48: `"Detailed ChatGPT Prompt Template"`
- その他多数のテンプレート説明文とサンプル

**備考**: このファイルは`useI18n`すら使用していない

### 🟡 **MEDIUM Priority** (4個) - 重要なUI要素

#### 2. `pages/project/script_editor.vue`
**ハードコード文字列** (6個):
- Line 4: `"Text"`
- Line 5: `"YAML"`
- Line 6: `"JSON"`
- Line 7: `"Media"`
- Line 8: `"Style"`
- Line 9: `"Ref"`

**備考**: タブラベルのハードコード

#### 3. `pages/project/script_editor/parameters/speech_params.vue`
**ハードコード文字列** (6個):
- Line 56: `"Voice ID"`
- Line 76: `"Speed"`
- Line 85: `"instruction"`
- Line 130: `"Add Speaker"`
- Line 136: `"No speakers defined"`
- Line 137: `"Initialize Speech Parameters"`

#### 4. `pages/project/chat.vue`
**ハードコード文字列** (3個):
- Line 62: `"with Search"`
- Line 274: `"Always reply in ${scriptLang.value}, regardless of..."`
- Line 350: `"Generate a ${scriptLang.value} script for..."`

**備考**: 動的に生成されるシステムメッセージ

#### 5. `pages/project/script_editor/beat_editor.vue`
**ハードコード文字列** (1個):
- Line 138: `"Unsupported type: {{ beat.image.type }}"`

### 🟢 **LOW Priority** (6個) - 軽微な問題

#### 6. `pages/project/script_editor/parameters/caption_params.vue`
**ハードコード文字列** (2個):
- Line 10: `placeholder="None"`
- Line 13: `"None"`

#### 7. `pages/project/chat/bot_message.vue`
**ハードコード文字列** (1個):
- Line 30: `"MM/DD HH:mm"` (コメント: `// TODO: format i18n`)

#### 8. `pages/project/chat/user_message.vue`
**ハードコード文字列** (1個):
- Line 31: `"MM/DD HH:mm"` (コメント: `// TODO: format i18n`)

#### 9. `pages/project/script_editor/text_editor.vue`
**ハードコード文字列** (1個):
- Line 3: `"Beat {{ index + 1 }}"`

#### 10. `pages/project/script_editor/beat_preview_image.vue`
**ハードコード文字列** (1個):
- Line 24: `"Reference"` (コメント: `<!-- Todo -->`)

#### 11. `pages/project/script_editor/parameters/movie_params.vue`
**ハードコード文字列** (1個):
- Line 98: `console.log(provider, agent);` (デバッグコード - 削除すべき)

## ✅ i18n対応完了済みファイル (21個)

以下のファイルは`useI18n`を使用し、すべてのユーザー向けテキストが`t()`関数で適切に翻訳されています：

1. `pages/project/script_editor/parameters/mulmo_error.vue`
2. `pages/project/concurrent_task_status.vue`
3. `pages/project/script_editor/parameters/text_slide_params.vue`
4. `pages/dashboard/new_project_dialog.vue`
5. `pages/dashboard/project_items.vue`
6. `pages/project/generate.vue`
7. `pages/project/script_editor/beat_style.vue`
8. `pages/project/script_editor/parameters/image_params.vue`
9. `pages/project/script_editor/presentation_style_editor.vue`
10. `pages/project/script_editor/settings_alert.vue`
11. `pages/dashboard.vue`
12. `pages/project/chat/tools_message.vue`
13. `pages/project/script_editor/parameters/audio_params.vue`
14. `pages/project/script_editor/parameters/canvas_size_params.vue`
15. `pages/project/script_editor/beat_preview_movie.vue`
16. `pages/project.vue`
17. `pages/project/project_header.vue`
18. `pages/project/select_language.vue`
19. `pages/project/script_editor/reference_selector.vue`
20. `pages/project/script_editor/reference.vue`
21. `pages/project/script_editor/beat_selector.vue`
22. `pages/settings.vue`

## 📈 推定作業量

### 作業時間見積もり
- **HIGH Priority**: ~2時間 (prompt_guide.vue)
- **MEDIUM Priority**: ~2時間 (4ファイル)
- **LOW Priority**: ~1時間 (6ファイル)
- **合計**: ~5時間

### 必要な翻訳キー追加数
- 新規キー: 約50個
- 既存キー活用可能: 約10個

## 🎯 実装推奨順序

1. **Phase 1**: `prompt_guide.vue` (最大影響)
2. **Phase 2**: `script_editor.vue`, `speech_params.vue` (コアUI)
3. **Phase 3**: `chat.vue`, `beat_editor.vue` (機能関連)
4. **Phase 4**: その他6ファイル (軽微な修正)

## 📝 特記事項

### 良い点
- 全体の65.6%が既にi18n対応済み
- コアコンポーネントの多くが対応済み
- 翻訳キー構造が整理されている

### 改善点
- `prompt_guide.vue`が完全に未対応（最優先）
- タブラベルなど基本UIのハードコード
- 日付フォーマットのローカライズ未対応
- デバッグコードの削除が必要

### 注意点
- 動的文字列生成部分は慎重に対応が必要
- TODOコメントが付いている箇所は既に認識済み
- console.logは削除すべき

---
**確認者**: Claude Code  
**確認方法**: 手動による全ファイル読み込み確認  
**確認日**: 2025年8月18日