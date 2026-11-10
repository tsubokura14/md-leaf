import { LeafIcon } from "@/components/icons";

/** アプリの印（若葉と「md-leaf」）。ノートの一覧の上に置く */
export function AppMark() {
  return (
    <span className="flex items-center gap-3 text-base font-bold">
      <LeafIcon className="size-5 text-accent" />
      md-leaf
    </span>
  );
}
