import type { Element, Root as HastRoot } from "hast";
import hljs from "highlight.js/lib/common";

// 色分けしない言語。mermaid はブラウザで図に描き、math は数式にする
const notHighlighted = new Set(["mermaid", "math"]);

function languageOf(code: Element): string | undefined {
  const className = code.properties.className;
  if (!Array.isArray(className)) return undefined;
  for (const name of className) {
    if (typeof name === "string" && name.startsWith("language-")) {
      return name.slice("language-".length);
    }
  }
  return undefined;
}

function textOf(node: Element): string {
  return node.children.map((child) => (child.type === "text" ? child.value : "")).join("");
}

/**
 * `pre > code.language-<言語>` を、highlight.js が知っている言語なら色分けする。mermaid の pre には印を付ける。
 * 結果の HTML（中の文字は highlight.js が符号化済み）を raw ノードとして code の中に入れる
 */
export function highlightCode() {
  return (tree: HastRoot) => {
    const walk = (node: HastRoot | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        const code = child.children[0];
        if (child.tagName === "pre" && code?.type === "element" && code.tagName === "code") {
          const language = languageOf(code);
          // Mermaid の図はブラウザで描く（src/components/note-body-content.tsx）。その印を付ける
          if (language === "mermaid") child.properties.dataMermaid = "";
          if (language && !notHighlighted.has(language) && hljs.getLanguage(language)) {
            const { value } = hljs.highlight(textOf(code), { language, ignoreIllegals: true });
            code.children = [{ type: "raw", value }];
          }
          continue;
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
