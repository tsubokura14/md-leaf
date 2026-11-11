// ノートの画像として扱うファイルの種類と、それを返す URL の形は、ここにだけ書く。
// Markdown の変換（画像の src の書き換え・切れた画像の判定）と、画像を返す入口（/files/）が
// 同じ一覧と同じ URL を使わないと、出した画像が返らなくなるため

export const FILE_PREFIX = "/files/";

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** 対象の画像なら Content-Type、そうでなければ undefined。拡張子の大文字・小文字は区別しない */
export function imageContentType(fileName: string): string | undefined {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return undefined;
  return contentTypes[fileName.slice(dot + 1).toLowerCase()];
}

/** コンテンツフォルダからのパス（区切りは /）から、画像を返す URL を作る */
export function fileHref(path: string): string {
  return `${FILE_PREFIX}${path.split("/").map(encodeURIComponent).join("/")}`;
}
