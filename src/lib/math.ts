import type { Element, ElementContent, Root as HastRoot, RootContent } from "hast";
import katex from "katex";

function hasClass(node: Element, name: string): boolean {
  const className = node.properties.className;
  return Array.isArray(className) && className.includes(name);
}

function textOf(node: Element): string {
  return node.children.map((child) => (child.type === "text" ? child.value : "")).join("");
}

// 式にできないときは、ビルドを止めず、書いたままの文字（$ を含む）を出す
function renderOrSource(tex: string, displayMode: boolean): RootContent {
  try {
    return { type: "raw", value: katex.renderToString(tex, { displayMode, throwOnError: true }) };
  } catch {
    const source: ElementContent = {
      type: "text",
      value: displayMode ? `$$\n${tex}\n$$` : `$${tex}$`,
    };
    return {
      type: "element",
      tagName: displayMode ? "div" : "span",
      properties: { className: ["math-error"] },
      children: [source],
    };
  }
}

/**
 * remark-math が作った `code.math-inline` と `pre > code.math-display` を、KaTeX の HTML にする。
 * KaTeX の結果（中の文字は符号化済み）を raw ノードとして置き換える
 */
export function renderMath() {
  return (tree: HastRoot) => {
    const walk = (node: HastRoot | Element) => {
      node.children.forEach((child, index) => {
        if (child.type !== "element") return;
        const code = child.children[0];
        if (
          child.tagName === "pre" &&
          code?.type === "element" &&
          code.tagName === "code" &&
          hasClass(code, "math-display")
        ) {
          node.children[index] = renderOrSource(textOf(code), true) as ElementContent;
          return;
        }
        if (child.tagName === "code" && hasClass(child, "math-inline")) {
          node.children[index] = renderOrSource(textOf(child), false) as ElementContent;
          return;
        }
        walk(child);
      });
    };
    walk(tree);
  };
}
