import { cookies } from "next/headers";
import { Suspense } from "react";
import { DENIED_EMAIL_COOKIE, signIn } from "@/auth";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { LeafIcon, PersonIcon } from "@/components/icons";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <LeafIcon className="size-8 text-accent" />
        <h1 className="mt-6 font-body text-2xl">md-leaf</h1>
        <p className="mt-4 text-sm text-muted">ノートを読むには、ログインしてください。</p>
        {/* searchParams と Cookie は開くたびに変わるので、そこだけを後から流し込む（cacheComponents） */}
        <Suspense fallback={null}>
          <LoginActions searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function LoginActions({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const error = firstValue(params.error);
  const callbackUrl = firstValue(params.callbackUrl) ?? "/";
  // 許可していないアドレスは src/auth.ts の signIn コールバックが Cookie に置く。
  // Cookie がなければ（期限切れなど）どのアドレスか言えないので、ふつうの失敗として扱う
  const deniedEmail =
    error === "AccessDenied" ? (await cookies()).get(DENIED_EMAIL_COOKIE)?.value : undefined;

  async function login() {
    "use server";
    // 許可していないアカウントのあとは、Google が同じアカウントで自動で戻ってこないよう、
    // アカウントを選ぶ画面を必ず出してもらう。戻り先が同じオリジンかは Auth.js の redirect コールバックが確かめる
    await signIn(
      "google",
      { redirectTo: callbackUrl },
      deniedEmail ? { prompt: "select_account" } : undefined,
    );
  }

  return (
    <>
      {deniedEmail ? (
        <div className="mt-8 w-full">
          <Banner tone="warning" title="このアカウントでは見られません">
            {deniedEmail} は、許可されていません。許可したアカウントでログインしてください。
          </Banner>
        </div>
      ) : error ? (
        <div className="mt-8 w-full">
          <Banner tone="danger" title="ログインできませんでした">
            時間をおいて、もう一度試してください。
          </Banner>
        </div>
      ) : null}
      <form action={login} className="mt-8 w-full">
        <Button type="submit" icon={<PersonIcon className="size-5" />} className="w-full">
          {deniedEmail ? "別の Google アカウントでログインする" : "Google でログインする"}
        </Button>
      </form>
    </>
  );
}
