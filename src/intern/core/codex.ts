import { extractLeadingDate, isIsoDate } from "./dates.ts";
import { normalizeContact, normalizePosting } from "./schema.ts";
import type { Contact, Posting, ProgramRule, RecordType, Taxonomy } from "./types.ts";

// Maps the JSON written by the Codex research sessions onto the tracker schema.

export interface CodexContext {
  batch: string;
  taxonomy: Taxonomy;
  now: string;
  legacyJobs?: Map<string, { title: string; url: string }>;
}

type Loose = Record<string, unknown>;

const asRecord = (value: unknown): Loose => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Loose) : {});
const text = (value: unknown) => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "");
const list = (value: unknown) =>
  (Array.isArray(value) ? value.map(text) : text(value).split(/[;；,，\s]+/)).filter(Boolean);

const RECORD_TYPE_BY_LABEL: Record<string, RecordType> = { 具体JD: "jd", 计划实习入口: "program", 导师实习招募: "mentor" };
// A leading date followed by these words records when a page was read, or dates an older post.
const NOT_A_PUBLICATION_DATE = /读取|核验|检索|旧帖|原始招聘/;
const ROLLING_DEADLINE = /全年开放|滚动/;
const TEAM_MAILBOX = /招聘|校园|校招|咨询|项目组|通用|统一|官方|公共/;
const LISTED_RECIPIENT = /指定|列出|列名/;
const EXTRA_FIELDS = [
  ["contactName", "contact_name"],
  ["contactRelation", "contact_relation"],
  ["supplementalEvidence", "supplemental_evidence"],
  ["unit", "unit"]
] as const;

const patternMatches = (pattern: string, value: string) => {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return value.toLowerCase().includes(pattern.toLowerCase());
  }
};

export const applyProgramRules = (program: string, company: string, rules: readonly ProgramRule[]) => {
  for (const rule of rules) {
    if (rule.company && rule.company !== company) continue;
    const included = rule.include.some((pattern) => patternMatches(pattern, program));
    const excluded = (rule.exclude || []).some((pattern) => patternMatches(pattern, program));
    if (included && !excluded) return rule.tag;
  }
  return "";
};

const checkedDate = (value: unknown) => (isIsoDate(value) ? value : null);

export const mapCodexPosting = (raw: unknown, ctx: CodexContext): Posting => {
  const source = asRecord(raw);
  const company = text(source.parent_company) || text(source.company);
  const organization = text(source.organization);
  const program = text(source.program);
  const deadline = text(source.deadline);
  const sourceDate = text(source.source_date);
  const published = extractLeadingDate(sourceDate);
  const extra: Record<string, string> = {};
  for (const [key, field] of EXTRA_FIELDS) {
    if (text(source[field])) extra[key] = text(source[field]);
  }
  const warnings: string[] = [];
  const posting = normalizePosting(
    {
      id: text(source.id),
      company,
      team: organization && organization !== company ? organization : "",
      companyTier: ctx.taxonomy.companyTiers[company] || "",
      title: text(source.title),
      program,
      programTag: applyProgramRules(program, company, ctx.taxonomy.programRules),
      recordType: RECORD_TYPE_BY_LABEL[text(source.record_type)] || "jd",
      internshipType: text(source.internship_type),
      region: text(source.region) === "海外" ? "overseas" : "cn",
      location: text(source.location),
      focus: source.focus,
      requirements: text(source.requirements),
      duration: text(source.duration),
      jd: text(source.jd),
      fit: text(source.fit),
      fitReason: text(source.fit_reason),
      gaps: text(source.gaps),
      priority: source.priority,
      eligibility: {
        bucket: text(source.eligibility_bucket),
        note: text(source.eligibility_status),
        graduationWindow: text(source.graduation_window)
      },
      url: text(source.url),
      sourceUrl: text(source.source_url),
      dates: {
        publishedAt: published && !NOT_A_PUBLICATION_DATE.test(sourceDate) ? published : null,
        opensAt: null,
        closesAt: extractLeadingDate(deadline),
        rolling: ROLLING_DEADLINE.test(deadline),
        startTerm: "",
        note: deadline,
        source: "",
        checkedAt: checkedDate(source.checked_date)
      },
      siteStatus: text(source.status),
      contactIds: list(source.contact_ids),
      legacyJobIds: list(source.existing_job_ids),
      provenance: {
        batch: ctx.batch,
        origin: text(source.origin),
        sourceDate,
        checkedAt: checkedDate(source.checked_date),
        sourceFile: text(source.source_file)
      },
      updatedAt: ctx.now,
      archived: false,
      extra
    },
    warnings
  );
  if (!posting) throw new Error(`无法导入岗位：${warnings.join("；")}`);
  return posting;
};

