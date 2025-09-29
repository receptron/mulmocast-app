import { type AgentFunctionInfo, type AgentFunction } from "graphai";

type HelpType =
  | "quickstart" // 最短導線（DL→プロジェクト→生成→成果物）
  | "download" // ダウンロード/インストールのみ
  | "project" // ダッシュボード/新規作成
  | "script" // AIチャット/テンプレ/ビート
  | "media" // 画像/動画/スライド操作
  | "style" // 生成パラメータ（Canvas/音声/画像/動画/字幕 等）
  | "generate" // 出力設定＆生成（Movie/Podcast/PDF）
  | "viewer" // Mulmo Viewer の使い方
  | "dev" // 開発版（参考）
  | "all"; // 目次のみ

type LinkRef = { label: string; url: string };

type HelpPayload = {
  type: HelpType;
  title: string;
  summary: string;
  // UI/LLM で扱いやすいよう “節” ごとに要点を分解
  sections?: Array<{
    id: string;
    title: string;
    summary?: string;
    steps?: string[]; // 手順
    bullets?: string[]; // 箇条書きヒント
    links?: LinkRef[]; // 節ローカルの参照
  }>;
  links?: LinkRef[]; // 章末リンク
  // 目次（type=all の時のみ）
  toc?: Array<{ id: HelpType; title: string; summary: string }>;
};

// --- static links ---
const LINKS = {
  macActions: {
    label: "GitHub Actions (macOS)",
    url: "https://github.com/receptron/mulmocast-app/actions/workflows/ci-mac.yml",
  },
  winActions: {
    label: "GitHub Actions (Windows)",
    url: "https://github.com/receptron/mulmocast-app/actions/workflows/ci-ms.yml",
  },
  howToUse1: { label: "MulmoCast App 使用方法ガイド", url: "./how_to_use.md" },
  howToUse2: { label: "MulmoCast 使用方法ガイド その2", url: "./procedure_onboarding.md" },
};

