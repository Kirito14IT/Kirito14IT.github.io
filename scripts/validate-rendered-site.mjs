import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  ["zh", "blog", "website-launch"]
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
const profileCard = homepage.match(/<a[^>]*data-profile-card[\s\S]*?<\/a>/)?.[0] || "";
const acmerLogo = profileCard.match(/<div[^>]*data-acmer-logo[\s\S]*?<\/div>/)?.[0] || "";
const acmStartNewsCard = homepage.match(/<article[^>]*>\s*<time>May 2024<\/time>[\s\S]*?<\/article>/)?.[0] || "";
const acmRetirementNewsCard = homepage.match(/<article[^>]*class="news-jump-card"[^>]*>\s*[\s\S]*?<time>Jul 2025<\/time>[\s\S]*?<\/article>/)?.[0] || "";
const researchSection = homepage.match(/<section id="research-experience"[\s\S]*?<\/section>/)?.[0] || "";
const zhResearchSection = zhHomepage.match(/<section id="research-experience"[\s\S]*?<\/section>/)?.[0] || "";
const workSection = homepage.match(/<section id="work-experience"[\s\S]*?<\/section>/)?.[0] || "";
const zhWorkSection = zhHomepage.match(/<section id="work-experience"[\s\S]*?<\/section>/)?.[0] || "";
const homeShortcutNav = homepage.match(/<nav[^>]*class="quick-jump-nav"[\s\S]*?<\/nav>/)?.[0] || "";
const zhHomeShortcutNav = zhHomepage.match(/<nav[^>]*class="quick-jump-nav"[\s\S]*?<\/nav>/)?.[0] || "";
const meteorMarkup = homepage.match(/<div class="meteor-shower">([\s\S]*?)<\/div>/)?.[1] || "";
const meteorCount = (meteorMarkup.match(/<span style=/g) || []).length;
const newsCards = (html) => (html.match(/<section id="news"[\s\S]*?<\/section>/)?.[0] || "").match(/<article\b[\s\S]*?<\/article>/g) || [];
const enNews = newsCards(homepage);
const zhNews = newsCards(zhHomepage);
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
const projectShowcases = [homepage, zhHomepage].map((html) => html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] || "").concat(readRendered("projects"), readRendered("zh", "projects"));
const newPaperResources = [
  { title: submissionTitles[0], paper: "https://arxiv.org/abs/2611.01700", code: "https://github.com/Kirito14IT/MemHarmBench" },
  { title: submissionTitles[1], paper: "https://arxiv.org/abs/2611.01710", code: "https://github.com/Kirito14IT/CST-MIL" }
];
const publicationCard = (html, title) => (html.match(/<article class="publication-card"[\s\S]*?<\/article>/g) || []).find((card) => card.includes(title)) || "";

