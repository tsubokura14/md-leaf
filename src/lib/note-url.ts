// ノートの URL の形（/notes/ ＋ .md を除いたパス）は、ここにだけ書く。
// ノートの一覧のリンクと、本文の中のリンクの書き換えが同じ URL を作らないと、
// 本文から移ったときに一覧の強調や上の帯の場所が合わなくなるため

export const NOTE_PREFIX = "/notes/";

/** ノートのパス（コンテンツフォルダから、.md を除く。区切りは /）から URL を作る */
export function noteHref(path: string): string {
  return `${NOTE_PREFIX}${path.split("/").map(encodeURIComponent).join("/")}`;
}
