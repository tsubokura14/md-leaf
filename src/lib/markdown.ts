import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Html, Root as MdastRoot } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";
import { parse as parseYaml } from "yaml";
import { callouts } from "./callouts";
import { type NoteHeading, noteHeadings } from "./headings";
import { highlightCode } from "./highlight";
import { renderMath } from "./math";
import { noteImages } from "./note-images";
import { resolveNoteLink } from "./note-links";
import { wrapTables } from "./tables";

export type RenderedMarkdown = {
  /** フロントマターの `title`。ないときは undefined（ファイル名を使うかは呼ぶ側が決める） */
  title: string | undefined;
  html: string;
  /** リンク先のノートがないリンク（書かれたままの形）。links を渡さなければいつも空 */
  brokenLinks: string[];
  /** ファイルがない・コンテンツフォルダの外を指す・対象外の拡張子の画像（書かれたままの形）。links を渡さなければいつも空 */
  brokenImages: string[];
  /** 本文の h2・h3 の一覧（本文の順） */
  headings: NoteHeading[];
};

export type NoteLinkContext = {
  /** リンクを書いたノートのパス（コンテンツフォルダから、.md を除く） */
  fromPath: string;
  /** 一覧にある全部のノートのパス（ホームの index を含む） */
  notePaths: ReadonlySet<string>;
  /** コンテンツフォルダの中の、対象の拡張子の画像のパス（コンテンツフォルダから、拡張子つき） */
  filePaths: ReadonlySet<string>;
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

function decodeForDisplay(href: string): string {
  try {
    return decodeURI(href);
  } catch {
    return href;
  }
}

// .md の相対リンクを、ノートの URL に書き換える（リンク先の決め方は note-links.ts）。
// links は呼ぶたびに違うので、processor を作り直さずに file.data で渡す
function noteLinks() {
  return (tree: HastRoot, file: VFile) => {
    const links = file.data.links as NoteLinkContext | undefined;
    const broken: string[] = [];
    file.data.brokenLinks = broken;
    if (!links) return;
    const walk = (node: HastRoot | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        const href = child.properties.href;
        if (child.tagName === "a" && typeof href === "string") {
          const resolved = resolveNoteLink(href, links.fromPath);
          if (resolved) {
            child.properties.href = resolved.href;
            child.properties.dataNoteLink = "";
            if (resolved.path === undefined || !links.notePaths.has(resolved.path)) {
              broken.push(decodeForDisplay(href));
            }
          }
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
  .use(remarkMath)
  .use(callouts)
  .use(remarkRehype, { handlers: { html: htmlAsText } })
  .use(externalLinksInNewTab)
  .use(noteLinks)
  .use(noteImages)
  .use(renderMath)
  .use(highlightCode)
  .use(wrapTables)
  .use(noteHeadings)
  // raw ノード（HTML の文字列）をそのまま出す。本文は dangerouslySetInnerHTML で入れるので、raw にノートの文字が
  // HTML のまま入ると、スクリプトが動く穴になる。
  // 前提（崩れたら見直す）：raw を作るのは KaTeX（math.ts）と highlight.js（highlight.ts）の結果だけで、どちらも
  // 中の文字を符号化済み。ノートの HTML のタグは htmlAsText で文字にしてあり、raw にならない。
  // raw を作る処理を足すときは見直す
  .use(rehypeStringify, { allowDangerousHtml: true });

/** links がなければ、リンクを書き換えない（一覧の名前を読むときは要らないため） */
export function renderMarkdown(source: string, links?: NoteLinkContext): RenderedMarkdown {
  const file = processor.processSync(new VFile({ value: source, data: { links } }));
  const title = file.data.title;
  return {
    title: typeof title === "string" ? title : undefined,
    html: String(file),
    brokenLinks: (file.data.brokenLinks as string[] | undefined) ?? [],
    brokenImages: (file.data.brokenImages as string[] | undefined) ?? [],
    headings: (file.data.headings as NoteHeading[] | undefined) ?? [],
  };
}
