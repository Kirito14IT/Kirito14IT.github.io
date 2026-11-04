// In-memory stand-in for the parts of the GitHub REST API the tracker uses:
// repository metadata, the contents API (with sha checks), and git blobs.
// Shared by the unit tests and the local mock server; it never touches the network.
import { createHash } from "node:crypto";

export interface FakeGitHubOptions {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
  files?: Record<string, string>;
  inlineLimit?: number;
}

export interface FakeCommit {
  path: string;
  message: string;
  sha: string;
}

export const blobSha = (text: string) => {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
};

const wrapLines = (value: string) => value.replace(/.{1,60}/g, "$&\n");

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "Authorization, Content-Type, Accept, X-GitHub-Api-Version",
  "access-control-allow-methods": "GET, PUT, OPTIONS",
  "access-control-expose-headers": "X-RateLimit-Remaining"
};

export const createFakeGitHub = (options: FakeGitHubOptions) => {
  const branch = options.branch || "main";
  const files = new Map(Object.entries(options.files || {}));
  const commits: FakeCommit[] = [];
  const failures: { status: number; headers: Record<string, string> }[] = [];

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS_HEADERS, ...headers } });
  const notFound = () => json(404, { message: "Not Found" });

  const handle = async (url: string, init: RequestInit = {}) => {
    const method = (init.method || "GET").toUpperCase();
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    const failure = failures.shift();
    if (failure) return json(failure.status, { message: "simulated failure" }, failure.headers);
    const authorization = new Headers(init.headers).get("authorization");
    if (options.token && authorization !== `Bearer ${options.token}`) return json(401, { message: "Bad credentials" });

    const { pathname, searchParams } = new URL(url);
    const prefix = `/repos/${options.owner}/${options.repo}`;
    if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return notFound();
    const rest = pathname.slice(prefix.length);

    if (rest === "" && method === "GET") {
      return json(200, { full_name: `${options.owner}/${options.repo}`, private: true, permissions: { pull: true, push: true } });
    }
    if (rest.startsWith("/git/blobs/") && method === "GET") {
      const sha = rest.slice("/git/blobs/".length);
      for (const text of files.values()) {
        if (blobSha(text) === sha) {
          return json(200, { sha, encoding: "base64", size: Buffer.byteLength(text), content: wrapLines(Buffer.from(text).toString("base64")) });
        }
      }
      return notFound();
    }
    if (!rest.startsWith("/contents/")) return notFound();

    const filePath = decodeURIComponent(rest.slice("/contents/".length));
    const current = files.get(filePath);
    if (method === "GET") {
      if ((searchParams.get("ref") || branch) !== branch || current === undefined) return notFound();
      const size = Buffer.byteLength(current, "utf8");
      const inline = size <= (options.inlineLimit ?? 1_000_000);
      return json(200, {
        type: "file",
        path: filePath,
        sha: blobSha(current),
        size,
        encoding: inline ? "base64" : "none",
        content: inline ? wrapLines(Buffer.from(current).toString("base64")) : ""
      });
    }
    if (method === "PUT") {
      const body = JSON.parse(String(init.body || "{}")) as { message?: string; content?: string; sha?: string; branch?: string };
      if ((body.branch || branch) !== branch) return notFound();
      if (current !== undefined && !body.sha) return json(422, { message: 'Invalid request.\n\n"sha" wasn\'t supplied.' });
      if (current !== undefined && body.sha !== blobSha(current)) return json(409, { message: `${filePath} does not match ${body.sha}` });
      const text = Buffer.from(body.content || "", "base64").toString("utf8");
      files.set(filePath, text);
      const sha = blobSha(text);
      commits.push({ path: filePath, message: body.message || "", sha });
      return json(current === undefined ? 201 : 200, { content: { path: filePath, sha }, commit: { message: body.message || "" } });
    }
    return notFound();
  };

  return {
    fetch: (input: string, init?: RequestInit) => handle(String(input), init),
    handle,
    files,
    commits,
    setFile: (filePath: string, text: string) => files.set(filePath, text),
    failNext: (status: number, headers: Record<string, string> = {}) => failures.push({ status, headers })
  };
};
