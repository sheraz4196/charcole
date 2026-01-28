#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const prompts = require("prompts");

const {
  detectPackageManager,
  installDependencies,
} = require("./lib/pkgManager");

/**
 * Merge base package.json with a feature package.json
 */
function mergePackageJson(base, fragment) {
  const merged = { ...base };

  // Merge dependencies
  if (fragment.dependencies) {
    merged.dependencies = {
      ...merged.dependencies,
      ...fragment.dependencies,
    };
  }

  // Merge devDependencies
  if (fragment.devDependencies) {
    merged.devDependencies = {
      ...merged.devDependencies,
      ...fragment.devDependencies,
    };
  }

  // Merge scripts
  if (fragment.scripts) {
    merged.scripts = {
      ...merged.scripts,
      ...fragment.scripts,
    };
  }

  return merged;
}

/**
 * Copy directory recursively
 */
function copyDirRecursive(src, dest, excludeFiles = []) {
  if (!fs.existsSync(src)) return;

  // Create destination directory if it doesn't exist
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
      copyDirRecursive(srcPath, destPath, excludeFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy module files while maintaining structure
 * This preserves the module's internal folder structure
 */
function copyModuleFiles(srcModulePath, destRoot) {
  // Read all files and directories in the module
  const entries = fs.readdirSync(srcModulePath, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcModulePath, entry.name);

    // Skip package.json file - we'll merge it separately
    if (entry.name === "package.json") {
      continue;
    }

    const destPath = path.join(destRoot, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

(async function main() {
  try {
    console.log("🔥 Welcome to Charcole v2 CLI");

    const responses = await prompts([
      {
        type: "text",
        name: "projectName",
        message: "Project name:",
        validate: (name) => (name ? true : "Project name is required"),
      },
      {
        type: "select",
        name: "language",
        message: "Language:",
        choices: [
          { title: "TypeScript", value: "ts" },
          { title: "JavaScript", value: "js" },
        ],
      },
      {
        type: "confirm",
        name: "auth",
        message: "Include JWT authentication module?",
        initial: true,
      },
    ]);

    const { projectName, language, auth } = responses;

    const targetDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Folder "${projectName}" already exists.`);
      process.exit(1);
    }

    const pkgManager = detectPackageManager();
    const templateDir = path.join(__dirname, "..", "template", language);

    console.log(`\n📁 Creating project in ${language.toUpperCase()}...`);

    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Read basePackage.json (INTERNAL - user never sees this)
    const basePkgPath = path.join(templateDir, "basePackage.json");
    if (!fs.existsSync(basePkgPath)) {
      throw new Error(`basePackage.json not found at ${basePkgPath}`);
    }

    let mergedPkg = JSON.parse(fs.readFileSync(basePkgPath, "utf-8"));
    console.log("✓ Loaded base package configuration");

    // Copy base template files (excluding modules and basePackage.json)
    const baseEntries = fs.readdirSync(templateDir, { withFileTypes: true });

    for (const entry of baseEntries) {
      const srcPath = path.join(templateDir, entry.name);

      // Skip modules directory and basePackage.json file
      if (entry.name === "modules" || entry.name === "basePackage.json") {
        continue;
      }

      const destPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    console.log("✓ Copied base template files");

    // Handle JWT authentication module if selected
    if (auth) {
      console.log("\n📦 Adding JWT authentication module...");

      const authModulePath = path.join(templateDir, "modules", "auth");

      if (!fs.existsSync(authModulePath)) {
        console.warn(`⚠️ Auth module not found at ${authModulePath}`);
      } else {
        // 1. Merge auth module's package.json
        const authPkgPath = path.join(authModulePath, "package.json");

        if (fs.existsSync(authPkgPath)) {
          try {
            const authPkg = JSON.parse(fs.readFileSync(authPkgPath, "utf-8"));
            mergedPkg = mergePackageJson(mergedPkg, authPkg);
            console.log("✓ Merged auth module dependencies");
            console.log(
              "  Added dependencies:",
              Object.keys(authPkg.dependencies || {}).join(", "),
            );
            if (authPkg.devDependencies) {
              console.log(
                "  Added devDependencies:",
                Object.keys(authPkg.devDependencies).join(", "),
              );
            }
          } catch (error) {
            console.error(
              `❌ Failed to parse auth module package.json:`,
              error.message,
            );
          }
        } else {
          console.warn("⚠️ Auth module package.json not found");
        }

        // 2. Copy auth module files (excluding package.json)
        copyModuleFiles(authModulePath, targetDir);
        console.log("✓ Copied auth module files");
      }
    } else {
      console.log("\n⏭️  Skipping JWT authentication module");
    }

    // Override project name
    mergedPkg.name = projectName;

    // Write final package.json (USER SEES ONLY THIS)
    const finalPkgPath = path.join(targetDir, "package.json");
    fs.writeFileSync(finalPkgPath, JSON.stringify(mergedPkg, null, 2));
    console.log(`\n📝 Created package.json at ${finalPkgPath}`);

    // Log the final package.json content for debugging
    console.log("\n📦 Final package.json dependencies:");
    console.log(
      "  dependencies:",
      Object.keys(mergedPkg.dependencies || {}).join(", "),
    );
    console.log(
      "  devDependencies:",
      Object.keys(mergedPkg.devDependencies || {}).join(", "),
    );

    console.log(`\n📦 Installing dependencies using ${pkgManager}...`);
    installDependencies(targetDir, pkgManager);

    console.log("\n✅ Charcole project created successfully!");
    console.log(
      `\n🚀 Next steps:\n  cd ${projectName}\n  ${
        pkgManager === "npm" ? "npm run dev" : `${pkgManager} run dev`
      }`,
    );
  } catch (err) {
    console.error("❌ Failed to create Charcole project:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
