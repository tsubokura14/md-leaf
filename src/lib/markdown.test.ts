import { describe, expect, test } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  test("フロントマターを本文から外し、title を返す", () => {
    const result = renderMarkdown("---\ntitle: ノートの入り口\ntags: [a]\n---\n\n本文です。\n");
    expect(result.title).toBe("ノートの入り口");
    expect(result.html).toBe("<p>本文です。</p>");
  });

  test("フロントマターに title がなければ、title を返さない", () => {
    const result = renderMarkdown("---\ntags: [a]\n---\n\n本文です。\n");
    expect(result.title).toBeUndefined();
    expect(result.html).toBe("<p>本文です。</p>");
  });

  test("フロントマターがなければ、title を返さず、本文はそのまま HTML にする", () => {
    const result = renderMarkdown("## 見出し\n\n本文です。\n");
    expect(result.title).toBeUndefined();
    expect(result.html).toBe("<h2>見出し</h2>\n<p>本文です。</p>");
  });

  test("フロントマターの title が数なら、文字にして返す", () => {
    const result = renderMarkdown("---\ntitle: 2024\n---\n\n本文です。\n");
    expect(result.title).toBe("2024");
  });

  test("フロントマターの YAML が壊れていても、本文を出し、title を返さない", () => {
    const result = renderMarkdown("---\ntitle: [閉じていない\n---\n\n本文です。\n");
    expect(result.title).toBeUndefined();
    expect(result.html).toBe("<p>本文です。</p>");
  });

  test("文の中の HTML のタグは、HTML にせず文字として出す", () => {
    const result = renderMarkdown('文の中に <b onclick="x()">太字</b> がある。\n');
    expect(result.html).toBe('<p>文の中に &#x3C;b onclick="x()">太字&#x3C;/b> がある。</p>');
  });

  test("段落になった HTML のタグは、HTML にせず文字の段落として出す", () => {
    const result = renderMarkdown("<script>alert(1)</script>\n");
    expect(result.html).toBe("<p>&#x3C;script>alert(1)&#x3C;/script></p>");
  });

  test("http(s):// のリンクは、別のタブで開く", () => {
    const result = renderMarkdown("[外](https://example.com) と [外2](http://example.com)\n");
    expect(result.html).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">外</a> と <a href="http://example.com" target="_blank" rel="noopener noreferrer">外2</a></p>',
    );
  });

  test("相対リンクは、別のタブにしない", () => {
    const result = renderMarkdown("[中](../dev/memo.md)\n");
    expect(result.html).toBe('<p><a href="../dev/memo.md">中</a></p>');
  });
});
