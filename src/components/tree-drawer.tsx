"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppMark } from "@/components/app-mark";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { NoteTree } from "@/components/note-tree";
import type { NoteTree as NoteTreeData } from "@/lib/notes";

type TreeDrawerProps = {
  tree: NoteTreeData;
  /** 一覧のいちばん下に置くもの（ログアウト） */
  footer: ReactNode;
};

/** スマホ（幅 lg 未満）の ☰ と、左から出るノートの一覧 */
export function TreeDrawer({ tree, footer }: TreeDrawerProps) {
  const [open, setOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    openButton.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        openButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={openButton}
        type="button"
        aria-label="ノートの一覧を開く"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="
          flex size-10 items-center justify-center rounded-md text-muted
          transition-colors
          hover:bg-surface
        "
      >
        <MenuIcon className="size-6" />
      </button>
      {/* 閉じているあいだも消さずに隠しておき、開くときに左から滑らせる */}
      <div
        className={`
          fixed inset-0 z-20
          ${open ? "visible" : "invisible"}
        `}
        inert={!open}
      >
        <div
          aria-hidden="true"
          onClick={close}
          className={`
            absolute inset-0 bg-overlay transition-opacity
            ${open ? "opacity-100" : "opacity-0"}
          `}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ノートの一覧"
          className={`
            relative flex h-full w-72 flex-col bg-bg transition-transform
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div
            className="
              flex h-14 shrink-0 items-center justify-between border-b
              border-border pr-2 pl-4
            "
          >
            <AppMark />
            <button
              ref={closeButton}
              type="button"
              aria-label="ノートの一覧を閉じる"
              onClick={close}
              className="
                flex size-10 items-center justify-center rounded-md text-muted
                transition-colors
                hover:bg-surface
              "
            >
              <CloseIcon className="size-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* 押したときではなく、ページが切り替わってから閉じる。押してすぐ閉じると、待つ間の行の印（PendingDot）が見えないため */}
            <NoteTree tree={tree} onNavigated={() => setOpen(false)} />
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
