import { EmptyState } from "@/components/empty-state";
import { FolderIcon } from "@/components/icons";
import { NoteBody } from "@/components/note-body";
import { NoteTree } from "@/components/note-tree";
import { getHome, getNoteTree } from "./data";

export default async function Home() {
  const home = await getHome();
  if (home) return <NoteBody title={home.title} html={home.html} headings={home.headings} />;

  const tree = await getNoteTree();
  if (tree.children.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon className="size-10" />}
        title="ノートがまだありません"
        description="コンテンツフォルダに md ファイルを置くと、ここに一覧が出ます。"
      />
    );
  }

  return (
    <div
      className="
        px-4 pt-6 pb-12
        lg:px-10 lg:pt-10
      "
    >
      <div className="mx-auto max-w-prose">
        <h1 className="font-body text-2xl leading-tight font-bold">ノート</h1>
        {/* PC では一覧が左に常にあるので、案内だけを出す */}
        <p
          className="
            mt-4 text-sm text-muted
            lg:hidden
          "
        >
          読みたいノートを選んでください。
        </p>
        <p
          className="
            mt-4 hidden text-sm text-muted
            lg:block
          "
        >
          左の一覧から、読みたいノートを選んでください。
        </p>
        <nav
          aria-label="ノート"
          className="
            mt-2 -ml-1
            lg:hidden
          "
        >
          <NoteTree tree={tree} />
        </nav>
      </div>
    </div>
  );
}
