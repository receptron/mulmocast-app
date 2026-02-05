# Azure OpenAI Service 対応 - MulmoCast App 実装計画

## 背景
- Issue: [receptron/mulmocast-cli#1117](https://github.com/receptron/mulmocast-cli/issues/1117)
- CLIでAzure OpenAI対応が完了（v2.1.23）
- Appでも同様の機能を実装する

## CLIでの実装方式（参考）
環境変数で各機能ごとにAzure OpenAI設定を指定:
```
IMAGE_OPENAI_API_KEY / IMAGE_OPENAI_BASE_URL  # 画像生成
TTS_OPENAI_API_KEY / TTS_OPENAI_BASE_URL      # 音声合成
LLM_OPENAI_API_KEY / LLM_OPENAI_BASE_URL      # テキスト生成
```

## App実装方針

### UI設計: Azure OpenAI専用セクションを追加
設定画面に「Azure OpenAI」カードを追加し、以下を入力可能に:
- 画像生成（IMAGE）: API Key + Base URL
- 音声合成（TTS）: API Key + Base URL
- テキスト生成（LLM）: API Key + Base URL

### なぜこの方式か
1. 通常のOpenAI設定と分離され、分かりやすい
2. 企業環境での利用を意識した設計
3. 各機能で異なるAzureリソースを使用可能

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

### Step 2: 定数の追加
**ファイル**: [src/shared/constants.ts](src/shared/constants.ts)

```typescript
// Azure OpenAI環境変数名
export const AZURE_OPENAI_ENV_KEYS = {
  IMAGE_OPENAI_API_KEY: 'IMAGE_OPENAI_API_KEY',
  IMAGE_OPENAI_BASE_URL: 'IMAGE_OPENAI_BASE_URL',
  TTS_OPENAI_API_KEY: 'TTS_OPENAI_API_KEY',
  TTS_OPENAI_BASE_URL: 'TTS_OPENAI_BASE_URL',
  LLM_OPENAI_API_KEY: 'LLM_OPENAI_API_KEY',
  LLM_OPENAI_BASE_URL: 'LLM_OPENAI_BASE_URL',
} as const;
```

### Step 3: settings_manager.ts の拡張
**ファイル**: [src/main/settings_manager.ts](src/main/settings_manager.ts)

`saveSettings`関数でAzure OpenAI設定を環境変数に展開:
```typescript
// Azure OpenAI設定を環境変数に反映
// 注: 既存のENV_KEYS処理と同じパターン（値があれば設定、なければスキップ）
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

**注意**: 既存の`ENV_KEYS`処理も削除ロジックがないため、同じパターンで実装。設定削除時の環境変数クリアは将来の改善課題とする。

### Step 4: LLM Settings に Azure OpenAI 選択肢を追加
**ファイル**: [src/shared/constants.ts](src/shared/constants.ts)
```typescript
export const llms = [
  { id: "openAIAgent", apiKey: "OPENAI_API_KEY" },
  { id: "anthropicAgent", apiKey: "ANTHROPIC_API_KEY" },
  { id: "azureOpenAIAgent", apiKey: null },  // API KeyはAzure設定セクションで設定（nullを明示）
];
```

**注意**: `apiKey: null`を明示することで、既存のバリデーションロジック（apiKeyの有無チェック）で誤動作しないようにする。llm_settings.vueでAzure選択時は専用のバリデーションパスを通す。

**ファイル**: [src/renderer/components/llm_settings.vue](src/renderer/components/llm_settings.vue)
- Azure OpenAI選択時にモデル名の手入力テキストフィールドを表示
- Base URL / API KeyはAzure OpenAI設定セクションの値を使用

### Step 5: Azure OpenAI設定UIコンポーネント作成
**新規ファイル**: `src/renderer/components/azure_openai_settings.vue`

Azure OpenAI専用の設定カード:
- 3つのサービス（IMAGE/TTS/LLM）それぞれにAPI Key + Base URL入力欄

### Step 6: MulmoScript UI に Azure OpenAI 対応追加

**ファイル**: [src/renderer/pages/project/script_editor/styles/image_params.vue](src/renderer/pages/project/script_editor/styles/image_params.vue)
- Providerドロップダウンに「Azure OpenAI」を追加
- Azure OpenAI選択時はModelを**テキスト入力**に変更（デプロイ名を手入力）
- Model未入力時は警告表示（Azureではデプロイ名必須）

**ファイル**: [src/renderer/pages/project/script_editor/styles/speech_speaker.vue](src/renderer/pages/project/script_editor/styles/speech_speaker.vue)
- Providerドロップダウンに「Azure OpenAI」を追加
- Azure OpenAI選択時はModel/Voiceを**テキスト入力**に変更
- Model未入力時は警告表示

### Step 7: 設定画面に組み込み
**ファイル**: [src/renderer/pages/settings.vue](src/renderer/pages/settings.vue)

API Keys セクションの下にAzure OpenAI設定セクションを追加

### Step 8: i18n翻訳追加
**ファイル**:
- [src/renderer/i18n/en.json](src/renderer/i18n/en.json)
- [src/renderer/i18n/ja.json](src/renderer/i18n/ja.json)

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
| `src/shared/constants.ts` | Azure用環境変数名定義、llmsにazureOpenAIAgent追加 |
| `src/main/settings_manager.ts` | Azure設定の環境変数展開 |
| `src/renderer/components/llm_settings.vue` | Azure OpenAI選択時のモデル手入力欄追加 |
| `src/renderer/components/azure_openai_settings.vue` | 新規作成 |
| `src/renderer/pages/settings.vue` | Azure設定コンポーネント組み込み |
| `src/renderer/pages/project/script_editor/styles/image_params.vue` | Azure OpenAI Provider追加、Model手入力対応 |
| `src/renderer/pages/project/script_editor/styles/speech_speaker.vue` | Azure OpenAI Provider追加、Model/Voice手入力対応 |
| `src/renderer/i18n/en.json` | 英語翻訳追加 |
| `src/renderer/i18n/ja.json` | 日本語翻訳追加 |

---

## 検証方法

1. **設定保存テスト**: Azure OpenAI設定を入力・保存し、再起動後も設定が保持されることを確認
2. **環境変数テスト**: main processで`process.env.IMAGE_OPENAI_API_KEY`等が正しく設定されることを確認
3. **E2Eテスト**: 実際にAzure OpenAIリソースを使って画像/音声/テキスト生成が動作することを確認

---

## 注意事項

### Base URLの仕様
- Base URLは `https://<リソース名>.openai.azure.com/` 形式で入力
- mulmocastライブラリがBase URLからエンドポイント（`/openai/deployments/<デプロイ名>/...`）を構築する
- `api-version`パラメータもライブラリ側で付与される
- UIのプレースホルダーに上記形式を表示し、ユーザーが誤解しないようにする

### 混在利用の優先ロジック
- 各機能（IMAGE/TTS/LLM）は**独立して**設定される
- 例: 「画像生成はAzure、LLMは通常OpenAI」という混在利用が可能
- 優先順位: `IMAGE_OPENAI_API_KEY`が設定されていれば画像生成はAzure、未設定なら`OPENAI_API_KEY`を使用
- 同様にTTS/LLMもそれぞれ独立して判定される

### その他
- `OPENAI_API_KEY`（通常のOpenAI）と`IMAGE_OPENAI_API_KEY`等（Azure）は共存可能
- MulmoScript内で`model`を明示的に指定しないとAzureでエラーになる場合がある（Azureではデプロイ名が必要）

---

## 今後の改善（別プラン）

以下は本プランの範囲外とし、別プランで対応:
- **バリデーション詳細**: Azure選択時のモデル名必須チェック、未入力時のUI挙動（警告/保存禁止）
- **環境変数削除処理**: 設定クリア時のprocess.env削除ロジック

---

## 実装時の変更点（プランとの差分）

### Chat機能のAzure OpenAI対応

プランでは `azureOpenAIAgent` を別のLLMオプションとして追加する予定だったが、**よりシンプルな方式**に変更:

#### 変更内容
1. **llms から `azureOpenAIAgent` を削除**（プランと逆）
2. **OpenAI選択時に「Use Azure OpenAI」チェックボックスを追加**
   - チェックON時: Azure OpenAI設定（API Key + Base URL）を使用
   - チェックON時: デプロイ名を手入力するフィールドを表示

#### 理由
- ユーザーはOpenAIとAzure OpenAIを切り替えて使いたい場合がある
- 別のLLMオプションとして追加すると、設定画面でLLMを切り替える必要があり面倒
- チェックボックス方式なら、同じ「OpenAI」設定内でAzureを有効/無効にできる

#### 修正ファイル
| ファイル | 変更内容 | 状態 |
|---------|---------|------|
| `src/shared/constants.ts` | `azureOpenAIAgent`をllmsから削除 | 未変更（元々なし） |
| `src/renderer/components/llm_settings.vue` | OpenAI選択時に「Use Azure」チェックボックス追加 | `v-if="false"`で非表示 |
| `src/renderer/store/global.ts` | AZURE_OPENAI設定をstoreに追加 | 済（既存） |
| `src/renderer/pages/project/chat.vue` | Azure使用時のconfig構築ロジック追加 | **restore済**（変更なし） |
| `src/renderer/pages/settings.vue` | llmConfigs保存時のシリアライズ修正 | 済 |
| `src/renderer/i18n/en.ts`, `ja.ts` | `useAzure`翻訳キー追加 | 済 |

### 未解決の問題: ブラウザでAzureOpenAIが動かない

#### 原因
`@graphai/openai_agent` (v2.0.9) のバグ:

```javascript
// Azure OpenAI の場合（150-154行）
if (url.hostname.endsWith(".openai.azure.com")) {
    return new AzureOpenAI({
        apiKey,
        endpoint: baseURL,
        apiVersion: apiVersion ?? "2025-04-01-preview",
        // ↑ dangerouslyAllowBrowser: true が無い！
    });
}

// 通常の OpenAI（161行）
return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: !!forWeb  // ← これはある
});
```

- ブラウザ環境では `AzureOpenAI` に `dangerouslyAllowBrowser: true` が必要
- それが無いので `AzureOpenAI` がエラーを投げる
- catch ブロックで捕捉され、通常の `OpenAI` クライアントにフォールバック
- 結果: 間違ったURL `https://xxx.openai.azure.com/chat/completions` → 404

#### 解決策（TODO）
- 案1. **カスタムfetchエージェント作成**: Azure OpenAI用のfetchベースエージェントを作成
- 案2. **ライブラリ修正**: `@graphai/openai_agent` にPRを送る

#### 現状の対応
**チェックボックスを一旦非表示に**（`v-if="false"`）
- `llm_settings.vue` で Azure OpenAI チェックボックスを非表示
- ライブラリ修正後に有効化予定

---

## 翻訳・画像生成・TTS の Azure 対応状況

| 機能 | 状態 | 備考 |
|-----|------|-----|
| 画像生成 (IMAGE) | ✅ 動作する | main processで実行。環境変数経由でAzure使用 |
| 音声合成 (TTS) | ✅ 動作する | main processで実行。環境変数経由でAzure使用 |
| 翻訳 (LLM) | ✅ 動作する | main processで実行。mulmocast-cliと同じ仕組み |
| Chat (LLM) | ❌ 動作しない | renderer processで実行。ブラウザ環境の問題 |

**翻訳が動く理由**: 翻訳はmain process（Node.js環境）で `mulmocast-cli` のGraphAIを使って実行される。Node.js環境では `AzureOpenAI` に `dangerouslyAllowBrowser` は不要なので、正常に動作する。

**Chatが動かない理由**: ChatはRenderer process（ブラウザ環境）で実行される。`@graphai/openai_agent` がブラウザでのAzure対応に問題がある。
