import { provider2LipSyncAgent } from "mulmocast/browser";

/**
 * Get description of what media types the lip sync model applies to
 * @param provider - Lip sync provider (e.g., "replicate")
 * @param model - Model name (e.g., "bytedance/latentsync")
 * @param t - i18n translation function
 * @returns Description string (e.g., "Applies lip sync to videos / Applies lip sync to images")
 */
export const getLipSyncModelDescription = (
  provider: string | undefined,
  model: string | undefined,
  t: (key: string) => string,
): string => {
  if (!provider || !model) {
    return "";
  }

  const agentInfo = provider2LipSyncAgent[provider as keyof typeof provider2LipSyncAgent];
  if (!agentInfo) return "";

  const modelParams = agentInfo.modelParams[model as keyof typeof agentInfo.modelParams];
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
