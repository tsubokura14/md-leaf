import { fireEvent, render, screen } from "@testing-library/react";
import { createContext, useContext } from "react";
import { describe, expect, test, vi } from "vitest";
import type { NoteTree as NoteTreeData } from "@/lib/notes";
import { NoteTree } from "./note-tree";

// useLinkStatus は Next.js のルーターの中でしか動かないので、Link ごと差し替える。
// pendingHref に当たるリンクだけを「待っている」ことにする
const hoisted = vi.hoisted(() => ({ pendingHref: null as string | null, pathname: "/" }));
const HrefContext = createContext<string | null>(null);

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      <HrefContext.Provider value={href}>{children}</HrefContext.Provider>
    </a>
  ),
  useLinkStatus: () => ({ pending: useContext(HrefContext) === hoisted.pendingHref }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => hoisted.pathname,
}));

const tree: NoteTreeData = {
  hasHome: true,
  children: [
    { type: "note", name: "01_a", path: "01_a" },
    { type: "note", name: "02_b", path: "02_b" },
  ],
} as NoteTreeData;

describe("NoteTree の読み込み中の印", () => {
  test("待っているリンクの行にだけ「読み込み中」が出る", () => {
    hoisted.pendingHref = "/notes/02_b";
    render(<NoteTree tree={tree} />);
    const statuses = screen.getAllByRole("status", { name: "読み込み中" });
    expect(statuses).toHaveLength(1);
    expect(statuses[0].closest("a")?.getAttribute("href")).toBe("/notes/02_b");
  });

  test("待っていないときは印を出さないが、印の枠は置いたまま", () => {
    hoisted.pendingHref = null;
    const { container } = render(<NoteTree tree={tree} />);
    expect(screen.queryByRole("status")).toBeNull();
    // ホーム・ノート2つの3行とも、印の枠を置いたまま（幅を取らないよう absolute で置く。見た目は触って確かめる）
    expect(container.querySelectorAll("a [data-pending-dot]")).toHaveLength(3);
  });
});

describe("NoteTree の、ページが切り替わったときの合図", () => {
  test("押しただけでは onNavigated を呼ばない", () => {
    hoisted.pendingHref = null;
    hoisted.pathname = "/";
    const onNavigated = vi.fn();
    render(<NoteTree tree={tree} onNavigated={onNavigated} />);
    fireEvent.click(screen.getByRole("link", { name: "02_b" }));
    expect(onNavigated).not.toHaveBeenCalled();
  });

  test("URL が変わると onNavigated を1回呼ぶ（初めの表示では呼ばない）", () => {
    hoisted.pendingHref = null;
    hoisted.pathname = "/";
    const onNavigated = vi.fn();
    const { rerender } = render(<NoteTree tree={tree} onNavigated={onNavigated} />);
    expect(onNavigated).not.toHaveBeenCalled();
    hoisted.pathname = "/notes/02_b";
    rerender(<NoteTree tree={tree} onNavigated={onNavigated} />);
    expect(onNavigated).toHaveBeenCalledTimes(1);
  });
});
