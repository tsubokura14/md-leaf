/**
 * 開いた URL とログインしているかから、移す先を決める（docs/design.md「ログインしていなければ、ログインの画面以外を出さない」）。
 * そのまま出すときは null を返す。
 */

const LOGIN_PATH = "/login";

export function decideAccess(
  url: { pathname: string; search: string },
  loggedIn: boolean,
): string | null {
  if (url.pathname === LOGIN_PATH) return loggedIn ? "/" : null;
  if (loggedIn) return null;

  // ホームはログインのあとの戻り先の既定なので、付けない
  const target = url.pathname + url.search;
  if (target === "/") return LOGIN_PATH;
  return `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(target)}`;
}
