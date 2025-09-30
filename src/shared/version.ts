export const resolveTargetAndVersion = (
  branch: string,
  packageVersion: string,
): { target: string; version?: string } => {
  if (branch === "main") {
    return { target: "test" };
  }

  const releaseRcMatch = branch.match(/^release\/(\d+\.\d+\.\d+-rc-\d+)$/);
  if (releaseRcMatch && releaseRcMatch[1] === packageVersion) {
    return { target: "dev", version: releaseRcMatch[1] };
  }

  const releaseMatch = branch.match(/^release\/(\d+\.\d+\.\d+)$/);
  if (releaseMatch && releaseMatch[1] === packageVersion) {
    return { target: "prod", version: releaseMatch[1] };
  }

  return { target: "unknown" }; // fallback
};