const checks = [
  ["both CV pages expose the versioned PDFs and download actions", [cv, zhCv].every((html) => Object.values(resumeManifest.resumes).every((resume) => html.includes(`${resume.path}?v=${resume.sha256.slice(0, 12)}`)) && (html.match(/class="resume-preview\b/g) || []).length === 2 && (html.match(/download="/g) || []).length === 3)],
  ["detailed PDF preview stays in a closed disclosure and inert template", [cv, zhCv].every((html) => /<details[^>]*data-detailed-resume/.test(html) && !/<details[^>]*\bopen\b[^>]*data-detailed-resume/.test(html) && /<template[^>]*data-detailed-template[^>]*>[\s\S]*?<iframe/.test(html))],
  ["published PDF copies match the resume manifest", Object.values(resumeManifest.resumes).every((resume) => createHash("sha256").update(fs.readFileSync(path.join(root, "dist", resume.path))).digest("hex") === resume.sha256)],
  ["home toolbar links to localized CV pages", homeShortcutNav.includes('href="/cv/">CV</a>') && zhHomeShortcutNav.includes('href="/zh/cv/">简历</a>')],
  ["duplicate homepage project cards are removed", [homepage, zhHomepage].every((html) => !(html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] || "").includes('class="card-grid"'))],
  ["web CV remains optional behind a collapsed disclosure", [cv, zhCv].every((html) => /<details class="web-cv\b/.test(html) && !/<details[^>]*class="web-cv[^>]*\bopen\b/.test(html))],
  ["About includes bilingual internship search copy and an email contact", [[homepage, "Seeking internships:", "I am currently seeking internship opportunities in foundation models, agent post-training, and LLM evaluation."], [zhHomepage, "实习求职：", "我近期正在寻找基座大模型、智能体后训练（Agent Post-Training）及大模型评测相关的实习机会。"]].every(([html, title, description]) => { const about = html.match(/<section id="about"[\s\S]*?<\/section>/)?.[0] || ""; return about.includes(title) && about.includes(description) && about.includes('href="mailto:2657751462@qq.com"'); })],
  ["homepage Blog shortcut and section heading are localized", homeShortcutNav.includes('href="#field-notes">Blog</a>') && zhHomeShortcutNav.includes('href="#field-notes">博客</a>') && homepage.includes("<h2>Blog</h2>") && zhHomepage.includes("<h2>博客</h2>") && !zhHomeShortcutNav.includes("技术笔记")],
  ["both new papers have linked publication cards on bilingual home and CV pages", [homepage, zhHomepage, cv, zhCv].every((html) => newPaperResources.every(({title, paper, code}) => { const card = publicationCard(html, title); return card.includes(`href="${paper}"`) && card.includes(`href="${code}"`) && card.includes("WWW 2027") && /arXiv preprint|arXiv 预印本/.test(card); }))],
  ["new publication links use safe external targets", [homepage, zhHomepage, cv, zhCv].every((html) => newPaperResources.every(({title}) => (publicationCard(html, title).match(/<a\b[^>]*>/g) || []).every((link) => link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'))))],
  ["all MemHarmBench cards use the original English Figure 1", [homepage, cv, zhHomepage, zhCv].every((html) => { const card = publicationCard(html, submissionTitles[0]); return card.includes('src="/figures/memharmbench-cross-session-en.webp"') && !card.includes('memharmbench-cross-session-zh.webp') && card.includes('loading="lazy"'); })],
  ["original English MemHarmBench figure is published", fs.existsSync(path.join(root, "dist", "figures", "memharmbench-cross-session-en.webp"))],
  ["bilingual homepages omit the learning map and percentage cards", [homepage, zhHomepage].every((html) => !html.includes('id="learning-map"') && !html.includes('class="learning-grid"') && !html.includes('class="progress-track"')) && !homepage.includes("Knowledge progress") && !zhHomepage.includes("知识进展")],
  ["standalone blog pages and navigation use Blog and 博客", readRendered("blog").includes("<h1>Blog</h1>") && readRendered("zh", "blog").includes("<h1>博客</h1>") && homepage.includes('href="/blog/">Blog</a>') && zhHomepage.includes('href="/zh/blog/">博客</a>') && !zhHomepage.includes("技术博客")],
  ["all 22 bilingual routes are generated", expectedRoutes.length === 22],
  ["English root uses the correct lang", homepage.includes('<html lang="en"')],
  ["Chinese root uses the correct lang", zhHomepage.includes('<html lang="zh-CN"')],
  ["public social profiles appear in bilingual home and CV sidebars", [homepage, zhHomepage, cv, zhCv].every((html) => socialProfileUrls.every((url) => html.includes(`href="${url}"`)) && !html.includes("https://www.douyin.com/user/self"))],
  ["social profiles also appear in the homepage contact panels", [homepage, zhHomepage].every((html) => socialProfileUrls.every((url) => html.split(`href="${url}"`).length - 1 === 2))],
  ["social labels are localized", homepage.includes(">Douyin</strong>") && homepage.includes(">Xiaohongshu</strong>") && zhHomepage.includes(">抖音</strong>") && zhHomepage.includes(">小红书</strong>")],
  ["duplicate XSafeClaw links are removed from sidebars and direct contact lists", [homepage, zhHomepage, cv, zhCv].every((html) => !(html.match(/<aside\b[\s\S]*?<\/aside>/)?.[0] || "").includes('href="https://github.com/XSafeAI/XSafeClaw"')) && [homepage, zhHomepage].every((html) => !(html.match(/<div class="direct-link-list">[\s\S]*?<\/div>/)?.[0] || "").includes('href="https://github.com/XSafeAI/XSafeClaw"'))],
  ["representative open-source XSafeClaw link is preserved", [homepage, zhHomepage].every((html) => (html.match(/<div class="representative-links">[\s\S]*?<\/div>/)?.[0] || "").includes('href="https://github.com/XSafeAI/XSafeClaw"'))],
  ["English About copy includes both labs and agent post-training", homepage.includes("I am a senior undergraduate student in Computer Science and Technology (Class of 2023)") && homepage.includes("I will begin my M.Sc. studies at Fudan University in 2027, advised by Xingjun Ma.") && homepage.includes("Fudan Vision and Learning Lab (FVL)") && homepage.includes("My research interests center on LLM agents, agent post-training, reinforcement learning for agents (Agent RL), and agent safety.")],
  ["Chinese About copy includes both labs and agent post-training", zhHomepage.includes("我是上海理工大学计算机科学与技术专业 2023 级本科生，目前大四在读。") && zhHomepage.includes("我将于 2027 年进入复旦大学攻读硕士学位，导师为马兴军老师。") && zhHomepage.includes("我正在复旦大学视觉与学习实验室（FVL）&amp;可信具身智能研究院（TEAI）进行科研实习") && zhHomepage.includes("研究兴趣聚焦大语言模型智能体、智能体后训练、智能体强化学习（Agent RL）与智能体安全。")],
  ["incoming education is synchronized across home and CV", [homepage, cv].every((html) => html.includes("2027 entry") && html.includes("Class of 2023; currently a senior undergraduate.")) && [zhHomepage, zhCv].every((html) => html.includes("2027年入学") && html.includes("硕士研究生（即将入学）"))],
  ["FVL and TEAI links and logos appear in both languages", [homepage, zhHomepage].every((html) => html.includes('class="sidebar-affiliations"') && html.includes('href="https://fvl.fudan.edu.cn/"') && html.includes('href="https://teai.fudan.edu.cn/#/"') && html.includes('src="/github-profile/fudan-university-logo.png"') && html.includes('src="/github-profile/fudan-teai-logo.png"'))],
  ["research focus prioritizes agent post-training and Agent RL", homepage.includes("Agent post-training and reinforcement learning (Agent RL) for LLM agents, with a focus on reasoning and tool use.") && homepage.includes("Agent safety, memory security, and cross-session prompt injection.") && homepage.includes("Multi-agent collaboration and safety-constrained code generation.") && homepage.includes("Reliable agent evaluation and practical agent systems.") && zhHomepage.includes("面向大语言模型智能体的后训练（Agent Post-Training）与强化学习（Agent RL），关注推理与工具使用。") && zhHomepage.includes("智能体安全、记忆安全与跨会话提示注入。") && zhHomepage.includes("多智能体协作与安全约束代码生成。") && zhHomepage.includes("可靠智能体评测与智能体系统实践。")],
  ["post-training replaces software security analysis and is placed early in interest tags", [[homepage, "Agent Post-Training", "Agent Safety", "Software Security Analysis"], [cv, "Agent Post-Training", "Agent Safety", "Software Security Analysis"], [zhHomepage, "智能体后训练", "智能体安全", "软件安全分析"], [zhCv, "智能体后训练", "智能体安全", "软件安全分析"]].every(([html, postTraining, safety, old]) => html.includes(`<span>${postTraining}</span>`) && html.indexOf(`<span>${postTraining}</span>`) < html.indexOf(`<span>${safety}</span>`) && !html.includes(`<span>${old}</span>`))],
  ["two WWW 2027 submissions lead bilingual News with Monday's date", submissionTitles.every((title, index) => enNews[index]?.includes(title) && enNews[index].includes("Oct 26, 2026") && enNews[index].includes("Submitted") && enNews[index].includes("WWW 2027") && zhNews[index]?.includes(title) && zhNews[index].includes("2026年10月26日") && zhNews[index].includes("已投稿") && zhNews[index].includes("WWW 2027"))],
  ["WWW submission notices link public arXiv and code without uploading PDFs or claiming acceptance", [enNews, zhNews].every((cards) => newPaperResources.every(({paper, code}, index) => cards[index].includes(`href="${paper}"`) && cards[index].includes(`href="${code}"`) && !/\.pdf\b|accepted|published|已录用|已接收/i.test(cards[index])))],
  ["National Day participation News links both projects without quantified contributions", [[enNews, "Oct 2026", "Participated", "National Day holiday"], [zhNews, "2026年10月", "参与", "国庆期间"]].every(([cards, date, participation, holiday]) => cards.some((card) => card.includes(date) && card.includes(participation) && card.includes(holiday) && card.includes('href="https://github.com/wuyoscar/AISafetyHot"') && card.includes('href="https://github.com/Kirito14IT/prompt-spider-ui"') && !/\bcommits?\b|\bPRs?\b|贡献量|贡献率/i.test(card)))],
  ["all three projects have dynamic star badges in bilingual News", [enNews, zhNews].every((cards) => starRepos.every((repo) => cards.some((card) => hasStarBadge(card, repo))))],
  ["National Day projects have separate star badges in the same News card", [enNews, zhNews].every((cards) => cards.some((card) => starRepos.slice(0, 2).every((repo) => hasStarBadge(card, repo))))],
  ["XSafeClaw star badge also appears in research, CV, and project detail pages", [researchSection, zhResearchSection, cv, zhCv, readRendered("projects", "xsafeclaw"), zhProject].every((html) => hasStarBadge(html, "XSafeAI/XSafeClaw"))],
  ["star badges retain icons and do not hard-code counts", [homepage, zhHomepage].every((html) => html.includes('class="repo-star-icon"') && /data-star-count[^>]*hidden[^>]*><\/span>/.test(html) && !/data-star-count[^>]*>\s*\d/.test(html))],
  ["AISafetyHot original demo assets are published", demoAssets.every((file) => fs.existsSync(path.join(root, "dist", "media", "aisafetyhot", file)))],
  ["bilingual project showcases include the attributed lazy-loaded demo and motion controls", projectShowcases.every((html) => html.includes('data-project-demo') && html.includes('src="/media/aisafetyhot/observatory.gif"') && html.includes('loading="lazy"') && html.includes('prefers-reduced-motion: reduce') && html.includes('data-demo-toggle') && html.includes('href="https://github.com/wuyoscar/AISafetyHot/blob/main/assets/observatory.gif"') && hasStarBadge(html, "wuyoscar/AISafetyHot"))],
  ["News remains concise and contains no project demos", [...enNews, ...zhNews].every((card) => !card.includes('data-project-demo') && !card.includes('observatory.gif'))],
  ["Agent RL appears in home and CV sidebars", [homepage, zhHomepage, cv, zhCv].every((html) => html.includes('<span>Agent RL</span>'))],
  ["Field Notes are linked from bilingual home and blog pages", [homepage, zhHomepage, readRendered("blog"), readRendered("zh", "blog")].every((html) => html.includes('id="field-notes"') && html.includes('href="https://github.com/Kirito14IT/chatgpt-codex-windows-remote-control-proxy-fix"'))],
  ["Field Notes retain the unresolved connection limitation", homepage.includes("a separate desktop WebSocket connection issue is documented as unresolved") && zhHomepage.includes("桌面端另一条 WebSocket 连接仍有未解决问题")],
  ["VulnSeeker code is linked across bilingual home, CV, and project pages", [homepage, cv, zhHomepage, zhCv, readRendered("projects", "vulnseeker"), readRendered("zh", "projects", "vulnseeker")].every((html) => html.includes('href="https://github.com/Kirito14IT/VulnSeeker"'))],
  ["SFMambaNet code is linked across bilingual home, CV, and project pages", [homepage, cv, zhHomepage, zhCv, sfmambaProject, zhSfmambaProject].every((html) => html.includes('href="https://github.com/Kirito14IT/SFMambaNet"'))],
  ["mouse News reflects the revised investigation", homepage.includes("initial filter-driver hypothesis that later testing ruled out") && zhHomepage.includes("后续测试推翻最初过滤驱动归因") && !homepage.includes("Diagnosed and fixed a defect in Logitech") && !zhHomepage.includes("定位并修复了罗技官方驱动栈")],
  ["embodied intelligence is rendered across bilingual research focus content", homepage.includes("Embodied Intelligence") && zhHomepage.includes("具身智能")],
  ["old secondary About paragraph is removed", !homepage.includes("I keep this public homepage focused")],
  ["official TEAI English name is used", homepage.includes("Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University")],
  ["English switch links to Chinese counterpart", homepage.includes('data-language-switch') && homepage.includes('href="/zh/"') && homepage.includes(">English</span>")],
  ["Chinese switch links to English counterpart", zhHomepage.includes('data-language-switch') && zhHomepage.includes('href="/"') && zhHomepage.includes(">中文</span>")],
  ["locale preference persistence is rendered", homepage.includes("krico-locale") && zhHomepage.includes("krico-locale")],
  ["light theme is the rendered default", homepage.includes('data-theme="light"') && zhHomepage.includes('data-theme="light"')],
  ["theme toggle is localized", homepage.includes('data-theme-toggle') && homepage.includes('aria-label="Switch to dark theme"') && zhHomepage.includes('aria-label="切换到深色主题"')],
  ["theme preference persistence is rendered", homepage.includes("krico-theme") && zhHomepage.includes("krico-theme")],
  ["global click effect layer is rendered", homepage.includes('data-click-effect-layer') && zhHomepage.includes('data-click-effect-layer')],
  ["click effect has no center ring", !homepage.includes("click-burst-ring") && !zhHomepage.includes("click-burst-ring")],
  ["canonical and language alternates are rendered", homepage.includes('hreflang="zh-CN"') && zhHomepage.includes('hreflang="en"')],
  ["meteor count is reduced to eight", meteorCount === 8],
  ["profile card exposes a stable rendered marker", profileCard.length > 0],
  ["ACMer logo is rendered in the profile card", profileCard.includes("data-acmer-logo") && profileCard.includes('aria-label="ACMer logo"')],
  ["ACMer wordmark is one continuous text element", /<text[^>]*data-acmer-wordmark[^>]*>ACMer<\/text>/.test(acmerLogo)],
  ["ACMer logo has no outer frame", !/<rect[^>]*stroke=/.test(acmerLogo)],
  ["old Academic Homepage label is removed", !profileCard.includes("Academic Homepage")],
  ["ACM experience period is corrected in both languages", researchSection.includes("May 2024 - Jul 2025") && zhResearchSection.includes("2024年5月 - 2025年7月") && cv.includes("May 2024 - Jul 2025") && zhCv.includes("2024年5月 - 2025年7月")],
  ["old ACM start date is removed", !homepage.includes("May 2023 - Jul 2025") && !zhHomepage.includes("2023年5月 - 2025年7月")],
  ["ACM journey-start News is bilingual and linked", acmStartNewsCard.includes("began my ACM journey") && acmStartNewsCard.includes("Looking forward to the challenges ahead! 🚀") && acmStartNewsCard.includes("https://cec.usst.edu.cn/2019/0523/c6556a148258/page.htm") && zhHomepage.includes("开启了我的 ACM 生涯。期待接下来的挑战！🚀")],
  ["ACMer retirement News is bilingual", acmRetirementNewsCard.includes("My chapter as an ACMer officially came to an end.") && zhHomepage.includes("我的 ACMer 身份正式退役。")],
  ["RAICOM national first prize remains in the ACM experience", researchSection.includes("National First Prize in the 2025 RAICOM Robot Developer Competition") && zhResearchSection.includes("睿抗机器人开发者大赛国家级一等奖")],
  ["ACM retirement News card links to Awards", acmRetirementNewsCard.includes('class="news-jump-card"') && acmRetirementNewsCard.includes('href="#awards-skills"')],
  ["international organization period remains correct", homepage.includes("Jan - Apr 2026") && cv.includes("Jan 2026 - Apr 2026")],
  ["NeurIPS reviewer service is bilingual", homepage.includes("Reviewer, NeurIPS 2026") && zhHomepage.includes("NeurIPS 2026 审稿人") && zhCv.includes("NeurIPS 2026 审稿人")],
  ["five-time scholarship is synchronized across home and CV", [homepage, cv].every((html) => html.includes("National Encouragement Scholarship, Five-time Recipient") && !html.includes("Three-time Recipient")) && [zhHomepage, zhCv].every((html) => html.includes("国家励志奖学金（5 次）") && !html.includes("国家励志奖学金（3 次）"))],
  ["ACM Shanghai silver award replaces CCPC naming across home and CV", [homepage, cv].every((html) => html.includes("2025 ACM Shanghai Collegiate Programming Contest") && html.includes("<strong>Silver Award</strong>") && !html.includes("CCPC Shanghai")) && [zhHomepage, zhCv].every((html) => html.includes("2025 ACM 上海站大学生程序设计竞赛") && html.includes("<strong>银奖</strong>") && !html.includes("CCPC"))],
  ["AI research internship includes advisor and both projects in English", [workSection, cv].every((html) => html.includes("AI Research Intern, Key Laboratory of Information Network Security, Ministry of Public Security (Third Research Institute, Shanghai)") && html.includes("<strong>Advisor:</strong> Songyang Wu") && html.includes("<strong>Project 1:</strong>") && html.includes("<strong>one sole-first-author paper</strong>") && html.includes("<strong>Project 2:</strong>") && html.includes("frozen semantic features") && !html.includes("Research Engineer (Online)"))],
  ["AI research internship includes advisor and both projects in Chinese", [zhWorkSection, zhCv].every((html) => html.includes("信息网络安全公安部重点实验室（公安部第三研究所，上海），AI 研究实习生") && html.includes("<strong>导师：</strong>吴松洋") && html.includes("<strong>项目 1：</strong>") && html.includes("<strong>独立一作论文 1 篇</strong>") && html.includes("<strong>项目 2：</strong>") && html.includes("<strong>轻量级短文本风险主题发现算法</strong>") && !html.includes("科研工程师（线上）"))],
  ["work-experience shortcut is bilingual", homepage.includes('href="#work-experience">Work Experience</a>') && zhHomepage.includes('href="#work-experience">工作经历</a>')],
  ["work-experience shortcut is penultimate before services", homeShortcutNav.indexOf('href="#awards-skills"') < homeShortcutNav.indexOf('href="#work-experience"') && homeShortcutNav.indexOf('href="#work-experience"') < homeShortcutNav.indexOf('href="#services"') && zhHomeShortcutNav.indexOf('href="#awards-skills"') < zhHomeShortcutNav.indexOf('href="#work-experience"') && zhHomeShortcutNav.indexOf('href="#work-experience"') < zhHomeShortcutNav.indexOf('href="#services"')],
  ["work-experience section is penultimate before services", homepage.indexOf('id="awards-skills"') < homepage.indexOf('id="work-experience"') && homepage.indexOf('id="work-experience"') < homepage.indexOf('id="services"') && zhHomepage.indexOf('id="awards-skills"') < zhHomepage.indexOf('id="work-experience"') && zhHomepage.indexOf('id="work-experience"') < zhHomepage.indexOf('id="services"')],
  ["three work experiences retain reverse chronological order", workSection.indexOf("AI Research Intern, Key Laboratory of Information Network Security") >= 0 && workSection.indexOf("AI Research Intern, Key Laboratory of Information Network Security") < workSection.indexOf("International Organization (United Nations Volunteers)") && workSection.indexOf("International Organization (United Nations Volunteers)") < workSection.indexOf("Meituan, Odd Jobs")],
  ["Meituan dates are corrected across bilingual homepages and CV pages", workSection.includes("Meituan, Odd Jobs") && workSection.includes("Jun 2023 - Sep 2023") && cv.includes("Jun 2023 - Sep 2023") && zhWorkSection.includes("美团，打零工") && zhWorkSection.includes("2023年6月 - 2023年9月") && zhCv.includes("2023年6月 - 2023年9月")],
  ["old Meituan dates are removed", !homepage.includes("Jun 2024 - Sep 2024") && !cv.includes("Jun 2024 - Sep 2024") && !zhHomepage.includes("2024年6月 - 2024年9月") && !zhCv.includes("2024年6月 - 2024年9月")],
  ["embedded competition news is bilingual and precisely dated", homepage.includes("Aug 13, 2026") && homepage.includes("Received the National First Prize at the National Finals") && zhHomepage.includes("2026年8月13日") && zhHomepage.includes("第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛")],
  ["embedded competition award and official link are rendered across home and CV", homepage.includes("9th National College Student Embedded Chip and System Design Competition") && cv.includes("https://www.socchina.net/home") && zhHomepage.includes("https://www.socchina.net/home") && zhCv.includes("全国一等奖（2026年8月13日）")],
  ["last-updated footer is bilingual", homepage.includes("Last updated:") && zhHomepage.includes("最近更新：")],
  ["visitor counter is hidden by default on both homepages", homepage.includes('aria-expanded="false"') && zhHomepage.includes('aria-expanded="false"')],
  ["both languages share the visitor counter path", homepage.includes("https%3A%2F%2Fkirito14it.github.io") && zhHomepage.includes("https%3A%2F%2Fkirito14it.github.io")],
  ["visitor counter remains homepage-only", !cv.includes("data-visit-counter") && !zhCv.includes("data-visit-counter")],
  ["bilingual homepages use the user's HTTPS visitor map and dashboard", [homepage, zhHomepage].every((html) => html.includes('data-visitor-map') && html.includes('https://mapmyvisitors.com/map.js?') && html.includes('d=Miw8Y3UKp7XPCrYF9jOIM4QCtDp0Xsl3diZ8V2GxW78') && html.includes('co=0b1428') && html.includes('cl=72b7cd') && html.includes('href="https://mapmyvisitors.com/web/1c95g"'))],
  ["visitor map appears at the bottom of homepages only", [homepage, zhHomepage].every((html) => html.indexOf('id="visitors"') > html.indexOf('id="services"') && html.indexOf('id="visitors"') < html.indexOf('data-site-footer')) && !cv.includes('data-visitor-map') && !zhCv.includes('data-visitor-map')],
  ["visitor map has localized titles and a privacy notice", homepage.includes('Visitors around the world') && zhHomepage.includes('世界访客') && [homepage, zhHomepage].every((html) => html.includes('https://mapmyvisitors.com/b/policy') && html.includes('data-visitor-status'))],
  ["computer challenge award is synchronized across home and CV", [homepage, cv].every((html) => html.includes('National Second Prize, National Computer Competency Challenge (2 awards)')) && [zhHomepage, zhCv].every((html) => html.includes('全国计算机能力挑战赛国家级二等奖（2 次）'))],
  ["scholarship counts are synchronized across home and CV", [homepage, cv].every((html) => html.includes('Scholarships: First Class (2 awards), Second Class (3 awards), Third Class (2 awards)')) && [zhHomepage, zhCv].every((html) => html.includes('奖学金一等奖（2 次）、二等奖（3 次）、三等奖（2 次）'))],
  ["Chinese project body is translated", zhProject.includes("运行轨迹采集") && zhProject.includes("受控工具调用")],
  ["Chinese blog body is translated", zhBlog.includes("公开学术主页") && zhBlog.includes("GitHub 贡献图")],
  ["Chinese UI labels replace English section labels", zhHomepage.includes(">关于我</h2>") && zhHomepage.includes(">科研与实践经历</h2>") && !zhHomepage.includes(">About Me</h2>")],
  ["advisor titles remain consistent", homepage.includes("Advisor Jingfeng Zhang") && homepage.includes("Advisor Xingjun Ma") && zhHomepage.includes("导师张景锋") && zhHomepage.includes("导师马兴军")],
  ["enterprise collaboration News places the linked advisor under TEAI", homepage.includes('At <a href="https://teai.fudan.edu.cn/"') && homepage.includes('under the guidance of <a href="http://xingjunma.com/"') && zhHomepage.includes('复旦大学可信具身智能研究院（TEAI）</a>的团队中，在<a href="http://xingjunma.com/"') && zhHomepage.includes("导师马兴军</a>指导下")],
  ["XSafeClaw News includes linked TEAI and advisor guidance", homepage.includes('Joined <a href="https://teai.fudan.edu.cn/"') && homepage.includes('Advisor Xingjun Ma</a>, worked on the <a href="https://github.com/XSafeAI/XSafeClaw"') && zhHomepage.includes('加入<a href="https://teai.fudan.edu.cn/"') && zhHomepage.includes('马兴军老师</a>的指导下，参与 <a href="https://github.com/XSafeAI/XSafeClaw"')],
  ["SFMambaNet News links the FZU laboratory and advisor in both languages", homepage.includes('Fujian Key Laboratory of Network Computing and Intelligent Information Processing</a> at Fuzhou University') && homepage.includes('Advisor Yizhang Liu</a>, began SFMambaNet research') && zhHomepage.includes('加入福州大学<a href="https://ncip.fzu.edu.cn/index.htm"') && zhHomepage.includes('导师刘翼章</a>指导下启动 SFMambaNet 研究')],
  ["SFMambaNet CV and project pages use the verified advisor name and links", cv.includes("Advisor Yizhang Liu") && zhCv.includes("导师刘翼章") && sfmambaProject.includes("https://ccds.fzu.edu.cn/info/1207/11276.htm") && zhSfmambaProject.includes("导师刘翼章")],
  ["old misspelling of the SFMambaNet advisor is removed", !zhHomepage.includes("刘一璋") && !zhCv.includes("刘一璋") && !zhSfmambaProject.includes("刘一璋")],
  ["academic honorifics remain removed for the two advisors", !homepage.includes("Prof. Jingfeng Zhang") && !homepage.includes("Dr. Xingjun Ma")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`Rendered-site validation failed:\n${failures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Rendered-site validation passed.");
