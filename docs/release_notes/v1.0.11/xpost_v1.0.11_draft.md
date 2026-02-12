# X Thread Draft for v1.0.11

## メタ情報

- **作成者**: @mulmocast (MulmoCast)
- **スレッド件数**: 6 件（予定）

## メインポスト

📢 MulmoCast v1.0.11 released!

Azure OpenAI Service Support
- Use Azure OpenAI for image generation, TTS & translation. Set API Key & Base URL per service.
- Azure OpenAI経由での画像生成・音声合成・翻訳に対応。サービスごとにAPI Key・Base URLを設定可能。

### 添付メディア

![Settings - Azure OpenAI](images/settings_azure_openai.png)

---

## 連投ポスト

### 1. ポスト

Vertex AI Support
- Google Cloud Vertex AI for Imagen (image) & Veo (video). Default Project ID & Location in Settings, override per project or beat.
- Vertex AIのImagen（画像）・Veo（動画）に対応。設定画面でデフォルト値を指定し、プロジェクト・ビート単位で上書き可能。

#### 添付メディア

![Settings - Vertex AI](images/settings_vertex_ai.png)

![Style - Image Params Vertex AI toggle](images/style_image_params_vertexai.png)

---

### 2. ポスト

📝 See setup guide for Azure OpenAI & Vertex AI details above.
- Note: Vertex AI runs on your gcloud-authenticated machine.
- 上記のセットアップ詳細はこちら。Vertex AIはgcloud ADC認証済みの端末で動作します。

en: https://zenn.dev/singularity/articles/zenn_azure_vertexai_en
ja: https://zenn.dev/singularity/articles/zenn_azure_vertexai

---

### 3. ポスト

Caption Split
- Previously 1 caption per beat. Now auto-split at punctuation (。.！!？? etc.) for multi-line display.
- これまで1ビート1字幕でしたが、句読点・記号で自動分割して複数行表示が可能に。

#### 添付メディア

![Style - Caption Split](images/style_caption_split.png)

---

### 4. ポスト

⚠️ Nijivoice Removed
- Nijivoice TTS removed (service ended Feb 4, 2026). Available: OpenAI, ElevenLabs, Gemini, Google, Kotodama.
- にじボイスのサービス終了（2026/2/4）に伴い削除。利用可能なTTS: OpenAI、ElevenLabs、Gemini、Google、Kotodama。

---

### 5. ポスト
- Other minor improvements
- その他、軽微な修正

※Update notifications appear in the app. Download from the official website.
※起動中のアプリに更新通知が届きます。ダウンロードは公式サイトから。

#MulmoCast #AIvideo #AI動画
