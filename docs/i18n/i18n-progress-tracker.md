# MulmoCast App i18n 進捗管理シート

MulmoCastアプリケーションの国際化プロジェクトの進捗を追跡するための管理シートです。

## 📊 プロジェクト概要

| 項目 | 値 | 更新日時 |
|------|----|---------| 
| プロジェクト開始日 | 2025-07-28 | 2025-07-28 14:00 |
| 最終更新日 | 2025-08-06 | 2025-08-06 14:00 |
| 実行者 | Claude Code | 2025-07-28 14:00 |
| 対象ブランチ | i18n-250729 | 2025-07-28 14:00 |
| 総コンポーネント数 | 73 | 2025-08-06 14:00 |
| 完了コンポーネント数 | 45 | 2025-08-06 14:00 |
| 進捗率 | 61.6% | 2025-08-06 14:00 |

## 🎯 フェーズ別進捗

### Phase 1: 現状分析 (Audit)
- [x] **実行日時**: 2025-08-18 12:00-12:30 (✅ 完了 - 最新状況分析)
- [x] **実行コマンド**: `/i18n-workflow audit all`
- [x] **結果ファイル**: `docs/i18n/i18n-audit-20250818.md`

#### 分析結果サマリー (更新版)
| カテゴリ | 現在値 | 目標値 | 状態 |
|----------|--------|--------|------|
| 翻訳カバレッジ | 30% (33/110) | 100% | ❌ 大幅改善必要 |
| 構造問題数 | 0 | 0 | ✅ 良好 |
| 未翻訳項目数 | 77コンポーネント | 0 | ❌ 要対応 |
| ハードコード箇所 | ~45キー | 0 | ❌ 改善必要 |
| クリティカル問題 | 1件 (prompt_guide.vue) | 0 | 🔥 緊急対応 |

### Phase 2: 実装計画 (Planning)  
- [x] **実行日時**: 2025-08-06 14:30-15:15 (✅ 完了 - main merge対応完了)
- [x] **実行コマンド**: `/i18n-workflow plan all`
- [x] **計画ファイル**: `docs/i18n/i18n-plan-20250806.md` (新規作成)

#### 実装優先度 (更新版 - main merge反映)
| 優先度 | コンポーネント群 | 対象数 | 予想工数 | 状態 |
|--------|-----------------|--------|----------|------|
| **CRITICAL** | NEW components (dialog, text_editor) | 2個 | 50分 | ✅ 緊急対応準備完了 |
| **HIGH** | Core UI fixes (header, chat) | 2個 | 20分 | ✅ 計画完了 |
| **MEDIUM** | Parameter components | 4個 | 80分 | ✅ 計画完了 |
| **LOW** | Quality & validation | - | 60分 | ✅ 計画完了 |
| **合計** | **残り28コンポーネント** | **28個** | **~5時間** | **✅ 実装準備完了** |

### Phase 3: 構造リファクタリング (Refactor) ⚠️ **CRITICAL UPDATE**
- [ ] **実行日時**: 2025-08-06 予定 ← **大幅な作業が判明**
- [ ] **実行コマンド**: `/i18n-refactor all` 
- [ ] **バックアップ**: ✅ Git commit済み

#### **現状 vs 目標構造のギャップ分析**

##### **現在のi18n構造** (実際のen.ts/ja.ts):
```
├── ui/                    ✅ 部分実装済み
│   ├── common/           ✅ title, image, audio等
│   ├── actions/          ✅ create, generate等
│   └── status/           ✅ loading, generating等
├── project/              ✅ 現在のアプローチ
│   ├── scriptEditor/     ✅ movieParams, speechParams等
│   └── productTabs/      ✅ 完全実装済み
├── beat/                 ⚠️ **旧構造のまま**
│   ├── form/            ❌ beat.form.textSlide (目標: beat.textSlide)
│   └── (フラット構造)    ❌ refactor plan準拠でない
└── parameters/          ❌ **完全に未実装**
```

##### **refactor plan目標構造**:
```
├── ui/ (elements/, tabs/, validation/ が未実装)
├── beat/ (form/ → 各タイプ別に分離が必要)  
└── parameters/ (project.scriptEditor.*から抽出が必要)
```

#### **重要な発見: refactor未完了**
| 修正項目 | 修正前 | 修正後 | 状態 |
|----------|--------|--------|------|
| beat構造変更 | `beat.form.textSlide` | `beat.textSlide` | ❌ **要実行** |
| parameters構造作成 | `project.scriptEditor.movieParams` | `parameters.movieParams` | ❌ **要実行** |
| ui要素追加 | (存在しない) | `ui.elements/tabs/validation` | ❌ **要実行** |
| コンポーネント更新 | 古いキーパス | 新しいキーパス | ❌ **30ファイル要更新** |

#### **修正された工数見積**
- **当初想定**: 軽微な追加作業 (3日, 5時間)
- **実際の必要作業**: 大規模refactor + 新規実装 (5-7日, 12-15時間)

#### **Phase 3 作業内容**
1. **構造refactor**: beat.*, parameters.* の大幅変更
2. **コンポーネント更新**: 全ての旧キーパス参照を修正
3. **新規コンポーネント**: text_editor.vue, new_project_dialog.vue のi18n化
4. **翻訳追加**: ~60個の新キー追加 (当初予想: ~6個)

### Phase 4: コンポーネント実装 (Implementation)
- [ ] **実行日時**: YYYY-MM-DD HH:MM  
- [ ] **実行コマンド**: `/i18n-batch "**/*.vue" both`

#### コンポーネント別進捗

