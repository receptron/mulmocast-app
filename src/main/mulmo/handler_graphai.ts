import { puppeteerCrawlerAgent } from "mulmocast";
import { defaultTestContext } from "graphai";

export const graphaiPuppeteerAgent = async (params: { url: string }) => {
  const { url } = params;
  console.log(url);

  return await puppeteerCrawlerAgent.agent({ ...defaultTestContext, namedInputs: { url } });
};
