const fs = require("fs");
const path = require("path");

/**
 * Recursively copy directory contents, excluding specific files
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {string[]} excludeFiles - Files to exclude (e.g., ['package.json'])
 */
function copyDir(src, dest, excludeFiles = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded files
    if (excludeFiles.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, excludeFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy template files based on selected language and features
 * @param {string} templateDir - Path to template directory (e.g., template/js or template/ts)
 * @param {string} targetDir - Destination project directory
 * @param {string[]} features - Array of selected features (e.g., ['auth'])
 */
function copyTemplateModules(templateDir, targetDir, features) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy base template files (excluding modules directory and any package.json files)
  const entries = fs.readdirSync(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(targetDir, entry.name);

    // Skip modules directory and all package.json files
    if (entry.name === "modules" || entry.name.includes("package.json")) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Copy selected feature modules
  const modulesDir = path.join(templateDir, "modules");
  if (fs.existsSync(modulesDir)) {
    features.forEach((feature) => {
      const featurePath = path.join(modulesDir, feature);
      if (fs.existsSync(featurePath)) {
        console.log(`📦 Including ${feature} module...`);
        // Copy module files but exclude package.json (it's merged into main package.json)
        copyDir(featurePath, targetDir, ["package.json"]);
      }
    });
  }
}

module.exports = {
  copyTemplateModules,
  copyDir,
};
