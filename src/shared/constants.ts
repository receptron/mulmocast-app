import { type MulmoImageParams, provider2LLMAgent } from "mulmocast/browser";
import { bgmAssets } from "mulmocast/data";
export { pdf_modes, languages } from "mulmocast/browser";

// Define all valid feature keys as a readonly tuple
export const FEATURE_KEYS = [
  "llmChat",
  "llmTranslation",
  "tts",
  "tts-jp",
  "imageGeneration",
  "videoGeneration",
  "webSearch",
  "soundEffects",
  "lipSync",
] as const;

// Create a union type from the tuple for type safety
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const ENV_KEYS = {
  OPENAI_API_KEY: {
    title: "OpenAI API Key",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
    features: ["llmChat", "llmTranslation", "tts", "imageGeneration"] as FeatureKey[],
  },
  REPLICATE_API_TOKEN: {
    title: "Replicate API Token",
    placeholder: "r8_...",
    url: "https://replicate.com/account/api-tokens",
    features: ["videoGeneration", "soundEffects", "lipSync"] as FeatureKey[],
  },
  GEMINI_API_KEY: {
    title: "Gemini API Key",
    placeholder: "AI...",
    url: "https://aistudio.google.com/app/apikey",
    features: ["llmChat", "imageGeneration", "videoGeneration"] as FeatureKey[],
  },
  NIJIVOICE_API_KEY: {
    title: "NijiVoice API Key",
    placeholder: "nv_...",
    url: "https://platform.nijivoice.com/api-keys",
    features: ["tts-jp"] as FeatureKey[],
  },
  ELEVENLABS_API_KEY: {
    title: "ElevenLabs API Key",
    placeholder: "el_...",
    url: "https://elevenlabs.io/app/settings/api-keys",
    features: ["tts"] as FeatureKey[],
  },
  KOTODAMA_API_KEY: {
    title: "Kotodama API Key",
    placeholder: "kt_...",
    url: "https://kotodama.go-spiral.ai/",
    features: ["tts"] as FeatureKey[],
  },
  ANTHROPIC_API_KEY: {
    title: "Anthropic API Key",
    placeholder: "sk-...",
    url: "https://console.anthropic.com/settings/keys",
    features: ["llmChat"] as FeatureKey[],
  },
  GROQ_API_KEY: {
    title: "GROQ API Key",
    placeholder: "gsk-...",
    url: "https://console.groq.com/keys",
    features: ["llmChat"] as FeatureKey[],
  },
  TAVILY_API_KEY: {
    title: "Tavily API Key",
    placeholder: "tvly-...",
    url: "https://app.tavily.com/home",
    features: ["webSearch"] as FeatureKey[],
  },
  EXA_API_KEY: {
    title: "EXA API Key",
    placeholder: "xxx...",
    url: "https://dashboard.exa.ai/api-keys",
    features: ["webSearch"] as FeatureKey[],
  },
} as const;

export type EnvKey = keyof typeof ENV_KEYS;

export const llms = [
  {
    id: "openAIAgent",
    apiKey: "OPENAI_API_KEY",
  },
  {
    id: "anthropicAgent",
    apiKey: "ANTHROPIC_API_KEY",
  },
  /*
  {
    id: "ollamaAgent",
  },
  {
    id: "geminiAgent",
    apiKey: "GEMINI_API_KEY",
  },
  {
    id: "groqAgent",
    apiKey: "GROQ_API_KEY",
   },
   */
];

export const LLM_DEFAULT_AGENT = "openAIAgent";
export const LLM_OLLAMA_DEFAULT_CONFIG = {
  url: "http://localhost:11434/v1",
  model: "gpt-oss:20b",
};
export const LLM_OPENAI_DEFAULT_CONFIG = {
  model: provider2LLMAgent.openai.defaultModel,
};
export const LLM_ANTHROPIC_DEFAULT_CONFIG = {
  model: provider2LLMAgent.anthropic.defaultModel,
};
export const LLM_GEMINI_DEFAULT_CONFIG = {
  model: provider2LLMAgent.gemini.defaultModel,
};
export const LLM_GROQ_DEFAULT_MODEL = provider2LLMAgent.groq.defaultModel;

export const LLM_GROQ_DEFAULT_CONFIG = {
  model: provider2LLMAgent.groq.defaultModel,
};

