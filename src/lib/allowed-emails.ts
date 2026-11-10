/**
 * 許可するメールアドレスの判定。
 * 許可するアドレスは環境変数 ALLOWED_EMAILS（カンマ区切り）にだけ置き、コードには書かない。
 */

function parseAllowedEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== "");
}

/** アドレスが許可するアドレスに入っているか。1つも設定されていなければ、だれも通さない */
export function isAllowedEmail(
  email: string | null | undefined,
  allowedEmails: string | undefined = process.env.ALLOWED_EMAILS,
): boolean {
  if (!email) return false;
  return parseAllowedEmails(allowedEmails).includes(email.trim().toLowerCase());
}

/**
 * Google から来たプロフィールでログインを許すか。
 * Google が「アドレスを確かめた」と言っていないアカウントは、
 * 他人のアドレスを名乗っている可能性があるので、許可するアドレスと同じでも通さない。
 */
export function isAllowedGoogleProfile(
  profile: { email?: string | null; email_verified?: boolean | null },
  allowedEmails: string | undefined = process.env.ALLOWED_EMAILS,
): boolean {
  return (
    profile.email_verified === true &&
    isAllowedEmail(profile.email, allowedEmails)
  );
}
