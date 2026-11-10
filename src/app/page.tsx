import { Suspense } from "react";
import { Logout } from "@/components/logout";

// 空のページ。ホームを作るとき（#3）に置き換える。ログアウトは #3 でノートの一覧のいちばん下へ移す
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">
        <h1>md-leaf</h1>
      </main>
      {/* ログイン中のアドレスは開くたびに読むので、そこだけを後から流し込む（cacheComponents） */}
      <Suspense fallback={null}>
        <Logout />
      </Suspense>
    </div>
  );
}
