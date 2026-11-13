import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "src/data/profile.ts",
  "src/data/cv.ts",
  "src/i18n/index.ts",
  "src/layouts/BaseLayout.astro",
  "src/components/Sidebar.astro",
  "src/components/ClickBurst.astro",
  "src/components/BrandIcon.astro",
  "src/components/PublicationCard.astro",
  "src/components/ResourceLinks.astro",
  "src/components/RepoStars.astro",
  "src/components/NewsCard.astro",
  "src/components/DatasetDownloads.astro",
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

const gradeLikeFraction = /(?<![/:])\b\d+\s*\/\s*\d+\b/;
const forbiddenPatterns = [
  /\bGPA\b/i,
  /\brank\b/i,
  gradeLikeFraction,
  /\b\d{11}\b/,
  /Research Intern,\s*XSafeClaw[\s\S]{0,500}(?:Apr 2026 - Present|2026\.04 – present)/,
  /TCSVT/,
  /IEEE Transactions on Circuits and Systems for Video Technology/,
  /Jungong Road/i,
  /No\.580/i,
  /Building\s+2/i,
  /Apartment\s+4/i
];

const requiredPublicSnippets = [
  "wzh2657751462@gmail.com",
  "learningProgress",
  "International Organization Internship",
  "meteor-shower",
  "SCI Zone 1",
  "CCF A",
  "IEEE Transactions on Image Processing (TIP)",
  "https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing",
  "https://ncip.fzu.edu.cn/index.htm",
  "https://ccds.fzu.edu.cn/info/1207/11276.htm",
  "Advisor Yizhang Liu",
  "导师刘翼章",
  "SCI Zone 3",
  "CCF C",
  "/figures/sfmambanet-framework.png",
  "/figures/safecoderl-framework.png",
  "meteor-layer",
  "Array.from({ length: 8 }",
  "const duration = 12.4 + (index % 6) * 1.7",
  "const delay = index * -1.24",
  "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
  "Academic publications and citations",
  "2026.03 – 2026.06",
  "2026.07",
  "https://zjfheart.github.io/",
  "RISE-AI Lab",
  "WWW 2027",
  "victim-centered",
  "2026.04 – 2026.08",
  "https://www.gass.ac.cn/gass/index.html",
  "https://github.com/Kirito14IT/ScamWeb",
  "/papers/scamweb.pdf",
  "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
  "/figures/scamweb-dataset-overview.png",
  "Dataset and annotation overview",
  "Hello!",
  "2.5k GitHub Stars",
  "2025 ACM Shanghai Collegiate Programming Contest",
  "2025 ACM 上海站大学生程序设计竞赛",
  "2027.09 – 2030.06 (expected)",
  "2027.09 – 2030.06（预计）",
  "2023.09 – 2027.06",
  "2026.02 – 2026.05",
  "https://huggingface.co/datasets/kirco567/ScamWeb-Dataset",
  "Preprints and Publications",
  "预印本与论文",
  "https://github.com/wuyoscar",
  "https://yunhao-feng.github.io",
  "My research interests include foundation models, coding agents",
  "研究兴趣包括基座大模型、Coding Agent、智能体后训练与强化学习，以及可信人工智能。",
  "Foundation Models",
  "基座大模型",
  "export const locales: Locale[] = [\"en\", \"zh\"]",
  "data-language-switch",
  "krico-locale",
  "data-click-effect-layer",
  "click-bubble-burst",
  "const maxBursts = 4",
  "const particleCount = 9 + Math.floor(Math.random() * 4)",
  "const distance = 26.4 + Math.random() * 27.6",
  "const duration = 1150 + Math.random() * 150",
  "const delay = Math.random() * 8",
  "window.setTimeout(() => removeBurst(burst), 1420)",
  "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "https://www.socchina.net/home",
  "9th National College Student Embedded Chip and System Design Competition",
  "第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛",
  "workExperiences",
  "AI Research Intern, Key Laboratory of Information Network Security, Ministry of Public Security (Third Research Institute, Shanghai)",
  "International Organization (United Nations Volunteers) - UNDP, Research Intern (Online)",
  "Meituan, Odd Jobs",
  "2023.06 – 2023.09",
  "信息网络安全公安部重点实验室（公安部第三研究所，上海），AI 研究实习生",
  "国际组织（联合国志愿人员组织）- UNDP，研究实习生（线上）",
  "美团，打零工",
  "2024.05 – 2025.07",
  "began my ACM journey. Looking forward to the challenges ahead! 🚀",
  "开启了我的 ACM 生涯。期待接下来的挑战！🚀",
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
    // CSS grid tracks and aspect ratios use the same slash notation as grades.
    // Exempt those declarations only; public copy and all privacy patterns stay checked.
    const checked = pattern === gradeLikeFraction
      ? content.replace(/\b(?:grid-row|grid-column|grid-area|aspect-ratio)\s*:[^;}]+[;}]/g, "")
      : content;
    if (pattern.test(checked)) {
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

const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const layout = source("src/layouts/BaseLayout.astro");
const home = source("src/views/HomePage.astro");
const sidebar = source("src/components/Sidebar.astro");
const timeline = source("src/components/Timeline.astro");
const education = source("src/components/Education.astro");
const publication = source("src/components/PublicationCard.astro");
const resources = source("src/components/ResourceLinks.astro");
const repoStars = source("src/components/RepoStars.astro");
const newsCard = source("src/components/NewsCard.astro");
const brandIcon = source("src/components/BrandIcon.astro");
const cvData = source("src/data/cv.ts");
const demo = source("src/components/AISafetyHotDemo.astro");
const visitor = source("src/components/VisitorMap.astro");
const stylesheet = source("src/styles/global.css");
const dateStyles = stylesheet.match(/time\s*,[^{}]*\.timeline-date[^{}]*\.education-period[^{}]*\.article-date\s*\{([^}]*)\}/)?.[1] || "";
const contracts = [
  ["shared styles keep the approved white system-font 15px base", /body\s*\{[^}]*background:\s*#(?:fff|ffffff)\s*;[^}]*font:\s*400\s+15px\//.test(stylesheet) && /--body:\s*-apple-system,[^;]*sans-serif/.test(stylesheet) && !/data-theme\s*=\s*["']dark|fonts\.googleapis\.com/.test(stylesheet + layout)],
  ["shared layout retains locale persistence without a theme toggle or theme preference", layout.includes("krico-locale") && !/ThemeToggle|krico-theme|data-theme-toggle/.test(layout)],
  ["home removes the hero, contribution graph, contacts, field notes, and skill groups", !/TypingHero|NeuralField|ContributionGraph|ContactLinks|FieldNotes|homeBlog|skills\.map\(|skill-groups|researchFocus|focusWords/.test(home)],
  ["sidebar no longer renders research focus tags", !/profile\.(?:interests|researchFocus|focusWords)|copy\.sidebar\.focus/.test(sidebar)],
  ["research collapse is opt-in and leaves other timelines expanded", /collapsible\s*=\s*false/.test(timeline) && /collapsible\s*\?\s*"details"\s*:\s*"article"/.test(timeline) && /<summary\b/.test(timeline)],
  ["research summary is optional in the shared timeline data type", /export type TimelineItem\s*=\s*\{[^}]*summary\?:\s*string/.test(cvData)],
  ["compact education is opt-in", /compact\s*=\s*false/.test(education)],
  ["sidebar selects contact brand icons by key instead of array position", sidebar.includes("BrandIcon") && /name=\{link\.icon\}/.test(sidebar) && !/contactIcons|link,\s*index|\[index\]/.test(sidebar)],
  ["brand icons expose a shared name, size, and class API and local brand assets", /name\??\s*:/.test(brandIcon) && /size\??\s*:/.test(brandIcon) && /class\??\s*:/.test(brandIcon) && /<img\b/.test(brandIcon) && brandIcon.includes("data-brand-icon") && !/src=["']https?:\/\//.test(brandIcon)],
  ["About includes three biography paragraphs, a plain-email callout, and the inline static total", home.includes("profile.researchInterests") && home.includes('class="internship-callout"') && home.includes("profile.contactNote") && home.includes("2.5k GitHub Stars") && !/mailto:|Repo Owner Stars|data-star-repo|about-metrics/.test(home)],
  ["News supports optional emoji data and renders accessible decorative item icons", /export type NewsItem\s*=\s*\{[^}]*emoji\?:\s*string/.test(cvData) && /item\.emoji/.test(newsCard) && newsCard.includes('class="news-item-emoji"') && newsCard.includes('aria-hidden="true"')],
  ["homepage publication variant omits dates, captions, and rating rows while retaining the figure badge", /variant\??\s*:/.test(publication) && publication.includes('variant === "home"') && publication.includes("!isHome") && publication.includes("publication-figure-badge") && /ratings\.join\(" · "\)/.test(publication) && publication.includes('"Preprint"') && home.includes('variant="home"')],
  ["publication titles render as bold plain semantic headings", /<h3>\s*(?:<strong>)?\{item\.title\}(?:<\/strong>)?\s*<\/h3>/.test(publication) && !publication.includes("publication-title-link") && /\.publication-details\s+h3\s*\{[^}]*font-weight:\s*700/.test(stylesheet + publication)],
  ["publication platform labels derive from exact URL hostnames", resources.includes('variant === "publication"') && resources.includes("new URL(url).hostname") && ["arxiv.org", "github.com", "huggingface.co"].every((host) => resources.includes(`"${host}"`)) && resources.includes("platform?.label ?? link.label")],
  ["live repository star badges retain grouped requests and cache validation", repoStars.includes('new Map<string, HTMLAnchorElement[]>()') && repoStars.includes("groups.forEach") && repoStars.includes("krico-github-stars:") && repoStars.includes("Number.isSafeInteger") && repoStars.includes("AbortSignal.timeout(6000)")],
  ["compact repository star badges remain opt-in with colored 26px styling", /variant\s*=\s*"plain"/.test(repoStars) && /variant\??:\s*"plain"\s*\|\s*"compact"/.test(repoStars) && repoStars.includes("repo-stars--compact") && /min-height:\s*26px/.test(repoStars) && /background:\s*color-mix\([^;]+--star-accent/.test(repoStars) && newsCard.includes('variant="compact"') && source("src/components/AISafetyHotProject.astro").includes('variant="compact"')],
  ["shared content links stay underlined and sidebar contacts remain plain", /\ba\s*\{[^}]*text-decoration:\s*underline/.test(stylesheet) && /\.sidebar-contact[^}]*\{[^}]*text-decoration:\s*none/.test(stylesheet)],
  ["dates retain body-sized ink-colored italic styling", [/font-style:\s*italic/, /font-size:\s*15px/, /color:\s*var\(--ink\)/].every((pattern) => pattern.test(dateStyles)) && /--ink:\s*#222(?:222)?\s*;/.test(stylesheet) && !/\.(?:news-list|post-card)\s+time\s*\{[^}]*(?:font-size:\s*(?:1[0-4]|[0-9])px|color:\s*var\(--muted\))/.test(stylesheet)],
  ["homepage publication figures use 360px columns without cropping", /\.publication-list--home[^{}]*\{[^}]*grid-template-columns:\s*360px\s+minmax\(0,\s*1fr\)/.test(stylesheet) && /\.publication-card--home\s+\.framework-preview\s+img\s*\{[^}]*height:\s*auto;[^}]*object-fit:\s*contain;[^}]*box-shadow:/.test(publication)],
  ["home renders all News in one scroll region", home.includes("news-scroll") && /news\.map\(/.test(home) && !/latestNews|olderNews|news-archive|news\.slice\(/.test(home)],
  ["News scroll height follows the approved desktop and mobile limits", /(?:max-)?height:\s*320px/.test(stylesheet + home) && /(?:max-)?height:\s*280px/.test(stylesheet + home)],
  ["News scroll window retains its pale background, border, and rounded corners", /\.news-scroll\s*\{[^}]*border:\s*1px\s+solid\s+#dce3eb;[^}]*border-radius:\s*10px;[^}]*background:\s*#f7f9fc/.test(stylesheet)],
  ["AISafetyHot displays its looping animation and a reduced-motion poster with no playback controls", /src=\{animation\}/.test(demo) && /<source\b[^>]*media="\(prefers-reduced-motion: reduce\)"[^>]*srcset=\{poster\}/.test(demo) && !/data-demo-toggle|<script\b/.test(demo)],
  ["visitor map waits for viewport proximity and retains the production guard", visitor.includes("IntersectionObserver") && /rootMargin:\s*["']300px(?: 0px)?["']/.test(visitor) && visitor.includes('location.hostname !== "kirito14it.github.io"')],
  ["visitor-map timeout starts inside the actual loading function", visitor.indexOf("window.setTimeout(unavailable") > visitor.indexOf("const loadMap =") && visitor.indexOf("const loadMap =") > visitor.indexOf('location.hostname !== "kirito14it.github.io"')],
  ["removed effect components have no remaining references", ["NeuralField", "TypingHero", "ContributionGraph"].every((component) => !fs.existsSync(path.join(root, `src/components/${component}.astro`)) && !joinedSource.includes(`@components/${component}.astro`))]
];
const contractFailures = contracts.filter(([, passed]) => !passed).map(([label]) => label);
if (contractFailures.length > 0) {
  console.error(`Simplified-site source contracts failed:\n${contractFailures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Content validation passed.");
