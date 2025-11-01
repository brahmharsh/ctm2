import fs from "fs";
import path from "path";

const EXCLUDED = [
  "node_modules",
  ".next",
  "dist",
  ".git",
  "public",
  ".vercel",
  ".turbo",
  "coverage",
];

const EXCLUDED_FILES = [
  ".gitignore",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "structure.txt", // prevent self-inclusion
  "README.md"
];

function walk(dir, level = 0) {
  const indent = "│   ".repeat(level);
  let result = "";

  for (const file of fs.readdirSync(dir)) {
    if (EXCLUDED.includes(file) || EXCLUDED_FILES.includes(file)) continue;

    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      result += `${indent}├── ${file}/\n` + walk(filePath, level + 1);
    } else {
      result += `${indent}│   ${file}\n`;
    }
  }

  return result;
}

// Run from project root
const root = process.cwd();
const output = `📂 ${path.basename(root)}/\n${walk(root)}`;

fs.writeFileSync("structure.txt", output);
console.log("✅ Clean structure saved to structure.txt");
