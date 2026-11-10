import { describe, expect, test } from "vitest";
import { decideAccess } from "./access";

describe("decideAccess", () => {
  test("ログインしていなければ、ログインの画面へ移し、開こうとした URL を引き継ぐ", () => {
    expect(decideAccess({ pathname: "/notes/x", search: "?a=1" }, false)).toBe(
      `/login?callbackUrl=${encodeURIComponent("/notes/x?a=1")}`,
    );
  });

  test("ログインしていなくて、ホームを開いたときは、戻り先を付けない", () => {
    expect(decideAccess({ pathname: "/", search: "" }, false)).toBe("/login");
  });

  test("ログインしていなくても、ログインの画面はそのまま出す", () => {
    expect(decideAccess({ pathname: "/login", search: "?error=AccessDenied" }, false)).toBeNull();
  });

  test("ログイン中にログインの画面を開くと、ホームへ移す", () => {
    expect(decideAccess({ pathname: "/login", search: "" }, true)).toBe("/");
  });

  test("ログイン中は、ほかの URL をそのまま出す", () => {
    expect(decideAccess({ pathname: "/notes/x", search: "" }, true)).toBeNull();
  });
});