export type AppSettingKey = "APP_LANGUAGE" | "VIEW_MODE" | "SORT_BY" | "SORT_ORDER" | "DARK_MODE";

export const VOICE_LISTS = {
  openai: [
    { id: "shimmer", description: "Bright, light, and youthful tone" },
    { id: "alloy", description: "Calm mid-low register, persuasive tone" },
    { id: "ash", description: "Deep, mature, slightly rough tone" },
    { id: "ballad", description: "Gentle, soothing voice suited for narration" },
    { id: "coral", description: "Soft and friendly voice quality" },
    { id: "echo", description: "Clear, neutral, and easy to understand" },
    { id: "fable", description: "Expressive, great for storytelling" },
    { id: "nova", description: "Energetic, modern, and crisp tone" },
    { id: "onyx", description: "Strong, deep, and powerful voice" },
    { id: "sage", description: "Calm, thoughtful, and intellectual tone" },
  ],
  google: [
    { id: "ja-JP-Standard-A" },
    { id: "ja-JP-Standard-B" },
    { id: "ja-JP-Standard-C" },
    { id: "ja-JP-Standard-D" },
    { id: "en-US-Standard-A" },
    { id: "en-US-Standard-B" },
    { id: "en-US-Standard-C" },
    { id: "en-US-Standard-D" },
    { id: "en-US-Standard-E" },
  ],
  gemini: [
    { id: "Zephyr" },
    { id: "Puck" },
    { id: "Charon" },
    { id: "Kore" },
    { id: "Fenrir" },
    { id: "Leda" },
    { id: "Orus" },
    { id: "Aoede" },
    { id: "Callirrhoe" },
    { id: "Autonoe" },
    { id: "Enceladus" },
    { id: "Iapetus" },
    { id: "Umbriel" },
    { id: "Algieba" },
    { id: "Despina" },
    { id: "Erinome" },
    { id: "Algenib" },
    { id: "Rasalgethi" },
    { id: "Laomedeia" },
    { id: "Achernar" },
    { id: "Alnilam" },
    { id: "Schedar" },
    { id: "Gacrux" },
    { id: "Pulcherrima" },
    { id: "Achird" },
    { id: "Zubenelgenubi" },
    { id: "Vindemiatrix" },
    { id: "Sadachbia" },
    { id: "Sadaltager" },
    { id: "Sulafat" },
  ],
  // TODO: remove name attribute because it move to i18n files
  nijivoice: [
    { key: "hanamura_honoka", id: "231e0170-0ece-4155-be44-231423062f41", name: "花村ほのか" },
    //  { key: "shitsuya_ren", id: "04c7f4e0-41d8-4d02-9cbe-bf79e635f5ab" },
    { key: "fuyutsuki_hatsune", id: "d158278c-c4fa-461a-b271-468146ad51c9", name: "冬月 初音" },
    // { key: "kokemura_marimo", id: "2f982b65-dbc3-4ed6-b355-b0f7c0abaa70", name: "苔村 まりも" },
    /*
    {
    key: "haruto_aiden_greenwood",
    id: "29cdf589-e581-4ab0-8467-0cd0c7ba640f",
    name: "陽斗・エイデン・グリーンウッド",
    }
  */
    { key: "nomoto_aiichiro", id: "6eafd860-d757-4469-80d5-3fee8375792d", name: "野本 藍一郎" },
    { key: "pono", id: "16e979a8-cd0f-49d4-a4c4-7a25aa42e184", name: "ぽの" },
    { key: "lapis", id: "47abf5ad-5336-4ace-9254-c145590a9576", name: "ラピス" },
    // { key: "asanagi_shizuku", id: "8bd8bcd2-9154-4ada-9c00-69e73e73b799", name: "朝凪 しずく" },
    // { key: "ibushi_akio", id: "3ea8f818-dc85-4bc5-9054-ca410f7465b6", name: "燻 秋雄" },
    /*
  {
      key: "julius_von_esterheim",
      id: "11125c91-0b98-411f-bdda-5f0ebf7c104c",
      name: "ユリウス・フォン・エステルハイム",
      },
  */
    { key: "moriya_kohane", id: "f385b5ad-d121-41d4-9145-7fc1d2cf3ab9", name: "守谷 こはね" },
    // { key: "wakakusa_hikari", id: "ae42d8b0-0c4b-4289-95b7-cf988569af36", name: "若草 ひかり" },
    { key: "homura_retsu", id: "04bcaeaf-ec57-4a1c-b938-042cdc7e05cb", name: "焔 烈" },
    { key: "kagaya_shinmaru", id: "bd7942cf-d7ec-43e6-b20b-abd765934842", name: "加賀谷 忍丸" },
    // { key: "takatsuki_riko", id: "8c08fd5b-b3eb-4294-b102-a1da00f09c72", name: "高槻 リコ" },
    { key: "shinkai_yura", id: "90031163-c497-44f3-a8a6-e45e4d0cb8f6", name: "深海 結涼" },
    {
      key: "tierion_valdier_graceford",
      id: "9752f60e-5fbb-48f6-a5ab-2b7c8b9aeede",
      name: "ティエリオン・ヴァルディエル・グレイスフォード",
    },
    { key: "gladiol_cromvain", id: "6b0a434e-31d6-46a6-ac20-a7cf4cc6dc1a", name: "グラディオール＝クロムヴェイン" },
    { key: "kurama_katsuo", id: "a5489404-aef2-4d42-87c0-beb427f402b7", name: "鞍馬 勝男" },
    // { key: "tsukishiro_miran", id: "cd6cc3fe-3f4c-49e3-b413-3766f13b3a4a", name: "月城 美蘭" },
    { key: "lucherica_lunamorte", id: "fde7396d-2f3d-4d69-bf50-3c725ea8c29d", name: "ルシェリカ・ルナモルテ" },
    { key: "yuno_ashe", id: "94f13ea3-e9f7-47ce-a9c3-244a3a1317bf", name: "ユノ・アーシェ" },
    { key: "ilmil", id: "c853dd84-6fb1-41bd-b82e-303d5f35fe38", name: "イルミル" },
    // { key: "souma_jin", id: "889afcb4-7443-475b-ac37-10fdfd97ee76", name: "蒼真 迅" },
    { key: "shinozaki_yuya", id: "b6d08e70-dbbb-48cc-b808-d4b3fad1eea8", name: "篠崎 優也" },
    // { key: "noela", id: "253ee5ac-b9e5-4186-8102-2845b14cded7", name: "ノエラ" },
    { key: "tenjinyashiki_kohaku", id: "c38b507b-b715-49a0-b8e3-59b0e14d8190", name: "天神屋敷 琥珀" },
    { key: "tokinomiya_tamaki", id: "95e4b512-9a69-4eca-a609-3e9bea31b832", name: "鴇ノ宮 環" },
    { key: "victor_d_ashford", id: "4407962b-8901-447a-8e0e-7896a0d230c0", name: "ヴィクター・D・アシュフォード" },
    { key: "li_haotian", id: "f35cb410-d2e8-40ad-8bce-9235951528ed", name: "李 昊天" },
    { key: "ranka", id: "249d8d02-2c25-4a24-8faf-26d6f734b7bc", name: "蘭華" },
    { key: "otori_kanna", id: "121f6a1a-3b8d-49ef-a6ef-9d437f5a5d0b", name: "鳳 環那" },
    { key: "amasaki_riruna", id: "cf645721-00c2-4223-ae5d-5e628dabeccc", name: "天咲 りるな" },
    { key: "tart", id: "ac6b27b6-88aa-4621-9ed5-11031f638dcb", name: "タルト" },
    { key: "shirokuma_aisuzu", id: "b411e6f4-7d54-4d3d-acdc-94ac61f209cf", name: "白熊 愛鈴" },
    { key: "hinata_cocoa", id: "81953d1b-b0c8-4755-8d34-20167bc467df", name: "日向 ここあ" },
    { key: "charlotte", id: "a63942a5-f4c1-4df3-a410-e039a3f4cabe", name: "シャルロッテ" },
    // { key: "momose_hinata", id: "e82ae612-bf6d-48f6-bfb8-5c65ccc5ce64", name: "桃瀬 ひなた" },
    // { key: "awashima_sumi", id: "a372b486-ccfc-406a-9394-d6d79cb4a36d", name: "淡島 澄" },
    { key: "morino_sota", id: "a7619e48-bf6a-4f9f-843f-40485651257f", name: "森野 颯太" },
    { key: "valgan", id: "2e0d97f0-de7e-4aaf-bb0d-8c09f793a144", name: "ヴァルガン" },
    // { key: "irene_de_almeria", id: "3018b3a9-0704-4c5c-af1a-c2c71790c279", name: "イレーネ・ド・アルメリア" },
    { key: "fuchi", id: "5c3c5b2b-ddfb-466b-963a-a88f61638d6f", name: "淵" },
    { key: "fukage", id: "b6142f17-1e4b-4fa3-9975-61c2ae186e46", name: "深景" },
    { key: "marpin_tinker", id: "dc92cd01-d116-4aae-b1d5-be581588ddcc", name: "マーピン・ティンカー" },
    { key: "hisasaki_yujin", id: "3eb139c4-bb33-4b59-9f9c-ba2b0280e7b1", name: "久咲 悠仁" },
    { key: "watanuki_sora", id: "7ced867c-c697-43d3-88db-1f8a2cf98f94", name: "綿貫 蒼空" },
    { key: "hakuten", id: "abefb6a1-3bdf-4758-b22b-20f629a309fe", name: "白天" },
    { key: "shigino_kano", id: "e237e362-2e27-4338-bd77-d2d0b24fda57", name: "鴫野 叶" },
    // { key: "ilya_current", id: "0d8e33fe-ae02-4d48-9f35-1a5c9ae6336b", name: "イリヤ・カレント" },
    { key: "nekota_yuma", id: "a4e72499-bcbf-402c-8a17-3ff64de1429f", name: "猫田 夕眞" },
    { key: "vivian", id: "9d9ed276-49ee-443a-bc19-26e6136d05f0", name: "ヴィヴィアン" },
    { key: "mizuki_mio", id: "abe3c525-3dd7-41d3-a9cf-750e0a5e0a76", name: "水樹 澪" },
    // { key: "rafael_grimoire", id: "d85208d1-aab3-4bbd-b6fa-004409526413", name: "ラファエル・グリモワール" },
    { key: "haruno_sota", id: "0a1f77b7-db87-4c35-9e31-5c6155097124", name: "春野 奏汰" },
    // { key: "kagari", id: "21a98868-151c-4c99-9a2a-cd2aeab30252", name: "篝" },
    // { key: "tsukiyomi_towa", id: "f9d08478-0ac7-4813-8e06-d68b7114a895", name: "月詠 トワ" },
    { key: "karasu_tokiko", id: "76eddd2d-1dae-498a-9908-3de1e3918807", name: "鴉羽 朱鷺子" },
    // { key: "morimiya_chino", id: "39c0637b-c365-409f-8e46-2d39c645062c", name: "森宮 千乃" },
    { key: "nitta_chihiro", id: "f069bc82-6efd-4cad-b7d1-9d520fc224c2", name: "新田 千紘" },
    { key: "laramei_milfi", id: "c2ecec45-c652-41cf-ab71-443a70004fc6", name: "ララメイ・ミルフィ" },
    { key: "kasuga_himari", id: "29769284-3fc5-40a6-963a-17e111784d6d", name: "春日 ひまり" },
    { key: "lucia_nightsbell", id: "60c3040b-5474-4fcc-8c06-d84a971829d4", name: "リュシア・ナイツベル" },
    { key: "shinonoi_shino", id: "80e83744-81c0-4d03-8716-84cf59b7c244", name: "篠ノ井 志乃" },
    { key: "silfena", id: "0ae77716-e2cd-4ddd-a64d-922fdfda904b", name: "シルフェナ" },
    // { key: "tachibana_shiho", id: "b8b54a8b-9c4d-4d01-8d6e-5194ba1c2dd3", name: "橘 志穂" },
    // { key: "mimi", id: "8fc501bd-9bb1-4207-bd52-033e99a7febb", name: "ミミ" },
    { key: "ben_carter", id: "bc06c63f-fef6-43b6-92f7-67f919bd5dae", name: "ベン・カーター" },
    { key: "eriol", id: "a5763e10-31fb-462b-8e8f-1ca1d073eed8", name: "エリオル" },
    { key: "miura_hayato", id: "65721129-028e-4fcc-8b9d-9974f670fe94", name: "三浦 隼人" },
    { key: "konomiya_seiga", id: "b2186c11-671a-4b78-b5ff-990cf46ea62a", name: "鴻ノ宮 清雅" },
    { key: "betty_kasan", id: "7d19a2d2-84d3-495a-98fa-cdf8030c99a1", name: "ベティ母さん" },
    { key: "ruchika", id: "1b95f92f-ca4a-449c-b7a2-bb6b5847c505", name: "ルチカ" },
    { key: "solsha_thorn", id: "a1fea7f7-34bc-4d1b-a869-10d81ce08762", name: "ソルシャ・ソーン" },
    { key: "yuki_rio", id: "623b9621-fc3d-47b6-a6b2-d9dcc60cf802", name: "結城 理央" },
    { key: "janaff", id: "c682c49d-e70f-4103-b36b-bff62a2f4c5e", name: "ジャナーフ" },
    // { key: "kirishima_ritsu", id: "24c33ff0-f4ea-475b-8137-3f95baf69e5e", name: "霧島 律" },
    { key: "arima_shinichiro", id: "311a59fa-01b2-4d2e-9968-10d2034f8f86", name: "有馬 慎一郎" },
    // { key: "pyonpyon", id: "a192db5f-bd8b-4fc7-bc08-af5ca5957c12", name: "跳々" },
    { key: "anastasia", id: "d8530fea-2f91-4b61-888d-d4a83c4cce25", name: "アナスタシア" },
    // { key: "hosenji_miria", id: "ce57ae24-1eab-44f0-aadb-2359104a8300", name: "宝泉寺 ミリア" },
    { key: "kaine_midori", id: "6f6ffec9-76dc-4ac5-93bb-1c8190c16afd", name: "海音 翠" },
    { key: "kuon_toru", id: "8ae6b193-e178-48ba-96b3-bd4cdd47e209", name: "久遠 透" },
    // { key: "hekikai_nagi", id: "ad07859e-8048-40ae-8ee3-95733f4265ed", name: "碧海 凪" },
    { key: "cedric_e_whitmore", id: "c9482acf-a907-4211-a37c-198b72184218", name: "セドリック・E・ウィットモア" },
    // { key: "takamiya_ryoka", id: "294eeefe-f46c-45a6-9e5a-e6a3b3d6eb6e", name: "高宮 涼香" },
    { key: "kaneshiro_natsumi", id: "5c7f729f-5814-436f-9e81-95aa837f9737", name: "金城 夏海" },
    { key: "ichinose_hinako", id: "03140129-afdb-45db-98dd-1ca5183efc58", name: "一之瀬 ひなこ" },
    // { key: "shogetsuin_teruomi", id: "dd8aac22-37c2-4a2c-9efb-7fc57c0c8f57", name: "照月院 輝臣" },
    // { key: "rintou", id: "8e76c497-9d70-495a-a3b4-0d63c93048a7", name: "燐灯" },
    { key: "lily_alto", id: "65d2f320-107b-4125-9d04-07b020ead331", name: "リリィ・アルト" },
    { key: "mirea", id: "453db77d-66f6-4a12-aac1-227363593e12", name: "ミレア" },
    { key: "kannagi_hitomi", id: "47be8fda-8759-45c0-b8ff-c53241357eef", name: "神薙 瞳" },
    { key: "fukasawa_misaki", id: "44339aa4-1bbc-4242-acd2-d8912866192f", name: "深沢 美咲" },
    { key: "shiina_yui", id: "99092fb8-d5b2-4fcf-a948-a5e456a71412", name: "椎名 結衣" },
    // { key: "schnee_leoparda", id: "69e52eba-f67d-46ee-b9b6-4ffebe1662a5", name: "シュネー・レオパーダ" },
    { key: "shindo_keisuke", id: "48f0a19c-660c-42a8-906b-e466caafe305", name: "新堂 慶介" },
    { key: "oliver_james", id: "172d67c6-fe5b-425e-880a-7ab0f503ce0a", name: "オリバー・ジェームズ" },
    { key: "santa_claus", id: "2773f3eb-2d5e-452b-b626-59d0869c53ec", name: "サンタクロース" },
    // { key: "sebas", id: "6df9295a-1560-4c58-85db-6f2d73c82540", name: "セバス" },
    { key: "bourbon", id: "1093a7ed-b310-49c2-a0d8-8e1e7946a600", name: "ボルボン" },
    { key: "fujisaki_naoto", id: "79012095-2c95-468b-929f-45bd188f3cc7", name: "藤崎 直人" },
    { key: "shiranami_waka", id: "3d542745-c402-4481-ad3a-e735c3bd93a7", name: "白波瀬 和香" },
    { key: "ayase_toka", id: "5f246a2d-1032-4b48-8a89-bcfc76d3777f", name: "綾瀬 透花" },
    { key: "kiryu_tomonari", id: "84d03c84-3565-4a10-b178-f540c5bc53f5", name: "桐生 智成" },
    { key: "toma", id: "5f1e8106-5e5a-422f-b269-9f2e53c18146", name: "灯真" },
    { key: "nappo", id: "9567a705-2cec-42c6-9019-9c94372e3b49", name: "ナッポ" },
    { key: "tiny", id: "a89a0edc-bb47-4e47-bac0-07ea2048e360", name: "ティニー" },
    { key: "todo_akane", id: "ac20b49e-692f-4d87-a997-533da07131a0", name: "藤堂 朱音" },
    { key: "hanamori_mirai", id: "cd18d367-4fd9-4437-b4fd-860e6e2024f6", name: "花森 未来" },
    { key: "lynette_hamilton", id: "a0069d19-f079-4d2e-a3af-419c6e599dd3", name: "リネット・ハミルトン" },
    // { key: "tsukishima_chiharu", id: "8fa54f94-536f-400b-8e24-e1536d6ada95", name: "月島 千遥" },
    { key: "kuze_rin", id: "ce87e7b3-506e-4871-a900-7aa9408a660f", name: "久世 凛" },
    { key: "sayo", id: "500c9291-c56f-421c-ab8f-af8945f35cd8", name: "小夜" },
    // { key: "chigusa_tomoka", id: "3708ad43-cace-486c-a4ca-8fe41186e20c", name: "千草 朋香" },
    { key: "seirei", id: "332bb48d-4883-45f6-9681-4be1709538e8", name: "青玲" },
    { key: "kisaragi_kaname", id: "e6d9f195-8ff1-43e0-84e9-6e6a6de874fb", name: "如月 要" },
    { key: "haoran", id: "29313305-0ef4-45ed-8784-0d7a617870ac", name: "ハオラン" },
    { key: "erika_waldheim", id: "c05bf02d-bed2-4335-aa69-0798e9e85205", name: "エリカ・ヴァルトハイム" },
    { key: "kosaka_mari", id: "3c6b9ee2-f46b-4e89-b6e3-e5c560894cb5", name: "高坂 茉莉" },
    { key: "azumi_rosetta_noibara", id: "1aa6d2f4-0e92-4043-a671-b39d8a681087", name: "あずみ・ロゼッタ・野茨" },
    { key: "ichiha_tsubaki", id: "1e4aac0e-26be-455d-b737-12013242dc2d", name: "一葉 ツバキ" },
    // { key: "shiba_soma", id: "eb1919e0-43f3-4acf-afaf-7c35f410855f", name: "柴 颯真" },
  ],
  elevenlabs: [
    { id: "3JDquces8E8bkmvbh6Bc", key: "otan" },
    { id: "c6SfcYrb2t09NHXiT80T", key: "janathan" },
    { id: "Mv8AjrYZCBkdsmDHNwcB", key: "ishibashi" },
    { id: "8EkOjt4xTPGMclNlh1pk", key: "morioki" },
    { id: "j210dv0vWm7fCknyQpbA", key: "hinata" },
    { id: "QEj0heL4nQHjaGrihlr0", key: "steven_casteel" },
    { id: "l39JidvAMB3s85XyNSRd", key: "sayuri" },
  ],
  kotodama: [
    { id: "Atla", key: "atla" },
    { id: "Poporo", key: "poporo" },
    { id: "jikkyo_baby", key: "jikkyo_baby" },
    { id: "Chunta", key: "chunta" },
    { id: "Mikko", key: "mikko" },
    { id: "Shion", key: "shion" },
    { id: "President", key: "president" },
    { id: "Kodama", key: "kodama" },
    { id: "Kyusuke", key: "kyusuke" },
    { id: "Kamiyama", key: "kamiyama" },
    { id: "Cammy", key: "cammy" },
    { id: "Marlo", key: "marlo" },
    { id: "Kitahara", key: "kitahara" },
    { id: "Ishigaki", key: "ishigaki" },
    { id: "Suginaka", key: "suginaka" },
  ],
} as const;

