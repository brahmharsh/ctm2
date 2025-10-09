// export-project.js
const fs = require("fs");
const path = require("path");

// ✅ Manual excludes (fallback)
const excludeDirs = ["node_modules", ".git", "dist", "build", ".next"];
const excludeExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".mp4",
  ".mp3",
  ".webm",
  ".wav",
  ".zip",
  ".tar",
  ".gz",
  ".lock",
];
const excludeFiles = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".gitignore",
  "README.md",
  "crawl.js",
];

// ✅ Load .gitignore rules if exists
function loadGitignore(baseDir) {
  const gitignorePath = path.join(baseDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return [];
  const rules = fs
    .readFileSync(gitignorePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return rules;
}

// ✅ Check exclude logic
function shouldExclude(filePath, stats, baseDir, gitignoreRules) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);
  const relPath = path.relative(baseDir, filePath);

  // Apply .gitignore rules (basic support)
  for (const rule of gitignoreRules) {
    if (relPath.startsWith(rule) || base === rule) {
      return true;
    }
  }

  // Apply manual excludes
  if (stats.isDirectory()) {
    return excludeDirs.includes(base);
  }
  if (excludeFiles.includes(base)) return true;
  if (excludeExtensions.includes(ext)) return true;

  return false;
}

// ✅ Export function
function exportProject(dir, baseDir, output, gitignoreRules) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(baseDir, fullPath);
    const stats = fs.statSync(fullPath);

    if (shouldExclude(fullPath, stats, baseDir, gitignoreRules)) continue;

    if (stats.isDirectory()) {
      exportProject(fullPath, baseDir, output, gitignoreRules);
    } else {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lang = path.extname(fullPath).slice(1); // guess code fence lang
        output.push(`/${relPath}\n\`\`\`${lang}\n${content}\n\`\`\`\n`);
      } catch {
        console.warn(`⚠️ Skipped binary file: ${relPath}`);
      }
    }
  }
}

// ✅ Runner
function run() {
  const baseDir = process.cwd();
  const gitignoreRules = loadGitignore(baseDir);
  const output = [];

  exportProject(baseDir, baseDir, output, gitignoreRules);

  fs.writeFileSync("project-export.md", output.join("\n"), "utf-8");
  console.log(
    "✅ Exported project to project-export.md (with .gitignore + manual excludes)",
  );
}

run();
