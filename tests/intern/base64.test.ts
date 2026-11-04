import { test } from "node:test";
import assert from "node:assert/strict";
import { base64ToUtf8, utf8ToBase64 } from "../../src/intern/core/base64.ts";

test("utf8 text round-trips through base64", () => {
  const text = "代码后训练实习 · Agent RL 🚀";
  assert.equal(base64ToUtf8(utf8ToBase64(text)), text);
  assert.equal(utf8ToBase64("hi"), "aGk=");
});

test("large payloads encode without exhausting the call stack", () => {
  const text = "实习".repeat(400_000);
  assert.equal(base64ToUtf8(utf8ToBase64(text)), text);
});

test("base64ToUtf8 ignores the line breaks GitHub inserts", () => {
  assert.equal(base64ToUtf8("5Luj\n56CB\n"), "代码");
});