##### 🏠 Dashboard Components
| コンポーネント | 状態 | 実行日時 | 翻訳キー数 | 備考 |
|---------------|------|----------|------------|------|
| `pages/dashboard/dashboard.vue` | ❌ 未実行 | - | - | - |
| `pages/dashboard/components/grid_view.vue` | ❌ 未実行 | - | - | - |
| `pages/dashboard/components/list_view.vue` | ❌ 未実行 | - | - | - |
| `pages/dashboard/components/new_project_dialog.vue` | ❌ 未実行 | - | - | - |

##### 🎬 Project Components  
| コンポーネント | 状態 | 実行日時 | 翻訳キー数 | 備考 |
|---------------|------|----------|------------|------|
| `pages/project/project.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/script_editor.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/beats_viewer.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/generate.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/chat.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/product_tabs.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/script_editor/beat_editor.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/script_editor/beat_preview.vue` | ❌ 未実行 | - | - | - |
| `pages/project/components/script_editor/beat_selector.vue` | ❌ 未実行 | - | - | - |

##### ⚙️ Settings Components
| コンポーネント | 状態 | 実行日時 | 翻訳キー数 | 備考 |
|---------------|------|----------|------------|------|
| `pages/settings/settings.vue` | ❌ 未実行 | - | - | - |

##### 🎨 UI Components
| コンポーネント | 状態 | 実行日時 | 翻訳キー数 | 備考 |
|---------------|------|----------|------------|------|
| `components/header.vue` | ❌ 未実行 | - | - | - |
| `components/layout.vue` | ❌ 未実行 | - | - | - |
| `components/media_modal.vue` | ❌ 未実行 | - | - | - |
| `components/code_editor.vue` | ❌ 未実行 | - | - | - |

##### 📋 Parameter Components
| コンポーネント | 状態 | 実行日時 | 翻訳キー数 | 備考 |
|---------------|------|----------|------------|------|
| `script_editor/parameters/audio_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/image_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/movie_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/text_slide_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/canvas_size_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/caption_params.vue` | ❌ 未実行 | - | - | - |
| `script_editor/parameters/speech_params.vue` | ❌ 未実行 | - | - | - |

### Phase 5: 最終検証 (Validation)
- [ ] **実行日時**: YYYY-MM-DD HH:MM
- [ ] **実行コマンド**: `/i18n-workflow audit all` (再実行)

#### 検証チェックリスト
- [ ] 全コンポーネントでハードコードテキスト0件
- [ ] en.ts と ja.ts の翻訳対応100%
- [ ] 翻訳キー命名規則の統一
- [ ] 動作確認（言語切り替えテスト）
- [ ] パフォーマンス影響の確認
- [ ] Git commit とPR作成

## 📈 統計情報

### 翻訳キー統計
| ファイル | 追加キー数 | 総キー数 | 最終更新 |
|----------|------------|----------|----------|
| `en.ts` | 0 | 0 | - |
| `ja.ts` | 0 | 0 | - |
| `common.ts` | 0 | 0 | - |

### 工数記録
| フェーズ | 予想工数 | 実工数 | 効率 |
|----------|----------|--------|------|
| Audit | ~30分 | - | - |
| Planning | ~30分 | - | - |
| Refactor | ~60分 | - | - |
| Implementation | ~3-4時間 | - | - |
| Validation | ~30分 | - | - |
| **合計** | **~5-6時間** | **0時間** | **-%** |

## ⚠️ 課題・注意事項

### 発見された問題
| 問題 | 深刻度 | 状態 | 対応予定 | 備考 |
|------|--------|------|----------|------|
| - | - | - | - | 問題が発見されたら記録 |

### 技術的制約
- [ ] Vue 3 Composition API使用必須
- [ ] 既存の`vue-i18n`設定との互換性維持  
- [ ] 翻訳キー命名規則: 最終版構造（`ui.common.{noun}`, `ui.actions.{verb}`, `beat.{type}.{field}`, `parameters.{type}.{field}`）
- [ ] common.tsは技術用語・固有名詞のみ
- [ ] プレースホルダー方式の活用（文字列連結禁止）
- [ ] 役割別キー分離（add/addThingをペアで管理）

### リスク管理
- [ ] 作業前のGitバックアップ
- [ ] 段階的コミットによるロールバック対応
- [ ] 動作確認後のマージ
- [ ] レビュープロセスの実施

## 📝 作業ログ

### 2025-08-06
- **時刻**: 14:00-14:30
- **作業**: Phase 1 現状分析 (Audit) - merge from main後の状態調査
- **結果**: 73コンポーネント中45件(61.6%)がi18n対応済み。新規コンポーネント2件で緊急対応必要
- **次回**: Phase 2 実装計画の更新が必要（新規コンポーネント対応含む）

- **時刻**: 14:30-15:15  
- **作業**: Phase 2 実装計画 (Planning) - main merge対応の詳細計画策定
- **結果**: 28コンポーネント対象の3段階実装計画完成。CRITICAL 2件、HIGH 2件、MEDIUM 4件の優先度設定
- **成果物**: `docs/i18n/i18n-plan-20250806.md` (詳細実装計画書)
- **次回**: Phase 3 実装開始 - CRITICAL components緊急対応から開始

---

### 更新履歴
- **YYYY-MM-DD**: シート作成
- **YYYY-MM-DD**: Phase 1完了
- **YYYY-MM-DD**: Phase 2完了
- **YYYY-MM-DD**: 全フェーズ完了

---

**📌 使用方法**:
1. `/i18n-workflow`コマンド実行時にこのシートを更新
2. 各フェーズ完了時にチェックボックスを更新
3. 問題発生時は課題セクションに記録
4. 最終的にGitコミット時に完了マーク