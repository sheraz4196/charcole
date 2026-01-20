#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const prompts = require("prompts");
const { copyTemplateModules } = require("./lib/templateHandler");
const {
  detectPackageManager,
  installDependencies,
} = require("./lib/pkgManager");

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
        initial: 0,
      },
      {
        type: "multiselect",
        name: "features",
        message: "Select features to include:",
        choices: [
          { title: "JWT Authentication", value: "auth" },
          { title: "Swagger Docs", value: "swagger", selected: true },
          { title: "Docker Support", value: "docker" },
          { title: "ESLint + Prettier", value: "lint", selected: true },
        ],
        min: 0,
      },
    ]);

    const { projectName, language, features } = responses;
    const targetDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Folder "${projectName}" already exists.`);
      process.exit(1);
    }

    const pkgManager = detectPackageManager();

    console.log(`\n📁 Creating project in ${language.toUpperCase()}...`);

    const templateDir = path.join(
      __dirname,
      "..",
      "template",
      language,
      "modules",
    );
    copyTemplateModules(templateDir, targetDir, features);

    const basePkg = JSON.parse(
      fs.readFileSync(path.join(templateDir, "basePackage.json")),
    );
    let mergedPkg = { ...basePkg };

    features.forEach((f) => {
      const fragPath = path.join(templateDir, f, "package.json");
      if (fs.existsSync(fragPath)) {
        const frag = JSON.parse(fs.readFileSync(fragPath));
        mergedPkg.dependencies = {
          ...mergedPkg.dependencies,
          ...frag.dependencies,
        };
        mergedPkg.devDependencies = {
          ...mergedPkg.devDependencies,
          ...frag.devDependencies,
        };
        mergedPkg.scripts = { ...mergedPkg.scripts, ...frag.scripts };
      }
    });

    mergedPkg.name = projectName;
    fs.writeFileSync(
      path.join(targetDir, "package.json"),
      JSON.stringify(mergedPkg, null, 2),
    );

    console.log(`\n📦 Installing dependencies using ${pkgManager}...`);
    installDependencies(targetDir, pkgManager);

    console.log("\n✅ Charcole project created successfully!");
    console.log(
      `\n🚀 Next steps:\n  cd ${projectName}\n  ${pkgManager === "npm" ? "npm run dev" : `${pkgManager} dev`}`,
    );
  } catch (err) {
    console.error("❌ Failed to create Charcole project:", err.message);
    process.exit(1);
  }
})();
