import type { Page, Request } from "@playwright/test";

// 読み込み中・読み込めなかったの状態は、画面を移るときの通信（RSC の返事）を、テストの側で止める・壊して作る
// （docs/design.md「画面の状態は、テスト用のコンテンツフォルダで作る」。アプリにテスト用の入口は作らない）。
//
// 前提（Next.js 16.4 で確かめた。版を上げて崩れたら見直す）：
// - ノートとホームは、ビルドのときに HTML にしてあるので、リンクの先読み（URL ごとの __PAGE__ の先読み）に中身まで入る。
//   先読みが済むと移るときに通信しないので、移り先の __PAGE__ の先読みを失敗させ、移るときに取りに行かせる
// - 移るときの通信を失敗させる（abort・500・RSC でない返事）と、Next.js はページごと読み直す（error.tsx は出ない）。
//   返事の中で、ページの中身の行だけを抜くと、通信が途中で切れたのと同じになり、error.tsx が出る
// - スケルトン（loading.tsx）は、移り先の形（App Shell）の先読みが済んでいないと出ない

const ROUTER_PREFETCH = "next-router-prefetch";
const SEGMENT_PREFETCH = "next-router-segment-prefetch";

function decodedPath(url: URL): string {
  return decodeURIComponent(url.pathname);
}

function isPagePrefetch(request: Request): boolean {
  return (request.headers()[SEGMENT_PREFETCH] ?? "").endsWith("__PAGE__");
}

/**
 * pathname（日本語のまま）へ移るときの通信を、hold なら返さずに止め、break なら返事の中のページの中身を抜く。
 * 戻すときは page.unrouteAll() を呼ぶ
 */
export async function interceptNavigation(
  page: Page,
  pathname: string,
  mode: "hold" | "break",
): Promise<void> {
  await page.route(
    (url) => url.searchParams.has("_rsc") && decodedPath(url) === pathname,
    async (route) => {
      const request = route.request();
      if (request.headers()[ROUTER_PREFETCH]) {
        return isPagePrefetch(request) ? route.abort() : route.continue();
      }
      if (mode === "hold") return new Promise<void>(() => {});
      const response = await route.fetch();
      return route.fulfill({ response, body: dropPageContent(await response.body()) });
    },
  );
}

/**
 * 移り先の形（App Shell）の先読みが済むのを待つ。済む前に押すと、スケルトンも帯も出ない。
 * 先読みは、ルートごとに1つ（ノートなら、どのノートへのリンクでも同じ）なので、ルートで見分ける
 */
export function waitForAppShell(page: Page, isRoute: (pathname: string) => boolean) {
  const matches = (request: Request) =>
    isPagePrefetch(request) && isRoute(decodedPath(new URL(request.url())));
  return Promise.race([
    page.waitForEvent("requestfinished", matches),
    page.waitForEvent("requestfailed", matches),
  ]);
}

// RSC の返事は「<16進の ID>:<中身>」の行が並ぶ。中身は改行まで（JSON など）か、
// 一部の種類（T など）は「<種類><16進の長さ>,」のあとにその長さのバイト（改行を含むことがある）
const LENGTH_PREFIXED_TAGS = new Set([..."TAOobUSsLlGgMmV"].map((c) => c.charCodeAt(0)));
const COLON = 0x3a;
const COMMA = 0x2c;
const NEWLINE = 0x0a;
// 返事の先頭に、部分的な返事かどうかを表す1バイト（# か ~）が付くことがある
const PARTIAL_MARKERS = new Set([0x23, 0x7e]);

type Row = { id: string; start: number; end: number; json?: unknown };

function parseRows(body: Buffer): Row[] {
  const rows: Row[] = [];
  let i = PARTIAL_MARKERS.has(body[0]) ? 1 : 0;
  while (i < body.length) {
    const start = i;
    const colon = body.indexOf(COLON, i);
    if (colon < 0) break;
    const id = body.subarray(i, colon).toString();
    i = colon + 1;
    if (LENGTH_PREFIXED_TAGS.has(body[i])) {
      const comma = body.indexOf(COMMA, i);
      i = comma + 1 + parseInt(body.subarray(i + 1, comma).toString(), 16);
      rows.push({ id, start, end: i });
      continue;
    }
    const newline = body.indexOf(NEWLINE, i);
    const end = newline < 0 ? body.length : newline;
    const text = body.subarray(i, end).toString();
    i = end + 1;
    let json: unknown;
    if (text.startsWith("[")) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }
    rows.push({ id, start, end: i, json });
  }
  return rows;
}

/** ページ（__PAGE__）の中身が入っている行の ID。__PAGE__ の行の、最初の子の参照（$L<ID>）から探す */
function pageContentId(rows: Row[]): string | undefined {
  for (const { json } of rows) {
    if (!Array.isArray(json)) continue;
    const segment = json[0]?.[1];
    if (segment?.s !== "__PAGE__") continue;
    const ref = segment.d?.r?.[3]?.children?.[0];
    if (typeof ref === "string" && ref.startsWith("$L")) return ref.slice(2);
  }
  return undefined;
}

function dropPageContent(body: Buffer): Buffer {
  const rows = parseRows(body);
  const id = pageContentId(rows);
  if (!id) throw new Error("RSC の返事に、ページの中身の行が見つからない");
  const parts: Buffer[] = [];
  let position = 0;
  for (const row of rows) {
    if (row.id !== id) continue;
    parts.push(body.subarray(position, row.start));
    position = row.end;
  }
  parts.push(body.subarray(position));
  return Buffer.concat(parts);
}
