import { batchFromCodex } from "../core/codex.ts";
import { postingsCsv } from "../core/csv.ts";
import { filterPostings } from "../core/filters.ts";
import { applyPostingPatches, describeImport, detectBatchFormat, importBatch, prepareTrackerBatch } from "../core/importer.ts";
import type { ContactsFile, PostingsFile, Snapshot } from "../core/types.ts";
import type { App } from "./app-api.ts";
import type { ImportFormat } from "./views/dialogs.ts";

export interface ImportInput {
  text: string;
  format: ImportFormat;
  batch: string;
  includeRestricted: boolean;
}

export interface ImportPlan {
  format: Exclude<ImportFormat, "auto">;
  postings: PostingsFile;
  contacts: ContactsFile | null;
  lines: string[];
  changes: number;
}

type Loose = Record<string, unknown>;
const isRecord = (value: unknown): value is Loose => typeof value === "object" && value !== null && !Array.isArray(value);
const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

// Works out what an import would change, without touching the snapshot.
export const planImport = (snapshot: Snapshot, input: ImportInput, now: string, today: string): ImportPlan => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.text);
  } catch {
    throw new Error("JSON 格式有误，请检查是否完整复制");
  }
  const format = input.format === "auto" ? detectBatchFormat(parsed) : input.format;
  const batch = input.batch.trim() || `import-${today}`;
  const batchCode = today.replaceAll("-", "");
  const current = { postings: snapshot.postings, contacts: snapshot.contacts };

  if (format === "patch") {
    const patches = Array.isArray(parsed) ? parsed : isRecord(parsed) ? asArray(parsed.patches) : [];
    const result = applyPostingPatches(snapshot.postings, patches, now);
    const lines = [`补丁更新 ${result.report.updated.length} 个岗位，找不到 ${result.report.missing.length} 个编号`];
    for (const item of result.report.updated) lines.push(`${item.id}：${item.fields.join("、")}`);
    if (result.report.missing.length > 0) lines.push(`找不到：${result.report.missing.join("、")}`);
    return { format, postings: result.file, contacts: null, lines, changes: result.report.updated.length };
  }

  let incoming: Parameters<typeof importBatch>[1];
  let skipped: string[] = [];
  let warnings: string[] = [];
  if (format === "codex-internships" || format === "codex-contacts") {
    const source = isRecord(parsed) ? parsed : {};
    const list = asArray(parsed);
    const codex = batchFromCodex(
      {
        internships: format === "codex-internships" && Array.isArray(parsed) ? list : asArray(source.internships),
        contacts: format === "codex-contacts" && Array.isArray(parsed) ? list : asArray(source.contacts),
        jobs: asArray(source.jobs)
      },
      { batch, taxonomy: snapshot.postings.taxonomy, now, includeRestricted: input.includeRestricted, existingContacts: snapshot.contacts.contacts }
    );
    incoming = codex;
    skipped = codex.skipped;
  } else {
    const prepared = prepareTrackerBatch(parsed, {
      existingIds: snapshot.postings.postings.map((posting) => posting.id),
      taxonomy: snapshot.postings.taxonomy,
      batch,
      batchCode,
      now
    });
    incoming = prepared;
    warnings = prepared.warnings;
  }
  const result = importBatch(current, incoming, { batchCode, now });
  const { report } = result;
  return {
    format,
    postings: result.postings,
    contacts: result.contacts,
    lines: [...describeImport(report, batch, skipped), ...warnings.map((warning) => `提示：${warning}`)],
    changes: report.added.length + report.updated.length + report.contactsAdded.length + report.contactsUpdated.length
  };
};

export const applyImportPlan = (app: App, plan: ImportPlan, batch: string) => {
  if (plan.contacts) {
    const contacts = plan.contacts.contacts;
    app.mutate("contacts", `contacts: 导入 ${batch}`, (file) => void (file.contacts = contacts));
  }
  const { postings, taxonomy } = plan.postings;
  return app.mutate("postings", `postings: 导入 ${batch}`, (file) => {
    file.postings = postings;
    file.taxonomy = taxonomy;
  });
};

const download = (filename: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportJson = (app: App) => {
  const ctx = app.context();
  const backup = { exportedAt: new Date().toISOString(), ...ctx.snapshot };
  download(`tracker-backup-${ctx.today}.json`, `${JSON.stringify(backup, null, 2)}\n`, "application/json");
  app.toast("已导出全部数据");
};

export const exportCsv = (app: App) => {
  const ctx = app.context();
  const list = filterPostings(ctx.postings, ctx.state.filters, ctx.filterCtx);
  download(`postings-${ctx.today}.csv`, postingsCsv(list, ctx.snapshot.progress, ctx.contactsById, ctx.today), "text/csv;charset=utf-8");
  app.toast(`已导出 ${list.length} 个岗位`);
};
