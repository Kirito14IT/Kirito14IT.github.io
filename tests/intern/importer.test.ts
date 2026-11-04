import { test } from "node:test";
import assert from "node:assert/strict";
import { applyProgramRules, batchFromCodex, mapCodexContact, mapCodexPosting } from "../../src/intern/core/codex.ts";
import { applyPostingPatches, describeImport, detectBatchFormat, importBatch, prepareTrackerBatch } from "../../src/intern/core/importer.ts";
import { emptyContactsFile, emptyPostingsFile, normalizeContact, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Contact, Posting } from "../../src/intern/core/types.ts";
import { codexContact, codexPosting, taxonomy } from "./fixtures.ts";

const NOW = "2026-11-05T08:00:00.000Z";
const LATER = "2026-12-10T08:00:00.000Z";

const ctx = { batch: "codex-20261105", taxonomy, now: NOW };

test("mapCodexPosting maps the core Codex fields", () => {
  const posting = mapCodexPosting(codexPosting({ organization: "示例科技基座团队", record_type: "计划实习入口", region: "海外", priority: "2" }), ctx);
  assert.equal(posting.company, "示例科技");
  assert.equal(posting.team, "示例科技基座团队");
  assert.equal(posting.companyTier, "国内大厂");
  assert.equal(posting.recordType, "program");
  assert.equal(posting.region, "overseas");
  assert.deepEqual(posting.focus, ["Coding Agent/代码", "后训练/RL"]);
  assert.equal(posting.priority, 2);
  assert.deepEqual(posting.eligibility, { bucket: "本科可尝试", note: "本科可投", graduationWindow: "不限届别" });
  assert.equal(posting.fitReason, "评测经历匹配");
  assert.equal(posting.provenance.batch, "codex-20261105");
  assert.equal(posting.updatedAt, NOW);
});

test("mapCodexPosting leaves the team empty when it repeats the company", () => {
  assert.equal(mapCodexPosting(codexPosting(), ctx).team, "");
});

test("mapCodexPosting reads leading deadline and publication dates only", () => {
  const dated = mapCodexPosting(codexPosting({ deadline: "2027-07-16（可能招满提前关闭）", source_date: "2026-07-21（官方职位日期）" }), ctx);
  assert.equal(dated.dates.closesAt, "2027-07-16");
  assert.equal(dated.dates.publishedAt, "2026-07-21");
  assert.equal(dated.dates.note, "2027-07-16（可能招满提前关闭）");
  const checkedOnly = mapCodexPosting(codexPosting({ deadline: "逐岗位；旧帖2026-07-02截止", source_date: "2026-11-05读取官方动态页面" }), ctx);
  assert.equal(checkedOnly.dates.closesAt, null);
  assert.equal(checkedOnly.dates.publishedAt, null);
  const rolling = mapCodexPosting(codexPosting({ deadline: "全年开放（官网）" }), ctx);
  assert.equal(rolling.dates.rolling, true);
});

test("applyProgramRules honours exclusions and company scope", () => {
  assert.equal(applyProgramRules("星火计划（实习分支）", "任意公司", taxonomy.programRules), "星火计划");
  assert.equal(applyProgramRules("研发实习（非星火标签）", "任意公司", taxonomy.programRules), "");
  assert.equal(applyProgramRules("TOP Talent 实习", "示例科技", taxonomy.programRules), "示例 Top Talent");
  assert.equal(applyProgramRules("TOP Talent 实习", "其他公司", taxonomy.programRules), "");
});

test("mapCodexContact maps fields and resolves legacy job references", () => {
  const legacyJobs = new Map([["J001", { title: "旧岗位", url: "https://jobs.example.com/old" }]]);
  const contact = mapCodexContact(codexContact(), { ...ctx, legacyJobs });
  assert.equal(contact.whyContact, "本人公开招实习");
  assert.equal(contact.relationLabel, "A2 本人同方向招聘");
  assert.equal(contact.outreachGate, "先确认方向");
  assert.equal(contact.priority, 1);
  assert.deepEqual(contact.legacyJobRefs, [
    { id: "J001", title: "旧岗位", url: "https://jobs.example.com/old" },
    { id: "J404", title: "", url: "" }
  ]);
});

test("batchFromCodex skips restricted records unless asked to include them", () => {
  const internships = [codexPosting(), codexPosting({ id: "S002", title: "受限岗位", current_view: false })];
  assert.deepEqual(
    batchFromCodex({ internships }, { ...ctx, includeRestricted: false, existingContacts: [] }).postings.map((posting) => posting.id),
    ["S001"]
  );
  assert.equal(batchFromCodex({ internships }, { ...ctx, includeRestricted: true, existingContacts: [] }).postings.length, 2);
});

