import { posix } from "node:path";
import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { VFile } from "vfile";
import { FILE_PREFIX, fileHref, imageContentType } from "./note-files";
import { decodeSegment } from "./note-links";

export type ResolvedImage = {
  /** 画像のパス（コンテンツフォルダから）。コンテンツフォルダの外を指すときは undefined */
  path: string | undefined;
  /** 書き換えたあとの src */
  src: string;
};

const schemePattern = /^[a-z][a-z\d+.-]*:/i;

/**
 * ノートの中の画像の src（hast にしたあとの、符号化された形）から、画像のファイルを決める。
 * 相対パスでなければ（http(s)://・スキーム付き・/ で始まる）undefined で、src は変えない。
 * パスの決め方と、外を指すときの符号化の仕方は、ノートへのリンク（note-links.ts の resolveNoteLink）とそろえる
 */
export function resolveImageSrc(src: string, fromPath: string): ResolvedImage | undefined {
  if (schemePattern.test(src) || src.startsWith("/") || src.startsWith("#")) return undefined;
  const rawPath = src.split(/[#?]/, 1)[0] ?? "";
  const decoded = rawPath.split("/").map(decodeSegment).join("/");
  const path = posix.join(posix.dirname(fromPath), decoded);
  if (path.startsWith("../")) {
    return { path: undefined, src: `${FILE_PREFIX}${encodeURIComponent(path)}` };
  }
  return { path, src: fileHref(path) };
}

type ImageContext = {
  fromPath: string;
  /** コンテンツフォルダの中の、対象の拡張子の画像のパス */
  filePaths: ReadonlySet<string>;
};

function decodeForDisplay(src: string): string {
  try {
    return decodeURI(src);
  } catch {
    return src;
  }
}

function isBlank(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

// 画像1つだけの段落なら、その img を返す
function onlyImage(paragraph: Element): Element | undefined {
  const contents = paragraph.children.filter((child) => !isBlank(child));
  const [first] = contents;
  if (contents.length !== 1 || first?.type !== "element" || first.tagName !== "img") {
    return undefined;
  }
  return first;
}

function toFigure(image: Element): Element {
  const alt = typeof image.properties.alt === "string" ? image.properties.alt : "";
  const children: ElementContent[] = [image];
  if (alt !== "") {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: {},
      children: [{ type: "text", value: alt }],
    });
  }
  return { type: "element", tagName: "figure", properties: {}, children };
}

/**
 * 画像の相対パスを /files/ の URL に書き換え、切れた画像（ない・外を指す・対象外の拡張子）を
 * file.data.brokenImages に集める。画像だけの段落は figure にし、代わりの文字を説明に出す。
 * 書き換えの材料は file.data.links（markdown.ts の NoteLinkContext）で受け、なければ書き換えない
 */
export function noteImages() {
  return (tree: HastRoot, file: VFile) => {
    const context = file.data.links as ImageContext | undefined;
    const broken: string[] = [];
    file.data.brokenImages = broken;
    const walk = (node: HastRoot | Element) => {
      node.children.forEach((child, index) => {
        if (child.type !== "element") return;
        const src = child.properties.src;
        if (child.tagName === "img" && context && typeof src === "string") {
          const resolved = resolveImageSrc(src, context.fromPath);
          if (resolved) {
            child.properties.src = resolved.src;
            if (
              resolved.path === undefined ||
              imageContentType(resolved.path) === undefined ||
              !context.filePaths.has(resolved.path)
            ) {
              broken.push(decodeForDisplay(src));
            }
          }
        }
        walk(child);
        if (child.tagName === "p") {
          const image = onlyImage(child);
          if (image) node.children[index] = toFigure(image);
        }
      });
    };
    walk(tree);
  };
}
