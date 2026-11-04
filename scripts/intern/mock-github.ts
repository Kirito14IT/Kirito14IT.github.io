// Serves a local data directory through a stand-in for the GitHub contents API, so the
// page can be exercised without a real token. Saves from the page are written back to
// the directory, and files are re-read before every request, so editing one on disk
// behaves like a change made on another device.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";
import { createFakeGitHub } from "./fake-github.ts";

const { values } = parseArgs({
  options: {
    root: { type: "string" },
    port: { type: "string", default: "4599" },
    owner: { type: "string", default: "local" },
    repo: { type: "string", default: "tracker-data" },
    branch: { type: "string", default: "main" },
    token: { type: "string", default: "local-test-token" },
    "inline-limit": { type: "string" }
  }
});

if (!values.root) {
  console.error("用法：node scripts/intern/mock-github.ts --root <目录> [--port 4599] [--owner local] [--repo tracker-data] [--token local-test-token]");
  process.exit(1);
}

const root = path.resolve(values.root);
const listJson = (dir: string, prefix = ""): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return entry.name.startsWith(".") ? [] : listJson(path.join(dir, entry.name), `${prefix}${entry.name}/`);
    return entry.name.endsWith(".json") ? [`${prefix}${entry.name}`] : [];
  });

const fake = createFakeGitHub({
  owner: values.owner,
  repo: values.repo,
  branch: values.branch,
  token: values.token,
  inlineLimit: values["inline-limit"] ? Number(values["inline-limit"]) : undefined
});

const server = createServer(async (request, response) => {
  // POST /__fail/<status> makes the next API call fail, to try out error handling.
  const failure = /^\/__fail\/(\d{3})$/.exec(request.url || "");
  if (failure && request.method === "POST") {
    fake.failNext(Number(failure[1]));
    response.writeHead(204, { "access-control-allow-origin": "*" });
    response.end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  for (const file of listJson(root)) fake.setFile(file, readFileSync(path.join(root, file), "utf8"));
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers[key] = value;
  }
  const committed = fake.commits.length;
  const result = await fake.handle(`http://localhost${request.url || "/"}`, {
    method: request.method,
    headers,
    body: chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined
  });
  for (const commit of fake.commits.slice(committed)) {
    const target = path.join(root, commit.path);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, fake.files.get(commit.path) || "", "utf8");
    console.log(`提交 ${commit.path}：${commit.message}`);
  }
  console.log(`${request.method} ${request.url} → ${result.status}`);
  response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
  response.end(Buffer.from(await result.arrayBuffer()));
});

server.listen(Number(values.port), "127.0.0.1", () => {
  console.log(`本地 GitHub 模拟服务：http://127.0.0.1:${values.port}（仓库 ${values.owner}/${values.repo}，令牌 ${values.token}）`);
});
