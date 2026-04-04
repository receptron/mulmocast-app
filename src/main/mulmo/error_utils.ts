const isErrorWithCause = (error: unknown): error is Error & { cause: unknown } => {
  return error instanceof Error && "cause" in error;
};

export const getErrorCause = (error: unknown): unknown => {
  return isErrorWithCause(error) ? error.cause : undefined;
};
