// ノートの URL の形（/notes/ ＋ .md を除いたパス）は、ここにだけ書く。
// ノートの一覧のリンクと、本文の中のリンクの書き換えが同じ URL を作らないと、
// 本文から移ったときに一覧の強調や上の帯の場所が合わなくなるため。
// Proxy からも使うので、ファイルを読む処理（src/lib/notes.ts）や node: のモジュールを持ち込まない

export const NOTE_PREFIX = "/notes/";

/** ノートのパス（コンテンツフォルダから、.md を除く。区切りは /）から URL を作る */
export function noteHref(path: string): string {
  return `${NOTE_PREFIX}${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // 「100%」のように、符号化されていない % を含む名前はそのまま使う
    return segment;
  }
}

/** URL の / で分けた部分を、ノートのパス（区切りは /）にする */
export function toNotePath(segments: string[]): string {
  return segments.map(decodeSegment).join("/");
}

/**
 * /notes/ の下で、notePaths（listNotePaths を / でつないだもの）にない URL か。
 * docs/design.md の「見つからないノートは、Proxy で 404 にする」
 */
export function isMissingNote(pathname: string, notePaths: readonly string[]): boolean {
  if (!pathname.startsWith(NOTE_PREFIX)) return false;
  const path = toNotePath(pathname.slice(NOTE_PREFIX.length).split("/"));
  return !notePaths.includes(path);
}
