import { AgentFunction, AgentFunctionInfo, GraphAILogger } from "graphai";
import puppeteer from "puppeteer";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

type Article = {
  url: string;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  length: number | null;
  textContent: string | null;
};

const NAV_TIMEOUT = 45_000;

const normalize = (s: string) =>
  s
    .replace(/\r\n/g, "\n")
    .replace(/[\n\t]{2,}/g, "\n")
    .trim();

const waitStable = async (page: puppeteer.Page, ms = 1200, step = 200) => {
  let last = -1;
  let stable = 0;
  while (stable < ms) {
    const len = await page.evaluate(() => document.body?.innerText?.length || 0);
    stable = len === last ? stable + step : 0;
    last = len;
    await new Promise((r) => setTimeout(r, step));
  }
};

const fetchArticle = async (url: string): Promise<Article> => {
  // 修正: executablePathを追加してバンドルされたChromiumを使用
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined  // 追加
  });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1366, height: 900 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: NAV_TIMEOUT });
    await waitStable(page);

    const html = await page.content();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    const ret: Article = {
      url,
      title: article?.title || null,
      byline: article?.byline || null,
      excerpt: article?.excerpt || null,
      length: article?.length || null,
      textContent: article?.textContent ? normalize(article.textContent) : null,
    };

    console.log(`[PUPPETEER_LOCAL] Successfully fetched article: ${ret.title || 'Untitled'}`);
    return ret;
  } catch (error) {
    console.error(`[PUPPETEER_LOCAL] Error fetching article from ${url}:`, error);
    return {
      url,
      title: null,
      byline: null,
      excerpt: null,
      length: null,
      textContent: null,
    };
  } finally {
    await browser.close();
  }
};

export const puppeteerCrawlerAgent: AgentFunction = async ({ namedInputs }) => {
  const { url } = namedInputs;
  console.log(`[PUPPETEER_LOCAL] Starting crawl for URL: ${url}`);

  if (!url) {
    throw new Error("URL is required for puppeteerCrawlerAgent");
  }

  const article = await fetchArticle(url);

  return [article];
};

const puppeteerCrawlerAgentInfo: AgentFunctionInfo = {
  name: "puppeteerCrawlerAgent",
  agent: puppeteerCrawlerAgent,
  mock: puppeteerCrawlerAgent,
  samples: [
    {
      params: {},
      inputs: {},
      result: {},
    },
  ],
  description: "Puppeteer Crawler Agent (Local Copy with executablePath support)",
  category: ["crawler"],
  repository: "https://github.com/receptron/mulmocast-cli",
  author: "Receptron team (Modified for local use)",
  license: "MIT",
};

export default puppeteerCrawlerAgentInfo;