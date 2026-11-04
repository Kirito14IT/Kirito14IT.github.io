import { base64ToUtf8, utf8ToBase64 } from "../core/base64.ts";

// Minimal client for the GitHub REST contents API, used to read and write the data files.

export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
  dir: string;
  apiBase: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type GitHubErrorKind = "auth" | "forbidden" | "not_found" | "conflict" | "rate_limit" | "network" | "invalid" | "server";

export const DEFAULT_API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

export class GitHubError extends Error {
  kind: GitHubErrorKind;
  status: number;

  constructor(kind: GitHubErrorKind, status: number, message: string) {
    super(message);
    this.name = "GitHubError";
    this.kind = kind;
    this.status = status;
  }
}

export const parseRepo = (value: string) => {
  const match = /^(?:https?:\/\/github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(value.trim());
  return match ? { owner: match[1], repo: match[2] } : null;
};

const readMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : "";
  } catch {
    return "";
  }
};

const errorFor = async (response: Response) => {
  const { status } = response;
  const detail = await readMessage(response);
  if (status === 401) return new GitHubError("auth", status, "令牌无效或已过期");
  if (status === 429 || (status === 403 && response.headers.get("x-ratelimit-remaining") === "0")) {
    return new GitHubError("rate_limit", status, "GitHub 接口调用次数已达上限，请稍后再试");
  }
  if (status === 403) return new GitHubError("forbidden", status, "令牌没有访问这个仓库的权限");
  if (status === 404) return new GitHubError("not_found", status, "找不到仓库或数据文件，也可能是令牌没有访问权限");
  if (status === 409 || (status === 422 && /sha/i.test(detail))) return new GitHubError("conflict", status, "远端数据已被修改");
  if (status >= 500) return new GitHubError("server", status, "GitHub 服务暂时不可用");
  return new GitHubError("invalid", status, `请求失败（${status}）${detail ? `：${detail}` : ""}`);
};

export const createGitHubClient = ({ fetch, token, ref }: { fetch: FetchLike; token: string; ref: RepoRef }) => {
  const repoUrl = `${ref.apiBase.replace(/\/+$/, "")}/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;
  const filePath = (name: string) =>
    [ref.dir, name]
      .filter(Boolean)
      .join("/")
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");

  const request = async (url: string, init: RequestInit = {}) => {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": API_VERSION,
          ...(init.body ? { "Content-Type": "application/json" } : {})
        }
      });
    } catch {
      throw new GitHubError("network", 0, "网络连接失败，请检查网络后重试");
    }
    if (!response.ok) throw await errorFor(response);
    return (await response.json()) as Record<string, unknown>;
  };

  return {
    async checkAccess() {
      const body = await request(repoUrl);
      const permissions = (body.permissions || {}) as { push?: unknown };
      return { fullName: String(body.full_name || ""), private: body.private === true, canPush: permissions.push === true };
    },

    async getFile(name: string) {
      const body = await request(`${repoUrl}/contents/${filePath(name)}?ref=${encodeURIComponent(ref.branch)}`);
      if (body.type !== "file" || typeof body.sha !== "string") throw new GitHubError("invalid", 200, `${name} 不是文件`);
      let content = typeof body.content === "string" ? body.content : "";
      // Files over 1 MB come back without inline content; the blob API still serves them.
      if (body.encoding !== "base64" || (content === "" && Number(body.size) > 0)) {
        const blob = await request(`${repoUrl}/git/blobs/${body.sha}`);
        content = typeof blob.content === "string" ? blob.content : "";
      }
      return { text: base64ToUtf8(content), sha: body.sha };
    },

    async putFile(name: string, text: string, sha: string | null, message: string) {
      const body = await request(`${repoUrl}/contents/${filePath(name)}`, {
        method: "PUT",
        body: JSON.stringify({ message, content: utf8ToBase64(text), branch: ref.branch, ...(sha ? { sha } : {}) })
      });
      const content = (body.content || {}) as { sha?: unknown };
      return { sha: String(content.sha || "") };
    }
  };
};

export type GitHubClient = ReturnType<typeof createGitHubClient>;
