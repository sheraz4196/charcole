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

function copyDirRecursive(src, dest, excludeFiles = [], excludeDirs = []) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded files
    if (excludeFiles.includes(entry.name)) {
      console.log(`Skipping excluded file: ${entry.name}`);
      continue;
    }

    // Skip .tgz files (tarball packages)
    if (entry.name.endsWith(".tgz")) {
      console.log(`Skipping tarball: ${entry.name}`);
      continue;
    }

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (excludeDirs.includes(entry.name)) {
        console.log(`Skipping excluded directory: ${entry.name}`);
        continue;
      }
      copyDirRecursive(srcPath, destPath, excludeFiles, excludeDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

(async function main() {
  try {
    console.log("🔥 Welcome to Charcole v2.2 CLI");

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
      {
        type: "confirm",
        name: "includePayments",
        message: "Include payments module? (Stripe / LemonSqueezy)",
        initial: false,
      },
      {
        type: (prev, values) => (values.includePayments ? "select" : null),
        name: "paymentProvider",
        message: "Which payment provider will you use?",
        choices: [
          { title: "Stripe (global)", value: "stripe" },
          { title: "LemonSqueezy (Pakistan + global)", value: "lemonsqueezy" },
          { title: "Both (I'll switch via env var)", value: "both" },
        ],
        initial: 0,
      },
    );

    const responses = await prompts(questions);

    // Use command line project name if provided, otherwise use prompt response
    const projectName = projectNameFromArgs || responses.projectName;
    const { language, auth, swagger, includePayments, paymentProvider } =
      responses;

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

    // Exclude basePackage.json and swagger module directory from initial copy
    // We'll handle modules separately based on user selection
    const srcModulesDir = path.join(templateDir, "src", "modules");

    // Copy everything except basePackage.json and the modules directory
    copyDirRecursive(templateDir, targetDir, ["basePackage.json"], ["modules"]);

    // Now handle modules directory manually
    const templateModulesDir = srcModulesDir;
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
            // Exclude package.json files from module folders
            copyDirRecursive(moduleSrcPath, moduleDestPath, ["package.json"]);
          }
        }
      }
    }
    // Handle Swagger module if selected
    if (swagger) {
      console.log("\n📦 Adding Swagger module dependencies...");
      const swaggerModuleDir = path.join(
        templateDir,
        "src",
        "modules",
        "swagger",
      );
      const swaggerPkgPath = path.join(swaggerModuleDir, "package.json");
      const swaggerTgzPath = path.join(
        swaggerModuleDir,
        "charcole-swagger-1.0.1.tgz",
      );

      // Copy tarball temporarily for npm install (will be cleaned up after)
      if (fs.existsSync(swaggerTgzPath)) {
        fs.copyFileSync(
          swaggerTgzPath,
          path.join(targetDir, "charcole-swagger-1.0.1.tgz"),
        );
        console.log("✓ Copied Swagger tarball temporarily for installation");
      } else {
        console.error("❌ Swagger tarball not found at:", swaggerTgzPath);
      }

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

        copyDirRecursive(authModulePath, targetAuthPath, ["package.json"], []);
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

    // Handle payments module if selected
    if (includePayments) {
      console.log("\n📦 Adding payments module...");

      // The payments module is in src/modules/payments in the template
      const paymentsModulePath = path.join(
        templateDir,
        "src",
        "modules",
        "payments",
      );

      if (!fs.existsSync(paymentsModulePath)) {
        console.error(`❌ Payments module not found at ${paymentsModulePath}`);
      } else {
        // 1. Merge payments module's package.json
        const paymentsPkgPath = path.join(paymentsModulePath, "package.json");

        if (fs.existsSync(paymentsPkgPath)) {
          try {
            const paymentsPkg = JSON.parse(
              fs.readFileSync(paymentsPkgPath, "utf-8"),
            );
            console.log("✓ Found payments module package.json");

            mergedPkg = mergePackageJson(mergedPkg, paymentsPkg);
            console.log("✓ Merged payments module dependencies");
            console.log(
              "  Added dependencies:",
              Object.keys(paymentsPkg.dependencies || {}).join(", "),
            );
            if (paymentsPkg.devDependencies) {
              console.log(
                "  Added devDependencies:",
                Object.keys(paymentsPkg.devDependencies).join(", "),
              );
            }
          } catch (error) {
            console.error(
              `❌ Failed to parse payments module package.json:`,
              error.message,
            );
          }
        } else {
          console.error(
            "❌ Payments module package.json not found at:",
            paymentsPkgPath,
          );
        }

        const targetPaymentsPath = path.join(targetModulesDir, "payments");
        console.log(
          `Copying payments module to: ${targetPaymentsPath} (excluding package.json)`,
        );

        copyDirRecursive(
          paymentsModulePath,
          targetPaymentsPath,
          ["package.json"],
          [],
        );
        console.log(
          "✓ Copied payments module files (package.json was excluded)",
        );

        const copiedPkgPath = path.join(targetPaymentsPath, "package.json");
        if (fs.existsSync(copiedPkgPath)) {
          console.warn(
            "⚠️ package.json was accidentally copied, removing it...",
          );
          fs.unlinkSync(copiedPkgPath);
        }
      }
    } else {
      console.log("\n⏭️  Skipping payments module");

      const targetPaymentsPath = path.join(
        targetDir,
        "src",
        "modules",
        "payments",
      );
      if (fs.existsSync(targetPaymentsPath)) {
        console.log("Cleaning up payments directory (not selected)...");
        fs.rmSync(targetPaymentsPath, { recursive: true, force: true });
      }
    }

    // Remove Swagger imports and setup from app file if not selected
    if (!swagger) {
      console.log("\n🧹 Removing Swagger references from app file...");
      const appFileName = language === "ts" ? "app.ts" : "app.js";
      const appFilePath = path.join(targetDir, "src", appFileName);

      if (fs.existsSync(appFilePath)) {
        let appContent = fs.readFileSync(appFilePath, "utf-8");

        // Remove swagger-related imports
        const swaggerConfigImport =
          language === "ts"
            ? 'import swaggerOptions from "./config/swagger.config";'
            : 'import swaggerOptions from "./config/swagger.config.js";';
        const setupSwaggerImport =
          'import { setupSwagger } from "@charcoles/swagger";';

        appContent = appContent
          .split("\n")
          .filter((line) => {
            const trimmedLine = line.trim();
            return (
              !trimmedLine.includes(swaggerConfigImport.trim()) &&
              !trimmedLine.includes(setupSwaggerImport.trim()) &&
              !trimmedLine.includes("setupSwagger(app, swaggerOptions);")
            );
          })
          .join("\n");

        fs.writeFileSync(appFilePath, appContent, "utf-8");
        console.log(`✓ Removed Swagger references from ${appFileName}`);
      }

      // Remove swagger config file
      const swaggerConfigFile =
        language === "ts" ? "swagger.config.ts" : "swagger.config.js";
      const swaggerConfigPath = path.join(
        targetDir,
        "src",
        "config",
        swaggerConfigFile,
      );
      if (fs.existsSync(swaggerConfigPath)) {
        fs.unlinkSync(swaggerConfigPath);
        console.log(`✓ Removed ${swaggerConfigFile}`);
      }

      // Remove lib/swagger directory
      const swaggerLibPath = path.join(targetDir, "src", "lib", "swagger");
      if (fs.existsSync(swaggerLibPath)) {
        fs.rmSync(swaggerLibPath, { recursive: true, force: true });
        console.log("✓ Removed lib/swagger directory");
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

    // Create .env from .env.example and ensure APP_NAME default exists
    try {
      const exampleEnvPath = path.join(targetDir, ".env.example");
      const envPath = path.join(targetDir, ".env");

      if (fs.existsSync(exampleEnvPath) && !fs.existsSync(envPath)) {
        let exampleContent = fs.readFileSync(exampleEnvPath, "utf-8");

        if (!/APP_NAME\s*=/.test(exampleContent)) {
          exampleContent = `APP_NAME=CHARCOLE API\n` + exampleContent;
        }

        if (includePayments) {
          if (paymentProvider === "both") {
            exampleContent = exampleContent.replace(
              "PAYMENT_PROVIDER=",
              'PAYMENT_PROVIDER=   # Set to "stripe" or "lemonsqueezy"',
            );
          } else {
            exampleContent = exampleContent.replace(
              "PAYMENT_PROVIDER=",
              `PAYMENT_PROVIDER=${paymentProvider}`,
            );
          }
        }

        fs.writeFileSync(envPath, exampleContent, "utf-8");
        console.log("✓ Created .env from .env.example with default APP_NAME");
      }
    } catch (err) {
      console.warn("⚠️  Failed to create .env automatically:", err.message);
    }

    // Initialize git repository to make project git-friendly
    try {
      const { execSync } = require("child_process");

      execSync("git --version", { stdio: "ignore" });
      execSync("git init", { cwd: targetDir, stdio: "ignore" });

      // Ensure .gitignore exists (copy from template if missing)
      const gitignoreSrc = path.join(templateDir, ".gitignore");
      const gitignoreDest = path.join(targetDir, ".gitignore");
      if (!fs.existsSync(gitignoreDest) && fs.existsSync(gitignoreSrc)) {
        fs.copyFileSync(gitignoreSrc, gitignoreDest);
      }

      // Stage files and attempt initial commit; ignore commit errors (e.g., missing git user config)
      try {
        execSync("git add .", { cwd: targetDir, stdio: "ignore" });
        execSync('git commit -m "chore: initial commit from Charcole"', {
          cwd: targetDir,
          stdio: "ignore",
        });
        console.log("✓ Initialized git repository and created initial commit");
      } catch (commitErr) {
        console.log(
          "✓ Initialized git repository (skipped commit — configure git user to enable commits)",
        );
      }
    } catch (gitErr) {
      console.log("ℹ️  Git not available; skipping repository initialization");
    }

    console.log(`\n📦 Installing dependencies using ${pkgManager}...`);
    installDependencies(targetDir, pkgManager);

    // Clean up the swagger tarball after installation
    if (swagger) {
      const tgzPath = path.join(targetDir, "charcole-swagger-1.0.1.tgz");
      if (fs.existsSync(tgzPath)) {
        fs.unlinkSync(tgzPath);
        console.log("✓ Cleaned up temporary Swagger tarball");
      }
    }

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
