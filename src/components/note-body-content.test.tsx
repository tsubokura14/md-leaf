import { fireEvent, render, screen } from "@testing-library/react";
import { drawMermaid } from "kinari-md/mermaid";
import { afterEach, describe, expect, test, vi } from "vitest";
import { NoteBodyContent } from "./note-body-content";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// 図を描く・描き直す処理は kinari-md が持ち、kinari-md がテストする。ここではつなぎ方だけを確かめる
vi.mock("kinari-md/mermaid", () => ({
  drawMermaid: vi.fn(),
}));

const mockedDraw = vi.mocked(drawMermaid);

afterEach(() => {
  mockedDraw.mockReset();
  push.mockReset();
});

describe("NoteBodyContent の本文と図", () => {
  test("本文は kinari-md の入れ物（.kinari-body）に入れる", () => {
    mockedDraw.mockReturnValue(() => {});
    const { container } = render(<NoteBodyContent html="<p>本文だけ</p>" />);
    expect(container.querySelector(".kinari-body p")).toHaveTextContent("本文だけ");
  });

  test("図は kinari-md の drawMermaid に本文の入れ物を渡して描き、外すときに描き直しをやめる", () => {
    const stop = vi.fn();
    mockedDraw.mockReturnValue(stop);
    const { container, unmount } = render(<NoteBodyContent html="<p>本文</p>" />);
    expect(mockedDraw).toHaveBeenCalledWith(container.querySelector(".kinari-body"));
    expect(stop).not.toHaveBeenCalled();
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  test("本文が変わったら、前の描き直しをやめてから描き直す", () => {
    const stop = vi.fn();
    mockedDraw.mockReturnValue(stop);
    const { rerender } = render(<NoteBodyContent html="<p>前</p>" />);
    rerender(<NoteBodyContent html="<p>後</p>" />);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(mockedDraw).toHaveBeenCalledTimes(2);
  });
});

describe("NoteBodyContent のリンク", () => {
  test("ノートへのリンク（data-internal-link）は、読み込み直さずに router.push で移る", () => {
    render(<NoteBodyContent html={'<p><a href="/notes/a" data-internal-link="">a</a></p>'} />);
    const link = screen.getByRole("link", { name: "a" });
    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(false);
    expect(push).toHaveBeenCalledWith("/notes/a");
  });

  test("印のないリンクは、ブラウザに任せる", () => {
    render(<NoteBodyContent html={'<p><a href="#節">節</a></p>'} />);
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "節" }));
    expect(notPrevented).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });
});
