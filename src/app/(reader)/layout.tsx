import { Suspense } from "react";
import { AppMark } from "@/components/app-mark";
import { Logout } from "@/components/logout";
import { NoteTree } from "@/components/note-tree";
import { TopBar } from "@/components/top-bar";
import { getNoteTree } from "./data";

// ログイン中のアドレスは開くたびに読むので、そこだけを後から流し込む（cacheComponents）
function TreeFooter() {
  return (
    <Suspense fallback={null}>
      <Logout />
    </Suspense>
  );
}

export default async function ReaderLayout({ children }: LayoutProps<"/">) {
  const tree = await getNoteTree();
  return (
    <div className="lg:flex">
      {/* PC（幅 lg 以上）では、ノートの一覧を左に常に出す。一覧が長いときは、一覧だけがスクロールする */}
      <aside
        aria-label="ノートの一覧"
        className="
          hidden
          lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col
          lg:border-r lg:border-border
        "
      >
        <div className="flex h-14 shrink-0 items-center px-4">
          <AppMark />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoteTree tree={tree} />
        </div>
        <TreeFooter />
      </aside>
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <TopBar tree={tree} treeFooter={<TreeFooter />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
