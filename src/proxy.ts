import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideAccess } from "@/lib/access";
import { isAllowedEmail } from "@/lib/allowed-emails";
import { isMissingNote } from "@/lib/note-url";

// ビルドのときに next.config.ts が埋め込む（docs/design.md の「見つからないノートは、Proxy で 404 にする」）
const notePaths: string[] = JSON.parse(process.env.NOTE_PATHS ?? "[]");

// docs/design.md「ログインしていなければ、ログインの画面以外を出さない」
export default auth((req) => {
  const loggedIn = isAllowedEmail(req.auth?.user?.email);
  const to = decideAccess(req.nextUrl, loggedIn);
  if (to !== null) return NextResponse.redirect(new URL(to, req.nextUrl));
  if (isMissingNote(req.nextUrl.pathname, notePaths)) {
    return NextResponse.rewrite(req.nextUrl, { status: 404 });
  }
  return NextResponse.next();
});

export const config = {
  // Auth.js の入口（Google から戻る先など）と、Next.js の静的ファイルと、ホーム画面に追加するときにブラウザが
  // Cookie を付けずに読むもの（マニフェストとアイコン。src/app/manifest.ts・icon.tsx・apple-icon.tsx）だけを通す。
  // マニフェストとアイコンは決まった URL だけを外す（末尾の $ を外すと、その下の URL まで守られなくなる）。
  // ノートの画像（/files/）は外さない（docs/design.md の「画像を返す入口は、コンテンツフォルダの中の画像だけを返す」）
  matcher: [
    "/((?!api/auth/|_next/static/|_next/image|favicon\\.ico$|manifest\\.webmanifest$|icon/(?:192|512)$|apple-icon$).*)",
  ],
};
