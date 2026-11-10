import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Html, Root as MdastRoot } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { VFile } from "vfile";
import { parse as parseYaml } from "yaml";

export type RenderedMarkdown = {
  /** フロントマターの `title`。ないときは undefined（ファイル名を使うかは呼ぶ側が決める） */
  title: string | undefined;
  html: string;
};

// フロントマター（先頭の yaml）を本文から外し、title を file.data に置く
function extractFrontmatter() {
  return (tree: MdastRoot, file: VFile) => {
    const first = tree.children[0];
    if (first?.type !== "yaml") return;
    tree.children.shift();
    file.data.title = readTitle(first.value);
  };
}

function readTitle(yaml: string): string | undefined {
  let data: unknown;
  try {
    data = parseYaml(yaml);
  } catch {
    // 壊れた YAML でビルド全体を止めず、title がないものとして扱う（題はファイル名になる）
    return undefined;
  }
  if (typeof data !== "object" || data === null || !("title" in data)) return undefined;
  const title = data.title;
  // `title: 2024` のように数として読まれたものも題に使う
  if (typeof title === "number") return String(title);
  if (typeof title === "string" && title.trim() !== "") return title;
  return undefined;
}

// ノートの中の HTML のタグは、動かさず、消さずに文字として出す
// （remark-rehype の既定では消える。allowDangerousHtml にすると HTML として動く）。
// 段落の外に書かれたタグ（ブロックの HTML）は、文字の段落にする
function htmlAsText(_state: unknown, node: Html, parent: { type: string } | undefined) {
  const text: ElementContent = { type: "text", value: node.value };
  if (parent && ["root", "blockquote", "listItem"].includes(parent.type)) {
    const paragraph: Element = {
      type: "element",
      tagName: "p",
      properties: {},
      children: [text],
    };
    return paragraph;
  }
  return text;
}

const externalLinkPattern = /^https?:\/\//;

// 外へのリンク（http(s)://）を別のタブで開く
function externalLinksInNewTab() {
  return (tree: HastRoot) => {
    const walk = (node: HastRoot | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        const href = child.properties.href;
        if (child.tagName === "a" && typeof href === "string" && externalLinkPattern.test(href)) {
          child.properties.target = "_blank";
          child.properties.rel = ["noopener", "noreferrer"];
        }
        walk(child);
      }
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(extractFrontmatter)
  .use(remarkGfm)
  .use(remarkRehype, { handlers: { html: htmlAsText } })
  .use(externalLinksInNewTab)
  .use(rehypeStringify);

export function renderMarkdown(source: string): RenderedMarkdown {
  const file = processor.processSync(source);
  const title = file.data.title;
  return {
    title: typeof title === "string" ? title : undefined,
    html: String(file),
  };
}
