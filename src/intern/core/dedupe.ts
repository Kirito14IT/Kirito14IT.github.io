export interface DuplicateCandidate {
  id?: string;
  company: string;
  title: string;
  url: string;
}

export interface DuplicateMatch {
  id: string;
  strength: "strong" | "weak";
  reason: string;
}

const TRACKING_PARAM = /^(utm_\w+|spm|from|source|ref|share\w*|fbclid|gclid)$/i;

// Hash fragments stay: several job boards route individual postings through `#/job/...`.
export const normalizeUrl = (url: string) => {
  const text = String(url || "").trim();
  if (!text) return "";
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return text.toLowerCase();
  }
  if (!/^https?:$/.test(parsed.protocol)) return text.toLowerCase();
  const params = [...parsed.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAM.test(key))
    .sort(([a, aValue], [b, bValue]) => (a === b ? aValue.localeCompare(bValue) : a.localeCompare(b)));
  const query = params.length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
  const pathname = parsed.pathname.replace(/\/+$/, "");
  const hash = parsed.hash === "#/" ? "" : parsed.hash;
  return `${parsed.protocol}//${parsed.host}${pathname}${query}${hash}`;
};

export const normalizeTitle = (title: string) =>
  String(title || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");

export const findDuplicates = (candidate: DuplicateCandidate, existing: readonly (DuplicateCandidate & { id: string })[]) => {
  const url = normalizeUrl(candidate.url);
  const title = normalizeTitle(candidate.title);
  const company = normalizeTitle(candidate.company);
  const matches: DuplicateMatch[] = [];
  for (const record of existing) {
    if (candidate.id && record.id === candidate.id) continue;
    const sameUrl = url !== "" && normalizeUrl(record.url) === url;
    const sameTitle = title !== "" && normalizeTitle(record.title) === title;
    const sameCompany = company !== "" && normalizeTitle(record.company) === company;
    if (sameUrl && sameTitle) matches.push({ id: record.id, strength: "strong", reason: "网址和岗位名相同" });
    else if (sameCompany && sameTitle) matches.push({ id: record.id, strength: "strong", reason: "公司和岗位名相同" });
    else if (sameUrl) matches.push({ id: record.id, strength: "weak", reason: "网址相同但岗位名不同" });
  }
  return matches;
};
