import { provider2LipSyncAgent, defaultProviders } from "mulmocast/browser";

/**
 * Get description of what media types the lip sync model applies to
 * @param provider - Lip sync provider (e.g., "replicate"), defaults to defaultProviders.lipSync
 * @param model - Model name (e.g., "bytedance/latentsync"), defaults to provider's defaultModel
 * @param t - i18n translation function
 * @returns Description string (e.g., "Applies lip sync to videos / Applies lip sync to images")
 */
export const getLipSyncModelDescription = (
  provider: string | undefined,
  model: string | undefined,
  t: (key: string) => string,
): string => {
  // Use default provider if not specified
  const effectiveProvider = (provider || defaultProviders.lipSync) as keyof typeof provider2LipSyncAgent;
  const agentInfo = provider2LipSyncAgent[effectiveProvider];
  if (!agentInfo) return "";

  // Use default model if not specified
  const effectiveModel = (model || agentInfo.defaultModel) as keyof typeof agentInfo.modelParams;
  const modelParams = agentInfo.modelParams[effectiveModel];
  if (!modelParams) return "";

  const targets: string[] = [];
  if (modelParams.video) {
    targets.push(t("parameters.lipSyncParams.targetVideo"));
  }
  if (modelParams.image) {
    targets.push(t("parameters.lipSyncParams.targetImage"));
  }

  return targets.length > 0 ? targets.join(t("parameters.lipSyncParams.targetSeparator")) : "";
};
