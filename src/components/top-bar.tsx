"use client";

import { Fragment, Suspense, type ReactNode } from "react";
import { FontSizeMenu } from "@/components/font-size-menu";
import { usePlace } from "@/components/note-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { TreeDrawer } from "@/components/tree-drawer";
import type { NoteTree } from "@/lib/notes";

const placeClass = `
  min-w-0 flex-1 truncate text-sm text-muted
  lg:px-1
`;

function Place({ tree }: { tree: NoteTree }) {
  const parts = usePlace(tree);
  return (
    <nav aria-label="場所" className={placeClass}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <>
              {" "}
              <span className="px-1">/</span>{" "}
            </>
          ) : null}
          {part}
        </Fragment>
      ))}
    </nav>
  );
}

type TopBarProps = {
  tree: NoteTree;
  /** スマホの一覧のいちばん下に置くもの（ログアウト） */
  treeFooter: ReactNode;
};

/** 上の帯。スクロールしても上に残る */
export function TopBar({ tree, treeFooter }: TopBarProps) {
  return (
    <header
      className="
        sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border
        bg-bg px-3
      "
    >
      <TreeDrawer tree={tree} footer={treeFooter} />
      <Suspense fallback={<nav aria-label="場所" className={placeClass} />}>
        <Place tree={tree} />
      </Suspense>
      <FontSizeMenu />
      <ThemeToggle />
    </header>
  );
}
