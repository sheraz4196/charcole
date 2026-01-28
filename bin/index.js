#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const prompts = require("prompts");

const { copyDir } = require("./lib/templateHandler");
const {
  detectPackageManager,
  installDependencies,
} = require("./lib/pkgManager");

/**
 * Merge base package.json with a feature package.json
 */
function mergePackageJson(base, fragment) {
  return {
    ...base,
    dependencies: {
      ...base.dependencies,
      ...fragment.dependencies,
    },
    devDependencies: {
      ...base.devDependencies,
      ...fragment.devDependencies,
    },
    scripts: {
      ...base.scripts,
      ...fragment.scripts,
    },
  };
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

    // Build features array based on user selection
    const features = [];
    if (auth) {
      features.push("auth");
    }

    const targetDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Folder "${projectName}" already exists.`);
      process.exit(1);
    }

    const pkgManager = detectPackageManager();
    const templateDir = path.join(__dirname, "..", "template", language);

    console.log(`\n📁 Creating project in ${language.toUpperCase()}...`);

    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Read basePackage.json (INTERNAL - user never sees this)
    const basePkgPath = path.join(templateDir, "basePackage.json");
    let mergedPkg = JSON.parse(fs.readFileSync(basePkgPath, "utf-8"));

    // Copy base template files (excluding modules and package.json files)
    const baseEntries = fs.readdirSync(templateDir, { withFileTypes: true });

    for (const entry of baseEntries) {
      const srcPath = path.join(templateDir, entry.name);
      const destPath = path.join(targetDir, entry.name);

      // Skip modules directory and package.json files
      if (entry.name === "modules" || entry.name === "basePackage.json") {
        continue;
      }

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    // Copy selected feature modules and merge their package.json files
    const modulesDir = path.join(templateDir, "modules");

    if (fs.existsSync(modulesDir) && features.length > 0) {
      features.forEach((feature) => {
        const featurePath = path.join(modulesDir, feature);

        if (fs.existsSync(featurePath)) {
          console.log(`📦 Including ${feature} module...`);

          // Read and merge package.json from module if it exists
          const featurePkgPath = path.join(featurePath, "package.json");
          if (fs.existsSync(featurePkgPath)) {
            try {
              const featurePkg = JSON.parse(
                fs.readFileSync(featurePkgPath, "utf-8"),
              );
              mergedPkg = mergePackageJson(mergedPkg, featurePkg);
              console.log(`✓ Merged ${feature} module dependencies`);
            } catch (error) {
              console.warn(
                `⚠️ Could not parse ${feature}/package.json:`,
                error.message,
              );
            }
          }

          // Copy module files but exclude package.json
          // IMPORTANT: Copy files while maintaining directory structure
          copyModuleFiles(featurePath, targetDir, ["package.json"]);
        }
      });
    }

    // Override project name
    mergedPkg.name = projectName;

    // Write final package.json (USER SEES ONLY THIS)
    fs.writeFileSync(
      path.join(targetDir, "package.json"),
      JSON.stringify(mergedPkg, null, 2),
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
    process.exit(1);
  }
})();

/**
 * Copy module files while maintaining structure
 */
function copyModuleFiles(src, destRoot, excludeFiles = []) {
  function copyRecursive(currentSrc, currentDest) {
    if (!fs.existsSync(currentDest)) {
      fs.mkdirSync(currentDest, { recursive: true });
    }

    const entries = fs.readdirSync(currentSrc, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrc, entry.name);
      const destPath = path.join(currentDest, entry.name);

      // Skip excluded files
      if (excludeFiles.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Copy all files from module to destination root
  copyRecursive(src, destRoot);
}
