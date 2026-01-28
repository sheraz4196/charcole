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
function copyModuleFiles(srcModulePath, destRoot, excludeFiles = []) {
  // Read all files and directories in the module
  const entries = fs.readdirSync(srcModulePath, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcModulePath, entry.name);
    const destPath = path.join(destRoot, entry.name);

    // Skip excluded files
    if (excludeFiles.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeFiles);
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

    // Copy ALL base template files (including src with empty modules directory)
    // But we'll handle modules separately based on user selection
    console.log("\n📁 Copying base template structure...");
    copyDirRecursive(templateDir, targetDir, ["basePackage.json"]);

    // Remove the modules directory from the copied structure since we'll handle it separately
    const targetModulesDir = path.join(targetDir, "src", "modules");
    if (fs.existsSync(targetModulesDir)) {
      // Remove auth directory if user didn't select it
      const targetAuthDir = path.join(targetModulesDir, "auth");
      if (!auth && fs.existsSync(targetAuthDir)) {
        console.log("Removing auth module (not selected)...");
        fs.rmSync(targetAuthDir, { recursive: true, force: true });
      }
    }

    // Handle JWT authentication module if selected
    if (auth) {
      console.log("\n📦 Adding JWT authentication module...");

      // The auth module is in src/modules/auth in the template
      const authModulePath = path.join(templateDir, "src", "modules", "auth");

      if (!fs.existsSync(authModulePath)) {
        console.error(`❌ Auth module not found at ${authModulePath}`);
        console.log("Looking for auth module in template...");

        // Debug: list what's in the template directory
        const srcPath = path.join(templateDir, "src");
        if (fs.existsSync(srcPath)) {
          console.log("Contents of src directory:");
          const srcContents = fs.readdirSync(srcPath, { withFileTypes: true });
          srcContents.forEach((item) => {
            console.log(`  ${item.isDirectory() ? "📁" : "📄"} ${item.name}`);
          });
        }
      } else {
        // 1. Merge auth module's package.json
        const authPkgPath = path.join(authModulePath, "package.json");

        if (fs.existsSync(authPkgPath)) {
          try {
            const authPkg = JSON.parse(fs.readFileSync(authPkgPath, "utf-8"));
            console.log("✓ Found auth module package.json");
            console.log(
              "Auth dependencies:",
              Object.keys(authPkg.dependencies || {}),
            );
            console.log(
              "Auth devDependencies:",
              Object.keys(authPkg.devDependencies || {}),
            );

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

        // 2. Ensure the target modules directory exists
        const targetModulesPath = path.join(targetDir, "src", "modules");
        if (!fs.existsSync(targetModulesPath)) {
          fs.mkdirSync(targetModulesPath, { recursive: true });
        }

        // 3. Copy auth module files (excluding package.json)
        const targetAuthPath = path.join(targetModulesPath, "auth");
        console.log(`Copying auth module to: ${targetAuthPath}`);
        copyDirRecursive(authModulePath, targetAuthPath, ["package.json"]);
        console.log("✓ Copied auth module files (excluding package.json)");
      }
    } else {
      console.log("\n⏭️  Skipping JWT authentication module");

      // Ensure no auth directory exists in the target
      const targetAuthPath = path.join(targetDir, "src", "modules", "auth");
      if (fs.existsSync(targetAuthPath)) {
        console.log("Cleaning up auth directory (not selected)...");
        fs.rmSync(targetAuthPath, { recursive: true, force: true });
      }
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