export const DECORATION_LISTS = {
  kotodama: [
    { id: "angry", key: "angry" },
    { id: "angry_en", key: "angry_en" },
    { id: "confused", key: "confused" },
    { id: "confused_en", key: "confused_en" },
    { id: "crying", key: "crying" },
    { id: "crying_en", key: "crying_en" },
    { id: "disgusted", key: "disgusted" },
    { id: "disgusted_en", key: "disgusted_en" },
    { id: "friendly", key: "friendly" },
    { id: "friendly_en", key: "friendly_en" },
    { id: "happy", key: "happy" },
    { id: "happy_en", key: "happy_en" },
    { id: "interested", key: "interested" },
    { id: "interested_en", key: "interested_en" },
    { id: "laughing", key: "laughing" },
    { id: "laughing_en", key: "laughing_en" },
    { id: "neutral", key: "neutral" },
    { id: "neutral_en", key: "neutral_en" },
    { id: "sad", key: "sad" },
    { id: "sad_en", key: "sad_en" },
    { id: "scared", key: "scared" },
    { id: "scared_en", key: "scared_en" },
    { id: "surprised", key: "surprised" },
    { id: "surprised_en", key: "surprised_en" },
    { id: "laughing_speech", key: "laughing_speech" },
    { id: "laughing_speech_en", key: "laughing_speech_en" },
    { id: "crying_speech", key: "crying_speech" },
    { id: "crying_speech_en", key: "crying_speech_en" },
    { id: "very_happy", key: "very_happy" },
    { id: "very_happy_en", key: "very_happy_en" },
  ],
} as const;

