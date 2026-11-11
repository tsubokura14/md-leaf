import type { NextRequest } from "next/server";
import { readContentFile } from "@/lib/notes";

// docs/design.md の「画像を返す入口は、コンテンツフォルダの中の画像だけを返す」
export async function GET(_req: NextRequest, ctx: RouteContext<"/files/[...path]">) {
  const { path } = await ctx.params;
  const file = await readContentFile(path);
  if (!file) return new Response("Not Found", { status: 404 });
  const headers = new Headers({
    "Content-Type": file.contentType,
    "X-Content-Type-Options": "nosniff",
  });
  if (file.contentType === "image/svg+xml") headers.set("Content-Security-Policy", "sandbox");
  return new Response(new Uint8Array(file.body), { headers });
}
