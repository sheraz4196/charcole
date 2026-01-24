const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Detect which package manager the user is using
 * Priority: pnpm > yarn > npm
 * @returns {string} - Package manager name ('pnpm', 'yarn', or 'npm')
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

  const installedManagers = ["pnpm", "yarn", "npm"].filter((manager) => {
    try {
      execSync(`${manager} --version`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });

  return installedManagers[0] || "npm";
}

/**
 * Install dependencies using the detected package manager
 * @param {string} targetDir - Project directory where package.json exists
 * @param {string} pkgManager - Package manager to use ('pnpm', 'yarn', or 'npm')
 */
function installDependencies(targetDir, pkgManager) {
  try {
    const installCmd =
      pkgManager === "yarn" ? "yarn install" : `${pkgManager} install`;

    execSync(installCmd, {
      cwd: targetDir,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`\n❌ Failed to install dependencies with ${pkgManager}`);
    throw error;
  }
}

module.exports = {
  detectPackageManager,
  installDependencies,
};