export const SCRIPT_EDITOR_TABS = {
  TEXT: "text",
  YAML: "yaml",
  JSON: "json",
  MEDIA: "media",
  STYLE: "style",
  REFERENCE: "reference",
} as const;

export type ScriptEditorTab = (typeof SCRIPT_EDITOR_TABS)[keyof typeof SCRIPT_EDITOR_TABS];

export const MULMO_VIEWER_TABS = {
  MOVIE: "movie",
  PDF: "pdf",
  PODCAST: "podcast",
  SLIDE: "slide",
} as const;

export type MulmoViewerTab = (typeof MULMO_VIEWER_TABS)[keyof typeof MULMO_VIEWER_TABS];

export const LANGUAGE_IDS = [
  "en",
  "es",
  "de",
  "ru",
  "fr",
  "ja",
  "pt",
  "tr",
  "it",
  "fa",
  "nl",
  "pl",
  "zh",
  "vi",
  "id",
  "cs",
  "ko",
  "ar",
  "uk",
  "el",
] as const;

export const LANGUAGES = [...LANGUAGE_IDS.map((key) => ({ id: key }))] as const;

export const I18N_SUPPORTED_LANGUAGES = [{ id: "en" }, { id: "ja" }] as const;

export const defaultSpeechProvider = "openai";
export const SPEECH_LANGUAGES = [{ id: "en" }, { id: "ja" }] as const;
export const SPEECH_DEFAULT_LANGUAGE = "en";

