import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homepagePath = path.join(root, "dist", "index.html");
const cvPath = path.join(root, "dist", "cv", "index.html");

if (!fs.existsSync(homepagePath) || !fs.existsSync(cvPath)) {
  console.error("Rendered homepage or CV is missing. Run `npm run build` first.");
  process.exit(1);
}

const homepage = fs.readFileSync(homepagePath, "utf8");
const cv = fs.readFileSync(cvPath, "utf8");
const profileCard = homepage.match(/<a[^>]*data-profile-card[\s\S]*?<\/a>/)?.[0] || "";
const acmerLogo = profileCard.match(/<div[^>]*data-acmer-logo[\s\S]*?<\/div>/)?.[0] || "";
const acmNewsCard = homepage.match(/<article[^>]*class="news-jump-card"[\s\S]*?May 2023 - Jul 2025[\s\S]*?<\/article>/)?.[0] || "";

const checks = [
  ["profile card exposes a stable rendered marker", profileCard.length > 0],
  ["ACMer logo is rendered in the profile card", profileCard.includes("data-acmer-logo") && profileCard.includes('aria-label="ACMer logo"')],
  ["ACMer wordmark is one continuous text element", /<text[^>]*data-acmer-wordmark[^>]*>ACMer<\/text>/.test(acmerLogo)],
  ["ACMer logo has no outer frame", !/<rect[^>]*stroke=/.test(acmerLogo)],
  ["old Academic Homepage label is removed from the profile card", !profileCard.includes("Academic Homepage")],
  ["ACM training-team period is rendered in News", homepage.includes("May 2023 - Jul 2025")],
  ["ACM training-team link is rendered in News", homepage.includes("https://cec.usst.edu.cn/2019/0523/c6556a148258/page.htm")],
  ["ACMer identity is rendered in News", homepage.includes("ACMer")],
  ["RAICOM national first prize is rendered in ACM News", acmNewsCard.includes("National First Prize in the 2025 RAICOM Robot Developer Competition")],
  ["ACM News card links to the Awards section", acmNewsCard.includes('class="news-card-jump"') && acmNewsCard.includes('href="#awards-skills"')],
  ["international organization internship News period is Jan to Apr 2026", homepage.includes("Jan - Apr 2026")],
  ["international organization internship timeline period is Jan to Apr 2026", homepage.includes("Jan 2026 - Apr 2026")],
  ["NeurIPS reviewer service is rendered in News", homepage.includes("Began serving as a reviewer for NeurIPS 2026")],
  ["Services navigation link is rendered", homepage.includes('href="#services">Services</a>')],
  ["NeurIPS reviewer service is rendered on the homepage", homepage.includes('id="services"') && homepage.includes("Reviewer, NeurIPS 2026")],
  ["NeurIPS reviewer service is rendered on the CV", cv.includes("Reviewer, NeurIPS 2026")],
  ["three-time National Encouragement Scholarship is rendered", homepage.includes("National Encouragement Scholarship, Three-time Recipient") && cv.includes("National Encouragement Scholarship, Three-time Recipient")],
  ["Git-derived last-updated footer is rendered", homepage.includes("data-site-footer") && homepage.includes("data-last-updated") && /<time[^>]*datetime="[^"]+"/.test(homepage)],
  ["visitor counter is hidden by default on the homepage", homepage.includes("data-visit-counter") && homepage.includes('aria-expanded="false"') && homepage.includes("data-visit-count-value")],
  ["visitor counter uses the configured badge endpoint", homepage.includes("https://api.visitorbadge.io/api/visitors")],
  ["visitor counter is limited to the homepage", !cv.includes("data-visit-counter")],
  ["advisor titles are rendered consistently", homepage.includes("Advisor Jingfeng Zhang") && homepage.includes("Advisor Xingjun Ma")],
  ["academic honorifics are removed for the two advisors", !homepage.includes("Prof. Jingfeng Zhang") && !homepage.includes("Dr. Xingjun Ma")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`Rendered-site validation failed:\n${failures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Rendered-site validation passed.");
