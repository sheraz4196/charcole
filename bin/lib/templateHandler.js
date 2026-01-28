const fs = require("fs");
const path = require("path");

/**
 * Recursively copy directory contents, excluding specific files
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

module.exports = {
  copyDir,
};