export const SORT_BY = {
  updatedAt: "updatedAt",
  title: "title",
} as const;

export const SORT_ORDER = {
  desc: "desc",
  asc: "asc",
} as const;

export const VIEW_MODE = {
  list: "list",
  grid: "grid",
} as const;

export const INITIAL_DESCRIPTION = "mulmocast";

export const IMAGE_PARAMS_DEFAULT_VALUES: MulmoImageParams = {
  provider: "openai",
  model: undefined,
  style: undefined,
  moderation: undefined,
};

// Image model display name mappings for i18n
export const IMAGE_MODEL_DISPLAY_KEYS: Record<string, string> = {
  "gemini-3-pro-image-preview": "nanoBananaPro",
  "gemini-2.5-flash-image": "nanoBanana",
};

export const AUDIO_PARAMS_DEFAULT_VALUES = {
  padding: 0.3,
  introPadding: 1.0,
  closingPadding: 0.8,
  outroPadding: 1.0,
  bgmVolume: 0.2,
  audioVolume: 1.0,
  bgm: {
    kind: "url",
    url: bgmAssets.bgms[1].url, // Default BGM configured in mulmocast-cli. https://github.com/receptron/mulmocast-cli/blob/main/src/utils/file.ts
  },
} as const;

export const SILENT_BGM = {
  kind: "url",
  url: "https://github.com/receptron/mulmocast-media/raw/refs/heads/main/bgms/silent001.mp3",
} as const;

