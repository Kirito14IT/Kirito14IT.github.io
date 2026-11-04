// Synthetic records shaped like the Codex research output. No real postings or people.
import type { Taxonomy } from "../../src/intern/core/types.ts";

export const taxonomy: Taxonomy = {
  companyTiers: { 示例科技: "国内大厂" },
  programRules: [
    { tag: "星火计划", include: ["星火"], exclude: ["非星火"] },
    { tag: "示例 Top Talent", include: ["top talent"], company: "示例科技" }
  ],
  focusOrder: []
};

export const codexPosting = (overrides: Record<string, unknown> = {}) => ({
  id: "S001",
  company: "示例科技",
  parent_company: "示例科技",
  organization: "示例科技",
  program: "日常实习",
  title: "代码后训练实习生",
  record_type: "具体JD",
  internship_type: "日常实习",
  location: "北京",
  requirements: "本科及以上",
  eligibility_status: "本科可投",
  graduation_window: "不限届别",
  duration: "至少3个月",
  deadline: "未公布",
  status: "页面可见",
  jd: "负责代码后训练",
  fit_reason: "评测经历匹配",
  gaps: "缺少 RL 训练经验",
  priority: 1,
  url: "https://jobs.example.com/p/1",
  source_url: "https://jobs.example.com/p/1",
  source_date: "页面未标日期",
  checked_date: "2026-11-05",
  contact_name: "",
  contact_email: "",
  contact_source_url: "",
  contact_relation: "",
  existing_job_ids: [],
  origin: "本轮新增",
  contact_ids: [],
  fit: "高",
  eligibility_bucket: "本科可尝试",
  current_view: true,
  focus: "Coding Agent/代码 / 后训练/RL",
  region: "中国/按项目确认",
  contact_emails: [],
  ...overrides
});

export const codexContact = (overrides: Record<string, unknown> = {}) => ({
  id: "C001",
  company: "示例科技",
  organization: "示例科技基座团队",
  name: "张三",
  role: "后训练负责人",
  email: "zhangsan@example.com",
  email_type: "公司个人邮箱",
  contact_type: "技术/科研个人",
  interests: "RL、Agent",
  why_contact: "本人公开招实习",
  relation_level: "A",
  relation_label: "A2 本人同方向招聘",
  relation_evidence: "个人主页写明招实习",
  contact_source_url: "https://zhangsan.example.com",
  affiliation_source_url: "https://zhangsan.example.com/about",
  job_ids: ["J001", "J404"],
  contact_priority: 1,
  recruiting_status: "公开招募",
  caveats: "需确认名额",
  checked_date: "2026-11-04",
  source_date: "2026-10",
  outreach_gate: "先确认方向",
  specific_jd_relation: "未证具体JD负责人",
  job_mapping_scope: "方向参考",
  ...overrides
});
