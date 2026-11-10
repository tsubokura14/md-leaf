import { describe, expect, test } from "vitest";
import { isAllowedEmail, isAllowedGoogleProfile } from "./allowed-emails";

describe("isAllowedEmail", () => {
  test("許可するアドレスに入っていれば通す（前後の空白は無視する）", () => {
    expect(
      isAllowedEmail("b@example.com", " a@example.com , b@example.com "),
    ).toBe(true);
  });

  test("許可するアドレスに入っていなければ通さない", () => {
    expect(isAllowedEmail("someone@example.com", "a@example.com")).toBe(false);
  });

  test("大文字・小文字を区別しない", () => {
    expect(isAllowedEmail("Allowed@Example.com", "allowed@EXAMPLE.com")).toBe(
      true,
    );
  });

  test("許可するアドレスが1つも設定されていなければ、だれも通さない", () => {
    expect(isAllowedEmail("a@example.com", undefined)).toBe(false);
    expect(isAllowedEmail("a@example.com", " , ")).toBe(false);
  });

  test("アドレスがなければ通さない", () => {
    expect(isAllowedEmail(undefined, "a@example.com")).toBe(false);
  });

  test("引数を省くと環境変数 ALLOWED_EMAILS を読む", () => {
    const saved = process.env.ALLOWED_EMAILS;
    process.env.ALLOWED_EMAILS = "env@example.com";
    try {
      expect(isAllowedEmail("env@example.com")).toBe(true);
    } finally {
      if (saved === undefined) delete process.env.ALLOWED_EMAILS;
      else process.env.ALLOWED_EMAILS = saved;
    }
  });
});

describe("isAllowedGoogleProfile", () => {
  test("確かめ済みの許可するアドレスなら通す", () => {
    expect(
      isAllowedGoogleProfile(
        { email: "a@example.com", email_verified: true },
        "a@example.com",
      ),
    ).toBe(true);
  });

  test("確かめ済みの印がなければ、許可するアドレスでも通さない", () => {
    expect(
      isAllowedGoogleProfile(
        { email: "a@example.com", email_verified: false },
        "a@example.com",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile({ email: "a@example.com" }, "a@example.com"),
    ).toBe(false);
  });
});