export const PRESET_CANVAS_SIZE_DEFAULT_VALUE = "1024x1024";
export const PRESET_CANVAS_SIZE = {
  "1792x1024": { width: 1792, height: 1024 },
  "1024x1792": { width: 1024, height: 1792 },
  "1024x1024": { width: 1024, height: 1024 },
  "1536x1024": { width: 1536, height: 1024 },
  "1024x1536": { width: 1024, height: 1536 },
} as const;

export const userLevels = [
  {
    id: "beginner",
    mode: 1,
  },
  {
    id: "semiPro",
    mode: 50,
  },
  {
    id: "pro",
    mode: 100,
  },
];

// Media file extensions for file dialogs and validation
export const MEDIA_FILE_EXTENSIONS = {
  image: ["jpg", "jpeg", "png"] as const,
  video: ["mp4", "mov", "webm"] as const,
  audio: ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"] as const,
};

export type ImageExtension = (typeof MEDIA_FILE_EXTENSIONS.image)[number];
export type VideoExtension = (typeof MEDIA_FILE_EXTENSIONS.video)[number];
export type AudioExtension = (typeof MEDIA_FILE_EXTENSIONS.audio)[number];
export type MediaExtension = ImageExtension | VideoExtension | AudioExtension;

// MIME type mappings for file extensions
export const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export const MOVIE_MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
} as const;

