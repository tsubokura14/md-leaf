import { posix } from "node:path";
import { FILE_PREFIX, fileHref } from "./note-files";
import { decodeSegment } from "./note-url";

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
