import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { NoteBodyContent } from "./note-body-content";
import { renderMermaid } from "./mermaid";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// 本物の mermaid はブラウザの描画（文字の大きさを測るなど）が要り、jsdom では描けない。描く処理を差し替える
vi.mock("./mermaid", () => ({
  renderMermaid: vi.fn(),
}));

const mockedRender = vi.mocked(renderMermaid);

const diagramHtml =
  '<p>前</p><pre data-mermaid=""><code class="language-mermaid">flowchart LR\n  A --&gt; B\n</code></pre>';

function sourceCode() {
  return screen.queryByText(/flowchart LR/);
}

afterEach(() => {
  mockedRender.mockReset();
  push.mockReset();
});

describe("NoteBodyContent の Mermaid", () => {
  test("描き終わるまでのあいだは、元のコードを出しておく", async () => {
    mockedRender.mockReturnValue(new Promise(() => {}));
    const { container } = render(<NoteBodyContent html={diagramHtml} />);
    await waitFor(() =>
      expect(mockedRender).toHaveBeenCalledWith(expect.any(String), "flowchart LR\n  A --> B\n"),
    );
    expect(sourceCode()).toBeInTheDocument();
    expect(container.querySelector(".mermaid-figure")).toBeNull();
  });

  test("描けたら、元のコードを図に替える", async () => {
    mockedRender.mockResolvedValue('<svg aria-label="図"></svg>');
    const { container } = render(<NoteBodyContent html={diagramHtml} />);
    await waitFor(() => expect(container.querySelector(".mermaid-figure svg")).not.toBeNull());
    expect(sourceCode()).toBeNull();
  });

  test("描けなかったら（書き方が間違っている）、元のコードをそのまま出す", async () => {
    mockedRender.mockRejectedValue(new Error("Parse error"));
    const { container } = render(<NoteBodyContent html={diagramHtml} />);
    await waitFor(() => expect(mockedRender).toHaveBeenCalled());
    // 失敗の後始末まで進ませる
    await Promise.resolve();
    expect(sourceCode()).toBeInTheDocument();
    expect(container.querySelector("pre[data-mermaid]")).not.toBeNull();
    expect(container.querySelector(".mermaid-figure")).toBeNull();
  });

  test("図のないノートでは、描く処理を呼ばない", async () => {
    render(<NoteBodyContent html="<p>本文だけ</p>" />);
    await Promise.resolve();
    expect(mockedRender).not.toHaveBeenCalled();
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
    render(<NoteBodyContent html={'<p><a href="https://example.com">外</a></p>'} />);
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "外" }));
    expect(notPrevented).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });
});