export const AUDIO_MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  webm: "audio/webm",
} as const;

export const MIME_TYPES = {
  ...IMAGE_MIME_TYPES,
  ...MOVIE_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
} as const;

export const IMAGE_MIME = [...new Set(Object.values(IMAGE_MIME_TYPES))];
export const MOVIE_MIME = [...new Set(Object.values(MOVIE_MIME_TYPES))];
export const AUDIO_MIME = [...new Set(Object.values(AUDIO_MIME_TYPES))];

export const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/flac": ".flac",
  "audio/webm": ".webm",
};

// Default transition duration in seconds
export const DEFAULT_TRANSITION_DURATION = 0.3;

// Transition types for movie transitions
export const TRANSITION_TYPES: ReadonlyArray<{
  value: string;
  label: string;
  group: "slide" | "wipe" | null;
}> = [
  { value: "__undefined__", label: "typeNone", group: null },
  { value: "fade", label: "typeFade", group: null },
  // Slide Transitions
  { value: "slideout_left", label: "typeSlideoutLeft", group: "slide" },
  { value: "slideout_right", label: "typeSlideoutRight", group: "slide" },
  { value: "slideout_up", label: "typeSlideoutUp", group: "slide" },
  { value: "slideout_down", label: "typeSlideoutDown", group: "slide" },
  { value: "slidein_left", label: "typeSlideinLeft", group: "slide" },
  { value: "slidein_right", label: "typeSlideinRight", group: "slide" },
  { value: "slidein_up", label: "typeSlideinUp", group: "slide" },
  { value: "slidein_down", label: "typeSlideinDown", group: "slide" },
  // Wipe Transitions
  { value: "wipeleft", label: "typeWipeleft", group: "wipe" },
  { value: "wiperight", label: "typeWiperight", group: "wipe" },
  { value: "wipeup", label: "typeWipeup", group: "wipe" },
  { value: "wipedown", label: "typeWipedown", group: "wipe" },
  { value: "wipetl", label: "typeWipetl", group: "wipe" },
  { value: "wipetr", label: "typeWipetr", group: "wipe" },
  { value: "wipebl", label: "typeWipebl", group: "wipe" },
  { value: "wipebr", label: "typeWipebr", group: "wipe" },
];