test("batchFromCodex turns emails missing from the contact list into linked contacts", () => {
  const internships = [
    codexPosting({
      id: "S010",
      contact_name: "岗位指定收件人（lisi）；示例实习招聘",
      contact_email: "lisi@example.com; interns@example.com",
      contact_emails: ["lisi@example.com", "interns@example.com"],
      contact_relation: "该JD原文指定收件邮箱"
    }),
    codexPosting({
      id: "S011",
      title: "评测实习生",
      contact_name: "示例实习招聘",
      contact_email: "interns@example.com",
      contact_emails: ["interns@example.com"],
      contact_relation: "官方通用咨询邮箱"
    }),
    codexPosting({ id: "S012", title: "安全实习生", contact_ids: ["C001"], contact_emails: ["zhangsan@example.com"] })
  ];
  const batch = batchFromCodex({ internships, contacts: [codexContact()] }, { ...ctx, includeRestricted: false, existingContacts: [] });
  const byEmail = new Map(batch.contacts.map((contact) => [contact.email, contact]));
  const person = byEmail.get("lisi@example.com");
  const mailbox = byEmail.get("interns@example.com");
  assert.ok(person && mailbox);
  assert.equal(person.name, "岗位指定收件人（lisi）");
  assert.equal(person.relationLabel, "A1 原始JD列名/收件");
  assert.equal(person.contactType, "技术/科研个人");
  assert.equal(mailbox.relationLabel, "C 通用/项目转介");
  assert.equal(mailbox.contactType, "团队/公共邮箱");
  assert.equal(person.origin, "posting-inline");
  const links = new Map(batch.postings.map((posting) => [posting.id, posting.contactIds]));
  assert.deepEqual(links.get("S010"), [person.id, mailbox.id]);
  assert.deepEqual(links.get("S011"), [mailbox.id]);
  assert.deepEqual(links.get("S012"), ["C001"]);
  assert.equal(batch.contacts.length, 3);
});

const posting = (overrides: Partial<Posting> & { id: string }): Posting => {
  const value = normalizePosting({ company: "示例科技", title: "代码后训练实习生", url: "https://jobs.example.com/p/1", updatedAt: NOW, ...overrides }, []);
  assert.ok(value);
  return value;
};

const contact = (overrides: Partial<Contact> & { id: string }): Contact => {
  const value = normalizeContact({ company: "示例科技", name: "张三", email: "zhangsan@example.com", updatedAt: NOW, ...overrides }, []);
  assert.ok(value);
  return value;
};

const files = (postings: Posting[] = [], contacts: Contact[] = []) => ({
  postings: { ...emptyPostingsFile(), taxonomy, postings },
  contacts: { ...emptyContactsFile(), contacts }
});

test("importBatch adds new postings and contacts", () => {
  const result = importBatch(files(), { postings: [posting({ id: "S001", contactIds: ["C001"] })], contacts: [contact({ id: "C001" })] }, { batchCode: "20261105", now: NOW });
  assert.deepEqual(result.report.added, ["S001"]);
  assert.deepEqual(result.report.contactsAdded, ["C001"]);
  assert.equal(result.postings.postings.length, 1);
  assert.equal(result.postings.updatedAt, NOW);
});

test("importBatch updates facts without clearing researched dates", () => {
  const existing = posting({ id: "S001", jd: "旧描述", dates: { closesAt: "2026-11-27", source: "https://jobs.example.com/p/1", checkedAt: "2026-11-05" } as Posting["dates"] });
  const incoming = posting({ id: "S001", jd: "新描述", location: "" });
  const result = importBatch(files([existing]), { postings: [incoming], contacts: [] }, { batchCode: "20261210", now: LATER });
  const updated = result.postings.postings[0];
  assert.equal(updated.jd, "新描述");
  assert.equal(updated.dates.closesAt, "2026-11-27");
  assert.equal(updated.updatedAt, LATER);
  assert.deepEqual(result.report.updated, [{ id: "S001", fields: ["jd"] }]);
});

test("importBatch reports unchanged postings without touching them", () => {
  const existing = posting({ id: "S001" });
  const result = importBatch(files([existing]), { postings: [posting({ id: "S001", updatedAt: LATER })], contacts: [] }, { batchCode: "20261210", now: LATER });
  assert.deepEqual(result.report.unchanged, ["S001"]);
  assert.equal(result.postings.postings[0].updatedAt, NOW);
  assert.equal(result.postings.updatedAt, "");
});

test("importBatch folds a strong duplicate with a new id into the existing posting", () => {
  const existing = posting({ id: "S001" });
  const duplicate = posting({ id: "N900", url: "https://jobs.example.com/p/1/?utm_source=feed", jd: "补充描述" });
  const result = importBatch(files([existing]), { postings: [duplicate], contacts: [] }, { batchCode: "20261210", now: LATER });
  assert.equal(result.postings.postings.length, 1);
  assert.deepEqual(result.report.merged, [{ incomingId: "N900", existingId: "S001", reason: "网址和岗位名相同" }]);
  assert.equal(result.postings.postings[0].jd, "补充描述");
});

