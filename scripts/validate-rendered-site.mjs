import fs from "node:fs";
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

const checks = [
  ["all 22 bilingual routes are generated", expectedRoutes.length === 22],
  ["English root uses the correct lang", homepage.includes('<html lang="en"')],
  ["Chinese root uses the correct lang", zhHomepage.includes('<html lang="zh-CN"')],
  ["English About copy is current", homepage.includes("I am an undergraduate student in Computer Science and Technology (Class of 2023)") && homepage.includes("where I work on AI agents, AI safety, and embodied intelligence. Feel free to contact me~")],
  ["Chinese About copy is current", zhHomepage.includes("我是上海理工大学计算机科学与技术专业 2023 级本科生") && zhHomepage.includes("研究方向为智能体、人工智能安全与具身智能。欢迎与我联系交流~")],
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
  ["three-time scholarship is bilingual", homepage.includes("National Encouragement Scholarship, Three-time Recipient") && zhHomepage.includes("国家励志奖学金（3 次）")],
  ["work-experience shortcut is bilingual", homepage.includes('href="#work-experience">Work Experience</a>') && zhHomepage.includes('href="#work-experience">工作经历</a>')],
  ["work-experience shortcut is penultimate before services", homeShortcutNav.indexOf('href="#awards-skills"') < homeShortcutNav.indexOf('href="#work-experience"') && homeShortcutNav.indexOf('href="#work-experience"') < homeShortcutNav.indexOf('href="#services"') && zhHomeShortcutNav.indexOf('href="#awards-skills"') < zhHomeShortcutNav.indexOf('href="#work-experience"') && zhHomeShortcutNav.indexOf('href="#work-experience"') < zhHomeShortcutNav.indexOf('href="#services"')],
  ["work-experience section is penultimate before services", homepage.indexOf('id="awards-skills"') < homepage.indexOf('id="work-experience"') && homepage.indexOf('id="work-experience"') < homepage.indexOf('id="services"') && zhHomepage.indexOf('id="awards-skills"') < zhHomepage.indexOf('id="work-experience"') && zhHomepage.indexOf('id="work-experience"') < zhHomepage.indexOf('id="services"')],
  ["three concise work experiences are rendered in reverse chronological order", workSection.indexOf("The Third Research Institute of the Ministry of Public Security") >= 0 && workSection.indexOf("The Third Research Institute of the Ministry of Public Security") < workSection.indexOf("International Organization (United Nations Volunteers)") && workSection.indexOf("International Organization (United Nations Volunteers)") < workSection.indexOf("Meituan, Odd Jobs")],
  ["Meituan dates are corrected across bilingual homepages and CV pages", workSection.includes("Meituan, Odd Jobs") && workSection.includes("Jun 2023 - Sep 2023") && cv.includes("Jun 2023 - Sep 2023") && zhWorkSection.includes("美团，打零工") && zhWorkSection.includes("2023年6月 - 2023年9月") && zhCv.includes("2023年6月 - 2023年9月")],
  ["old Meituan dates are removed", !homepage.includes("Jun 2024 - Sep 2024") && !cv.includes("Jun 2024 - Sep 2024") && !zhHomepage.includes("2024年6月 - 2024年9月") && !zhCv.includes("2024年6月 - 2024年9月")],
  ["embedded competition news is bilingual and precisely dated", homepage.includes("Aug 13, 2026") && homepage.includes("Received the National First Prize at the National Finals") && zhHomepage.includes("2026年8月13日") && zhHomepage.includes("第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛")],
  ["embedded competition award and official link are rendered across home and CV", homepage.includes("9th National College Student Embedded Chip and System Design Competition") && cv.includes("https://www.socchina.net/home") && zhHomepage.includes("https://www.socchina.net/home") && zhCv.includes("全国一等奖（2026年8月13日）")],
  ["last-updated footer is bilingual", homepage.includes("Last updated:") && zhHomepage.includes("最近更新：")],
  ["visitor counter is hidden by default on both homepages", homepage.includes('aria-expanded="false"') && zhHomepage.includes('aria-expanded="false"')],
  ["both languages share the visitor counter path", homepage.includes("https%3A%2F%2Fkirito14it.github.io") && zhHomepage.includes("https%3A%2F%2Fkirito14it.github.io")],
  ["visitor counter remains homepage-only", !cv.includes("data-visit-counter") && !zhCv.includes("data-visit-counter")],
  ["Chinese project body is translated", zhProject.includes("运行轨迹采集") && zhProject.includes("受控工具调用")],
  ["Chinese blog body is translated", zhBlog.includes("公开学术主页") && zhBlog.includes("GitHub 贡献图")],
  ["Chinese UI labels replace English section labels", zhHomepage.includes(">关于我</h2>") && zhHomepage.includes(">科研与实践经历</h2>") && !zhHomepage.includes(">About Me</h2>")],
  ["advisor titles remain consistent", homepage.includes("Advisor Jingfeng Zhang") && homepage.includes("Advisor Xingjun Ma") && zhHomepage.includes("导师张景锋") && zhHomepage.includes("导师马兴军")],
  ["academic honorifics remain removed for the two advisors", !homepage.includes("Prof. Jingfeng Zhang") && !homepage.includes("Dr. Xingjun Ma")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`Rendered-site validation failed:\n${failures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Rendered-site validation passed.");