// --- knowledge base (setup 章は含めない) ---
const HELP_DB: Record<HelpType, HelpPayload> = {
  quickstart: {
    type: "quickstart",
    title: "最短導入クイックスタート",
    summary: "アプリの入手 → プロジェクト作成 → 生成 → 成果物確認までを最短ルートで通すための要点のみ。",
    sections: [
      {
        id: "download",
        title: "ダウンロード＆配置",
        steps: [
          "GitHub Actions から macOS の最新成功ワークフローを開く",
          "Artifacts の `macOS-release-files` をダウンロードして ZIP を展開",
          "`MulmoCast.app` を Applications へドラッグ＆ドロップ（更新時は「置き換える」）",
          "初回起動の警告は「開く」を選択",
        ],
        links: [LINKS.macActions],
      },
      {
        id: "project",
        title: "プロジェクトを作る",
        steps: ["アプリを起動し、ダッシュボードの「新規作成」をクリック", "プロジェクトページへ移動して編集を開始"],
      },
      {
        id: "script",
        title: "スクリプトを用意する",
        steps: [
          "AIアシスタントチャットに URL を貼る（例：Apple のイベントページ）",
          "テンプレートから「入力欄へコピー」→ 必要に応じて“in 5 beats”など条件を加え送信",
          "生成完了後、タイトルと編集エリアにスクリプトが反映される",
        ],
      },
      {
        id: "generate",
        title: "生成して確認する",
        steps: [
          "出力設定で Movie / Podcast / PDF をチェック",
          "「コンテンツ生成」をクリック（右下に進捗表示）",
          "完了後、成果物エリアに各ファイルが並ぶ",
          "右上の拡大ボタンで Mulmo Viewer を開いて再生・言語切替",
        ],
      },
    ],
    links: [LINKS.howToUse1, LINKS.howToUse2],
  },

  download: {
    type: "download",
    title: "ダウンロード & インストール",
    summary: "macOS/Windows の取得と配置のみを扱います。",
    sections: [
      {
        id: "mac",
        title: "macOS",
        steps: [
          "GitHub Actions の最新成功ワークフローを開く",
          "`macOS-release-files` をダウンロードして ZIP 展開",
          "`MulmoCast.app` を Applications へ移動（更新時は「置き換える」）",
          "初回起動の警告は「開く」",
        ],
        links: [LINKS.macActions],
      },
      {
        id: "win",
        title: "Windows（参考）",
        steps: ["GitHub Actions（ci-ms）から同様の手順で取得"],
        links: [LINKS.winActions],
      },
      {
        id: "dev",
        title: "開発版（参考）",
        steps: ["git clone", "cd mulmocast-app", "yarn install", "yarn run start"],
      },
    ],
  },

  project: {
    type: "project",
    title: "ダッシュボード & 新規プロジェクト",
    summary: "ダッシュボードからプロジェクトを作成し、編集画面へ遷移します。",
    sections: [
      {
        id: "create",
        title: "新規作成",
        steps: ["ダッシュボードで「新規作成」をクリック", "プロジェクト編集画面へ移動"],
      },
    ],
  },

  script: {
    type: "script",
    title: "AIチャット & スクリプト作成",
    summary: "URL 読み込み・テンプレート活用でスクリプトを効率よく作成します。",
    sections: [
      {
        id: "ai-chat",
        title: "AIアシスタントチャット",
        steps: [
          "URL を入力して送信（例：Apple のイベントページ）",
          "テンプレートを選び「入力欄へコピー」",
          "必要に応じて“in 5 beats”などの条件を追加して送信",
        ],
        bullets: ["EXA が設定されていれば検索系の依頼も可能（例：主要 AI ニュース調査）"],
      },
    ],
    links: [LINKS.howToUse2],
  },

  media: {
    type: "media",
    title: "Media（画像/動画/スライド）",
    summary: "画像・動画の取得/生成、スライド作成の要点。",
    sections: [
      {
        id: "image-video",
        title: "画像/動画",
        bullets: [
          "画像生成：プロンプト / 参照画像 / ドラッグ＆ドロップ / URL 取得",
          "動画生成：画像からの動画化、リップシンク対応",
        ],
      },
      {
        id: "slides",
        title: "スライド（テキスト系）",
        bullets: ["Markdown / Chart.js / Mermaid / HTML（Tailwind）", "HTML プロンプトで自動生成"],
      },
      {
        id: "coming-soon",
        title: "Coming Soon",
        bullets: ["スライドテンプレート（Vision）"],
      },
    ],
  },

  style: {
    type: "style",
    title: "Style / Parameters",
    summary: "生成結果を左右する各種パラメータ群。",
    sections: [
      {
        id: "params",
        title: "主なパラメータ",
        bullets: [
          "Canvas Size",
          "Speech Parameters（話者、プロバイダ/声/言語）",
          "Image Parameters（プロバイダ/モデル）",
          "Movie Parameters（プロバイダ/モデル）",
          "Text Slide Parameters（CSS）",
          "Audio Parameters（間合い、BGM）",
          "Caption Parameters（言語）",
        ],
      },
    ],
  },

  generate: {
    type: "generate",
    title: "出力設定 & 生成",
    summary: "Movie / Podcast / PDF を生成し、進捗と結果を確認します。",
    sections: [
      {
        id: "run",
        title: "生成フロー",
        steps: [
          "出力形式（Movie / Podcast / PDF）にチェック",
          "「コンテンツ生成」をクリック",
          "右下の進捗を確認",
          "完了後、成果物エリアに一覧表示",
        ],
      },
    ],
  },

  viewer: {
    type: "viewer",
    title: "Mulmo Viewer",
    summary: "画像/動画・音声・テキストをビートごとに視聴。言語切替にも対応。",
    sections: [
      {
        id: "play",
        title: "再生と操作",
        bullets: [
          "各ビート：画像/動画、音声、テキスト",
          "サムネイル上の再生ボタンで開始",
          "視聴中でもページ送り可能",
          "右上の拡大ボタンでフルビュー",
          "テキスト/音声は英語へ切替→翻訳/音声再生成が可能",
        ],
      },
    ],
  },

  dev: {
    type: "dev",
    title: "開発版（参考）",
    summary: "アプリ化せずにソースから起動。",
    sections: [{ id: "dev-steps", title: "起動", steps: ["git clone", "yarn install", "yarn run start"] }],
  },

  all: {
    type: "all",
    title: "カテゴリ一覧",
    summary: "必要な章を type に指定して取得できます（setup は提供しません）。",
    toc: [
      { id: "quickstart", title: "最短導入クイックスタート", summary: "DL→作成→生成→確認の最短ルート" },
      { id: "download", title: "ダウンロード & インストール", summary: "入手と配置のみ" },
      { id: "project", title: "ダッシュボード & 新規作成", summary: "プロジェクトの開始" },
      { id: "script", title: "AIチャット & スクリプト作成", summary: "URL/テンプレ/ビート" },
      { id: "media", title: "Media（画像/動画/スライド）", summary: "取得・生成・スライド" },
      { id: "style", title: "Style / Parameters", summary: "生成に効く各種パラメータ" },
      { id: "generate", title: "出力設定 & 生成", summary: "Movie / Podcast / PDF" },
      { id: "viewer", title: "Mulmo Viewer", summary: "視聴＆言語切替" },
      { id: "dev", title: "開発版（参考）", summary: "ソースから起動" },
    ],
  },
};

