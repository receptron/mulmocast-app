import { puppeteerCrawlerAgent } from "./puppeteer_crawler_agent";

export const graphaiPuppeteerAgent = async (params: { url: string }) => {
  const { url } = params;
  console.log(`[GRAPHAI] Using local puppeteerCrawlerAgent for URL: ${url}`);

  return await puppeteerCrawlerAgent({ namedInputs: { url } });
};
