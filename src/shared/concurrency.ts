/**
 * Parse a user-entered concurrency value.
 *
 * Returns `undefined` for blank input or any non-positive / non-finite number,
 * which signals "use the provider default" downstream. Decimal values are
 * floored — concurrency is an integer.
 */
export const parseConcurrency = (value: string | number): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : undefined;
};
