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
    expect(result.html).toBe('<h2 data-heading="0">見出し</h2>\n<p>本文です。</p>');
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
      filePaths: new Set<string>(),
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

  describe("画像（links を渡したとき）", () => {
    const links = {
      fromPath: "開発/Git ブランチの運用メモ",
      notePaths: new Set(["開発/Git ブランチの運用メモ"]),
      filePaths: new Set(["開発/branch-graph.png", "images/a b.png"]),
    };
    const files = (path: string) => `/files/${path.split("/").map(encodeURIComponent).join("/")}`;

    test("画像だけの段落は、/files/ の URL の画像と、代わりの文字の説明にする", () => {
      const result = renderMarkdown("![ブランチの図](branch-graph.png)", links);
      expect(result.html).toBe(
        `<figure><img src="${files("開発/branch-graph.png")}" alt="ブランチの図">` +
          "<figcaption>ブランチの図</figcaption></figure>",
      );
      expect(result.brokenImages).toEqual([]);
    });

    test("代わりの文字が空なら、説明を出さない", () => {
      const result = renderMarkdown("![](<../images/a b.png>)", links);
      expect(result.html).toBe(`<figure><img src="${files("images/a b.png")}" alt=""></figure>`);
    });

    test("文の途中の画像は、説明を付けず img のまま", () => {
      const result = renderMarkdown("図 ![ブランチの図](branch-graph.png) を見る", links);
      expect(result.html).toBe(
        `<p>図 <img src="${files("開発/branch-graph.png")}" alt="ブランチの図"> を見る</p>`,
      );
    });

    test("ファイルがない・外を指す・対象外の拡張子の画像は、書かれたままのパスを brokenImages に返す", () => {
      const result = renderMarkdown(
        "![a](ない.png) ![b](../../外.png) ![c](<../images/a b.png>) ![d](memo.txt)",
        links,
      );
      expect(result.brokenImages).toEqual(["ない.png", "../../外.png", "memo.txt"]);
      expect(result.html).toContain(`src="/files/${encodeURIComponent("../外.png")}"`);
    });

    test("http(s):// の画像はそのまま出し、切れた画像にしない", () => {
      const result = renderMarkdown("![外](https://example.com/a.png)", links);
      expect(result.html).toBe(
        '<figure><img src="https://example.com/a.png" alt="外"><figcaption>外</figcaption></figure>',
      );
      expect(result.brokenImages).toEqual([]);
    });

    test("![[ ]] の書き方は画像にせず、文字のまま出す", () => {
      const result = renderMarkdown("![[branch-graph.png]]", links);
      expect(result.html).toBe("<p>![[branch-graph.png]]</p>");
      expect(result.brokenImages).toEqual([]);
    });
  });

  describe("コード", () => {
    test("言語を書いたコードは、その言語の書き方で色分けする", () => {
      const result = renderMarkdown('```js\n// 消す\nconst a = "x";\n```\n');
      expect(result.html).toBe(
        '<pre><code class="language-js"><span class="hljs-comment">// 消す</span>\n' +
          '<span class="hljs-keyword">const</span> a = <span class="hljs-string">&quot;x&quot;</span>;\n' +
          "</code></pre>",
      );
    });

    test("色分けしても、コードの中の HTML のタグは文字のまま出す", () => {
      const result = renderMarkdown('```js\nconst a = "<b>x</b>";\n```\n');
      expect(result.html).not.toContain("<b>");
      expect(result.html).toContain("&lt;b&gt;x&lt;/b&gt;");
    });

    test("言語を書かないコードは、色分けせずに出す", () => {
      const result = renderMarkdown('```\nconst a = "x";\n```\n');
      expect(result.html).toBe('<pre><code>const a = "x";\n</code></pre>');
    });

    test("知らない言語のコードは、色分けせずに出す", () => {
      const result = renderMarkdown('```nosuchlang\nconst a = "x";\n```\n');
      expect(result.html).toBe(
        '<pre><code class="language-nosuchlang">const a = "x";\n</code></pre>',
      );
    });

    test("mermaid のコードは、色分けせず、ブラウザで描く印（data-mermaid）を pre に付ける", () => {
      const result = renderMarkdown("```mermaid\nflowchart LR\n  A --> B\n```\n");
      expect(result.html).toBe(
        '<pre data-mermaid=""><code class="language-mermaid">flowchart LR\n  A --> B\n</code></pre>',
      );
    });
    test("文の中のコードは、色分けしない", () => {
      const result = renderMarkdown('`const a = "x"` を書く\n');
      expect(result.html).toBe('<p><code>const a = "x"</code> を書く</p>');
    });
  });

  describe("数式", () => {
    test("$...$ は、文の中の数式として KaTeX の式にする", () => {
      const result = renderMarkdown("時間は $t_i$ と書く\n");
      expect(result.html).toMatch(/^<p>時間は <span class="katex">[\s\S]*<\/span> と書く<\/p>$/);
      expect(result.html).not.toContain("katex-display");
      expect(result.html).not.toContain("$");
    });

    test("$$...$$ は、本文の中央に置く数式として KaTeX の式にする", () => {
      const result = renderMarkdown("$$\nT = \\sum_{i=1}^{n} t_i\n$$\n");
      expect(result.html).toMatch(/^<span class="katex-display">[\s\S]*<\/span>$/);
      expect(result.html).not.toContain("<pre");
      expect(result.html).not.toContain("$");
    });

    test("文の中の数式が式にできないときは、書いたままの文字を出す", () => {
      const result = renderMarkdown("式は $\\nosuchcommand{x}$ です\n");
      expect(result.html).toBe(
        '<p>式は <span class="math-error">$\\nosuchcommand{x}$</span> です</p>',
      );
    });

    test("本文の中央に置く数式が式にできないときは、書いたままの文字を出す", () => {
      const result = renderMarkdown("$$\n\\frac{1}{\n$$\n");
      expect(result.html).toBe('<div class="math-error">$$\n\\frac{1}{\n$$</div>');
    });

    test("$ が1つだけのときは、数式にせず文字のまま出す", () => {
      const result = renderMarkdown("値段は 100$ です\n");
      expect(result.html).toBe("<p>値段は 100$ です</p>");
    });
  });

  test("表は、横にスクロールする枠（div.table-scroll）で包み、列の揃えを残す", () => {
    const result = renderMarkdown("| a | b |\n| --- | :-: |\n| 1 | 2 |\n");
    expect(result.html).toMatch(/^<div class="table-scroll"><table>[\s\S]*<\/table><\/div>$/);
    expect(result.html).toContain('<th align="center">b</th>');
  });
});
