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

  test("相対リンクは、別のタブにしない。links を渡さなければ書き換えず、切れたリンクともしない", () => {
    const result = renderMarkdown("[中](../dev/memo.md)\n");
    expect(result.html).toBe('<p><a href="../dev/memo.md">中</a></p>');
    expect(result.brokenLinks).toEqual([]);
  });

  describe("ノートへのリンク（links を渡したとき）", () => {
    const links = {
      fromPath: "開発/Git ブランチの運用メモ",
      notePaths: new Set(["index", "開発/リリースの手順", "開発/Docker のメモ"]),
    };

    test(".md の相対リンクを、ノートの URL に書き換え、data-note-link を付ける", () => {
      const result = renderMarkdown(
        "[手順](リリースの手順.md) [Docker](<Docker のメモ.md#見出し>) [ホーム](../index.md)",
        links,
      );
      const note = (name: string) =>
        `/notes/${encodeURIComponent("開発")}/${encodeURIComponent(name)}`;
      expect(result.html).toBe(
        `<p><a href="${note("リリースの手順")}" data-note-link="">手順</a> ` +
          `<a href="${note("Docker のメモ")}" data-note-link="">Docker</a> ` +
          `<a href="/" data-note-link="">ホーム</a></p>`,
      );
      expect(result.brokenLinks).toEqual([]);
    });

    test("リンク先がないリンクも書き換え、書かれたままのリンク先を brokenLinks に返す", () => {
      const result = renderMarkdown("[古い](<../開発/古い名前.md>) [外](../../x.md)", links);
      expect(result.html).toBe(
        `<p><a href="/notes/${encodeURIComponent("開発")}/${encodeURIComponent("古い名前")}" data-note-link="">古い</a> ` +
          `<a href="/notes/${encodeURIComponent("../x")}" data-note-link="">外</a></p>`,
      );
      expect(result.brokenLinks).toEqual(["../開発/古い名前.md", "../../x.md"]);
    });

    test("対象外のリンク（外へのリンク、.md 以外、#見出し だけ）は変えない", () => {
      const result = renderMarkdown("[外](https://example.com/a.md) [図](図.png) [節](#節)", links);
      expect(result.html).toBe(
        '<p><a href="https://example.com/a.md" target="_blank" rel="noopener noreferrer">外</a> ' +
          `<a href="${encodeURI("図.png")}">図</a> <a href="${encodeURI("#節")}">節</a></p>`,
      );
      expect(result.brokenLinks).toEqual([]);
    });

    test("[[ ]] の書き方はリンクにせず、文字のまま出す", () => {
      const result = renderMarkdown("[[リリースの手順]]", links);
      expect(result.html).toBe("<p>[[リリースの手順]]</p>");
      expect(result.brokenLinks).toEqual([]);
    });
  });
});
