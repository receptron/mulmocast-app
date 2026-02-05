# Azure OpenAI Service 対応 - MulmoCast App 実装計画 v2

## フェーズ概要

本実装は3つのフェーズに分けて進める:

| Phase | 内容 | 状態 |
|-------|------|------|
| **Phase 1** | 環境変数経由でのAzure対応（IMAGE/TTS/翻訳） | 本プラン |
| **Phase 2** | Chat対応（Azure OpenAIチェックボックス追加） | 将来課題 |
| **Phase 3** | 翻訳でもモデル変更できるようにする | 将来課題 |

### Phase 2: Chat対応（将来）
- `llm_settings.vue` に「Use Azure OpenAI」チェックボックスを追加
- `chat.vue` でAzure OpenAI config構築ロジックを追加
- **前提条件**: `@graphai/openai_agent` の `dangerouslyAllowBrowser` 対応が必要
- 詳細は [Phase 2 実装ガイド](#phase-2-chat対応-実装ガイド) を参照

### Phase 3: 翻訳モデル変更対応（将来）
- 翻訳時に使用するLLMモデルをUIから選択可能にする
- 現在は環境変数 `LLM_OPENAI_BASE_URL` で固定
- 詳細は [Phase 3 実装ガイド](#phase-3-翻訳モデル変更-実装ガイド) を参照

---

## 背景
- Issue: [receptron/mulmocast-cli#1117](https://github.com/receptron/mulmocast-cli/issues/1117)
- CLIでAzure OpenAI対応が完了（v2.1.23）
- Appでも同様の機能を実装する

## CLIでの実装方式
環境変数で各機能ごとにAzure OpenAI設定を指定:
```
IMAGE_OPENAI_API_KEY / IMAGE_OPENAI_BASE_URL  # 画像生成
TTS_OPENAI_API_KEY / TTS_OPENAI_BASE_URL      # 音声合成
LLM_OPENAI_API_KEY / LLM_OPENAI_BASE_URL      # テキスト生成
```

mulmocastライブラリが環境変数を自動検出してAzure OpenAIを使用する。

---

## App実装方針

### シンプルな方式
1. 設定画面でAzure OpenAIのAPI Key / Base URLを入力
2. 設定保存時に環境変数に展開
3. mulmocastライブラリが自動でAzure OpenAIを使用

**UIへの特別な変更は不要。** 環境変数経由でライブラリが自動判定する。

---

## 実装手順

### Step 1: 型定義の拡張
**ファイル**: [src/types/index.ts](src/types/index.ts)

```typescript
export type AzureOpenAIServiceConfig = {
  apiKey?: string;
  baseUrl?: string;  // https://<リソース名>.openai.azure.com/
};

export type AzureOpenAIConfig = {
  image?: AzureOpenAIServiceConfig;
  tts?: AzureOpenAIServiceConfig;
  llm?: AzureOpenAIServiceConfig;
};

// Settings型にAZURE_OPENAIフィールドを追加
export type Settings = {
  // 既存フィールド...
  AZURE_OPENAI?: AzureOpenAIConfig;
};
```

### Step 2: settings_manager.ts の拡張
**ファイル**: [src/main/settings_manager.ts](src/main/settings_manager.ts)

`saveSettings`関数でAzure OpenAI設定を環境変数に展開:
```typescript
// Azure OpenAI設定を環境変数に反映
if (settings.AZURE_OPENAI) {
  const { image, tts, llm } = settings.AZURE_OPENAI;
  if (image?.apiKey) process.env.IMAGE_OPENAI_API_KEY = image.apiKey;
  if (image?.baseUrl) process.env.IMAGE_OPENAI_BASE_URL = image.baseUrl;
  if (tts?.apiKey) process.env.TTS_OPENAI_API_KEY = tts.apiKey;
  if (tts?.baseUrl) process.env.TTS_OPENAI_BASE_URL = tts.baseUrl;
  if (llm?.apiKey) process.env.LLM_OPENAI_API_KEY = llm.apiKey;
  if (llm?.baseUrl) process.env.LLM_OPENAI_BASE_URL = llm.baseUrl;
}
```

### Step 3: Pinia Store の拡張
**ファイル**: [src/renderer/store/global.ts](src/renderer/store/global.ts)

SETTINGS型にAZURE_OPENAIを追加し、updateSettingsで反映。

### Step 4: Azure OpenAI設定UIコンポーネント作成
**新規ファイル**: `src/renderer/components/azure_openai_settings.vue`

Azure OpenAI専用の設定カード:
- 3つのサービス（IMAGE/TTS/LLM）それぞれにAPI Key + Base URL入力欄
- 折りたたみ可能なアコーディオン形式

### Step 5: 設定画面に組み込み
**ファイル**: [src/renderer/pages/settings.vue](src/renderer/pages/settings.vue)

API Keys セクションの下にAzure OpenAI設定セクションを追加

### Step 6: i18n翻訳追加
**ファイル**:
- [src/renderer/i18n/en.ts](src/renderer/i18n/en.ts)
- [src/renderer/i18n/ja.ts](src/renderer/i18n/ja.ts)

```json
{
  "settings": {
    "azureOpenAI": {
      "title": "Azure OpenAI",
      "description": "企業向けAzure OpenAI Serviceの設定",
      "image": { "title": "画像生成", "apiKey": "API Key", "baseUrl": "Base URL" },
      "tts": { "title": "音声合成", "apiKey": "API Key", "baseUrl": "Base URL" },
      "llm": { "title": "テキスト生成", "apiKey": "API Key", "baseUrl": "Base URL" },
      "baseUrlPlaceholder": "https://<リソース名>.openai.azure.com/"
    }
  }
}
```

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/types/index.ts` | AzureOpenAIConfig型追加、Settings型拡張 |
| `src/main/settings_manager.ts` | Azure設定の環境変数展開 |
| `src/renderer/store/global.ts` | AZURE_OPENAI設定をstoreに追加 |
| `src/renderer/components/azure_openai_settings.vue` | **新規作成** |
| `src/renderer/pages/settings.vue` | Azure設定コンポーネント組み込み |
| `src/renderer/i18n/en.ts` | 英語翻訳追加 |
| `src/renderer/i18n/ja.ts` | 日本語翻訳追加 |

---

## 変更不要なファイル

以下のファイルは変更**不要**:
- `image_params.vue` - 環境変数で自動判定される
- `speech_speaker.vue` - 環境変数で自動判定される
- `chat.vue` - 環境変数経由ではブラウザ環境で動作しない（将来課題）
- `llm_settings.vue` - Chatのためだけなので不要
- `constants.ts` - 環境変数名の定数は不要（settings_manager.tsで直接使用）

---

## 動作する機能

| 機能 | 状態 | 備考 |
|-----|------|-----|
| 画像生成 (IMAGE) | ✅ 動作する | main processで実行。環境変数経由でAzure使用 |
| 音声合成 (TTS) | ✅ 動作する | main processで実行。環境変数経由でAzure使用 |
| 翻訳 (LLM) | ✅ 動作する | main processで実行。環境変数経由でAzure使用 |
| Chat (LLM) | ❌ 対象外 | renderer processで実行。ブラウザ環境では環境変数が使えない |

**Note**: ChatのAzure対応は別課題として対応（ライブラリ修正が必要）

---

## 検証方法

1. **設定保存テスト**: Azure OpenAI設定を入力・保存し、再起動後も設定が保持されることを確認
2. **環境変数テスト**: main processで`process.env.IMAGE_OPENAI_API_KEY`等が正しく設定されることを確認
3. **E2Eテスト**: 実際にAzure OpenAIリソースを使って画像/音声/翻訳が動作することを確認

---

## 注意事項

### Base URLの仕様
- Base URLは `https://<リソース名>.openai.azure.com/` 形式で入力
- mulmocastライブラリがBase URLからエンドポイントを構築
- UIのプレースホルダーに形式を表示

### 混在利用
- 各機能（IMAGE/TTS/LLM）は独立して設定可能
- 例: 「画像生成はAzure、TTSは通常OpenAI」という混在利用が可能

---

## 実装時に発生した問題と修正

### 問題1: 無限ループによる "Maximum recursive updates exceeded" エラー

#### 症状
設定画面を開くと以下のエラーが発生:
```
Maximum recursive updates exceeded in component <settings>.
This means you have a reactive effect that is mutating its own dependencies
and thus recursively triggering itself.
```

#### 原因
`azure_openai_settings.vue` で2つのwatchが相互にトリガーし合い、無限ループが発生:

1. `localConfig` が変更される
2. watch → `emit("update:config", ...)` 発火
3. 親 (`settings.vue`) が `azureOpenAIConfig.value = config` で更新
4. 親のwatch → `saveSettings()` → `globalStore.updateSettings()` 実行
5. `props.config` が更新される
6. watch → `localConfig` を更新
7. → 1に戻る（無限ループ）

#### 修正内容
`azure_openai_settings.vue` の `props.config` watchで、値が実際に変わった場合のみ `localConfig` を更新するように修正:

```typescript
// 修正前
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.image = { ...createDefaultServiceConfig(), ...newConfig.image };
      // ...
    }
  },
  { deep: true },
);

// 修正後
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      const newImage = { ...createDefaultServiceConfig(), ...newConfig.image };
      // Only update if values actually changed
      if (JSON.stringify(localConfig.image) !== JSON.stringify(newImage)) {
        localConfig.image = newImage;
      }
      // ...
    }
  },
  { deep: true },
);
```

### 問題2: vue-i18n の HTML検出警告

#### 症状
設定画面を開くと以下の警告が発生:
```
[intlify] Detected HTML in 'https://<resource-name>.openai.azure.com/' message.
Recommend not using HTML messages to avoid XSS.
```

#### 原因
i18n翻訳ファイルの `baseUrlPlaceholder` に `<resource-name>` という文字列が含まれており、vue-i18nがHTMLタグとして検出した。

#### 修正内容
`en.ts` と `ja.ts` の `baseUrlPlaceholder` を修正:

```typescript
// 修正前
baseUrlPlaceholder: "https://<resource-name>.openai.azure.com/"

// 修正後
baseUrlPlaceholder: "https://your-resource-name.openai.azure.com/"
```

### 問題3: Azure OpenAI設定時でもOpenAI API Key警告が表示される

#### 症状
Azure OpenAIのAPI Keyを設定しても、「You need to setup OpenAI API Key」エラーが表示され、Generate Contentsボタンが押せない。

#### 背景: OpenAI vs Azure OpenAI の API Key 構造の違い

| サービス | API Key構造 |
|---------|------------|
| **OpenAI** | `OPENAI_API_KEY` 1つで全機能（image/tts/llm）に対応 |
| **Azure OpenAI** | 機能ごとに別々のAPI Key（`image.apiKey`, `tts.apiKey`, `llm.apiKey`） |

#### 原因
現在の `settingPresence` は `OPENAI_API_KEY` の有無のみをチェックしている。
Azure OpenAIでは機能ごとにAPI Keyが分かれているため、単純な置き換えでは対応できない。

#### 修正方針
**機能別のAPI Keyチェック関数を追加する**

各機能（image/tts/llm）について、以下のいずれかがあれば「設定済み」とする:
- 通常の `OPENAI_API_KEY`（全機能で使える）
- Azure OpenAIの該当機能のAPI Key

#### 修正内容

**ファイル**: `src/renderer/store/global.ts`

```typescript
// 新規追加: 機能別にOpenAI API Keyが設定されているかチェック
const hasOpenAIKeyForFeature = (feature: 'image' | 'tts' | 'llm'): boolean => {
  // 通常のOpenAI API Keyがあれば全機能で使える
  if (settings.value.APIKEY?.OPENAI_API_KEY) {
    return true;
  }
  // Azure OpenAIの場合は機能別にチェック
  const azureOpenAI = settings.value.AZURE_OPENAI;
  if (azureOpenAI) {
    return !!azureOpenAI[feature]?.apiKey;
  }
  return false;
};
```

**使用例**:
```typescript
// 画像生成時のチェック
if (!hasOpenAIKeyForFeature('image')) {
  // 警告表示
}

// TTS時のチェック
if (!hasOpenAIKeyForFeature('tts')) {
  // 警告表示
}
```

#### 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/renderer/store/global.ts` | `hasOpenAIKeyForFeature` 関数を追加、export |
| `src/renderer/pages/project/script_editor/settings_alert.vue` | `feature` propを追加、OpenAI判定時に`hasOpenAIKeyForFeature`を使用 |
| `src/renderer/pages/project/script_editor/styles/image_params.vue` | SettingsAlertに `feature="image"` を追加 |
| `src/renderer/pages/project/script_editor/styles/speech_speaker.vue` | SettingsAlertに `feature="tts"` を追加 |

#### 検証方法
1. OpenAI API Keyを空にする
2. Azure OpenAIの `image.apiKey` のみ設定
3. 画像生成 → 警告なし、TTS → 警告あり を確認

#### 修正完了
✅ 2024/02/05 コミット `44b6ba6f` で修正完了

### 問題4: Generate Contentsボタン押下時に「OpenAI API key is not set」エラー

#### 症状
Azure OpenAI設定がある状態でGenerate Contentsボタンを押すと、「OpenAI API key is not set」エラーが表示される。

#### 原因
アプリ起動時の環境変数設定が不足している。

**現状** (`src/main/main.ts` 296-303行目):
```typescript
const settings = await settingsManager.loadSettings();

for (const envKey of Object.keys(ENV_KEYS)) {
  const value = settings?.APIKEY?.[envKey as keyof typeof ENV_KEYS];
  if (value) {
    process.env[envKey] = value;
  }
}
```

- `settings.APIKEY` から通常のAPI Key（`OPENAI_API_KEY`等）を環境変数に設定
- **Azure OpenAI設定** (`settings.AZURE_OPENAI`) を環境変数に設定していない

`saveSettings`では Azure OpenAI設定を環境変数に設定しているが、`main.ts`の起動時処理には含まれていない。

#### 影響
- アプリ起動後、設定を保存するまではAzure OpenAI環境変数が設定されない
- mulmocastライブラリが`OPENAI_API_KEY`または機能別環境変数をチェックした際に「not set」エラーになる

#### 修正方針
`main.ts`の起動時処理にAzure OpenAI環境変数の設定を追加する。

#### 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/main/main.ts` | Azure OpenAI設定から環境変数を設定するコードを追加 |

#### 修正内容
```typescript
const settings = await settingsManager.loadSettings();

// 既存: APIKEY設定
for (const envKey of Object.keys(ENV_KEYS)) {
  const value = settings?.APIKEY?.[envKey as keyof typeof ENV_KEYS];
  if (value) {
    process.env[envKey] = value;
  }
}

// 追加: Azure OpenAI設定
if (settings.AZURE_OPENAI) {
  const { image, tts, llm } = settings.AZURE_OPENAI;
  if (image?.apiKey) process.env.IMAGE_OPENAI_API_KEY = image.apiKey;
  if (image?.baseUrl) process.env.IMAGE_OPENAI_BASE_URL = image.baseUrl;
  if (tts?.apiKey) process.env.TTS_OPENAI_API_KEY = tts.apiKey;
  if (tts?.baseUrl) process.env.TTS_OPENAI_BASE_URL = tts.baseUrl;
  if (llm?.apiKey) process.env.LLM_OPENAI_API_KEY = llm.apiKey;
  if (llm?.baseUrl) process.env.LLM_OPENAI_BASE_URL = llm.baseUrl;
}
```

#### 調査結果
環境変数経由のアプローチでは問題が解決しなかった。根本原因を調査:

1. mulmocastライブラリの`settings2GraphAIConfig`関数を分析
2. `audio.js`内で`settings2GraphAIConfig(settings, process.env)`を呼び出し
3. `getKey`関数は以下の順序でキーを探す:
   - `settings["TTS_OPENAI_API_KEY"]` (prefix + key)
   - `settings["OPENAI_API_KEY"]` (key only)
   - `env["TTS_OPENAI_API_KEY"]` (env prefix + key)
   - `env["OPENAI_API_KEY"]` (env key only)

4. `handler_generator.ts`では`args = { settings: settings.APIKEY ?? {} }`を渡していた
5. `settings.APIKEY`には`TTS_OPENAI_API_KEY`などのプレフィックス付きキーが含まれていない

#### 最終修正
**ファイル**: `src/main/mulmo/handler_generator.ts`

`buildMulmoSettings`関数を追加して、Azure OpenAI設定を`settings`オブジェクトに直接マッピング:

```typescript
const buildMulmoSettings = (settings: Settings): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = { ...settings.APIKEY };

  // Add Azure OpenAI keys with service-specific prefixes
  if (settings.AZURE_OPENAI) {
    const { image, tts, llm } = settings.AZURE_OPENAI;

    // TTS (Text-to-Speech) Azure OpenAI settings
    if (tts?.apiKey) result["TTS_OPENAI_API_KEY"] = tts.apiKey;
    if (tts?.baseUrl) result["TTS_OPENAI_BASE_URL"] = tts.baseUrl;

    // Image generation Azure OpenAI settings
    if (image?.apiKey) result["IMAGE_OPENAI_API_KEY"] = image.apiKey;
    if (image?.baseUrl) result["IMAGE_OPENAI_BASE_URL"] = image.baseUrl;

    // LLM Azure OpenAI settings
    if (llm?.apiKey) result["LLM_OPENAI_API_KEY"] = llm.apiKey;
    if (llm?.baseUrl) result["LLM_OPENAI_BASE_URL"] = llm.baseUrl;
  }

  return result;
};

// 使用箇所
const mulmoSettings = buildMulmoSettings(settings);
const args = { settings: mulmoSettings };
```

**メリット**:
- `settings2GraphAIConfig`の最初のチェック（`settings["TTS_OPENAI_API_KEY"]`）で直接マッチ
- 環境変数に依存しない確実な設定渡し
- 全てのmulmocast関数呼び出し箇所で一貫した動作

#### 修正対象箇所
| 関数 | 修正内容 |
|-----|---------|
| `mulmoActionRunner` | `buildMulmoSettings(settings)`を使用 |
| `mulmoGenerateBeatImage` | `buildMulmoSettings(settings)`を使用 |
| `mulmoGenerateBeatAudio` | `buildMulmoSettings(settings)`を使用 |
| `mulmoTranslateBeat` | `buildMulmoSettings(settings)`を使用 |
| `mulmoTranslate` | `buildMulmoSettings(settings)`を使用 |

### 問題5: PRレビュー指摘事項

#### 5-1: キー削除時に古い環境変数が残り続ける（中）

**症状**:
ユーザーがAPIキーを削除しても、古いキーが環境変数に残り続け、`settings2GraphAIConfig`のフォールバックで使用される可能性がある。

**原因**:
`saveSettings`と`loadSettings`で環境変数を「セットのみ」しており、空になったキーを`delete`していない。

**対象ファイル**:
- `src/main/settings_manager.ts` (lines 41-112)
- `src/main/main.ts` (lines 298-314)

**修正方針**:
APIKEY / Azure の各キーについて、値が空なら `delete process.env[KEY]` を実施。

#### 5-2: 設定保存時の console.log(data) が機密情報を露出（中）

**症状**:
設定保存時に`console.log(data)`でAPIキーがログに出力される。

**原因**:
デバッグ用のログが残っている。

**対象ファイル**:
- `src/renderer/pages/settings.vue` (line 275)

**修正方針**:
`console.log`を削除する。

#### 5-3: AzureのbaseUrlが未設定でも「設定済み」と見なされる（低〜中）

**症状**:
`hasOpenAIKeyForFeature`がAzureの`apiKey`のみをチェックし、`baseUrl`を無視している。Azure OpenAIは`baseUrl`が必須のため、未設定だと実際には失敗するが警告が出ない。

**原因**:
Azure判定時に`apiKey`のみをチェックしている。

**対象ファイル**:
- `src/renderer/store/global.ts` (lines 78-90)

**修正方針**:
Azure判定時は`apiKey && baseUrl`を両方チェックする。

---

## Phase 2: Chat対応 実装ガイド

### 概要
ChatはRenderer Process（ブラウザ環境）で実行されるため、Main Processとは異なるアプローチが必要。

### Phase 1からの学び
- `settings2GraphAIConfig`は`settings`オブジェクトを**最初に**チェックする
- 環境変数(`process.env`)は2番目にチェックされる
- したがって、`settings`に直接`LLM_OPENAI_API_KEY`等を渡せば動作する可能性がある

### 実装方針
1. **UI変更**: `llm_settings.vue`に「Use Azure OpenAI」トグルを追加
2. **設定の渡し方**: `chat.vue`でGraphAI configを構築する際に、Azure設定を含める
   ```typescript
   // Phase 1の buildMulmoSettings と同様のパターン
   const buildChatConfig = (settings: Settings) => {
     const config: Record<string, any> = {};
     if (settings.AZURE_OPENAI?.llm?.apiKey) {
       config.openAIAgent = {
         apiKey: settings.AZURE_OPENAI.llm.apiKey,
         baseURL: settings.AZURE_OPENAI.llm.baseUrl,
       };
     } else if (settings.APIKEY?.OPENAI_API_KEY) {
       config.openAIAgent = {
         apiKey: settings.APIKEY.OPENAI_API_KEY,
       };
     }
     return config;
   };
   ```

### 前提条件・確認事項
- [ ] `@graphai/openai_agent`の`dangerouslyAllowBrowser`対応状況を確認
- [ ] Azure OpenAIのCORS設定（ブラウザからの直接アクセス可否）
- [ ] Azure OpenAI APIのエンドポイント形式（`/openai/deployments/{deployment-id}/chat/completions`）

### 修正対象ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/renderer/pages/project/llm_settings.vue` | Azure OpenAIトグル追加 |
| `src/renderer/pages/project/chat.vue` | Azure config構築ロジック |

---

## Phase 3: 翻訳モデル変更 実装ガイド

### 概要
翻訳時に使用するLLMモデルをUIから選択可能にする。

### 現状
- 翻訳は`mulmoTranslate`/`mulmoTranslateBeat`経由でMain Processで実行
- `buildMulmoSettings`で`LLM_OPENAI_API_KEY`/`LLM_OPENAI_BASE_URL`を渡している
- モデル選択UIは現在存在しない

### 実装方針
1. **UI追加**: 翻訳設定UIにLLMプロバイダー/モデル選択を追加
2. **設定保存**: `Settings`型に翻訳用LLM設定を追加
   ```typescript
   type Settings = {
     // 既存...
     TRANSLATION_LLM?: {
       provider: 'openai' | 'anthropic' | 'gemini';
       model?: string;
     };
   };
   ```
3. **mulmocast連携**: 翻訳関数呼び出し時にLLM設定を渡す

### 修正対象ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/types/index.ts` | `TRANSLATION_LLM`型追加 |
| `src/renderer/pages/project/script_editor/` | 翻訳LLM設定UI |
| `src/main/mulmo/handler_generator.ts` | 翻訳時のLLM設定渡し |

### 依存関係
- mulmocastライブラリが翻訳時のLLMプロバイダー/モデル指定に対応している必要あり
