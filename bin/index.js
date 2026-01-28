#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const prompts = require("prompts");

const { copyTemplateModules } = require("./lib/templateHandler");
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

    // Copy base template + selected modules (auth will be excluded if not selected)
    copyTemplateModules(templateDir, targetDir, features);

    // Read basePackage.json (INTERNAL - user never sees this)
    const basePkgPath = path.join(templateDir, "basePackage.json");
    let mergedPkg = JSON.parse(fs.readFileSync(basePkgPath, "utf-8"));

    // Merge feature package.json files for selected modules
    features.forEach((feature) => {
      const featurePkgPath = path.join(
        templateDir,
        "modules",
        feature,
        "package.json",
      );

      if (fs.existsSync(featurePkgPath)) {
        const featurePkg = JSON.parse(fs.readFileSync(featurePkgPath, "utf-8"));
        mergedPkg = mergePackageJson(mergedPkg, featurePkg);
        console.log(`✓ Merged ${feature} module dependencies`);
      }
    });

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
        pkgManager === "npm" ? "npm run dev" : `${pkgManager} dev`
      }`,
    );
  } catch (err) {
    console.error("❌ Failed to create Charcole project:", err.message);
    process.exit(1);
  }
})();
