export const isArrayBufferUint8Array = (value: unknown): value is Uint8Array<ArrayBuffer> => {
  return value instanceof Uint8Array && value.buffer instanceof ArrayBuffer;
};

export const isNonEmptyString = (value: string | null | undefined): value is string => {
  return !!value;
};

export const isOneOf = <T extends string>(candidates: readonly T[], value: unknown): value is T => {
  return candidates.some((candidate) => candidate === value);
};
