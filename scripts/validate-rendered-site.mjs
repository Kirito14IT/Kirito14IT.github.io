import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homepagePath = path.join(root, "dist", "index.html");

if (!fs.existsSync(homepagePath)) {
  console.error("Rendered homepage is missing. Run `npm run build` first.");
  process.exit(1);
}

const homepage = fs.readFileSync(homepagePath, "utf8");
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
  ["ACM News card links to the Awards section", acmNewsCard.includes('class="news-card-jump"') && acmNewsCard.includes('href="#awards-skills"')],
  ["advisor titles are rendered consistently", homepage.includes("Advisor Jingfeng Zhang") && homepage.includes("Advisor Xingjun Ma")],
  ["academic honorifics are removed for the two advisors", !homepage.includes("Prof. Jingfeng Zhang") && !homepage.includes("Dr. Xingjun Ma")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`Rendered-site validation failed:\n${failures.map((label) => `- ${label}`).join("\n")}`);
  process.exit(1);
}

console.log("Rendered-site validation passed.");