export const mapCodexContact = (raw: unknown, ctx: CodexContext): Contact => {
  const source = asRecord(raw);
  const warnings: string[] = [];
  const contact = normalizeContact(
    {
      id: text(source.id),
      company: text(source.company),
      organization: text(source.organization),
      name: text(source.name),
      role: text(source.role),
      email: text(source.email),
      emailType: text(source.email_type),
      contactType: text(source.contact_type),
      interests: text(source.interests),
      whyContact: text(source.why_contact),
      relationLevel: text(source.relation_level),
      relationLabel: text(source.relation_label),
      relationEvidence: text(source.relation_evidence),
      relationScope: text(source.relation_scope),
      exactJobOwnerConfirmed: source.exact_job_owner_confirmed,
      specificJdRelation: text(source.specific_jd_relation),
      jobMappingScope: text(source.job_mapping_scope),
      outreachGate: text(source.outreach_gate),
      caveats: text(source.caveats),
      recruitingStatus: text(source.recruiting_status),
      priority: source.contact_priority,
      sourceUrl: text(source.contact_source_url),
      affiliationUrl: text(source.affiliation_source_url),
      legacyJobRefs: list(source.job_ids).map((id) => ({ id, ...(ctx.legacyJobs?.get(id) || { title: "", url: "" }) })),
      origin: "codex",
      checkedAt: checkedDate(source.checked_date),
      sourceDate: text(source.source_date),
      updatedAt: ctx.now,
      archived: false
    },
    warnings
  );
  if (!contact) throw new Error(`无法导入联系人：${warnings.join("；")}`);
  return contact;
};

// Some postings list an address that never made it into the contact sheet, such as a
// JD-designated recipient or a programme mailbox. Those become contacts of their own.
const inlineContact = (source: Loose, posting: Posting, email: string, name: string, shared: boolean, id: string, ctx: CodexContext) => {
  const relation = text(source.contact_relation);
  const mailbox = TEAM_MAILBOX.test(name) || (!shared && TEAM_MAILBOX.test(relation));
  const listed = !mailbox && LISTED_RECIPIENT.test(`${name}${relation}`);
  const [level, label] = mailbox ? ["C", "C 通用/项目转介"] : listed ? ["A", "A1 原始JD列名/收件"] : ["B", "B 团队/研究关联"];
  const warnings: string[] = [];
  const contact = normalizeContact(
    {
      id,
      company: posting.company,
      organization: posting.team || posting.company,
      name,
      role: "岗位页列出的邮箱",
      email,
      emailType: mailbox ? "团队/公共邮箱" : "岗位指定邮箱",
      contactType: mailbox ? "团队/公共邮箱" : "技术/科研个人",
      whyContact: relation,
      relationLevel: level,
      relationLabel: label,
      relationEvidence: relation,
      specificJdRelation: listed ? `岗位 ${posting.id} 原文列出该邮箱` : "",
      sourceUrl: text(source.contact_source_url) || posting.url,
      origin: "posting-inline",
      checkedAt: posting.provenance.checkedAt,
      sourceDate: text(source.source_date),
      updatedAt: ctx.now
    },
    warnings
  );
  if (!contact) throw new Error(`无法从岗位 ${posting.id} 生成联系人：${warnings.join("；")}`);
  return contact;
};

export const batchFromCodex = (
  raw: { internships: unknown[]; contacts?: unknown[]; jobs?: unknown[] },
  options: CodexContext & { includeRestricted: boolean; existingContacts: readonly Contact[] }
) => {
  const internships = raw.internships.map(asRecord);
  const legacyJobs = new Map(options.legacyJobs || []);
  for (const job of [...(raw.jobs || []).map(asRecord), ...internships]) {
    const id = text(job.id);
    if (id && !legacyJobs.has(id)) legacyJobs.set(id, { title: text(job.title), url: text(job.url) });
  }
  const ctx: CodexContext = { ...options, legacyJobs };
  const contacts = (raw.contacts || []).map((item) => mapCodexContact(item, ctx));
  const knownEmails = new Map<string, string>();
  for (const contact of [...options.existingContacts, ...contacts]) {
    if (contact.email) knownEmails.set(contact.email.toLowerCase(), contact.id);
  }
  const usedIds = new Set([...options.existingContacts, ...contacts].map((contact) => contact.id));
  let sequence = 0;
  const allocateId = () => {
    let id = "";
    do {
      sequence += 1;
      id = `X${String(sequence).padStart(3, "0")}`;
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  };

  const postings: Posting[] = [];
  const skipped: string[] = [];
  for (const source of internships) {
    if (source.current_view === false && !options.includeRestricted) {
      skipped.push(text(source.id));
      continue;
    }
    const posting = mapCodexPosting(source, ctx);
    const emails = list(source.contact_emails).length > 0 ? list(source.contact_emails) : list(source.contact_email);
    const names = text(source.contact_name).split(/[；;]/).map(text).filter(Boolean);
    emails.forEach((email, index) => {
      const key = email.toLowerCase();
      let id = knownEmails.get(key);
      if (!id) {
        id = allocateId();
        knownEmails.set(key, id);
        const name = names.length === emails.length ? names[index] : text(source.contact_name) || email;
        contacts.push(inlineContact(source, posting, email, name, emails.length > 1, id, ctx));
      }
      if (!posting.contactIds.includes(id)) posting.contactIds.push(id);
    });
    postings.push(posting);
  }
  return { postings, contacts, skipped, warnings: [] as string[] };
};
