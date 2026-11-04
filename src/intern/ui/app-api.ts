import type { ActionContext } from "../core/actions.ts";
import type { FileKey, Snapshot } from "../core/types.ts";
import type { TrackerSync } from "../data/sync.ts";
import type { UiState, ViewContext } from "./context.ts";
import type { SafeHtml } from "./html.ts";

// What command handlers may use from the running page.
export interface App {
  readonly state: UiState;
  readonly sync: TrackerSync | null;
  context(): ViewContext;
  render(): void;
  toast(message: string, kind?: "info" | "error"): void;
  mutate<K extends FileKey>(key: K, message: string, edit: (file: Snapshot[K], ctx: ActionContext) => void): boolean;
  openDialog(content: SafeHtml): void;
  closeDialog(): void;
  openPosting(id: string): void;
}
