import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { testServerEnv } from "./test-env";

// http の localhost では、Auth.js のセッションの Cookie に __Secure- の接頭辞が付かない
const SESSION_COOKIE = "authjs.session-token";

// docs/design.md「画面の状態は、テスト用のコンテンツフォルダで作る」
export async function logIn(
  context: BrowserContext,
  baseURL: string | undefined,
  email: string,
): Promise<void> {
  const value = await encode({
    token: { email, name: email, sub: email },
    secret: testServerEnv.AUTH_SECRET,
    salt: SESSION_COOKIE,
  });
  await context.addCookies([
    { name: SESSION_COOKIE, value, url: baseURL, httpOnly: true, sameSite: "Lax" },
  ]);
}
