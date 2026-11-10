import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { NoteMissingIcon } from "@/components/icons";

// 場所を空にし、一覧で何も強調しないのは、上の帯と一覧が URL から決める（src/components/note-tree.tsx）
export default function NoteNotFound() {
  return (
    <EmptyState
      icon={<NoteMissingIcon className="size-10" />}
      title="ノートが見つかりません"
      description="リンク先のノートは、名前が変わったか、消された可能性があります。"
      action={
        <Link
          href="/"
          className="
            block rounded-md bg-accent px-5 py-3 text-sm font-bold text-on-accent
            transition-opacity
            hover:opacity-90
          "
        >
          ホームへ戻る
        </Link>
      }
    />
  );
}
