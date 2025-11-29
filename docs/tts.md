# TTS Provider Integration Guide

このドキュメントは、新しいTTSプロバイダーをMulmoCastアプリに統合する際の実装手順をまとめたものです。

## 前提条件

新しいTTSプロバイダーは、まず`mulmocast-cli`（mulmocastパッケージ）側で実装されている必要があります。mulmocastパッケージの`provider2TTSAgent`に定義が含まれていることを確認してください。

## 実装手順

### 1. API Key設定の追加

**ファイル**: `src/shared/constants.ts`

`ENV_KEYS`にAPI Keyの定義を追加します：

```typescript
export const ENV_KEYS = {
  // ... 既存のキー
  KOTODAMA_API_KEY: {
    title: "Kotodama API Key",
    placeholder: "kt_...",
    url: "https://kotodama.go-spiral.ai/",
    features: ["tts"] as FeatureKey[],
  },
};
```

### 2. Voice Listの追加

**ファイル**: `src/shared/constants.ts`

`VOICE_LISTS`にプロバイダーの音声リストを追加します：

```typescript
export const VOICE_LISTS = {
  // ... 既存のプロバイダー
  kotodama: [
    { id: "Atla", key: "atla" },
    { id: "Poporo", key: "poporo" },
    { id: "jikkyo_baby", key: "jikkyo_baby" },
  ],
} as const;
```

**注意**:
- `id`: APIに渡す実際の値（mulmocastパッケージのデフォルト値と一致させる）
- `key`: i18n翻訳キーに使用される識別子

### 3. Decoration List（オプション）

プロバイダーが音声スタイル（decoration）をサポートする場合、`DECORATION_LISTS`に追加します：

**ファイル**: `src/shared/constants.ts`

```typescript
export const DECORATION_LISTS = {
  kotodama: [
    { id: "neutral", key: "neutral" },
    { id: "neutral_en", key: "neutral_en" },
    { id: "happy", key: "happy" },
    { id: "happy_en", key: "happy_en" },
    { id: "angry", key: "angry" },
    { id: "angry_en", key: "angry_en" },
  ],
} as const;
```

### 4. Settings Alert設定

**ファイル**: `src/renderer/pages/project/script_editor/settings_alert.vue`

`provider2ApiKey`マッピングにプロバイダーを追加します：

```typescript
const provider2ApiKey = {
  openai: "OPENAI_API_KEY",
  nijivoice: "NIJIVOICE_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
  elevenlabs: "ELEVENLABS_API_KEY",
  kotodama: "KOTODAMA_API_KEY", // 追加
};
```

### 5. i18n翻訳の追加

#### 英語翻訳 (`src/renderer/i18n/en.ts`)

```typescript
{
  ai: {
    provider: {
      kotodama: {
        name: "Kotodama",
        speechName: "Kotodama",
      },
    },
    apiKeyName: {
      KOTODAMA_API_KEY: "Kotodama API Key",
    },
  },
  voiceList: {
    kotodama: {
      atla: "Atla",
      poporo: "Poporo",
      jikkyo_baby: "Jikkyo Baby",
    },
  },
  decorationList: { // decorationがある場合
    kotodama: {
      neutral: "Neutral",
      neutral_en: "Neutral (English)",
      happy: "Happy",
      happy_en: "Happy (English)",
      angry: "Angry",
      angry_en: "Angry (English)",
    },
  },
  parameters: {
    speechParams: {
      decoration: "Voice Style", // decorationがある場合
    },
  },
  errors: {
    generate: {
      apiError: {
        ttsKotodamaAgent: "An error occurred with speech synthesis (Kotodama).",
      },
      apiKeyInvalid: {
        ttsKotodamaAgent: "The Kotodama API Key is invalid",
      },
      apiRateLimit: {
        ttsKotodamaAgent: "The Kotodama API usage limit has been reached. Please try again later.",
      },
      apiKeyMissing: {
        KOTODAMA_API_KEY: "Kotodama API key is not set",
      },
    },
  },
}
```

#### 日本語翻訳 (`src/renderer/i18n/ja.ts`)

```typescript
{
  ai: {
    provider: {
      kotodama: {
        name: "Kotodama",
        speechName: "Kotodama",
      },
    },
    apiKeyName: {
      KOTODAMA_API_KEY: "Kotodama API Key",
    },
  },
  voiceList: {
    kotodama: {
      atla: "アトラ",
      poporo: "ポポロ",
      jikkyo_baby: "実況ベイビー",
    },
  },
  decorationList: { // decorationがある場合
    kotodama: {
      neutral: "ニュートラル",
      neutral_en: "ニュートラル（英語）",
      happy: "ハッピー",
      happy_en: "ハッピー（英語）",
      angry: "アングリー",
      angry_en: "アングリー（英語）",
    },
  },
  parameters: {
    speechParams: {
      decoration: "音声スタイル", // decorationがある場合
    },
  },
  errors: {
    generate: {
      apiError: {
        ttsKotodamaAgent: "音声合成（Kotodama）でエラーが発生しました。",
      },
      apiKeyInvalid: {
        ttsKotodamaAgent: "KotodamaのAPI Keyが正しくありません",
      },
      apiRateLimit: {
        ttsKotodamaAgent: "KotodamaのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      },
      apiKeyMissing: {
        KOTODAMA_API_KEY: "KotodamaのAPI Keyが設定されていません",
      },
    },
  },
}
```

