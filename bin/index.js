#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectName = process.argv[2];

if (!projectName) {
  console.error("❌ Please provide a project name.");
  console.error("Usage: npx create-charcole my-backend");
  process.exit(1);
}

const currentDir = process.cwd();
const targetDir = path.join(currentDir, projectName);
const templateDir = path.join(__dirname, "..", "template");

if (fs.existsSync(targetDir)) {
  console.error(`❌ Folder "${projectName}" already exists.`);
  process.exit(1);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log("🔥 Creating Charcole app...");

  copyDir(templateDir, targetDir);

  const pkgPath = path.join(targetDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  console.log("✅ Charcole app created successfully!");
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${projectName}`);
  console.log("  npm install");
  console.log("  npm run dev");
  console.log("");
  console.log("🧱 Built with Charcole — Express, but engineered.");
} catch (err) {
  console.error("❌ Failed to create Charcole app.");
  console.error(err.message);
  process.exit(1);
}
