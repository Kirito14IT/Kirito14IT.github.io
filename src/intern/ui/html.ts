// Tagged templates that escape every interpolated value. Only fragments built by
// `html` or wrapped with `raw` are inserted as markup, so data can never inject tags.

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export class SafeHtml {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

const escapeText = (value: string) => value.replace(/[&<>"']/g, (char) => ESCAPES[char]);

const render = (value: unknown): string => {
  if (value === null || value === undefined || value === false) return "";
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return escapeText(String(value));
};

export const raw = (value: string) => new SafeHtml(value);

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new SafeHtml(strings.reduce((out, part, index) => out + part + (index < values.length ? render(values[index]) : ""), ""));

export const safeUrl = (url: string) => {
  const value = String(url || "").trim();
  return /^https?:\/\/[^\s]+$/i.test(value) ? value : "";
};

export const mailtoHref = (email: string) => {
  const value = String(email || "").trim();
  return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value) ? `mailto:${value}` : "";
};
