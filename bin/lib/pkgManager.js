const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Detect which package manager the user is using
 * Priority: pnpm > yarn > npm
 */
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.includes("pnpm")) return "pnpm";
    if (userAgent.includes("yarn")) return "yarn";
    if (userAgent.includes("npm")) return "npm";
  }

  const lockFiles = {
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    "package-lock.json": "npm",
  };

  for (const [lockFile, manager] of Object.entries(lockFiles)) {
    if (fs.existsSync(path.join(process.cwd(), lockFile))) {
      return manager;
    }
  }

  return "npm";
}

/**
 * Install dependencies
 */
function installDependencies(targetDir, pkgManager) {
  const installCmd =
    pkgManager === "yarn" ? "yarn install" : `${pkgManager} install`;

  execSync(installCmd, {
    cwd: targetDir,
    stdio: "inherit",
  });
}

module.exports = {
  detectPackageManager,
  installDependencies,
};
