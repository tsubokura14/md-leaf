import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideAccess } from "@/lib/access";
import { isAllowedEmail } from "@/lib/allowed-emails";

// docs/design.md「ログインしていなければ、ログインの画面以外を出さない」
export default auth((req) => {
  const loggedIn = isAllowedEmail(req.auth?.user?.email);
  const to = decideAccess(req.nextUrl, loggedIn);
  if (to === null) return NextResponse.next();
  return NextResponse.redirect(new URL(to, req.nextUrl));
});

export const config = {
  // Auth.js の入口（Google から戻る先など）と、Next.js の静的ファイルだけを通す
  matcher: ["/((?!api/auth/|_next/static/|_next/image|favicon\\.ico$).*)"],
};
