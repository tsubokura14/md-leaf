import { render, screen } from "@testing-library/react";
import { createContext, useContext } from "react";
import { describe, expect, test, vi } from "vitest";
import type { NoteTree as NoteTreeData } from "@/lib/notes";
import { NoteTree } from "./note-tree";

// useLinkStatus は Next.js のルーターの中でしか動かないので、Link ごと差し替える。
// pendingHref に当たるリンクだけを「待っている」ことにする
const hoisted = vi.hoisted(() => ({ pendingHref: null as string | null }));
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
  usePathname: () => "/",
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
    // ホーム・ノート2つの3行とも、行の幅を変えないよう枠を置いておく
    expect(container.querySelectorAll("a [data-pending-dot]")).toHaveLength(3);
  });
});
