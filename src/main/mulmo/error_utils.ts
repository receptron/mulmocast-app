import { GraphAILogger } from "graphai";

const isErrorWithCause = (error: unknown): error is Error & { cause: unknown } => {
  return error instanceof Error && "cause" in error;
};

export const getErrorCause = (error: unknown): unknown => {
  return isErrorWithCause(error) ? error.cause : undefined;
};

const isFileNotFoundError = (error: unknown): error is Error & { code: "ENOENT"; path?: string } => {
  return error instanceof Error && "code" in error && (error as { code: unknown }).code === "ENOENT";
};

type ZodIssueLike = { path: (string | number)[]; message: string };

const isZodError = (error: unknown): error is Error & { issues: ZodIssueLike[] } => {
  return error instanceof Error && "issues" in error && Array.isArray((error as { issues: unknown }).issues);
};

export const formatZodError = (error: unknown): string | null => {
  if (!isZodError(error)) return null;
  return error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
};

export const logCaughtError = (error: unknown): void => {
  if (isFileNotFoundError(error)) {
    const filePath = "path" in error ? (error as { path?: string }).path : undefined;
    GraphAILogger.log(`file ${filePath ?? "(unknown)"} not found`);
    return;
  }
  const zodFormatted = formatZodError(error);
  if (zodFormatted !== null) {
    GraphAILogger.log(`Validation error:\n${zodFormatted}`);
    return;
  }
  GraphAILogger.log(error);
};