### 6. UIコンポーネント（decorationがある場合）

**ファイル**: `src/renderer/pages/project/script_editor/styles/speech_speaker.vue`

decorationセレクトを追加します：

```vue
<template>
  <!-- 既存のproviderとvoiceIdセレクト -->

  <!-- decorationセレクト（kotodama用） -->
  <div v-if="localizedSpeaker.provider === 'kotodama'">
    <Label class="text-xs">{{ t("parameters.speechParams.decoration") }}</Label>
    <Select
      :model-value="speaker?.speechOptions?.decoration || 'neutral'"
      @update:model-value="(value) => handleSpeechOptionsChange('decoration', value)"
    >
      <SelectTrigger class="h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="decoration in getDecorationList('kotodama')" :key="decoration.id" :value="decoration.id">
          {{ t(["decorationList", "kotodama", decoration.key ?? decoration.id].join(".")) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { DECORATION_LISTS } from "@/../shared/constants";

type DecorationProvider = keyof typeof DECORATION_LISTS;

const getDecorationList = (provider: string) => {
  return DECORATION_LISTS[provider as DecorationProvider] || [];
};
</script>
```

### 7. Provider切り替え時のデフォルト値設定

**ファイル**: `src/renderer/pages/project/script_editor/styles/speech_speaker.vue`

`handleProviderChange`関数で、mulmocastパッケージの`provider2TTSAgent`からデフォルト値を取得します：

```typescript
import { type Speaker, provider2TTSAgent } from "mulmocast/browser";

const handleProviderChange = async (provider: string) => {
  type ProviderKey = keyof typeof provider2TTSAgent;
  const providerConfig = provider2TTSAgent[provider as ProviderKey];

  // mulmocastパッケージのdefaultVoiceを使用
  const voiceId = providerConfig?.defaultVoice || DEFAULT_VOICE_IDS[provider];
  const updatedSpeakers: Partial<Speaker> = {
    provider,
    voiceId,
    displayName: props.speaker.displayName,
  };

  // defaultDecorationがある場合は設定
  if (provider === "kotodama" && providerConfig?.defaultDecoration) {
    updatedSpeakers.speechOptions = {
      decoration: providerConfig.defaultDecoration,
    };
  }

  // ... 残りの処理
};
```

## 重要なポイント

### mulmocastパッケージとの連携

- **provider2TTSAgent**: mulmocastパッケージの`provider2TTSAgent`から設定を取得します
  - `defaultVoice`: デフォルトの音声ID
  - `defaultDecoration`: デフォルトの音声スタイル（ある場合）
  - `agentName`: エージェント名（エラーメッセージのキーに使用）
  - `keyName`: 対応するAPI Keyの名前

### データ構造

プロバイダー切り替え時に生成される設定例：

```json
{
  "provider": "kotodama",
  "voiceId": "Atla",
  "speechOptions": {
    "decoration": "neutral"
  }
}
```

### 既存プロバイダーの参考実装

- **nijivoice**: `speed`パラメータの実装例
- **openai**: `instruction`パラメータの実装例
- **kotodama**: `decoration`パラメータの実装例

## チェックリスト

新しいTTSプロバイダーを追加する際は、以下をすべて実装してください：

- [ ] `ENV_KEYS`にAPI Key定義を追加
- [ ] `VOICE_LISTS`に音声リストを追加
- [ ] （オプション）`DECORATION_LISTS`に音声スタイルを追加
- [ ] `settings_alert.vue`の`provider2ApiKey`に追加
- [ ] `en.ts`に英語翻訳を追加（provider, apiKeyName, voiceList, errors）
- [ ] `ja.ts`に日本語翻訳を追加（provider, apiKeyName, voiceList, errors）
- [ ] （decorationがある場合）UIコンポーネントにセレクトを追加
- [ ] `handleProviderChange`でデフォルト値を設定
- [ ] `yarn run lint`と`yarn run type-check`を実行して確認

## 実装例: Kotodama TTS

このガイドは、Kotodama TTS統合の実装を基にしています。詳細な実装については、以下のファイルを参照してください：

- `src/shared/constants.ts` (lines 76-82, 340-356)
- `src/renderer/pages/project/script_editor/settings_alert.vue` (line 40)
- `src/renderer/pages/project/script_editor/styles/speech_speaker.vue` (lines 67-82, 217-245)
- `src/renderer/i18n/en.ts` (kotodama関連のセクション)
- `src/renderer/i18n/ja.ts` (kotodama関連のセクション)
