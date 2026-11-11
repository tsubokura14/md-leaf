import { posix } from "node:path";
import { NOTE_PREFIX, noteHref } from "./note-url";

export type ResolvedNoteLink = {
  /** リンク先のノートのパス（コンテンツフォルダから、.md を除く）。コンテンツフォルダの外を指すときは undefined */
  path: string | undefined;
  /** 書き換えたあとの URL */
  href: string;
};

const NOTE_EXTENSION = ".md";
const HOME_PATH = "index";
const schemePattern = /^[a-z][a-z\d+.-]*:/i;

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // 「100%」のように、符号化されていない % を含む名前はそのまま使う
    return segment;
  }
}

/**
 * ノートの中のリンクの href（hast にしたあとの、符号化された形）から、リンク先のノートを決める。
 * 対象（.md で終わる相対リンク）でなければ undefined。
 *
 * - `#` と `?` のあとは捨てる（見出しへ移るのは #6 の目次で見出しに印が付いてから）
 * - 大文字・小文字は区別する（本番のファイルの扱いに合わせる）
 * - コンテンツフォルダの外を指すときは、パス全体を1つの部分として符号化する（`/notes/..%2Fx`）。
 *   `/` で分けずに1つにするのは、ブラウザやルーターが `..` を畳んで、別の URL（ほかのノート）に
 *   変えてしまわないようにするため。readNote は一覧の中だけを探すので、どのノートにも当たらず
 *   「ノートが見つかりません」になる
 */
export function resolveNoteLink(href: string, fromPath: string): ResolvedNoteLink | undefined {
  if (schemePattern.test(href) || href.startsWith("/") || href.startsWith("#")) return undefined;
  const rawPath = href.split(/[#?]/, 1)[0] ?? "";
  const decoded = rawPath.split("/").map(decodeSegment).join("/");
  if (!decoded.endsWith(NOTE_EXTENSION)) return undefined;

  const joined = posix.join(posix.dirname(fromPath), decoded);
  const path = joined.slice(0, -NOTE_EXTENSION.length);
  if (joined.startsWith("../")) {
    return { path: undefined, href: `${NOTE_PREFIX}${encodeURIComponent(path)}` };
  }
  return { path, href: path === HOME_PATH ? "/" : noteHref(path) };
}
