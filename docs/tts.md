# TTS Provider Integration Guide

このドキュメントは、新しいTTSプロバイダーをMulmoCastアプリに統合する際の実装手順をまとめたものです。

## 前提条件

**まず、`mulmocast-cli`（mulmocastパッケージ）側で実装してください。**

新しいTTSプロバイダーは、アプリに統合する前に`mulmocast-cli`側で実装されている必要があります。以下の手順で進めてください：

1. **CLI側の実装**: まず、以下のドキュメントを参照してmulmocast-cli側でTTSプロバイダーを実装します
   - 📄 [mulmocast-cli TTS Integration Guide](https://github.com/receptron/mulmocast-cli/blob/main/docs/tts.md)

2. **実装確認**: mulmocastパッケージの`provider2TTSAgent`に新しいプロバイダーの定義が含まれていることを確認してください

3. **アプリ側の統合**: CLI側の実装が完了したら、このドキュメントの手順に従ってアプリ側に統合します

## 基本方針

**通常、TTSプロバイダーはvoiceIdのみを設定すれば十分です。**

一部のプロバイダー（openaiのinstruction、kotodamaのdecorationなど）は追加の設定（speechOptions）を必要としますが、これはプロバイダー固有の機能です。新しいプロバイダーを追加する際は、まず基本的な実装（voiceIdのみ）を行い、必要に応じてTTS固有設定を追加してください。

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

### 3. TTS固有の設定（オプション）

**通常はvoiceIdのみで十分です。**

プロバイダーが追加の設定をサポートする場合のみ、以下の対応が必要です：

#### 例: Kotodamaの場合（decoration）

Kotodamaは音声スタイル（decoration）をサポートしているため、選択肢リストを定義します：

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

#### 他のプロバイダーの例

- **openai**: `instruction`（テキスト入力、読み上げスタイルの指示）
- **elevenlabs**: `model`（モデル選択）

### 4. Settings Alert設定

**ファイル**: `src/renderer/pages/project/script_editor/settings_alert.vue`

`provider2ApiKey`マッピングにプロバイダーを追加します：

```typescript
const provider2ApiKey = {
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
  elevenlabs: "ELEVENLABS_API_KEY",
  kotodama: "KOTODAMA_API_KEY", // 追加
};
```

### 5. i18n翻訳の追加

#### 必須の翻訳項目

すべてのTTSプロバイダーで必要な翻訳：

**英語翻訳** (`src/renderer/i18n/en.ts`):

```typescript
{
  ai: {
    provider: {
      [providerName]: {
        name: "Provider Display Name",
        speechName: "Provider Speech Name",
      },
    },
    apiKeyName: {
      [API_KEY_NAME]: "API Key Display Name",
    },
  },
  voiceList: {
    [providerName]: {
      [voiceKey]: "Voice Display Name",
      // 各音声のキーと表示名
    },
  },
  errors: {
    generate: {
      apiError: {
        [agentName]: "Error message for API errors.",
      },
      apiKeyInvalid: {
        [agentName]: "Error message for invalid API key",
      },
      apiRateLimit: {
        [agentName]: "Error message for rate limit.",
      },
      apiKeyMissing: {
        [API_KEY_NAME]: "Error message for missing API key",
      },
    },
  },
}
```

**日本語翻訳** (`src/renderer/i18n/ja.ts`) も同様の構造で追加します。

#### TTS固有設定の翻訳（オプション）

プロバイダーが追加の設定をサポートする場合、その設定項目の翻訳も追加します。

**Kotodamaの例（decoration）**:

```typescript
// en.ts
{
  decorationList: {
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
      decoration: "Voice Style",
    },
  },
}

// ja.ts
{
  decorationList: {
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
      decoration: "音声スタイル",
    },
  },
}
```

### 6. UIコンポーネント（TTS固有設定がある場合のみ）

**通常はvoiceIdのみで、この手順は不要です。**

プロバイダーが追加の設定を必要とする場合のみ、UIコンポーネントを追加します。

**ファイル**: `src/renderer/pages/project/script_editor/styles/speech_speaker.vue`

#### 例1: Kotodama（セレクト形式のdecoration）

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

#### 例2: OpenAI（テキスト入力のinstruction）

```vue
<div v-if="localizedSpeaker.provider === 'openai' || !localizedSpeaker.provider">
  <Label class="text-xs">{{ t("parameters.speechParams.instruction") }}</Label>
  <Input
    :model-value="speaker?.speechOptions?.instruction || ''"
    @update:model-value="(value) => handleSpeechOptionsChange('instruction', value)"
    class="h-8"
    :placeholder="t('parameters.speechParams.instructionPlaceholder')"
  />
</div>
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

  // TTS固有設定のデフォルト値を設定（プロバイダーごとに異なる）
  // 例: Kotodamaのdecoration
  if (provider === "kotodama" && providerConfig?.defaultDecoration) {
    updatedSpeakers.speechOptions = {
      decoration: providerConfig.defaultDecoration,
    };
  }

  const lang = mulmoScriptHistoryStore.lang;
  if (props.speaker?.lang?.[lang]) {
    const langData = { ...props.speaker.lang };
    langData[lang] = updatedSpeakers;
    emit("updateSpeakerData", {
      lang: langData,
    });
  } else {
    emit("updateSpeakerData", updatedSpeakers, false);
  }
};
```

**重要**:
- 通常はvoiceIdの設定のみで十分です
- TTS固有設定（speed, instruction, decorationなど）がある場合のみ、`speechOptions`を設定します
- デフォルト値は`provider2TTSAgent`から取得するか、適切な初期値を設定します

## 重要なポイント

### mulmocastパッケージとの連携

- **provider2TTSAgent**: mulmocastパッケージの`provider2TTSAgent`から設定を取得します
  - `defaultVoice`: デフォルトの音声ID
  - `agentName`: エージェント名（エラーメッセージのキーに使用）
  - `keyName`: 対応するAPI Keyの名前
  - その他のプロバイダー固有設定（例: kotodamaの`defaultDecoration`）

### データ構造

#### 基本的なプロバイダー（voiceIdのみ）

```json
{
  "provider": "openai",
  "voiceId": "shimmer"
}
```

#### TTS固有設定があるプロバイダー（例: Kotodama）

```json
{
  "provider": "kotodama",
  "voiceId": "Atla",
  "speechOptions": {
    "decoration": "neutral"
  }
}
```

#### その他の例

```json
// OpenAI (instruction)
{
  "provider": "openai",
  "voiceId": "shimmer",
  "speechOptions": {
    "instruction": "Read slowly and gently"
  }
}
```

### 既存プロバイダーの参考実装

- **openai**: `instruction`パラメータの実装例
- **kotodama**: `decoration`パラメータの実装例

## チェックリスト

新しいTTSプロバイダーを追加する際は、以下を実装してください：

### 必須項目（すべてのプロバイダー）

- [ ] `ENV_KEYS`にAPI Key定義を追加（constants.ts）
- [ ] `VOICE_LISTS`に音声リストを追加（constants.ts）
- [ ] `settings_alert.vue`の`provider2ApiKey`に追加
- [ ] `en.ts`に英語翻訳を追加（provider, apiKeyName, voiceList, errors）
- [ ] `ja.ts`に日本語翻訳を追加（provider, apiKeyName, voiceList, errors）
- [ ] `handleProviderChange`でデフォルトvoiceIdを設定
- [ ] `yarn run lint`と`yarn run type-check`を実行して確認

### オプション項目（TTS固有設定がある場合のみ）

- [ ] 設定項目のリストを`constants.ts`に追加（例: `DECORATION_LISTS`）
- [ ] 設定項目の翻訳を`en.ts`と`ja.ts`に追加
- [ ] UIコンポーネント（Select/Input）を`speech_speaker.vue`に追加
- [ ] `handleProviderChange`でデフォルト値を`speechOptions`に設定

## 実装例: Kotodama TTS

このガイドは、Kotodama TTS統合の実装を基にしています。詳細な実装については、以下のファイルを参照してください：

- `src/shared/constants.ts` (lines 76-82, 340-356)
- `src/renderer/pages/project/script_editor/settings_alert.vue` (line 40)
- `src/renderer/pages/project/script_editor/styles/speech_speaker.vue` (lines 67-82, 217-245)
- `src/renderer/i18n/en.ts` (kotodama関連のセクション)
- `src/renderer/i18n/ja.ts` (kotodama関連のセクション)
