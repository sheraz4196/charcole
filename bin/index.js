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

function copyDirRecursive(src, dest, excludeFiles = []) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (excludeFiles.includes(entry.name)) {
      console.log(`Skipping excluded file: ${entry.name}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

(async function main() {
  try {
    console.log("🔥 Welcome to Charcole v2.1 CLI");

    // Check if project name is provided as command line argument
    const args = process.argv.slice(2);
    let projectNameFromArgs = null;

    if (args.length > 0) {
      // The first argument that doesn't start with '-' is likely the project name
      for (const arg of args) {
        if (!arg.startsWith("-")) {
          projectNameFromArgs = arg;
          break;
        }
      }
    }

    const questions = [];

    // Only ask for project name if not provided in command line
    if (!projectNameFromArgs) {
      questions.push({
        type: "text",
        name: "projectName",
        message: "Project name:",
        validate: (name) => (name ? true : "Project name is required"),
      });
    }

    questions.push(
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
      {
        type: "confirm",
        name: "swagger",
        message: "Include auto-generated Swagger documentation?",
        initial: true,
      },
    );

    const responses = await prompts(questions);

    // Use command line project name if provided, otherwise use prompt response
    const projectName = projectNameFromArgs || responses.projectName;
    const { language, auth, swagger } = responses;

    if (!projectName || projectName.trim() === "") {
      console.error("❌ Project name is required");
      process.exit(1);
    }

    const targetDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Folder "${projectName}" already exists.`);
      process.exit(1);
    }

    const pkgManager = detectPackageManager();
    const templateDir = path.join(__dirname, "..", "template", language);

    console.log(
      `\n📁 Creating project "${projectName}" in ${language.toUpperCase()}...`,
    );

    fs.mkdirSync(targetDir, { recursive: true });

    const basePkgPath = path.join(templateDir, "basePackage.json");
    if (!fs.existsSync(basePkgPath)) {
      throw new Error(`basePackage.json not found at ${basePkgPath}`);
    }

    let mergedPkg = JSON.parse(fs.readFileSync(basePkgPath, "utf-8"));
    console.log("✓ Loaded base package configuration");

    console.log("\n📁 Copying base template structure...");

    copyDirRecursive(templateDir, targetDir, ["basePackage.json"]);

    const templateModulesDir = path.join(templateDir, "src", "modules");
    const targetModulesDir = path.join(targetDir, "src", "modules");

    if (fs.existsSync(templateModulesDir)) {
      if (!fs.existsSync(targetModulesDir)) {
        fs.mkdirSync(targetModulesDir, { recursive: true });
      }

      const moduleEntries = fs.readdirSync(templateModulesDir, {
        withFileTypes: true,
      });

      for (const entry of moduleEntries) {
        if (entry.isDirectory()) {
          const moduleName = entry.name;
          const moduleSrcPath = path.join(templateModulesDir, moduleName);

          if (moduleName === "auth") {
            if (!auth) {
              console.log(`⏭️  Skipping auth module (not selected)`);
              continue;
            }
          } else if (moduleName === "swagger") {
            if (!swagger) {
              console.log(`⏭️  Skipping swagger module (not selected)`);
              continue;
            } else {
              // Do not copy swagger module folder, just merge package.json below
              console.log(
                `⏭️  Not copying swagger module folder (merging dependencies only)`,
              );
              continue;
            }
          } else {
            const moduleDestPath = path.join(targetModulesDir, moduleName);
            console.log(`📦 Copying ${moduleName} module...`);
            copyDirRecursive(moduleSrcPath, moduleDestPath);
          }
        }
      }
    }
    // Handle Swagger module if selected
    if (swagger) {
      console.log("\n📦 Adding Swagger module dependencies...");
      const swaggerPkgPath = path.join(
        templateDir,
        "src",
        "modules",
        "swagger",
        "package.json",
      );
      if (fs.existsSync(swaggerPkgPath)) {
        try {
          const swaggerPkg = JSON.parse(
            fs.readFileSync(swaggerPkgPath, "utf-8"),
          );
          mergedPkg = mergePackageJson(mergedPkg, swaggerPkg);
          console.log("✓ Merged Swagger module dependencies");
          console.log(
            "  Added dependencies:",
            Object.keys(swaggerPkg.dependencies || {}).join(", "),
          );
          if (swaggerPkg.devDependencies) {
            console.log(
              "  Added devDependencies:",
              Object.keys(swaggerPkg.devDependencies).join(", "),
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to parse Swagger module package.json:`,
            error.message,
          );
        }
      } else {
        console.error(
          "❌ Swagger module package.json not found at:",
          swaggerPkgPath,
        );
      }
    }

    // Handle JWT authentication module if selected
    if (auth) {
      console.log("\n📦 Adding JWT authentication module...");

      // The auth module is in src/modules/auth in the template
      const authModulePath = path.join(templateDir, "src", "modules", "auth");

      if (!fs.existsSync(authModulePath)) {
        console.error(`❌ Auth module not found at ${authModulePath}`);
      } else {
        // 1. Merge auth module's package.json
        const authPkgPath = path.join(authModulePath, "package.json");

        if (fs.existsSync(authPkgPath)) {
          try {
            const authPkg = JSON.parse(fs.readFileSync(authPkgPath, "utf-8"));
            console.log("✓ Found auth module package.json");

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
          console.error(
            "❌ Auth module package.json not found at:",
            authPkgPath,
          );
        }

        const targetAuthPath = path.join(targetModulesDir, "auth");
        console.log(
          `Copying auth module to: ${targetAuthPath} (excluding package.json)`,
        );

        copyDirRecursive(authModulePath, targetAuthPath, ["package.json"]);
        console.log("✓ Copied auth module files (package.json was excluded)");

        const copiedPkgPath = path.join(targetAuthPath, "package.json");
        if (fs.existsSync(copiedPkgPath)) {
          console.warn(
            "⚠️ package.json was accidentally copied, removing it...",
          );
          fs.unlinkSync(copiedPkgPath);
        }
      }
    } else {
      console.log("\n⏭️  Skipping JWT authentication module");

      const targetAuthPath = path.join(targetDir, "src", "modules", "auth");
      if (fs.existsSync(targetAuthPath)) {
        console.log("Cleaning up auth directory (not selected)...");
        fs.rmSync(targetAuthPath, { recursive: true, force: true });
      }
    }

    mergedPkg.name = projectName;

    const finalPkgPath = path.join(targetDir, "package.json");
    fs.writeFileSync(finalPkgPath, JSON.stringify(mergedPkg, null, 2));
    console.log(`\n📝 Created package.json at ${finalPkgPath}`);

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
