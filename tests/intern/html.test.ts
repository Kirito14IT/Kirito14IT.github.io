import { test } from "node:test";
import assert from "node:assert/strict";
import { html, mailtoHref, raw, safeUrl } from "../../src/intern/ui/html.ts";

test("html escapes interpolated text", () => {
  const value = `<img src=x onerror="alert('x')">&`;
  assert.equal(html`<p title="${value}">${value}</p>`.toString(), '<p title="&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;">&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;</p>');
});

test("nested fragments and arrays are inserted once, without double escaping", () => {
  const items = ["a<b", "c"].map((item) => html`<li>${item}</li>`);
  assert.equal(html`<ul>${items}</ul>`.toString(), "<ul><li>a&lt;b</li><li>c</li></ul>");
  assert.equal(html`<b>${raw("<i>ok</i>")}</b>`.toString(), "<b><i>ok</i></b>");
});

test("empty values render as nothing and numbers as text", () => {
  assert.equal(html`[${null}${undefined}${false}${0}${12}]`.toString(), "[012]");
});

test("objects that merely look like fragments are still escaped", () => {
  const spoof = { html: "<script>" };
  assert.equal(html`${spoof}`.toString(), "[object Object]");
});

test("safeUrl only lets http and https through", () => {
  assert.equal(safeUrl(" https://jobs.example.com/p/1 "), "https://jobs.example.com/p/1");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,hi"), "");
  assert.equal(safeUrl("/relative"), "");
});

test("mailtoHref only builds links for plausible addresses", () => {
  assert.equal(mailtoHref("zhangsan@example.com"), "mailto:zhangsan@example.com");
  assert.equal(mailtoHref("not an address"), "");
  assert.equal(mailtoHref("a@b.com?cc=evil@example.com"), "");
});
