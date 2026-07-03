import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "src/data/profile.ts",
  "src/data/cv.ts",
  "src/pages/index.astro",
  "src/pages/cv.astro",
  "src/pages/projects/index.astro",
  "src/pages/blog/index.astro"
];

const forbiddenPatterns = [
  /\bGPA\b/i,
  /\brank\b/i,
  /\b\d+\s*\/\s*\d+\b/,
  /\b\d{11}\b/,
  /Jungong Road/i,
  /No\.580/i,
  /Building\s+2/i,
  /Apartment\s+4/i
];

const requiredPublicSnippets = [
  "2657751462@qq.com",
  "data-neural-field",
  "learningProgress",
  "International Organization Internship",
  "Please feel free to reach out by email",
  "meteor-shower",
  ".typing-target::after",
  "max-height: calc(100dvh - 32px)",
  "SCI Zone 1",
  "CCF B",
  "SCI Zone 3",
  "CCF C",
  "/figures/sfmambanet-framework.png",
  "/figures/safecoderl-framework.png",
  "data-draggable-sticker",
  "meteor-layer",
  "Array.from({ length: 16 }",
  "document.addEventListener(\"pointermove\", moveSticker",
  "z-index: 4;",
  "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
  "Academic publications and citations",
  "scholar-link"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error(`Missing required files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const textFiles = [];
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", ".astro"].includes(entry.name)) collect(full);
      continue;
    }
    if (/\.(astro|ts|md|mjs|css|json|yml|yaml)$/.test(entry.name)) {
      textFiles.push(full);
    }
  }
};
collect(path.join(root, "src"));

const violations = [];
const sourceCorpus = [];
for (const file of textFiles) {
  const content = fs.readFileSync(file, "utf8");
  sourceCorpus.push(content);
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(root, file)} matches ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`Sensitive or grade-like content detected:\n${violations.join("\n")}`);
  process.exit(1);
}

const joinedSource = sourceCorpus.join("\n");
const missingSnippets = requiredPublicSnippets.filter((snippet) => !joinedSource.includes(snippet));
if (missingSnippets.length > 0) {
  console.error(`Required public homepage features are missing:\n${missingSnippets.map((snippet) => `- ${snippet}`).join("\n")}`);
  process.exit(1);
}

console.log("Content validation passed.");
