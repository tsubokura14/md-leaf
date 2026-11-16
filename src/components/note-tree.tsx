"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { ChevronIcon, HomeIcon } from "@/components/icons";
import { NOTE_PREFIX, noteHref } from "@/lib/note-url";
import type { NoteTree as NoteTreeData, NoteTreeEntry, NoteTreeFolder } from "@/lib/notes";

// 今のページ（場所・一覧の強調・開いておくフォルダ）は、ページから渡さず、一覧の木と usePathname から決める。
// レイアウトはページを移っても作り直されないので、今のページはクライアントで知るしかない。
// 木にない URL（見つからないノート）は、場所を空にし、何も強調しない。
// usePathname は、ビルドのときに分からない URL では止まるので、使う部品は Suspense に入れる

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

type Current = { home: true } | { home: false; trail: NoteTreeEntry[] } | null;

/** 今の URL が、木のどこに当たるか。trail は一番上からのフォルダと、最後にノート */
function findCurrent(tree: NoteTreeData, pathname: string): Current {
  if (pathname === "/") return { home: true };
  if (!pathname.startsWith(NOTE_PREFIX)) return null;
  const path = pathname.slice(NOTE_PREFIX.length).split("/").map(decodeSegment).join("/");
  const trail: NoteTreeEntry[] = [];
  let entries: NoteTreeEntry[] = tree.children;
  for (;;) {
    const next = entries.find((entry) =>
      entry.type === "note" ? entry.path === path : path.startsWith(`${entry.path}/`),
    );
    if (!next) return null;
    trail.push(next);
    if (next.type === "note") return { home: false, trail };
    entries = next.children;
  }
}

/** 上の帯の場所。ホームは「ホーム」、ノートはフォルダとノートの名前。木にない URL は空 */
export function usePlace(tree: NoteTreeData): string[] {
  const current = findCurrent(tree, usePathname());
  if (!current) return [];
  if (current.home) return ["ホーム"];
  return current.trail.map((entry) => entry.name);
}

const rowClass = `
  relative flex w-full items-start gap-2 rounded-md px-2 py-2 text-left leading-normal
  transition-colors
  hover:bg-surface
`;
const currentClass = "bg-accent/10 font-bold text-accent hover:bg-accent/10";

/**
 * 押したリンクの移動を待つ間だけ、行の右端に出す点（docs/ui.md の「状態の見せ方」）。
 * useLinkStatus は <Link> の子でしか使えないので、行の中に置く部品にする。
 * 行の高さと名前の折り返しの幅を変えないよう、行（relative）の右の余白（px-2）の中、1行目の高さに absolute で置く。
 * 枠はいつも置き、点の見え方だけを切り替える
 */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      data-pending-dot=""
      role={pending ? "status" : undefined}
      aria-label={pending ? "読み込み中" : undefined}
      aria-hidden={pending ? undefined : true}
      className={`
        absolute top-3.5 right-0.5 size-1.5 rounded-full bg-accent
        ${pending ? "motion-safe:animate-pulse" : "opacity-0"}
      `}
    />
  );
}

type NoteTreeProps = {
  tree: NoteTreeData;
  /** ノート・「ホーム」を押したとき（スマホでは一覧を閉じる） */
  onNavigate?: () => void;
};

/** ノートの一覧。スマホの引き出しと PC の左の欄で同じものを使う */
export function NoteTree(props: NoteTreeProps) {
  return (
    <Suspense fallback={<TreeList {...props} current={null} />}>
      <CurrentTree {...props} />
    </Suspense>
  );
}

function CurrentTree(props: NoteTreeProps) {
  const pathname = usePathname();
  // ページを移ったら、開いておくフォルダを今のノートに合わせて決め直す
  return <TreeList key={pathname} {...props} current={findCurrent(props.tree, pathname)} />;
}

function TreeList({ tree, onNavigate, current }: NoteTreeProps & { current: Current }) {
  const currentPaths = new Set(current && !current.home ? current.trail.map((e) => e.path) : []);
  // ホームでは、開く理由のあるフォルダがないので、すべて閉じておく
  const [open, setOpen] = useState(() => currentPaths);
  const toggle = (path: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  return (
    <ul className="p-2 text-sm">
      {tree.hasHome ? (
        <li>
          <Link
            href="/"
            onClick={onNavigate}
            aria-current={current?.home ? "page" : undefined}
            className={`
              ${rowClass}
              ${current?.home ? currentClass : ""}
            `}
          >
            <HomeIcon className="my-0.5 size-4 shrink-0 text-muted" />
            ホーム
            <PendingDot />
          </Link>
        </li>
      ) : null}
      {!tree.hasHome && tree.children.length === 0 ? (
        <li className="px-2 py-2 text-muted">ノートがありません</li>
      ) : null}
      <Entries
        entries={tree.children}
        open={open}
        toggle={toggle}
        currentPaths={currentPaths}
        onNavigate={onNavigate}
      />
    </ul>
  );
}

type EntriesProps = {
  entries: NoteTreeEntry[];
  open: Set<string>;
  toggle: (path: string) => void;
  currentPaths: Set<string>;
  onNavigate?: () => void;
};

function Entries({ entries, ...rest }: EntriesProps) {
  return entries.map((entry) =>
    entry.type === "folder" ? (
      <Folder key={entry.path} folder={entry} {...rest} />
    ) : (
      <li key={entry.path}>
        <Link
          href={noteHref(entry.path)}
          onClick={rest.onNavigate}
          aria-current={rest.currentPaths.has(entry.path) ? "page" : undefined}
          className={`
            ${rowClass}
            ${rest.currentPaths.has(entry.path) ? currentClass : ""}
          `}
        >
          {entry.name}
          <PendingDot />
        </Link>
      </li>
    ),
  );
}

function Folder({ folder, ...rest }: Omit<EntriesProps, "entries"> & { folder: NoteTreeFolder }) {
  const isOpen = rest.open.has(folder.path);
  return (
    <li>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => rest.toggle(folder.path)}
        className={rowClass}
      >
        <ChevronIcon
          className={`
            my-0.5 size-4 shrink-0 text-muted transition-transform
            ${isOpen ? "rotate-90" : ""}
          `}
        />
        {folder.name}
      </button>
      {isOpen ? (
        <ul className="ml-4 border-l border-border pl-2">
          <Entries entries={folder.children} {...rest} />
        </ul>
      ) : null}
    </li>
  );
}
