import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCvData } from "../src/data/cv.ts";
import { getProfile } from "../src/data/profile.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readRendered = (...parts) => fs.readFileSync(path.join(root, "dist", ...parts, "index.html"), "utf8");

const expectedRoutes = [
  [],
  ["cv"],
  ["projects"],
  ["projects", "mangrove-blue-carbon"],
  ["projects", "safecoderl"],
  ["projects", "sfmambanet"],
  ["projects", "vulnseeker"],
  ["projects", "watermark-mobile"],
  ["projects", "xsafeclaw"],
  ["blog"],
  ["blog", "website-launch"],
  ["blog", "logitech-mouse-freeze"],
  ["blog", "reviewer-centered-academic-writing"],
  ["zh"],
  ["zh", "cv"],
  ["zh", "projects"],
  ["zh", "projects", "mangrove-blue-carbon"],
  ["zh", "projects", "safecoderl"],
  ["zh", "projects", "sfmambanet"],
  ["zh", "projects", "vulnseeker"],
  ["zh", "projects", "watermark-mobile"],
  ["zh", "projects", "xsafeclaw"],
  ["zh", "blog"],
  ["zh", "blog", "website-launch"],
  ["zh", "blog", "logitech-mouse-freeze"],
  ["zh", "blog", "reviewer-centered-academic-writing"]
];

const missingRoutes = expectedRoutes.filter((parts) => !fs.existsSync(path.join(root, "dist", ...parts, "index.html")));
if (missingRoutes.length > 0) {
  console.error(`Rendered routes are missing:\n${missingRoutes.map((parts) => `- /${parts.join("/")}/`).join("\n")}`);
  process.exit(1);
}

