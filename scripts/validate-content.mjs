import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "src/data/profile.ts",
  "src/data/cv.ts",
  "src/i18n/index.ts",
  "src/components/ThemeToggle.astro",
  "src/components/ClickBurst.astro",
  "src/views/HomePage.astro",
  "src/pages/index.astro",
  "src/pages/cv.astro",
  "src/pages/projects/index.astro",
  "src/pages/blog/index.astro",
  "src/pages/zh/index.astro",
  "src/pages/zh/cv.astro",
  "src/pages/zh/projects/index.astro",
  "src/pages/zh/blog/index.astro",
  "src/content/blog/zh/website-launch.md",
  "src/content/projects/zh/xsafeclaw.md"
];

const forbiddenPatterns = [
  /\bGPA\b/i,
  /\brank\b/i,
  /\b\d+\s*\/\s*\d+\b/,
  /\b\d{11}\b/,
  /Apr 2026 - Present/,
  /TCSVT/,
  /IEEE Transactions on Circuits and Systems for Video Technology/,
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
  "CCF A",
  "IEEE Transactions on Image Processing (TIP)",
  "https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing",
  "SCI Zone 3",
  "CCF C",
  "/figures/sfmambanet-framework.png",
  "/figures/safecoderl-framework.png",
  "data-draggable-sticker",
  "meteor-layer",
  "Array.from({ length: 8 }",
  "const duration = 12.4 + (index % 6) * 1.7",
  "const delay = index * -1.24",
  "document.addEventListener(\"pointermove\", moveSticker",
  "z-index: 4;",
  "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
  "Academic publications and citations",
  "scholar-link",
  "Mar 2026 - Jun 2026",
  "July 2026",
  "https://zjfheart.github.io/",
  "RISE-AI Lab",
  "ICLR 2027",
  "victim-centered",
  "Apr 2026 - Aug 2026",
  "https://www.gass.ac.cn/gass/index.html",
  "https://anonymous.4open.science/r/ScamWeb-B710",
  "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
  "/figures/scamweb-dataset-overview.png",
  "Dataset and annotation overview",
  ".hero-panel h2,\n.typing-line",
  "I am an undergraduate student in Computer Science and Technology (Class of 2023)",
  "Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University",
  "我是上海理工大学计算机科学与技术专业 2023 级本科生",
  "研究方向为智能体与人工智能安全",
  "export const locales: Locale[] = [\"en\", \"zh\"]",
  "data-language-switch",
  "krico-locale",
  "data-theme-toggle",
  "krico-theme",
  "Switch to dark theme",
  "切换到深色主题",
  "data-click-effect-layer",
  "click-bubble-burst",
  "const maxBursts = 4",
  "const particleCount = 9 + Math.floor(Math.random() * 4)",
  "const distance = 26.4 + Math.random() * 27.6",
  "const duration = 1150 + Math.random() * 150",
  "const delay = Math.random() * 8",
  "window.setTimeout(() => removeBurst(burst), 1420)",
  "translationKey: \"website-launch\"",
  "translationKey: \"xsafeclaw\""
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
