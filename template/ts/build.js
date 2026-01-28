import { build } from "esbuild";
import { glob } from "glob";
import fs from "fs";
import path from "path";

const entryPoints = await glob("src/**/*.ts");

// Custom plugin to rewrite .ts imports to .js
const rewriteImportsPlugin = {
  name: "rewrite-imports",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const contents = await fs.promises.readFile(args.path, "utf8");

      // Replace .ts extensions with .js in imports
      const modifiedContents = contents
        .replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from "$1.js"')
        .replace(/import\s+['"]([^'"]+)\.ts['"]/g, 'import "$1.js"');

      return {
        contents: modifiedContents,
        loader: "ts",
      };
    });
  },
};

await build({
  entryPoints,
  outdir: "dist",
  bundle: false,
  platform: "node",
  format: "esm",
  target: "es2020",
  sourcemap: true,
  outExtension: { ".js": ".js" },
  packages: "external",
  plugins: [rewriteImportsPlugin],
})
  .then(() => {
    console.log("✅ Build completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Build failed:", error);
    process.exit(1);
  });