const homepage = readRendered();
const cv = readRendered("cv");
const zhHomepage = readRendered("zh");
const zhCv = readRendered("zh", "cv");
const resumeManifest = JSON.parse(fs.readFileSync(path.join(root, "public/cv/resume-manifest.json"), "utf8"));
const sfmambaProject = readRendered("projects", "sfmambanet");
const zhSfmambaProject = readRendered("zh", "projects", "sfmambanet");
const zhProject = readRendered("zh", "projects", "xsafeclaw");
const zhBlog = readRendered("zh", "blog", "website-launch");
// Match complete elements, including nested instances of the same tag. This
// keeps disclosure content and semantic heading markup visible to assertions.
const elements = (html, tag, accepts = () => true) => {
  const matches = [];
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, "g");
  const stack = [];
  for (const token of html.matchAll(tokens)) {
    if (!token[0].startsWith("</")) {
      stack.push({ start: token.index, opening: token[0] });
      continue;
    }
    const opening = stack.pop();
    if (opening && accepts(opening.opening)) matches.push(html.slice(opening.start, token.index + token[0].length));
  }
  return matches;
};
const hasClass = (opening, className) => (opening.match(/\bclass="([^"]*)"/)?.[1] || "").split(/\s+/).includes(className);
const section = (html, id) => elements(html, "section", (opening) => opening.includes(`id="${id}"`))[0] || "";
const textContent = (html) => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const attribute = (html, name) => textContent(html.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || "");
const classElements = (html, tag, className) => elements(html, tag, (opening) => hasClass(opening, className));
const calloutOf = (html) => classElements(section(html, "about"), "aside", "internship-callout")[0] || "";
const biographyParagraphs = (html) => elements(section(html, "about"), "p").filter((paragraph) => !calloutOf(html).includes(paragraph));
const imageTags = (html) => html.match(/<img\b[^>]*>/g) || [];
const hasLocalIcon = (html) => imageTags(html).some((img) => attribute(img, "src").startsWith("/") && fs.existsSync(path.join(root, "dist", attribute(img, "src"))));
const headingTexts = (html, level) => elements(html, `h${level}`).map(textContent);
const sidebarOf = (html) => elements(html, "aside")[0] || "";
const navWithClass = (html, className) => elements(html, "nav", (opening) => hasClass(opening, className))[0] || "";
const hasLabeledLink = (html, href, label) => elements(html, "a", (opening) => opening.includes(`href="${href}"`)).some((link) => textContent(link) === label);
const profileCard = homepage.match(/<a[^>]*data-profile-card[\s\S]*?<\/a>/)?.[0] || "";
const acmerLogo = profileCard.match(/<div[^>]*data-acmer-logo[\s\S]*?<\/div>/)?.[0] || "";
const researchSection = section(homepage, "research-experience");
const zhResearchSection = section(zhHomepage, "research-experience");
const workSection = section(homepage, "work-experience");
const zhWorkSection = section(zhHomepage, "work-experience");
const homeShortcutNav = navWithClass(homepage, "quick-jump-nav");
const zhHomeShortcutNav = navWithClass(zhHomepage, "quick-jump-nav");
const homeSectionOrder = ["about", "news", "publications", "projects", "education", "work-experience", "research-experience", "awards-skills", "services", "acknowledgements", "visitors"];
const followsHomeSectionOrder = (ids) => JSON.stringify(ids) === JSON.stringify(homeSectionOrder);
const homeShortcutOrder = homeSectionOrder.filter((id) => id !== "visitors");
const meteorMarkup = homepage.match(/<div class="meteor-shower">([\s\S]*?)<\/div>/)?.[1] || "";
const meteorCount = (meteorMarkup.match(/<span style=/g) || []).length;
const newsCards = (html) => elements(section(html, "news"), "article");
const enNews = newsCards(homepage);
const zhNews = newsCards(zhHomepage);
const acmStartNewsCard = enNews.find((card) => elements(card, "time").some((time) => textContent(time) === "2024.05")) || "";
const acmRetirementNewsCard = enNews.find((card) => elements(card, "time").some((time) => textContent(time) === "2025.07")) || "";
const submissionTitles = [
  "MemHarmBench: Evaluating Cross-Session Prompt Injection in Memory-Persistent AI Agents",
  "CST: Lightweight Risk Triage with Source-Grounded Evidence for Web Discussions"
];
const socialProfileUrls = [
  "https://www.douyin.com/user/MS4wLjABAAAAUGvPhZRE2l6SIkWl-UGmjqijJv1pQ_63oDcA7cMT-kg",
  "https://www.xiaohongshu.com/user/profile/639c0cc20000000026005bed"
];
const starRepos = ["wuyoscar/AISafetyHot", "Kirito14IT/prompt-spider-ui", "XSafeAI/XSafeClaw"];
const hasStarBadge = (html, repo) => html.includes(`data-star-repo="${repo}"`) && html.includes(`href="https://github.com/${repo}/stargazers"`) && html.includes(`src="https://img.shields.io/github/stars/${repo}?`);
const demoAssets = ["observatory.gif", "observatory-poster.webp"];
const projectShowcases = [homepage, zhHomepage].map((html) => section(html, "projects")).concat(readRendered("projects"), readRendered("zh", "projects"));
const newPaperResources = [
  { title: submissionTitles[0], paper: "https://arxiv.org/abs/2611.01700", code: "https://github.com/Kirito14IT/MemHarmBench" },
  { title: submissionTitles[1], paper: "https://arxiv.org/abs/2611.01710", code: "https://github.com/Kirito14IT/CST-MIL" }
];
const publicationCards = (html) => elements(html, "article", (opening) => hasClass(opening, "publication-card"));
const publicationCard = (html, title) => publicationCards(html).find((card) => card.includes(title)) || "";
const octoberReleaseCard = (cards, title, date) => cards.find((card) => card.includes(title) && card.includes(date)) || "";
const recommendationImage = "/news/memharmbench-alpha-sight-recommendation-20261104.png";
const labHeadUrl = "https://baike.baidu.com/item/%E5%A7%9C%E8%82%B2%E5%88%9A/22131913";
const timelineCards = (html) => ["article", "details"].flatMap((tag) => elements(html, tag, (opening) => hasClass(opening, "timeline-item")));
const privatePage = readRendered("zh", "intern");
const privateAssets = [...privatePage.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.(?:js|css))"/g)].map((match) => fs.readFileSync(path.join(root, "dist", match[1]), "utf8"));
const renderedPages = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return renderedPages(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
const publicPages = renderedPages(path.join(root, "dist"))
  .filter((file) => !file.includes(path.join("dist", "zh", "intern")))
  .map((file) => fs.readFileSync(file, "utf8"));
const emailLike = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
const expectedCredits = [
  { authors: ["Zhihua Wang", "Yunhao Feng", "Yifeng Gao", "Rui Pan", "Baiheng Zhao", "Zixing Chen", "Xingjun Ma"], correspondingAuthor: "Xingjun Ma", date: "2026.11.01", roles: ["First author", "第一作者"] },
  { authors: ["Zhihua Wang", "Yifeng Gao", "Yunhao Feng", "Rui Pan", "Baiheng Zhao", "Zixing Chen", "Nan Li"], correspondingAuthor: "Yifeng Gao", date: "2026.11.01", roles: ["First author", "第一作者"] },
  { authors: ["Nan Li", "Zhihua Wang", "Ziyang Chen", "Yunhao Feng", "Songyang Wu"], homepageAuthors: ["Zhihua Wang", "Nan Li", "Ziyang Chen", "Yunhao Feng", "Songyang Wu"], coFirstAuthors: ["Nan Li", "Zhihua Wang"], correspondingAuthor: "Songyang Wu", date: "2026.08", roles: ["Co-first author", "共同第一作者"] },
  { authors: ["Zhihua Wang", "Junfan Chen", "Zixiang Wei", "Lan Lin", "Guoxiang Tong"], correspondingAuthor: "Guoxiang Tong", date: "2026.06.02", roles: ["First author", "第一作者"] },
  { authors: ["Zhihua Wang", "Yanping Li", "Yizhang Liu"], homepageAuthors: ["Zhihua Wang", "Yifeng Gao", "Yanping Li", "Yizhang Liu"], correspondingAuthor: "Yanping Li", date: "2026.06.03", roles: ["First author", "第一作者"] },
  { authors: ["Zhihua Wang"], date: "2026", roles: ["Sole author", "独立作者"] }
];
const expectedPublicationResources = [
  { url: "https://arxiv.org/abs/2611.01700", links: ["https://arxiv.org/abs/2611.01700", "https://github.com/Kirito14IT/MemHarmBench", "https://huggingface.co/datasets/kirco567/MemHarmBench"] },
  { url: "https://arxiv.org/abs/2611.01710", links: ["https://arxiv.org/abs/2611.01710", "https://github.com/Kirito14IT/CST-MIL"] },
  { url: "/papers/scamweb.pdf", links: ["/papers/scamweb.pdf", "https://github.com/Kirito14IT/ScamWeb", "https://huggingface.co/datasets/kirco567/ScamWeb-Dataset"] },
  { url: "/papers/safecoderl.pdf", links: [] },
  { url: "https://doi.org/10.48550/arXiv.2606.04493", links: ["https://arxiv.org/abs/2606.04493", "https://github.com/Kirito14IT/SFMambaNet"] },
  { url: "/papers/mangrove-paper.pdf", links: ["/papers/mangrove-paper.pdf", "/papers/unv-certificate.pdf", "/papers/unv-thanks.pdf", "/papers/unv-assignment.pdf"] }
];
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const canonicalPaperUrl = (url) => url.replace(/^https:\/\/doi\.org\/10\.48550\/arxiv\./i, "https://arxiv.org/abs/");
const resourceLinksOf = (html) => classElements(html, "a", "publication-resource-link");
const paperPaths = ["mangrove-paper", "unv-certificate", "unv-thanks", "unv-assignment", "safecoderl", "scamweb"].map((name) => `/papers/${name}.pdf`);
const paperFilesMatchBuild = () => paperPaths.every((url) => {
  const original = path.join(root, "public", url);
  const published = path.join(root, "dist", url);
  if (!fs.existsSync(original) || !fs.existsSync(published)) return false;
  const sourceBytes = fs.readFileSync(original);
  return sourceBytes.subarray(0, 5).toString() === "%PDF-" && sourceBytes.equals(fs.readFileSync(published));
});
const publicationMetadataMatches = (html, locale, isHome) => {
  const publications = getCvData(locale).publications;
  return publicationCards(html).length === publications.length && publications.every((item) => {
    const card = publicationCard(html, item.title);
    const authors = isHome ? item.homepageAuthors ?? item.authors : item.authors;
    const expectedAuthorLine = authors.map((author) => `${author}${item.coFirstAuthors?.includes(author) ? "*" : ""}${item.correspondingAuthor === author ? "†" : ""}`).join(", ");
    const authorLine = elements(card, "p", (opening) => hasClass(opening, "publication-authors"))[0] || "";
    const ratings = isHome ? item.homepageRatings ?? item.ratings : item.ratings;
    const ratingGroup = elements(card, "div", (opening) => hasClass(opening, "rating-pills"))[0] || "";
    const figureBadge = classElements(card, "span", "publication-figure-badge")[0] || "";
    const metadata = elements(card, "p", (opening) => hasClass(opening, "muted") && !hasClass(opening, "publication-author-notes"))[0] || "";
    const figure = elements(card, "figure")[0] || "";
    const datesMatch = isHome
      ? !/<time\b|<figcaption\b/.test(card) && !ratingGroup && textContent(figureBadge) === (ratings?.length ? ratings.join(" · ") : "Preprint")
      : card.includes(`datetime="${item.date.replaceAll(".", "-")}"`) && equal(elements(ratingGroup, "span").map(textContent), ratings ?? []) && !figureBadge && elements(figure, "figcaption").length === 1;
    return textContent(authorLine) === expectedAuthorLine &&
      elements(authorLine, "strong").some((author) => textContent(author) === "Zhihua Wang") &&
      textContent(metadata) === `${item.role} · ${isHome ? item.homepageStatus ?? item.status : item.status}${isHome ? "" : ` · ${item.date}`}` &&
      datesMatch &&
      (!item.url || resourceLinksOf(card).some((link) => canonicalPaperUrl(attribute(link, "href")) === canonicalPaperUrl(item.url))) &&
      (item.links ?? []).every(({ url }) => card.includes(`href="${url}"`)) &&
      (!item.frameworkImage || imageTags(figure).some((img) => attribute(img, "src") === item.frameworkImage && attribute(img, "alt") === item.frameworkAlt));
  });
};

const checks = [
  ["all six research PDFs are published intact from the site assets", paperFilesMatchBuild()],
  ["only ScamWeb configures official rolling-30-day dataset downloads", ["en", "zh"].every((locale) => { const items = getCvData(locale).publications.filter((item) => item.datasetDownloads); return items.length === 1 && items[0].title.startsWith("ScamWeb:") && items[0].datasetDownloads.repo === "kirco567/ScamWeb-Dataset" && items[0].datasetDownloads.fallback === 839; })],
  ["ScamWeb renders Paper, GitHub, Hugging Face, and its localized adjacent download count", [[homepage, "Downloads (30d)"], [cv, "Downloads (30d)"], [zhHomepage, "近30天下载"], [zhCv, "近30天下载"]].every(([html, label]) => { const card = publicationCards(html).find((item) => item.includes("ScamWeb:")) || ""; const row = classElements(card, "div", "resource-links")[0] || ""; const badges = classElements(row, "div", "dataset-downloads"); return equal(resourceLinksOf(row).map((link) => attribute(link, "href")), ["/papers/scamweb.pdf", "https://github.com/Kirito14IT/ScamWeb", "https://huggingface.co/datasets/kirco567/ScamWeb-Dataset"]) && hasLabeledLink(row, "/papers/scamweb.pdf", "Paper") && badges.length === 1 && badges[0].includes('data-hf-dataset="kirco567/ScamWeb-Dataset"') && textContent(badges[0]).includes(label) && textContent(badges[0]).includes("839") && row.indexOf('data-hf-dataset=') > row.indexOf('href="https://huggingface.co/datasets/kirco567/ScamWeb-Dataset"') && !card.includes("anonymous.4open.science"); })],
  ["News resource rows use official arXiv and GitHub icons with canonical labels", [enNews, zhNews].every((cards) => { const links = cards.flatMap((card) => classElements(card, "div", "resource-links").flatMap((group) => elements(group, "a"))).filter((link) => /https:\/\/(?:arxiv\.org|github\.com)\//.test(attribute(link, "href"))); return links.length >= 6 && links.every((link) => { const github = attribute(link, "href").startsWith("https://github.com/"); return textContent(link) === (github ? "GitHub" : "arXiv") && link.includes(`data-brand-icon="${github ? "github" : "arxiv"}"`) && hasLocalIcon(link); }); })],
  ["National Day open-source News thanks collaborators in both languages", [[enNews, "Many thanks to my collaborators for their support and ideas."], [zhNews, "感谢合作者的支持与启发。"]].every(([cards, thanks]) => cards.some((card) => textContent(card).includes(thanks) && card.includes('href="https://github.com/wuyoscar/AISafetyHot"') && card.includes('href="https://github.com/Kirito14IT/prompt-spider-ui"')))],
  ["international-organization publication provides four local documents", [[homepage, "en"], [cv, "en"], [zhHomepage, "zh"], [zhCv, "zh"]].every(([html, locale]) => { const card = publicationCards(html).find((item) => item.includes("Research Support in Analysing Mangrove")) || ""; const labels = locale === "zh" ? ["Paper", "证书", "感谢信", "任务书"] : ["Paper", "Certificate", "Thanks", "Assignment"]; return resourceLinksOf(card).length === 4 && paperPaths.slice(0, 4).every((url, index) => hasLabeledLink(card, url, labels[index])) && !card.includes('href="https://www.undp.org/"'); })],
  ["About places nonlinked GitHub and ICPC marks inline and links only the USST abbreviation", [homepage, zhHomepage].every((html) => { const about = section(html, "about"); const first = biographyParagraphs(html)[0] || ""; return !about.includes("about-metrics") && !first.includes('href="#awards-skills"') && classElements(first, "span", "about-stat-badge").length === 1 && first.includes('data-brand-icon="github"') && first.includes('data-brand-icon="icpc"') && hasLabeledLink(first, "https://www.usst.edu.cn/", "USST") && !elements(first, "strong").some((item) => /University of Shanghai for Science and Technology|上海理工大学光电信息与计算机工程学院/.test(textContent(item))); })],
  ["About emphasizes the linked FVL director and vice-president role", [homepage, zhHomepage].every((html) => { const first = biographyParagraphs(html)[0] || ""; return elements(first, "strong").some((item) => /Yu-Gang Jiang.*Vice President|姜育刚.*副校长/.test(textContent(item))) && first.includes(`href="${labHeadUrl}"`); })],
  ["research introductions stay plain while topics remain bold and the two smiles match", [homepage, zhHomepage].every((html) => { const interests = biographyParagraphs(html)[2] || ""; const topics = elements(interests, "strong").map(textContent); return topics.length === 1 && /foundation models|基座大模型/.test(topics[0]) && !/My research interests include|我的研究兴趣包括/.test(topics[0]) && textContent(interests).endsWith("🙂（：") && textContent(calloutOf(html)).endsWith("：）"); })],
  ["Carey branding appears in bilingual home and CV titles and sidebars", [homepage, zhHomepage, cv, zhCv].every((html) => sidebarOf(html).includes('<h1>Carey</h1>') && /<title>[^<]*Carey[^<]*<\/title>/.test(html) && !html.includes('>Krico<'))],
  ["both CV pages expose the versioned PDFs and download actions", [cv, zhCv].every((html) => Object.values(resumeManifest.resumes).every((resume) => html.includes(`${resume.path}?v=${resume.sha256.slice(0, 12)}`)) && (html.match(/class="resume-preview\b/g) || []).length === 2 && (html.match(/download="/g) || []).length === 3)],
  ["primary downloads retain the requested filenames", [cv, zhCv].every((html) => html.includes('download="ZhihuaWang_cv_en.pdf"') && html.includes('download="ZhihuaWang_cv_cn.pdf"'))],
  ["detailed PDF preview stays in a closed disclosure and inert template", [cv, zhCv].every((html) => /<details[^>]*data-detailed-resume/.test(html) && !/<details[^>]*\bopen\b[^>]*data-detailed-resume/.test(html) && /<template[^>]*data-detailed-template[^>]*>[\s\S]*?<iframe/.test(html))],
  ["published PDF copies match the resume manifest", Object.values(resumeManifest.resumes).every((resume) => createHash("sha256").update(fs.readFileSync(path.join(root, "dist", resume.path))).digest("hex") === resume.sha256)],
  ["homepage and CV sidebars retain localized CV links", [homepage, cv].every((html) => hasLabeledLink(sidebarOf(html), "/cv/", "CV")) && [zhHomepage, zhCv].every((html) => hasLabeledLink(sidebarOf(html), "/zh/cv/", "简历"))],
  ["all inner public Astro pages retain the four plain localized page links", expectedRoutes.filter((parts) => parts.length > 0 && parts.join("/") !== "zh").every((parts) => { const locale = parts[0] === "zh" ? "zh" : "en"; const prefix = locale === "zh" ? "/zh" : ""; const labels = locale === "zh" ? ["首页", "简历", "项目", "博客"] : ["Home", "CV", "Projects", "Blog"]; const nav = navWithClass(readRendered(...parts), "site-navigation"); return equal(elements(nav, "a").map(textContent), labels) && ["/", "/cv/", "/projects/", "/blog/"].every((href, index) => hasLabeledLink(nav, `${prefix}${href}`, labels[index])); })],
  ["home sections and their shortcuts follow the approved content order", [
    [homepage, homeShortcutNav],
    [zhHomepage, zhHomeShortcutNav]
  ].every(([html, nav]) =>
    followsHomeSectionOrder([...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(([, id]) => id)) &&
    JSON.stringify([...nav.matchAll(/href="#([^"]+)"/g)].map(([, id]) => id).filter((id) => id !== "home")) === JSON.stringify(homeShortcutOrder)
  )],
  ["duplicate homepage project cards are removed", [homepage, zhHomepage].every((html) => !(html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] || "").includes('class="card-grid"'))],
  ["News scroll region contains all entries with keyboard access and no archive disclosure", [[homepage, "en"], [zhHomepage, "zh"]].every(([html, locale]) => { const news = section(html, "news"); const scroll = elements(news, "div", (opening) => hasClass(opening, "news-scroll"))[0] || ""; const opening = scroll.match(/^<div\b[^>]*>/)?.[0] || ""; const cards = newsCards(html); return /role="region"/.test(opening) && /tabindex="0"/.test(opening) && /aria-label="[^"]+"/.test(opening) && cards.length === getCvData(locale).news.length && elements(scroll, "article").length === cards.length && !news.includes("news-archive"); })],
  ["News uses a fire heading and preserves all seventeen item-specific decorative emoji", [[homepage, "en"], [zhHomepage, "zh"]].every(([html, locale]) => { const items = getCvData(locale).news; const cards = newsCards(html); return headingTexts(section(html, "news"), 2)[0]?.startsWith("🔥") && items.length === 17 && cards.length === items.length && cards.every((card, index) => { const icons = classElements(card, "span", "news-item-emoji"); return icons.length === Number(Boolean(items[index].emoji)) && (!items[index].emoji || textContent(icons[0]) === items[index].emoji && icons[0].includes('aria-hidden="true"')); }) && cards.filter((card) => elements(card, "strong").length).length >= 10; })],
  ["homepage publication headings use the approved bilingual wording", headingTexts(section(homepage, "publications"), 2).some((heading) => heading.endsWith("Preprints and Publications")) && headingTexts(section(zhHomepage, "publications"), 2).some((heading) => heading.endsWith("预印本与论文"))],
  ["home research has eight default-closed native disclosures with exact dated summaries", [[homepage, "en"], [zhHomepage, "zh"]].every(([html, locale]) => { const cards = elements(section(html, "research-experience"), "details", (opening) => hasClass(opening, "timeline-item")); const items = getCvData(locale).experiences; return cards.length === 8 && items.length === 8 && cards.every((card, index) => { const opening = card.match(/^<details\b[^>]*>/)?.[0] || ""; const summary = elements(card, "summary")[0] || ""; const parts = elements(summary, "span").map(textContent); return !/\s(?:open|name)(?:[\s=>])/.test(opening) && /<summary\b/.test(card.replace(/^<details\b[^>]*>\s*/, "").slice(0, 30)) && equal(parts, [items[index].period, items[index].summary]) && !/<(?:a|button)\b/.test(summary) && textContent(card).includes(items[index].title); }); })],
  ["compact education is homepage-only, graduate-first, and preserves schools, degrees, and periods", [[homepage, cv, "en"], [zhHomepage, zhCv, "zh"]].every(([html, cvHtml, locale]) => { const education = section(html, "education"); const rows = elements(education, "li").map(textContent); const items = [...getCvData(locale).education].sort((a, b) => b.period.localeCompare(a.period)); return items.length === 2 && equal(rows, items.map((item) => `${item.period} ${item.institution} · ${item.degree}`)) && education.includes('class="education-compact"') && !education.includes('class="timeline-card"') && !cvHtml.includes('class="education-compact"'); })],
  ["work and full CV timelines stay expanded within their existing CV disclosure", [workSection, zhWorkSection, cv, zhCv].every((html) => !elements(html, "details", (opening) => hasClass(opening, "timeline-item")).length)],
  ["publication author order, roles, correspondence, co-first marks, and dates retain approved facts", ["en", "zh"].every((locale, localeIndex) => { const items = getCvData(locale).publications; return items.length === expectedCredits.length && items.every((item, index) => { const expected = expectedCredits[index]; return equal(item.authors, expected.authors) && equal(item.homepageAuthors, expected.homepageAuthors) && equal(item.coFirstAuthors, expected.coFirstAuthors) && item.correspondingAuthor === expected.correspondingAuthor && item.date === expected.date && item.role === expected.roles[localeIndex]; }); })],
  ["publication metadata preserves homepage overrides, accessible figures, and full-CV dates and ratings", [[homepage, "en", true], [zhHomepage, "zh", true], [cv, "en", false], [zhCv, "zh", false]].every(([html, locale, isHome]) => publicationMetadataMatches(html, locale, isHome))],
  ["publication source URLs stay within the approved resources", ["en", "zh"].every((locale) => getCvData(locale).publications.every((item, index) => { const expected = expectedPublicationResources[index]; const links = (item.links ?? []).map(({ url }) => url); return item.url === expected.url && expected.links.every((url) => links.includes(url)) && links.every((url) => [...expected.links, expected.url].includes(url)); }))],
  ["publication titles remain plain semantic headings in home and full CV", [[homepage, "en"], [zhHomepage, "zh"], [cv, "en"], [zhCv, "zh"]].every(([html, locale]) => getCvData(locale).publications.every((item) => { const heading = elements(publicationCard(html, item.title), "h3")[0] || ""; return textContent(heading) === item.title && !/<a\b/.test(heading); }))],
  ["author-symbol explanations appear only on cards whose visible authors use them", [[homepage, "en", true], [zhHomepage, "zh", true], [cv, "en", false], [zhCv, "zh", false]].every(([html, locale, isHome]) => !html.includes("publication-author-legend") && getCvData(locale).publications.every((item) => { const authors = isHome ? item.homepageAuthors ?? item.authors : item.authors; const coFirst = authors.some((author) => item.coFirstAuthors?.includes(author)); const corresponding = authors.includes(item.correspondingAuthor); const card = publicationCard(html, item.title); const authorLine = classElements(card, "p", "publication-authors")[0] || ""; const notes = classElements(card, "p", "publication-author-notes"); const text = textContent(notes[0] || ""); return notes.length === Number(coFirst || corresponding) && text.includes("*") === coFirst && text.includes("†") === corresponding && (!coFirst || /Co-first author|共同第一作者/.test(text)) && (!corresponding || /Corresponding author|通讯作者/.test(text)) && (!notes.length || card.indexOf(notes[0]) > card.indexOf(authorLine)); }))],
  ["publication resource labels and official or portrait PDF icons match actual URLs without duplicates", [homepage, zhHomepage, cv, zhCv].every((html) => publicationCards(html).every((card) => { const links = resourceLinksOf(card); const urls = links.map((link) => canonicalPaperUrl(attribute(link, "href"))); return urls.length === new Set(urls).size && links.every((link) => { const parsed = new URL(attribute(link, "href"), "https://kirito14it.github.io"); const host = parsed.hostname.toLowerCase().replace(/^www\./, ""); const platform = { "arxiv.org": ["arXiv", "arxiv"], "github.com": ["GitHub", "github"], "huggingface.co": ["Hugging Face", "huggingface"] }[host]; if (platform) return textContent(link) === platform[0] && link.includes(`data-brand-icon="${platform[1]}"`) && hasLocalIcon(link); const pdfIcon = imageTags(link).find((img) => attribute(img, "data-brand-icon") === "pdf"); return !/^(?:arXiv|GitHub|Hugging Face)$/.test(textContent(link)) && (parsed.pathname.toLowerCase().endsWith(".pdf") ? Boolean(pdfIcon) && attribute(pdfIcon, "src") === "/brand-icons/pdf.png" && attribute(pdfIcon, "height") === "16" && attribute(pdfIcon, "width") === "13" && hasLocalIcon(link) : !pdfIcon); }); }))],
  ["web CV remains optional behind a collapsed disclosure", [cv, zhCv].every((html) => /<details class="web-cv\b/.test(html) && !/<details[^>]*class="web-cv[^>]*\bopen\b/.test(html))],
  ["About retains three approved biography paragraphs and a separate internship callout", [[homepage, "en"], [zhHomepage, "zh"]].every(([html, locale]) => { const about = section(html, "about"); const profile = getProfile(locale); const paragraphs = biographyParagraphs(html).map(textContent); const callout = calloutOf(html); return paragraphs.length === 3 && paragraphs[0] === profile.bio && paragraphs[0].startsWith("Hello!") && paragraphs[2] === `${profile.researchInterests} 🙂（：` && headingTexts(callout, 3).some((heading) => heading.endsWith(profile.internshipSearch.title)) && textContent(callout).includes(profile.contactNote) && textContent(callout).includes(profile.email) && hasLabeledLink(callout, locale === "zh" ? "/zh/cv/" : "/cv/", locale === "zh" ? "简历" : "CV") && elements(callout, "strong").some((strong) => /foundation models|基座大模型/.test(textContent(strong))) && !about.includes("mailto:"); })],
  ["homepages omit Blog content while inner pages retain localized Blog navigation", hasLabeledLink(navWithClass(cv, "site-navigation"), "/blog/", "Blog") && hasLabeledLink(navWithClass(zhCv, "site-navigation"), "/zh/blog/", "博客") && [homepage, zhHomepage].every((html) => !html.includes('id="field-notes"') && !html.includes('href="#field-notes"'))],
  ["both new papers retain their resources while only homepages omit submission venues", [
    [homepage, false],
    [zhHomepage, false],
    [cv, true],
    [zhCv, true]
  ].every(([html, showSubmissionVenue]) => newPaperResources.every(({ title, paper, code }) => {
    const card = publicationCard(html, title);
    return card.includes(`href="${paper}"`) && card.includes(`href="${code}"`) &&
      card.includes("WWW 2027") === showSubmissionVenue && /arXiv preprint|arXiv 预印本/.test(card);
  }))],
  ["new publication links use safe external targets", [homepage, zhHomepage, cv, zhCv].every((html) => newPaperResources.every(({title}) => (publicationCard(html, title).match(/<a\b[^>]*>/g) || []).every((link) => link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'))))],
  ["all MemHarmBench cards use the original English Figure 1", [homepage, cv, zhHomepage, zhCv].every((html) => { const card = publicationCard(html, submissionTitles[0]); return card.includes('src="/figures/memharmbench-cross-session-en.webp"') && !card.includes('memharmbench-cross-session-zh.webp') && card.includes('loading="lazy"'); })],
  ["original English MemHarmBench figure is published", fs.existsSync(path.join(root, "dist", "figures", "memharmbench-cross-session-en.webp"))],
  ["CST publication cards share the original figure while full CV retains its caption", fs.existsSync(path.join(root, "dist/figures/cst-framework-original.png")) && [homepage, cv, zhHomepage, zhCv].every((html) => { const card = publicationCard(html, submissionTitles[1]); return card.includes('src="/figures/cst-framework-original.png"') && card.includes('loading="lazy"'); }) && [cv, zhCv].every((html) => /Original figure from the paper|论文原图/.test(elements(publicationCard(html, submissionTitles[1]), "figcaption")[0] || ""))],
  ["combined MemHarmBench and CST research card retains dates, affiliations, advisors, and both project resources", [[homepage, "2026.08 – 2026.11", "Xingjun Ma", "Yu-Gang Jiang (Vice President, Fudan University)", "Shanghai Innovation Institute"], [zhHomepage, "2026.08 – 2026.11", "马兴军", "姜育刚（复旦大学副校长）", "上海创智学院"]].every(([html, period, advisor, head, institute]) => { const cards = timelineCards(section(html, "research-experience")); const combined = cards.filter((card) => headingTexts(card, 3).some((title) => /MemHarmBench.*CST/.test(title))); return combined.length === 1 && [period, advisor, head, institute, "FVL", "TEAI", ...newPaperResources.flatMap(({paper, code}) => [`href="${paper}"`, `href="${code}"`])].every((value) => combined[0].includes(value)); })],
  ["lab director remains linked in About and full CV education", [[homepage, cv, "Lab Director", "Yu-Gang Jiang (Vice President, Fudan University)"], [zhHomepage, zhCv, "实验室负责人", "姜育刚（复旦大学副校长）"]].every(([html, cvHtml, label, head]) => { const education = section(cvHtml, "education"); return section(html, "about").includes(`href="${labHeadUrl}"`) && education.includes(label) && education.includes(head) && education.includes(`href="${labHeadUrl}"`); })],
  ["bilingual homepages omit the learning map and percentage cards", [homepage, zhHomepage].every((html) => !html.includes('id="learning-map"') && !html.includes('class="learning-grid"') && !html.includes('class="progress-track"')) && !homepage.includes("Knowledge progress") && !zhHomepage.includes("知识进展")],
  ["standalone blog pages and navigation use Blog and 博客", headingTexts(readRendered("blog"), 1).includes("Blog") && headingTexts(readRendered("zh", "blog"), 1).includes("博客") && hasLabeledLink(navWithClass(cv, "site-navigation"), "/blog/", "Blog") && hasLabeledLink(navWithClass(zhCv, "site-navigation"), "/zh/blog/", "博客") && !zhHomepage.includes("技术博客")],
  ["all 26 public Astro routes are generated", expectedRoutes.length === 26],
  ["English root uses the correct lang", homepage.includes('<html lang="en"')],
  ["Chinese root uses the correct lang", zhHomepage.includes('<html lang="zh-CN"')],
  ["public social profiles appear in bilingual home and CV sidebars", [homepage, zhHomepage, cv, zhCv].every((html) => socialProfileUrls.every((url) => html.includes(`href="${url}"`)) && !html.includes("https://www.douyin.com/user/self"))],
  ["homepages show social profiles once in the sidebar", [homepage, zhHomepage].every((html) => socialProfileUrls.every((url) => sidebarOf(html).includes(`href="${url}"`) && html.split(`href="${url}"`).length - 1 === 1))],
  ["social labels retain localized Douyin and shared RedNote naming", hasLabeledLink(sidebarOf(homepage), socialProfileUrls[0], "Douyin") && hasLabeledLink(sidebarOf(homepage), socialProfileUrls[1], "RedNote") && hasLabeledLink(sidebarOf(zhHomepage), socialProfileUrls[0], "抖音") && hasLabeledLink(sidebarOf(zhHomepage), socialProfileUrls[1], "RedNote")],
  ["seven profile contacts use their matching keyed icons in both home and CV sidebars", [[homepage, "en"], [cv, "en"], [zhHomepage, "zh"], [zhCv, "zh"]].every(([html, locale]) => { const profile = getProfile(locale); const sidebar = sidebarOf(html); const links = classElements(sidebar, "a", "sidebar-contact"); return profile.links.length === 7 && equal([...profile.links.map(({icon}) => icon)].sort(), ["email", "github", "scholar", "linkedin", "x", "douyin", "rednote"].sort()) && links.length === 8 && profile.links.every((item) => links.some((link) => attribute(link, "href") === item.url && textContent(link) === item.label && link.includes(`data-brand-icon="${item.icon}"`))); })],
  ["Google Scholar remains in the sidebar with no duplicate home contact panel", [homepage, zhHomepage].every((html) => {
    const link = 'href="https://scholar.google.com/citations?user=MyweXYYAAAAJ"';
    return sidebarOf(html).includes(link) && html.split(link).length === 2 && !html.includes('class="direct-link-list"');
  })],
  ["duplicate XSafeClaw links are removed from sidebars and direct contact lists", [homepage, zhHomepage, cv, zhCv].every((html) => !(html.match(/<aside\b[\s\S]*?<\/aside>/)?.[0] || "").includes('href="https://github.com/XSafeAI/XSafeClaw"')) && [homepage, zhHomepage].every((html) => !(html.match(/<div class="direct-link-list">[\s\S]*?<\/div>/)?.[0] || "").includes('href="https://github.com/XSafeAI/XSafeClaw"'))],
  ["bilingual homepages omit the standalone contact panel", [homepage, zhHomepage].every((html) => !html.includes('id="contact"') && !html.includes('class="representative-links"') && sidebarOf(html).includes('href="mailto:wzh2657751462@gmail.com"'))],
  ["English About keeps linked incoming and undergraduate affiliations, open-source total, and concise ACM award", (() => { const about = section(homepage, "about"); const text = textContent(biographyParagraphs(homepage)[0] || ""); return ["incoming CS master's student", "Xingjun Ma", "Yu-Gang Jiang", "School of Optical-Electrical and Computer Engineering", "2023–2027", "2.5k GitHub Stars", "ACM silver medal"].every((value) => text.includes(value)) && ["https://www.usst.edu.cn/", "https://www.fudan.edu.cn/", "http://xingjunma.com/", "https://fvl.fudan.edu.cn/", "https://teai.fudan.edu.cn/"].every((url) => about.includes(`href="${url}`)); })()],
  ["Chinese About keeps linked incoming and undergraduate affiliations, open-source total, and concise ACM award", (() => { const about = section(zhHomepage, "about"); const text = textContent(biographyParagraphs(zhHomepage)[0] || ""); return ["准硕士生", "马兴军", "姜育刚", "上海理工大学光电信息与计算机工程学院", "2023–2027", "2.5k GitHub Stars", "ACM 银奖"].every((value) => text.includes(value)) && ["https://www.usst.edu.cn/", "https://www.fudan.edu.cn/", "http://xingjunma.com/", "https://fvl.fudan.edu.cn/", "https://teai.fudan.edu.cn/"].every((url) => about.includes(`href="${url}`)); })()],
  ["About's second paragraph preserves the MPS internship and PhD collaborator facts", [homepage, zhHomepage].every((html) => { const paragraph = biographyParagraphs(html)[1] || ""; const text = textContent(paragraph); return ["Nan Li", "Web Agent", "LLM", "Yutao Wu", "Yunhao Feng"].every((value) => text.includes(value)) && /LLM research intern|LLM 研究实习生/.test(text) && /PhD student|博士生/.test(text) && ["https://www.gass.ac.cn/gass/index.html", "https://github.com/wuyoscar", "https://yunhao-feng.github.io", "https://www.deakin.edu.au", "https://www.antgroup.com"].every((url) => paragraph.includes(`href="${url}"`)) && !/Dr\.?\s*(?:Yutao|Yunhao)|(?:Yutao Wu|Yunhao Feng)\s*博士(?!生)/.test(text); })],
  ["About's total remains static and both homepages have localized acknowledgements before visitors", [homepage, zhHomepage].every((html) => { const about = section(html, "about"); return about.includes("GitHub Stars") && about.includes("2.5k") && !/data-star-repo|Repo Owner Stars/.test(about) && textContent(section(html, "acknowledgements")).length > 30; })],
  ["incoming education is synchronized across home and CV", [homepage, cv].every((html) => textContent(section(html, "education")).includes("2027")) && [zhHomepage, zhCv].every((html) => textContent(section(html, "education")).includes("2027") && html.includes("硕士研究生（即将入学）")) && cv.includes("Class of 2023; currently a senior undergraduate.")],
  ["education source data retains approved degree wording and exact expected periods", ["en", "zh"].every((locale) => { const [fudan, usst] = getCvData(locale).education; return fudan.period === (locale === "en" ? "2027.09 – 2030.06 (expected)" : "2027.09 – 2030.06（预计）") && fudan.degree === (locale === "en" ? "Incoming CS M.S. Student" : "计算机科学硕士研究生（即将入学）") && usst.period === "2023.09 – 2027.06" && fudan.details.length === 3 && usst.details.length === 2; })],
  ["SafeCodeRL research dates change to February–May while publication date stays unchanged", [[homepage, cv, "en"], [zhHomepage, zhCv, "zh"]].every(([html, cvHtml, locale]) => { const items = getCvData(locale); const experience = items.experiences.find((item) => item.title?.includes("SafeCodeRL")); const publication = items.publications.find((item) => item.title.startsWith("SafeCodeRL:")); return experience?.period === "2026.02 – 2026.05" && publication?.date === "2026.06.02" && [html, cvHtml].every((page) => timelineCards(page).some((card) => textContent(card).includes(experience.title) && textContent(card).includes(experience.period))); })],
  ["About affiliations use local official institutional brand assets", [homepage, zhHomepage].every((html) => { const about = section(html, "about"); return ["fudan", "teai", "usst", "gass", "deakin", "ant"].every((name) => imageTags(about).some((img) => attribute(img, "data-brand-icon") === name && attribute(img, "src").startsWith("/") && fs.existsSync(path.join(root, "dist", attribute(img, "src"))))); })],
  ["About has no separate focus list or interest chips outside its callout", [homepage, zhHomepage].every((html) => { const about = section(html, "about").replace(calloutOf(html), ""); return !/<(?:ul|h3)\b/.test(about) && !about.includes('class="tag-list"'); })],
  ["October 26 News announces public GitHub code and arXiv papers in both languages", newPaperResources.every(({ title }) => {
    const en = octoberReleaseCard(enNews, title, "2026.10.26");
    const zh = octoberReleaseCard(zhNews, title, "2026.10.26");
    return en.includes("publicly available on GitHub") && en.includes("paper is available on arXiv") && zh.includes("代码已在 GitHub 公开") && zh.includes("论文已发布于 arXiv") && !/WWW 2027|Submitted|已投稿/.test(en + zh);
  })],
  ["October release notices retain public paper and code URLs without claiming acceptance", [[enNews, "2026.10.26"], [zhNews, "2026.10.26"]].every(([cards, date]) => newPaperResources.every(({ title, paper, code }) => { const card = octoberReleaseCard(cards, title, date); return card.includes(`href="${paper}"`) && card.includes(`href="${code}"`) && !/\.pdf\b|accepted|已录用|已接收/i.test(card); }))],
  ["November 4 recommendations lead bilingual News with both recommendation sources", enNews[0]?.includes("2026.11.04") && enNews[0].includes("Shanghai Innovation Institute") && enNews[0].includes("MiraclePlus") && enNews[0].includes("Alpha Sight") && zhNews[0]?.includes("2026.11.04") && zhNews[0].includes("上海创智学院论文推荐") && zhNews[0].includes("奇绩创坛") && zhNews[0].includes("奇绩信号 Alpha Sight")],
  ["recommendation News retains paper and code resources and an accessible screenshot dialog", [enNews[0], zhNews[0]].every((card) => card?.includes(`href="${newPaperResources[0].paper}"`) && card.includes(`href="${newPaperResources[0].code}"`) && card.includes(`src="${recommendationImage}"`) && /<img[^>]+loading="lazy"/.test(card) && card.includes('aria-haspopup="dialog"') && /<dialog[^>]*aria-labelledby=/.test(card) && card.includes("data-news-media-close") && card.includes(`href="${recommendationImage}"`) && !/<dialog[^>]*\bopen\b/.test(card))],
  ["published recommendation screenshot preserves the supplied original bytes", fs.existsSync(path.join(root, "dist", recommendationImage)) && createHash("sha256").update(fs.readFileSync(path.join(root, "dist", recommendationImage))).digest("hex") === "721cf67f490509dc00d78560f388a819a8cc682a606d9a496e83720cc98bb70d"],
  ["National Day participation News links both projects without quantified contributions", [[enNews, "2026.10", "Participated", "National Day holiday"], [zhNews, "2026.10", "参与", "国庆期间"]].every(([cards, date, participation, holiday]) => cards.some((card) => card.includes(date) && card.includes(participation) && card.includes(holiday) && card.includes('href="https://github.com/wuyoscar/AISafetyHot"') && card.includes('href="https://github.com/Kirito14IT/prompt-spider-ui"') && !/\bcommits?\b|\bPRs?\b|贡献量|贡献率/i.test(card)))],
  ["all three projects have dynamic star badges in bilingual News", [enNews, zhNews].every((cards) => starRepos.every((repo) => cards.some((card) => hasStarBadge(card, repo))))],
  ["News and featured AISafetyHot project use compact live star badges", [homepage, zhHomepage].every((html) => newsCards(html).filter((card) => card.includes("data-star-repo")).every((card) => classElements(card, "div", "repo-stars--compact").length === 1) && classElements(section(html, "projects"), "div", "repo-stars--compact").some((group) => hasStarBadge(group, "wuyoscar/AISafetyHot")))],
  ["National Day projects have separate star badges in the same News card", [enNews, zhNews].every((cards) => cards.some((card) => starRepos.slice(0, 2).every((repo) => hasStarBadge(card, repo))))],
  ["XSafeClaw star badge also appears in research, CV, and project detail pages", [researchSection, zhResearchSection, cv, zhCv, readRendered("projects", "xsafeclaw"), zhProject].every((html) => hasStarBadge(html, "XSafeAI/XSafeClaw"))],
  ["star badges retain icons and do not hard-code counts", [homepage, zhHomepage].every((html) => html.includes('class="repo-star-icon"') && /data-star-count[^>]*hidden[^>]*><\/span>/.test(html) && !/data-star-count[^>]*>\s*\d/.test(html))],
  ["AISafetyHot original demo assets are published", demoAssets.every((file) => fs.existsSync(path.join(root, "dist", "media", "aisafetyhot", file)))],
  ["bilingual project showcases display the attributed looping animation with a reduced-motion poster", projectShowcases.every((html) => html.includes('data-project-demo') && html.includes('src="/media/aisafetyhot/observatory.gif"') && /<source\b[^>]*media="\(prefers-reduced-motion: reduce\)"[^>]*srcset="\/media\/aisafetyhot\/observatory-poster.webp"/.test(html) && html.includes('loading="lazy"') && !html.includes('data-demo-toggle') && html.includes('href="https://github.com/wuyoscar/AISafetyHot/blob/main/assets/observatory.gif"') && hasStarBadge(html, "wuyoscar/AISafetyHot"))],
  ["News remains concise and contains no project demos", [...enNews, ...zhNews].every((card) => !card.includes('data-project-demo') && !card.includes('observatory.gif'))],
  ["sidebars omit research focus blocks while About retains Agent RL", [homepage, zhHomepage, cv, zhCv].every((html) => !sidebarOf(html).includes('class="tag-list compact"')) && [homepage, zhHomepage].every((html) => section(html, "about").includes("Agent RL"))],
  ["Field Notes remain available on bilingual Blog pages", [readRendered("blog"), readRendered("zh", "blog")].every((html) => html.includes('id="field-notes"') && html.includes('href="https://github.com/Kirito14IT/chatgpt-codex-windows-remote-control-proxy-fix"'))],
  ["Blog Field Notes retain the unresolved connection limitation", readRendered("blog").includes("a separate desktop WebSocket connection issue is documented as unresolved") && readRendered("zh", "blog").includes("桌面端另一条 WebSocket 连接仍有未解决问题")],
  ["VulnSeeker code is linked across bilingual home, CV, and project pages", [homepage, cv, zhHomepage, zhCv, readRendered("projects", "vulnseeker"), readRendered("zh", "projects", "vulnseeker")].every((html) => html.includes('href="https://github.com/Kirito14IT/VulnSeeker"'))],
  ["SFMambaNet code is linked across bilingual home, CV, and project pages", [homepage, cv, zhHomepage, zhCv, sfmambaProject, zhSfmambaProject].every((html) => html.includes('href="https://github.com/Kirito14IT/SFMambaNet"'))],
  ["mouse News reflects the revised investigation", homepage.includes("initial filter-driver hypothesis that later testing ruled out") && zhHomepage.includes("后续测试推翻最初过滤驱动归因") && !homepage.includes("Diagnosed and fixed a defect in Logitech") && !zhHomepage.includes("定位并修复了罗技官方驱动栈")],
  ["homepages omit skills while CV retains programming, tools, and language qualifications", [homepage, zhHomepage].every((html) => !html.includes('class="skill-groups"')) && [cv, zhCv].every((html) => html.includes('class="skill-groups') && ["C/C++", "Python", "CodeQL", "PyTorch", "CET-4", "CET-6"].every((skill) => html.includes(skill)))],
  ["old secondary About paragraph is removed", !homepage.includes("I keep this public homepage focused")],
  ["full CV retains the TEAI affiliation while About links its official institution", cv.includes("Institute of Trustworthy Embodied AI (TEAI)") && section(homepage, "about").includes('href="https://teai.fudan.edu.cn/#/"')],
  ["English switch links to Chinese counterpart", homepage.includes('data-language-switch') && homepage.includes('href="/zh/"') && homepage.includes(">English</span>")],
  ["Chinese switch links to English counterpart", zhHomepage.includes('data-language-switch') && zhHomepage.includes('href="/"') && zhHomepage.includes(">中文</span>")],
  ["locale preference persistence is rendered", homepage.includes("krico-locale") && zhHomepage.includes("krico-locale")],
  ["light theme is the rendered default", homepage.includes('data-theme="light"') && zhHomepage.includes('data-theme="light"')],
  ["all public Astro pages use a fixed light theme with no theme preference or toggle", expectedRoutes.every((parts) => { const html = readRendered(...parts); return html.includes('data-theme="light"') && !/krico-theme|data-theme-toggle/.test(html); })],
  ["global click effect layer is rendered", homepage.includes('data-click-effect-layer') && zhHomepage.includes('data-click-effect-layer')],
  ["click effect has no center ring", !homepage.includes("click-burst-ring") && !zhHomepage.includes("click-burst-ring")],
  ["canonical and language alternates are rendered", homepage.includes('hreflang="zh-CN"') && zhHomepage.includes('hreflang="en"')],
  ["all public Astro routes retain their language, canonical URL, and bilingual counterparts", expectedRoutes.every((parts) => { const html = readRendered(...parts); const zh = parts[0] === "zh"; const suffix = (zh ? parts.slice(1) : parts).join("/"); const enPath = suffix ? `/${suffix}/` : "/"; const zhPath = `/zh${enPath}`; const base = "https://kirito14it.github.io"; return html.includes(`<html lang="${zh ? "zh-CN" : "en"}"`) && html.includes(`<link rel="canonical" href="${base}${zh ? zhPath : enPath}">`) && html.includes(`<link rel="alternate" hreflang="en" href="${base}${enPath}">`) && html.includes(`<link rel="alternate" hreflang="zh-CN" href="${base}${zhPath}">`) && html.includes(`<link rel="alternate" hreflang="x-default" href="${base}${enPath}">`); })],
  ["meteor count is reduced to eight", meteorCount === 8],
  ["profile card exposes a stable rendered marker", profileCard.length > 0],
  ["ACMer logo is rendered in the profile card", profileCard.includes("data-acmer-logo") && profileCard.includes('aria-label="ACMer logo"')],
  ["ACMer wordmark is one continuous text element", /<text[^>]*data-acmer-wordmark[^>]*>ACMer<\/text>/.test(acmerLogo)],
  ["ACMer logo has no outer frame", !/<rect[^>]*stroke=/.test(acmerLogo)],
  ["old Academic Homepage label is removed", !profileCard.includes("Academic Homepage")],
  ["ACM experience period is corrected in both languages", researchSection.includes("2024.05 – 2025.07") && zhResearchSection.includes("2024.05 – 2025.07") && cv.includes("2024.05 – 2025.07") && zhCv.includes("2024.05 – 2025.07")],
  ["old ACM start date is removed", [homepage, zhHomepage, cv, zhCv].every((html) => !["May 2023 - Jul 2025", "2023年5月 - 2025年7月", "2023.05 – 2025.07"].some((period) => html.includes(period)))],
  ["ACM journey-start News is bilingual and linked", acmStartNewsCard.includes("began my ACM journey") && acmStartNewsCard.includes("Looking forward to the challenges ahead! 🚀") && acmStartNewsCard.includes("https://cec.usst.edu.cn/2019/0523/c6556a148258/page.htm") && zhHomepage.includes("开启了我的 ACM 生涯。期待接下来的挑战！🚀")],
  ["ACMer retirement News is bilingual", textContent(acmRetirementNewsCard).includes("My chapter as an ACMer officially came to an end.") && textContent(zhHomepage).includes("我的 ACMer 身份正式退役。")],
  ["RAICOM national first prize remains in the ACM experience", researchSection.includes("National First Prize in the 2025 RAICOM Robot Developer Competition") && zhResearchSection.includes("睿抗机器人开发者大赛国家级一等奖")],
  ["ACM retirement News card links to Awards", acmRetirementNewsCard.includes('class="news-jump-card"') && acmRetirementNewsCard.includes('href="#awards-skills"')],
  ["international organization period remains correct", [homepage, zhHomepage, cv, zhCv].every((html) => html.includes("2026.01 – 2026.04"))],
  ["NeurIPS reviewer service is bilingual", homepage.includes("Reviewer, NeurIPS 2026") && zhHomepage.includes("NeurIPS 2026 审稿人") && zhCv.includes("NeurIPS 2026 审稿人")],
  ["five-time scholarship is synchronized across home and CV", [homepage, cv].every((html) => html.includes("National Encouragement Scholarship, Five-time Recipient") && !html.includes("Three-time Recipient")) && [zhHomepage, zhCv].every((html) => html.includes("国家励志奖学金（5 次）") && !html.includes("国家励志奖学金（3 次）"))],
  ["ACM Shanghai silver award replaces CCPC naming across home and CV", [homepage, cv].every((html) => textContent(html).includes("2025 ACM Shanghai Collegiate Programming Contest") && html.includes("<strong>Silver Award</strong>") && !html.includes("CCPC Shanghai")) && [zhHomepage, zhCv].every((html) => textContent(html).includes("2025 ACM 上海站大学生程序设计竞赛") && html.includes("<strong>银奖</strong>") && !html.includes("CCPC"))],
  ["AI research internship includes advisor and both projects in English", [workSection, cv].every((html) => html.includes("AI Research Intern, Key Laboratory of Information Network Security, Ministry of Public Security (Third Research Institute, Shanghai)") && html.includes("<strong>Advisor:</strong> Songyang Wu") && html.includes("<strong>Project 1:</strong>") && html.includes("<strong>one sole-first-author paper</strong>") && html.includes("<strong>Project 2:</strong>") && html.includes("frozen semantic features") && !html.includes("Research Engineer (Online)"))],
  ["AI research internship includes advisor and both projects in Chinese", [zhWorkSection, zhCv].every((html) => html.includes("信息网络安全公安部重点实验室（公安部第三研究所，上海），AI 研究实习生") && html.includes("<strong>导师：</strong>吴松洋") && html.includes("<strong>项目 1：</strong>") && html.includes("<strong>独立一作论文 1 篇</strong>") && html.includes("<strong>项目 2：</strong>") && html.includes("<strong>轻量级短文本风险主题发现算法</strong>") && !html.includes("科研工程师（线上）"))],
  ["work-experience shortcut is bilingual", homepage.includes('href="#work-experience">Work Experience</a>') && zhHomepage.includes('href="#work-experience">工作经历</a>')],
  ["work-experience shortcuts precede research and awards in both languages", [homeShortcutNav, zhHomeShortcutNav].every((nav) => nav.indexOf('href="#work-experience"') < nav.indexOf('href="#research-experience"') && nav.indexOf('href="#research-experience"') < nav.indexOf('href="#awards-skills"'))],
  ["work-experience sections precede research and awards in both languages", [homepage, zhHomepage].every((html) => html.indexOf('id="work-experience"') < html.indexOf('id="research-experience"') && html.indexOf('id="research-experience"') < html.indexOf('id="awards-skills"'))],
  ["three work experiences retain reverse chronological order", workSection.indexOf("AI Research Intern, Key Laboratory of Information Network Security") >= 0 && workSection.indexOf("AI Research Intern, Key Laboratory of Information Network Security") < workSection.indexOf("International Organization (United Nations Volunteers)") && workSection.indexOf("International Organization (United Nations Volunteers)") < workSection.indexOf("Meituan, Odd Jobs")],
  ["Meituan dates are corrected across bilingual homepages and CV pages", workSection.includes("Meituan, Odd Jobs") && workSection.includes("2023.06 – 2023.09") && cv.includes("2023.06 – 2023.09") && zhWorkSection.includes("美团，打零工") && zhWorkSection.includes("2023.06 – 2023.09") && zhCv.includes("2023.06 – 2023.09")],
  ["old Meituan dates are removed", [homepage, zhHomepage, cv, zhCv].every((html) => !["Jun 2024 - Sep 2024", "2024年6月 - 2024年9月", "2024.06 – 2024.09"].some((period) => html.includes(period)))],
  ["embedded competition news is bilingual and precisely dated", homepage.includes("2026.08.13") && textContent(homepage).includes("Received the National First Prize at the National Finals") && zhHomepage.includes("2026.08.13") && textContent(zhHomepage).includes("第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛")],
  ["awards place ACM silver first and the unlinked embedded award fourth with a year-only date", [homepage, cv, zhHomepage, zhCv].every((html) => { const list = elements(html, "ul").find((item) => /9th National College Student Embedded Chip and System Design Competition|第九届全国大学生嵌入式芯片与系统设计竞赛/.test(textContent(item))) || ""; const rows = elements(list, "li"); return rows.length === 10 && /ACM/.test(textContent(rows[0])) && /Silver Award|银奖/.test(textContent(rows[0])) && elements(rows[0], "strong").some((item) => textContent(item) === "ACM") && /9th National|第九届/.test(textContent(rows[3])) && !/<a\b/.test(rows[0] + rows[3]) && textContent(elements(rows[3], "time")[0] || "") === "2026" && !rows[3].includes("2026.08.13"); })],
  ["first- and second-prize keywords are emphasized across bilingual awards", [[homepage, "en"], [cv, "en"], [zhHomepage, "zh"], [zhCv, "zh"]].every(([html, locale]) => { const list = elements(html, "ul").find((item) => /9th National College Student Embedded Chip and System Design Competition|第九届全国大学生嵌入式芯片与系统设计竞赛/.test(textContent(item))) || ""; const labels = elements(list, "strong").map(textContent); return locale === "en" ? labels.filter((text) => text === "National First Prize").length === 2 && labels.filter((text) => text === "National Second Prize").length === 2 : labels.filter((text) => text.includes("一等奖")).length === 2 && labels.filter((text) => text.includes("二等奖")).length === 2; })],
  ["last-updated footer is bilingual", homepage.includes("Last updated:") && zhHomepage.includes("最近更新：")],
  ["visitor counter is hidden by default on both homepages", homepage.includes('aria-expanded="false"') && zhHomepage.includes('aria-expanded="false"')],
  ["both languages share the visitor counter path", homepage.includes("https%3A%2F%2Fkirito14it.github.io") && zhHomepage.includes("https%3A%2F%2Fkirito14it.github.io")],
  ["visitor counter remains homepage-only", !cv.includes("data-visit-counter") && !zhCv.includes("data-visit-counter")],
  ["bilingual homepages use the user's HTTPS visitor map and dashboard on a white map", [homepage, zhHomepage].every((html) => html.includes('data-visitor-map') && html.includes('https://mapmyvisitors.com/map.js?') && html.includes('d=Miw8Y3UKp7XPCrYF9jOIM4QCtDp0Xsl3diZ8V2GxW78') && html.includes('co=ffffff') && html.includes('href="https://mapmyvisitors.com/web/1c95g"'))],
  ["visitor map appears after services and acknowledgements on homepages only", [homepage, zhHomepage].every((html) => html.indexOf('id="acknowledgements"') > html.indexOf('id="services"') && html.indexOf('id="visitors"') > html.indexOf('id="acknowledgements"') && html.indexOf('id="visitors"') < html.indexOf('data-site-footer')) && !cv.includes('data-visitor-map') && !zhCv.includes('data-visitor-map')],
  ["visitor map has localized titles and a privacy notice", homepage.includes('Visitors around the world') && zhHomepage.includes('世界访客') && [homepage, zhHomepage].every((html) => html.includes('https://mapmyvisitors.com/b/policy') && html.includes('data-visitor-status'))],
  ["computer challenge award is synchronized across home and CV", [homepage, cv].every((html) => textContent(html).includes('National Second Prize, National Computer Competency Challenge (2 awards)')) && [zhHomepage, zhCv].every((html) => textContent(html).includes('全国计算机能力挑战赛国家级二等奖（2 次）'))],
  ["scholarship counts are synchronized across home and CV", [homepage, cv].every((html) => html.includes('Scholarships: First Class (2 awards), Second Class (3 awards), Third Class (2 awards)')) && [zhHomepage, zhCv].every((html) => html.includes('奖学金一等奖（2 次）、二等奖（3 次）、三等奖（2 次）'))],
  ["Chinese project body is translated", zhProject.includes("运行轨迹采集") && zhProject.includes("受控工具调用")],
  ["Chinese blog body is translated", zhBlog.includes("公开学术主页") && zhBlog.includes("GitHub 贡献图")],
  ["Chinese UI headings remain localized with semantic emoji markup", headingTexts(zhHomepage, 2).some((text) => text.endsWith("关于我")) && headingTexts(zhHomepage, 2).some((text) => text.endsWith("科研与实践经历")) && !headingTexts(zhHomepage, 2).includes("About Me")],
  ["advisor titles remain consistent", homepage.includes("Advisor Jingfeng Zhang") && homepage.includes("Advisor Xingjun Ma") && zhHomepage.includes("导师张景锋") && zhHomepage.includes("导师马兴军")],
  ["enterprise collaboration News places the linked advisor under TEAI", [[enNews, "enterprise-oriented multi-agent secure collaboration", "Advisor Xingjun Ma"], [zhNews, "多智能体安全协作", "导师马兴军"]].every(([cards, project, advisor]) => cards.some((card) => { const text = textContent(card); return text.includes(project) && text.includes(advisor) && card.includes('href="https://teai.fudan.edu.cn/"') && card.includes('href="http://xingjunma.com/"'); }))],
  ["XSafeClaw News includes linked TEAI and advisor guidance", [[enNews, "Advisor Xingjun Ma"], [zhNews, "马兴军老师"]].every(([cards, advisor]) => cards.some((card) => textContent(card).includes(advisor) && card.includes('href="https://teai.fudan.edu.cn/"') && card.includes('href="http://xingjunma.com/"') && card.includes('href="https://github.com/XSafeAI/XSafeClaw"')))],
  ["SFMambaNet News links the FZU laboratory and advisor in both languages", [[enNews, "Fujian Key Laboratory of Network Computing and Intelligent Information Processing", "Advisor Yizhang Liu"], [zhNews, "福建省网络计算与智能信息处理重点实验室", "导师刘翼章"]].every(([cards, lab, advisor]) => cards.some((card) => textContent(card).includes(lab) && textContent(card).includes(advisor) && textContent(card).includes("SFMambaNet") && card.includes('href="https://ncip.fzu.edu.cn/index.htm"') && card.includes('href="https://ccds.fzu.edu.cn/info/1207/11276.htm"')))],
  ["SFMambaNet CV and project pages use the verified advisor name and links", cv.includes("Advisor Yizhang Liu") && zhCv.includes("导师刘翼章") && sfmambaProject.includes("https://ccds.fzu.edu.cn/info/1207/11276.htm") && zhSfmambaProject.includes("导师刘翼章")],
  ["old misspelling of the SFMambaNet advisor is removed", !zhHomepage.includes("刘一璋") && !zhCv.includes("刘一璋") && !zhSfmambaProject.includes("刘一璋")],
  ["academic honorifics remain removed for the two advisors", !homepage.includes("Prof. Jingfeng Zhang") && !homepage.includes("Dr. Xingjun Ma")],
  ["standalone page stays out of search results and sends no referrer", privatePage.includes('<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">') && privatePage.includes('<meta name="referrer" content="no-referrer">')],
  ["standalone page ships a content security policy limited to the GitHub API", /<meta http-equiv="Content-Security-Policy" content="[^"]*script-src 'self'[^"]*connect-src 'self' https:\/\/api\.github\.com;[^"]*"/.test(privatePage)],
  ["standalone page loads no third-party widgets, fonts, or canonical links", !/chatdoc|mapmyvisitors|fonts\.googleapis|rel="canonical"|hreflang=/.test(privatePage) && privateAssets.length > 0 && privateAssets.every((asset) => !/chatdoc|mapmyvisitors|fonts\.googleapis/.test(asset))],
  ["no public page links to the standalone page", publicPages.length > 0 && publicPages.every((html) => !html.includes("/zh/intern"))],
  ["standalone page bundle contains no email addresses", ![privatePage, ...privateAssets].some((text) => emailLike.test(text))]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`Rendered-site validation failed:\n${failures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Rendered-site validation passed.");
