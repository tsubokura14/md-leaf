"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { TocIcon } from "@/components/icons";
import type { Heading } from "@/lib/markdown";
import "./toc.css";

// 上の帯の目次のボタンと、ページが出す目次。上の帯はレイアウトに、見出しはページにあるので、
// 開いているかとボタン（閉じたらフォーカスを戻す先）だけを context で共有する

type TocState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  button: RefObject<HTMLButtonElement | null>;
};

const TocContext = createContext<TocState | null>(null);

function useToc(): TocState {
  const state = useContext(TocContext);
  if (!state) throw new Error("TocProvider の中で使う");
  return state;
}

/** 上の帯と本文をまとめて包み、スマホの目次の開閉を共有する */
export function TocProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const value = useMemo(() => ({ open, setOpen, button }), [open]);
  return <TocContext value={value}>{children}</TocContext>;
}

/** 上の帯の目次のボタン（幅 xl 未満で、見出しのある本文を出しているときだけ） */
export function TocButton() {
  const { open, setOpen, button } = useToc();
  // 出し分けは「Aa」と同じく CSS の変形で行う（src/components/font-size-menu.tsx の説明。変形は src/app/globals.css の toc）。
  // xl:hidden と toc:block を同じ要素に書くと、どちらが勝つかが変形の並び順で決まるので、要素を分ける
  return (
    <div className="xl:hidden">
      <div
        className="
          hidden
          toc:block
        "
      >
        <button
          ref={button}
          type="button"
          aria-label="目次を開く"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="
            flex size-10 items-center justify-center rounded-md text-muted
            transition-colors
            hover:bg-surface
          "
        >
          <TocIcon className="size-6" />
        </button>
      </div>
    </div>
  );
}

// 押した見出しへ移る。Next.js は前のページを隠して残すので、document 全体ではなく、この本文の中から探す。
// URL にも履歴にも手を付けない（#見出し を付けると押すたびに履歴が増え、「戻る」で前のページへ戻れなくなるため）
function goToHeading(from: HTMLElement, id: string) {
  const note = from.closest("[data-note]");
  const heading = note?.querySelector<HTMLElement>(`[data-heading="${id}"]`);
  if (!heading) return;
  for (let details = heading.closest("details"); details;) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
  heading.scrollIntoView({ block: "start" });
}

function TocContents({
  headings,
  onSelect,
}: {
  headings: Heading[];
  onSelect: (element: HTMLElement, id: string) => void;
}) {
  return (
    <>
      <p className="shrink-0 px-3 pb-2 font-ui text-xs font-bold text-muted">目次</p>
      <ul className="min-h-0 overflow-x-hidden overflow-y-auto">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              type="button"
              onClick={(event) => onSelect(event.currentTarget, heading.id)}
              className={`
                block w-full rounded-md py-2 pr-3 text-left font-ui text-sm
                leading-normal wrap-anywhere transition-colors
                hover:bg-surface
                ${heading.depth === 3 ? "pl-7 text-muted" : "pl-3"}
              `}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** ページが出す目次。広い PC では本文の右に、それより狭いと目次のボタンで下から出す。見出しがなければ何も出さない */
export function NoteToc({ headings }: { headings: Heading[] }) {
  const { open, setOpen, button } = useToc();
  const panel = useRef<HTMLDivElement>(null);

  // ページを離れる（隠される）ときに閉じておく。開いたまま次のページへ持ち越さない
  useEffect(() => () => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen, button]);

  if (headings.length === 0) return null;

  const close = () => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  };

  const selectInSheet = (element: HTMLElement, id: string) => {
    close();
    goToHeading(element, id);
  };

  return (
    // data-toc は、上の帯の目次のボタンを出す目印（src/app/globals.css の toc の変形）
    <div data-toc="" className="contents">
      <nav
        aria-label="目次"
        className="
          toc-side hidden
          xl:sticky xl:top-24 xl:flex xl:w-48 xl:shrink-0 xl:flex-col
          xl:self-start
        "
      >
        <TocContents headings={headings} onSelect={goToHeading} />
      </nav>
      {/* 閉じているあいだも消さずに隠しておき、開くときに下から滑らせる（src/components/tree-drawer.tsx と同じ作り） */}
      <div
        className={`
          fixed inset-0 z-20
          xl:hidden
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
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="目次"
          tabIndex={-1}
          className={`
            toc-sheet absolute inset-x-0 bottom-0 flex flex-col rounded-t-lg
            border-t border-border bg-bg px-3 pb-8 shadow-sheet outline-none
            transition-transform
            ${open ? "translate-y-0" : "translate-y-full"}
          `}
        >
          <div
            aria-hidden="true"
            className="mx-auto mt-3 mb-4 h-1 w-10 shrink-0 rounded-sm bg-border"
          />
          <TocContents headings={headings} onSelect={selectInSheet} />
        </div>
      </div>
    </div>
  );
}
