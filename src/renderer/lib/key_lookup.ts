export const valueForKey = <T>(entries: Record<string, T> | undefined, key: string | undefined): T | undefined => {
  if (key === undefined) {
    return undefined;
  }
  return entries?.[key];
};