test("importBatch gives a colliding id to a different posting a fresh id", () => {
  const existing = posting({ id: "S001" });
  const other = posting({ id: "S001", company: "样例智能", title: "多模态实习生", url: "https://jobs.example.org/7", contactIds: ["C001"] });
  const result = importBatch(files([existing], [contact({ id: "C001" })]), { postings: [other], contacts: [] }, { batchCode: "20261210", now: LATER });
  assert.equal(result.postings.postings.length, 2);
  assert.deepEqual(result.report.remapped, [{ from: "S001", to: "P20261210-001" }]);
  assert.equal(result.postings.postings[1].id, "P20261210-001");
});

test("importBatch matches contacts by email and rewrites posting references", () => {
  const known = contact({ id: "C001" });
  const sameEmail = contact({ id: "C077", name: "张三（Zhang San）", role: "研究员" });
  const linked = posting({ id: "S050", title: "评测实习生", url: "https://jobs.example.com/p/50", contactIds: ["C077"] });
  const result = importBatch(files([], [known]), { postings: [linked], contacts: [sameEmail] }, { batchCode: "20261210", now: LATER });
  assert.equal(result.contacts.contacts.length, 1);
  assert.deepEqual(result.report.contactsMerged, [{ incomingId: "C077", existingId: "C001" }]);
  assert.deepEqual(result.postings.postings[0].contactIds, ["C001"]);
  assert.equal(result.contacts.contacts[0].role, "研究员");
});

test("applyPostingPatches sets only the provided fields and can clear values", () => {
  const existing = posting({ id: "S001", dates: { closesAt: "2026-11-27", note: "旧备注" } as Posting["dates"] });
  const { file, report } = applyPostingPatches(
    { ...emptyPostingsFile(), postings: [existing] },
    [
      { id: "S001", dates: { closesAt: null, rolling: true, source: "https://jobs.example.com/faq", checkedAt: "2026-11-06" } },
      { id: "S404", dates: { rolling: true } }
    ],
    LATER
  );
  const patched = file.postings[0];
  assert.equal(patched.dates.closesAt, null);
  assert.equal(patched.dates.rolling, true);
  assert.equal(patched.dates.note, "旧备注");
  assert.equal(patched.updatedAt, LATER);
  assert.deepEqual(report.updated, [{ id: "S001", fields: ["dates.closesAt", "dates.rolling", "dates.source", "dates.checkedAt"] }]);
  assert.deepEqual(report.missing, ["S404"]);
});

test("prepareTrackerBatch numbers new postings and fills derived fields", () => {
  const { postings, contacts } = prepareTrackerBatch(
    {
      postings: [
        { company: "示例科技", title: "星火计划实习生", program: "星火计划（实习分支）" },
        { id: "S001", company: "样例智能", title: "已有编号的岗位" }
      ],
      contacts: [{ id: "N1", name: "李四", email: "lisi@example.com" }]
    },
    { existingIds: ["P20261105-001"], taxonomy, batch: "manual-test", batchCode: "20261105", now: NOW }
  );
  assert.deepEqual(postings.map((posting) => posting.id), ["P20261105-002", "S001"]);
  assert.equal(postings[0].companyTier, "国内大厂");
  assert.equal(postings[0].programTag, "星火计划");
  assert.equal(postings[0].provenance.batch, "manual-test");
  assert.equal(contacts[0].email, "lisi@example.com");
});

test("detectBatchFormat recognises each supported shape", () => {
  assert.equal(detectBatchFormat([codexPosting()]), "codex-internships");
  assert.equal(detectBatchFormat({ internships: [codexPosting()], contacts: [] }), "codex-internships");
  assert.equal(detectBatchFormat([codexContact()]), "codex-contacts");
  assert.equal(detectBatchFormat([{ id: "S001", dates: { closesAt: "2026-11-27" } }]), "patch");
  assert.equal(detectBatchFormat({ patches: [] }), "patch");
  assert.equal(detectBatchFormat({ postings: [{ company: "示例", title: "岗位" }] }), "tracker");
  assert.equal(detectBatchFormat([{ company: "示例", title: "岗位" }]), "tracker");
});

test("describeImport summarises a report in readable lines", () => {
  const result = importBatch(files(), { postings: [posting({ id: "S001" })], contacts: [contact({ id: "C001" })] }, { batchCode: "20261105", now: NOW });
  const lines = describeImport(result.report, "codex-test", ["S009"]);
  assert.equal(lines[0], "批次 codex-test：新增岗位 1，更新 0，未变化 0，合并重复 0，重新编号 0");
  assert.equal(lines[1], "联系人：新增 1，更新 0，合并 0，重新编号 0");
  assert.ok(lines.includes("跳过 1 条受限记录：S009"));
});
