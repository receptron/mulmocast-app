export const resolveTargetFromVersion = (
  packageVersion: string,
  isDev: boolean = false,
): "prod" | "dev" | "test" | "unknown" => {
  if (isDev) {
    return "test";
  }
  if (/^\d+\.\d+\.\d+$/.test(packageVersion)) {
    return "prod";
  }
  if (/^\d+\.\d+\.\d+-rc-\d+$/.test(packageVersion)) {
    return "dev";
  }
  // mainブランチ用のバージョンは通常 "alpha" や "test" などが含まれる場合が多いが、ここでは判定しない
  return "unknown";
};

export const resolveTargetAndVersion = (
  branch: string,
  packageVersion: string,
): { target: string; version?: string } => {
  if (branch === "main") {
    return { target: "test" };
  }

  if (`release/${packageVersion}` === branch) {
    const target = resolveTargetFromVersion(packageVersion);
    if (target !== "unknown") {
      return { target, version: packageVersion };
    }
  }

  return { target: "unknown" }; // fallback
};
