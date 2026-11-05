import { GitHubError } from "../data/github.ts";

// Turns a failed connection into advice for the setting most likely at fault. GitHub
// answers 404 rather than 403 when a token cannot see a private repository, so the
// stage (checking access vs reading files) decides which advice applies.

export type ConnectStage = "access" | "load";

export const connectErrorMessage = (error: unknown, stage: ConnectStage, settings: { dir: string; branch: string }) => {
  if (!(error instanceof GitHubError)) return error instanceof Error ? error.message : String(error);
  if (error.kind === "auth") return "令牌无效或已过期。请重新复制完整的令牌后再试。";
  if (error.kind === "not_found" && stage === "access") {
    return "GitHub 返回 404：这个令牌看不到该仓库。最常见的原因是创建令牌时 Repository access 保留了默认的 Public repositories；也可能令牌建在了另一个 GitHub 账号下。请在令牌设置里改为 Only select repositories 并勾选这个仓库，Contents 设为 Read and write。";
  }
  if (error.kind === "not_found") {
    const folder = settings.dir ? `${settings.dir}/` : "";
    return `能访问仓库，但在 ${settings.branch} 分支找不到数据文件（${folder}postings.json、contacts.json、progress.json）。请检查高级设置里的分支和数据目录。`;
  }
  if (error.kind === "forbidden") return "令牌能看到仓库，但没有读写内容的权限。请在令牌设置里把 Contents 设为 Read and write。";
  return error.message;
};
