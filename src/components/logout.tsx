import { connection } from "next/server";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/button";
import { LogoutIcon } from "@/components/icons";

/**
 * ログイン中のメールアドレスと「ログアウト」ボタン。確認は出さない（docs/ui.md の「部品の使い分け」）。
 * #3 で、ノートの一覧のいちばん下へ移す
 */
export async function Logout() {
  // auth() は中で乱数（CSRF の値）を作る。cookies()・headers() だけでは App Shell の事前の組み立て
  // （partialPrefetching）に入ってしまい乱数で止まるので、開いたときに組み立てるよう先に connection() を呼ぶ
  await connection();
  const session = await auth();
  const email = session?.user?.email;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="border-t border-border px-4 py-4">
      {email ? <p className="text-sm text-muted">{email}</p> : null}
      <form action={logout} className="mt-3">
        <Button type="submit" icon={<LogoutIcon className="size-4" />}>
          ログアウト
        </Button>
      </form>
    </div>
  );
}
