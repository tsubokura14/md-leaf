import { describe, expect, test } from "vitest";
import { renderMarkdown } from "./markdown";

// コールアウトの外側の要素（開いた タグ）だけを取り出す
function openingTags(html: string): string[] {
  return [...html.matchAll(/<(div|details) class="callout"[^>]*>/g)].map((m) => m[0]);
}

// 題のない、中身1行のコールアウトの Markdown
function callout(kind: string): string {
  return `> [!${kind}]\n> 中身\n`;
}

function titleOf(html: string): string | undefined {
  return html.match(/<span class="callout-title-text">(.*?)<\/span>/)?.[1];
}

describe("コールアウト", () => {
  test("[!種類] で始まる引用を、題と中身のあるコールアウトにする。題がなければ種類名", () => {
    const { html } = renderMarkdown("> [!tip]\n> main には直接コミットしない。\n");
    expect(html).not.toContain("<blockquote");
    expect(html).not.toContain("[!tip]");
    expect(openingTags(html)).toEqual(['<div class="callout" data-callout="tip">']);
    expect(html).toContain('<div class="callout-title">');
    expect(html).toMatch(/<div class="callout-title"><svg[^>]*class="callout-icon"/);
    expect(titleOf(html)).toBe("Tip");
    expect(html).toContain(
      '<div class="callout-content">\n<p>main には直接コミットしない。</p>\n</div>',
    );
  });

  test("題を書けば、その文字を題にする（文の中の書き方も使える）", () => {
    const { html } = renderMarkdown("> [!warning] **大事** な注意\n> 中身\n");
    expect(titleOf(html)).toBe("<strong>大事</strong> な注意");
    expect(html).toContain("<p>中身</p>");
  });

  test("種類の大文字・小文字は区別しない", () => {
    const { html } = renderMarkdown("> [!TIP]\n> 中身\n");
    expect(openingTags(html)).toEqual(['<div class="callout" data-callout="tip">']);
    expect(titleOf(html)).toBe("Tip");
  });

  test.each([
    ["abstract", "abstract"],
    ["info", "note"],
    ["note", "note"],
    ["example", "abstract"],
    ["tip", "tip"],
    ["important", "important"],
    ["question", "warning"],
    ["success", "tip"],
    ["warning", "warning"],
    ["caution", "caution"],
    ["danger", "danger"],
  ])("種類 %s は %s の色にする", (kind, color) => {
    const { html } = renderMarkdown(callout(kind));
    expect(openingTags(html)).toEqual([`<div class="callout" data-callout="${color}">`]);
  });

  test.each([
    ["abstract", "info"],
    ["tip", "important"],
    ["warning", "caution"],
  ])("意味を分けた組 %s と %s は色が違う", (a, b) => {
    const [ha, hb] = [a, b].map((k) => openingTags(renderMarkdown(callout(k)).html));
    expect(ha).not.toEqual(hb);
  });

  function iconOf(kind: string): string | undefined {
    const { html } = renderMarkdown(callout(kind));
    return html.match(/<svg[^>]*class="callout-icon"[^>]*>.*?<\/svg>/)?.[0];
  }

  const kinds = [
    "abstract",
    "info",
    "note",
    "example",
    "tip",
    "important",
    "question",
    "success",
    "warning",
    "caution",
    "danger",
  ];

  test("11種類それぞれに違うアイコンを出す", () => {
    expect(new Set(kinds.map(iconOf)).size).toBe(11);
  });

  test.each([
    ["summary", "abstract"],
    ["tldr", "abstract"],
    ["hint", "tip"],
    ["check", "success"],
    ["done", "success"],
    ["help", "question"],
    ["faq", "question"],
    ["attention", "warning"],
    ["error", "danger"],
  ])("別名 %s は %s と同じ色とアイコン", (alias, kind) => {
    expect(openingTags(renderMarkdown(callout(alias)).html)[0]).toBe(
      openingTags(renderMarkdown(callout(kind)).html)[0],
    );
    expect(iconOf(alias)).toBe(iconOf(kind));
  });

  test.each(["todo", "quote", "cite", "failure", "fail", "missing", "bug", "memo"])(
    "%s は note の色と鉛筆のアイコン",
    (kind) => {
      expect(openingTags(renderMarkdown(callout(kind)).html)).toEqual([
        '<div class="callout" data-callout="note">',
      ]);
      expect(iconOf(kind)).toBe(iconOf("note"));
    },
  );

  test("題がないときは種類名（例：Important）", () => {
    expect(titleOf(renderMarkdown("> [!important]\n> 中身\n").html)).toBe("Important");
    expect(titleOf(renderMarkdown("> [!bug]\n> 中身\n").html)).toBe("Bug");
  });

  test("別名の題は、書いた別名の先頭を大文字にしたもの", () => {
    const { html } = renderMarkdown("> [!hint]\n> 中身\n");
    expect(titleOf(html)).toBe("Hint");
  });

  test("知らない種類は note の色とアイコンで、題は書いた種類名", () => {
    const { html } = renderMarkdown("> [!memo]\n> 中身\n");
    expect(openingTags(html)).toEqual(['<div class="callout" data-callout="note">']);
    expect(titleOf(html)).toBe("memo");
  });

  test("[!種類]- は、矢印つきの閉じた details にする", () => {
    const { html } = renderMarkdown("> [!info]- 消してしまったブランチを戻すには\n> 中身\n");
    expect(openingTags(html)).toEqual(['<details class="callout" data-callout="note">']);
    expect(html).toMatch(/<summary class="callout-title">.*<svg[^>]*class="callout-chevron"/);
    expect(titleOf(html)).toBe("消してしまったブランチを戻すには");
    expect(html).toContain("<p>中身</p>");
  });

  test("[!種類]+ は、矢印つきの開いた details にする", () => {
    const { html } = renderMarkdown("> [!info]+\n> 中身\n");
    expect(openingTags(html)).toEqual(['<details class="callout" data-callout="note" open>']);
    expect(html).toContain("callout-chevron");
  });

  test("- ・+ のないものは、矢印を出さない", () => {
    const { html } = renderMarkdown("> [!info]\n> 中身\n");
    expect(html).not.toContain("callout-chevron");
    expect(html).not.toContain("<details");
  });

  test("中身は、段落・リスト・コードを本文と同じに出す", () => {
    const { html } = renderMarkdown(
      "> [!note]\n> 1行目 `git reflog`\n>\n> - 項目\n>\n> ```sh\n> git status\n> ```\n",
    );
    expect(html).toContain("<p>1行目 <code>git reflog</code></p>");
    expect(html).toContain("<ul>\n<li>項目</li>\n</ul>");
    expect(html).toContain('<pre><code class="language-sh">');
  });

  test("中身がなければ、見出しの行だけを出す", () => {
    const { html } = renderMarkdown("> [!note] 題だけ\n");
    expect(titleOf(html)).toBe("題だけ");
    expect(html).not.toContain("callout-content");
  });

  test("コールアウトの中のコールアウトも、コールアウトにする", () => {
    const { html } = renderMarkdown("> [!note]\n> 外\n>\n> > [!tip]\n> > 中\n");
    expect(openingTags(html)).toEqual([
      '<div class="callout" data-callout="note">',
      '<div class="callout" data-callout="tip">',
    ]);
    expect(html).not.toContain("<blockquote");
  });

  test("中身の行が [!種類] で始まっても、中身の文字のまま出す", () => {
    const { html } = renderMarkdown("> [!note]\n> [!tip] は書き方の例\n");
    expect(openingTags(html)).toHaveLength(1);
    expect(html).toContain("<p>[!tip] は書き方の例</p>");
  });

  test("[!種類] で始まらない引用は、ふつうの引用のまま出す", () => {
    const { html } = renderMarkdown("> ふつうの引用 [!tip]\n");
    expect(html).toBe("<blockquote>\n<p>ふつうの引用 [!tip]</p>\n</blockquote>");
  });
});
