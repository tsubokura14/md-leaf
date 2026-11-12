import { describe, expect, test } from "vitest";
import { renderMarkdown } from "./markdown";

describe("見出しの一覧", () => {
  test("h2・h3 を本文の順に、0 からの番号で集め、h1・h4 以下は集めない", () => {
    const { headings } = renderMarkdown(
      "# 題\n\n## 流れ\n\n### 番号を先に書く理由\n\n#### 細かい話\n\n## 注意\n",
    );
    expect(headings).toEqual([
      { id: "0", text: "流れ", depth: 2 },
      { id: "1", text: "番号を先に書く理由", depth: 3 },
      { id: "2", text: "注意", depth: 2 },
    ]);
  });

  test("h2・h3 にだけ data-heading の印を付け、id 属性は付けない", () => {
    const { html } = renderMarkdown("# 題\n\n## 流れ\n\n### 理由\n\n#### 細かい話\n");
    expect(html).toContain("<h1>題</h1>");
    expect(html).toContain('<h2 data-heading="0">流れ</h2>');
    expect(html).toContain('<h3 data-heading="1">理由</h3>');
    expect(html).toContain("<h4>細かい話</h4>");
    expect(html).not.toMatch(/<h\d[^>]* id=/);
  });

  test("見出しの文字だけを集める（太字・リンク・コードは中の文字だけ、数式は数えない）。前後の空白は除く", () => {
    const { headings } = renderMarkdown(
      "## **大事** な [リンク](https://example.com) と `git` $x^2$ \n",
    );
    expect(headings).toEqual([{ id: "0", text: "大事 な リンク と git", depth: 2 }]);
  });

  test("文字が空の見出し（画像だけ）は集めず、印も付けない。番号は詰める", () => {
    const { headings, html } = renderMarkdown("## ![図](https://example.com/a.png)\n\n## 次\n");
    expect(headings).toEqual([{ id: "0", text: "次", depth: 2 }]);
    expect(html).toMatch(/<h2><img/);
  });

  test("コールアウト・折りたたみのコールアウトの中の見出しも集める", () => {
    const { headings, html } = renderMarkdown(
      "## 前\n\n> [!note]\n> ## 中の見出し\n\n> [!tip]-\n> ### 閉じた中の見出し\n",
    );
    expect(headings).toEqual([
      { id: "0", text: "前", depth: 2 },
      { id: "1", text: "中の見出し", depth: 2 },
      { id: "2", text: "閉じた中の見出し", depth: 3 },
    ]);
    expect(html).toMatch(/<details[\s\S]*<h3 data-heading="2">閉じた中の見出し<\/h3>/);
  });

  test("同じ文字の見出しは、別の番号の見出しにする", () => {
    const { headings } = renderMarkdown("## 手順\n\n## 手順\n");
    expect(headings).toEqual([
      { id: "0", text: "手順", depth: 2 },
      { id: "1", text: "手順", depth: 2 },
    ]);
  });

  test("見出しがなければ空", () => {
    expect(renderMarkdown("ただの文。\n").headings).toEqual([]);
  });
});
