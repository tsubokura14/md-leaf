import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { isAllowedGoogleProfile } from "@/lib/allowed-emails";

/**
 * 許可していないアドレスで Google から戻ったとき、ログインの画面の帯にそのアドレスを出すための Cookie。
 * アドレスを URL の後ろに付けると、ブラウザの履歴やサーバーの記録に残るので、短い時間の Cookie で渡す。
 */
export const DENIED_EMAIL_COOKIE = "denied-email";
const DENIED_EMAIL_MAX_AGE_SECONDS = 5 * 60;

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

// AUTH_SECRET・AUTH_GOOGLE_ID・AUTH_GOOGLE_SECRET は、Auth.js が環境変数から自動で読む
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    // データベースを使わないので、ログインの状態は暗号化した Cookie（JWT）に持つ。
    // 期限は Cookie を出し直すたびに延びるので、「最後に開いてから30日」になる
    strategy: "jwt",
    maxAge: THIRTY_DAYS_IN_SECONDS,
  },
  pages: {
    signIn: "/login",
    // 失敗したとき（許可していないアドレスも含む）は /login?error=<種類> へ戻す
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (profile && isAllowedGoogleProfile(profile)) return true;

      // false を返すと、Auth.js が /login?error=AccessDenied へ戻す
      if (profile?.email) {
        (await cookies()).set(DENIED_EMAIL_COOKIE, profile.email, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: DENIED_EMAIL_MAX_AGE_SECONDS,
        });
      }
      return false;
    },
  },
});