// --- simple matcher (type or query) ---
function bestMatchType(raw?: string): HelpType {
  const fallback: HelpType = "quickstart";
  if (!raw) return fallback;
  const key = String(raw).toLowerCase();
  const legal = new Set<HelpType>([
    "quickstart",
    "download",
    "project",
    "script",
    "media",
    "style",
    "generate",
    "viewer",
    "dev",
    "all",
  ]);
  if (legal.has(key as HelpType)) return key as HelpType;

  const table: Array<[HelpType, string[]]> = [
    ["download", ["download", "install", "artifact", "actions", "mac", "windows"]],
    ["project", ["project", "dashboard", "新規作成"]],
    ["script", ["script", "chat", "template", "beats", "ai"]],
    ["media", ["media", "image", "video", "slide", "markdown", "mermaid", "chart", "html"]],
    ["style", ["style", "parameter", "canvas", "speech", "bgm", "caption"]],
    ["generate", ["generate", "movie", "podcast", "pdf", "出力"]],
    ["viewer", ["viewer", "mulmo", "視聴", "再生"]],
    ["dev", ["dev", "開発", "yarn", "start"]],
    ["all", ["all", "一覧", "目次"]],
  ];
  for (const [t, kws] of table) {
    if (kws.some((kw) => key.includes(kw))) return t;
  }
  return fallback;
}

// --- agent ---
export const mulmoCastHelpAgent: AgentFunction = async ({ params, namedInputs }) => {
  const { arg } = { ...params, ...namedInputs };
  const { type, query } = (arg ?? {}) as { type?: string; query?: string };

  const resolvedType = bestMatchType(type ?? query);
  const payload = HELP_DB[resolvedType] ?? HELP_DB.quickstart;

  return { content: JSON.stringify(payload) };
};

const mulmoCastHelpAgentInfo: AgentFunctionInfo = {
  name: "mulmoCastHelpAgent",
  agent: mulmoCastHelpAgent,
  mock: mulmoCastHelpAgent,
  samples: [
    {
      params: {},
      inputs: { arg: { type: "quickstart" } },
      result: {
        content: JSON.stringify(HELP_DB.quickstart),
      },
    },
    {
      params: {},
      inputs: { arg: { type: "all" } },
      result: {
        content: JSON.stringify(HELP_DB.all),
      },
    },
    {
      params: {},
      inputs: { arg: { type: "script" } },
      result: {
        content: JSON.stringify(HELP_DB.script),
      },
    },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "mulmoCastHelpAgent--help",
        description: "mulmocastHelp",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description:
                "ヘルプカテゴリ。quickstart | download | project | script | media | style | generate | viewer | dev | all",
            },
          },
          required: ["type"],
        },
      },
    },
  ],
  description: "MulmoCast Help Agent (LLM 後段加工向け JSON 出力)",
  repository: "",
  category: ["net"],
  author: "Receptron team",
  license: "MIT",
};

export default mulmoCastHelpAgentInfo;
