import type { VertexAIConfig } from "@/../../types";

type VertexAIParams = {
  vertexai_project?: string;
  vertexai_location?: string;
};

export const isVertexAIEnabled = (params?: VertexAIParams): boolean => {
  return params?.vertexai_project !== undefined || params?.vertexai_location !== undefined;
};

export const getVertexAIDefaults = (config?: VertexAIConfig): VertexAIParams => {
  return {
    vertexai_project: config?.project || "",
    vertexai_location: config?.location || "",
  };
};

export const stripVertexAIFields = <T extends VertexAIParams>(
  params: T,
): Omit<T, "vertexai_project" | "vertexai_location"> => {
  const { vertexai_project: __p, vertexai_location: __l, ...rest } = params;
  return rest as Omit<T, "vertexai_project" | "vertexai_location">;
};
