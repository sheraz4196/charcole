const fs = require("fs");
const path = require("path");

/**
 * Recursively copy directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy template files based on selected language and features
 * @param {string} templateDir - Path to template directory (e.g., template/js or template/ts)
 * @param {string} targetDir - Destination project directory
 * @param {string[]} features - Array of selected features
 */
function copyTemplateModules(templateDir, targetDir, features) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const entries = fs.readdirSync(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(targetDir, entry.name);

    if (entry.name === "modules" || entry.name.includes("package.json")) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  const modulesDir = path.join(templateDir, "modules");
  if (fs.existsSync(modulesDir)) {
    features.forEach((feature) => {
      const featurePath = path.join(modulesDir, feature);
      if (fs.existsSync(featurePath)) {
        copyDir(featurePath, targetDir);
      }
    });
  }
}

module.exports = {
  copyTemplateModules,
  copyDir,
};
