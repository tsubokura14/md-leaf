import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { contentDir, listNotePaths, readHome, readNote, readNoteTree } from "./notes";

let dir: string;

async function put(files: Record<string, string>) {
  for (const [path, body] of Object.entries(files)) {
    const file = join(dir, ...path.split("/"));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
  }
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "md-leaf-notes-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("contentDir", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("CONTENT_DIR がなければ content/ を使う", () => {
    vi.stubEnv("CONTENT_DIR", undefined);
    expect(contentDir()).toBe(resolve("content"));
  });

  test("CONTENT_DIR があればそれを使う", () => {
    vi.stubEnv("CONTENT_DIR", "e2e/fixtures/content");
    expect(contentDir()).toBe(resolve("e2e/fixtures/content"));
  });
});

describe("readNoteTree", () => {
  test("md ファイルとフォルダを構成そのままの木にし、md 以外と md のないフォルダは出さない", async () => {
    await put({
      "開発/Git.md": "本文",
      "開発/図.png": "x",
      "開発/深い/メモ.md": "本文",
      "画像だけ/a.png": "x",
      "空の入れ子/中/a.txt": "x",
      ".trash/消した.md": "本文",
      "メモ.md": "本文",
      "読んで.txt": "x",
    });

    const tree = await readNoteTree(dir);

    expect(tree.children).toEqual([
      {
        type: "folder",
        name: "開発",
        path: "開発",
        children: [
          {
            type: "folder",
            name: "深い",
            path: "開発/深い",
            children: [{ type: "note", name: "メモ", path: "開発/深い/メモ" }],
          },
          { type: "note", name: "Git", path: "開発/Git" },
        ],
      },
      { type: "note", name: "メモ", path: "メモ" },
    ]);
  });

  test("同じ階層では、フォルダが先、ノートがあと。それぞれ名前の順で、数字は数の大きさの順", async () => {
    await put({
      "10 ノート.md": "",
      "2 ノート.md": "",
      "z フォルダ/a.md": "",
      "10 フォルダ/a.md": "",
      "2 フォルダ/a.md": "",
    });

    const tree = await readNoteTree(dir);

    expect(tree.children.map((entry) => entry.name)).toEqual([
      "2 フォルダ",
      "10 フォルダ",
      "z フォルダ",
      "2 ノート",
      "10 ノート",
    ]);
  });

  test("ノートの名前は、フロントマターの title があればそれ、なければファイル名", async () => {
    await put({
      "b-file.md": "---\ntitle: b 題つき\n---\n本文",
      "c-file.md": "本文",
    });

    const tree = await readNoteTree(dir);

    expect(tree.children).toEqual([
      { type: "note", name: "b 題つき", path: "b-file" },
      { type: "note", name: "c-file", path: "c-file" },
    ]);
  });

  test("一番上の index.md はノートとして並べず、ホームがあるとする。下の階層の index.md はノート", async () => {
    await put({
      "index.md": "入り口",
      "開発/index.md": "開発の入り口",
    });

    const tree = await readNoteTree(dir);

    expect(tree.hasHome).toBe(true);
    expect(tree.children).toEqual([
      {
        type: "folder",
        name: "開発",
        path: "開発",
        children: [{ type: "note", name: "index", path: "開発/index" }],
      },
    ]);
  });

  test("一番上に index.md がなければ、ホームはない", async () => {
    await put({ "メモ.md": "本文" });

    const tree = await readNoteTree(dir);

    expect(tree.hasHome).toBe(false);
  });
});

describe("listNotePaths", () => {
  test("ホーム以外の全部のノートを、フォルダごとに分けたパス（.md を除く）で返す", async () => {
    await put({
      "index.md": "入り口",
      "開発/Git ブランチの運用メモ.md": "本文",
      "メモ.md": "本文",
    });

    const paths = await listNotePaths(dir);

    expect(paths).toEqual([["開発", "Git ブランチの運用メモ"], ["メモ"]]);
  });
});

describe("readNote", () => {
  beforeEach(async () => {
    await put({
      "index.md": "---\ntitle: ノートの入り口\n---\n入り口",
      "開発/Git ブランチの運用メモ.md": "---\ntitle: 運用メモ\n---\n\n本文です。\n",
      "開発/題なし.md": "本文です。\n",
      "外.md": "本文",
    });
  });

  test("分けたパスから、ノートの題と本文の HTML を返す", async () => {
    const note = await readNote(["開発", "Git ブランチの運用メモ"], dir);

    expect(note).toEqual({
      path: "開発/Git ブランチの運用メモ",
      title: "運用メモ",
      html: "<p>本文です。</p>",
    });
  });

  test("URL の符号化のままのパスでも探せる", async () => {
    const note = await readNote(
      [encodeURIComponent("開発"), encodeURIComponent("Git ブランチの運用メモ")],
      dir,
    );

    expect(note?.title).toBe("運用メモ");
  });

  test("title がなければ、題はファイル名", async () => {
    const note = await readNote(["開発", "題なし"], dir);

    expect(note?.title).toBe("題なし");
  });

  test("ないノートは返さない", async () => {
    expect(await readNote(["開発", "ない"], dir)).toBeUndefined();
  });

  test("一番上の index.md は、ノートとしては返さない（ホームで出す）", async () => {
    expect(await readNote(["index"], dir)).toBeUndefined();
  });

  test("コンテンツフォルダの外は返さない", async () => {
    await writeFile(join(dir, "..", "md-leaf-outside.md"), "外");
    try {
      expect(await readNote(["..", "md-leaf-outside"], dir)).toBeUndefined();
      expect(await readNote(["開発", "..", "外"], dir)).toBeUndefined();
    } finally {
      await rm(join(dir, "..", "md-leaf-outside.md"), { force: true });
    }
  });
});

describe("readHome", () => {
  test("一番上の index.md があれば、ノートとして返す", async () => {
    await put({ "index.md": "---\ntitle: ノートの入り口\n---\n\n入り口です。\n" });

    const home = await readHome(dir);

    expect(home).toEqual({ path: "index", title: "ノートの入り口", html: "<p>入り口です。</p>" });
  });

  test("一番上に index.md がなければ返さない", async () => {
    await put({ "開発/index.md": "本文" });

    expect(await readHome(dir)).toBeUndefined();
  });
});

describe("ノートの中のリンク", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("ほかのノートと、ホームへのリンクを、ノートの URL に書き換える", async () => {
    await put({
      "index.md": "[メモ](<開発/Docker のメモ.md>)",
      "開発/Docker のメモ.md": "[ホーム](../index.md)",
    });

    const home = await readHome(dir);
    const note = await readNote(["開発", "Docker のメモ"], dir);

    expect(home?.html).toContain(
      `href="/notes/${encodeURIComponent("開発")}/${encodeURIComponent("Docker のメモ")}" data-note-link=""`,
    );
    expect(note?.html).toContain('href="/" data-note-link=""');
  });

  test("リンク先がないリンクがあれば、リンクを書いたノートとリンク先を警告に出す", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await put({
      "index.md": "[古い](<開発/古い名前.md>)",
      "開発/a.md": "[外](../../x.md) [ある](b.md)",
      "開発/b.md": "本文",
    });

    await readHome(dir);
    await readNote(["開発", "a"], dir);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.join(" ")).toContain("index.md");
    expect(warn.mock.calls[0]?.join(" ")).toContain("開発/古い名前.md");
    expect(warn.mock.calls[1]?.join(" ")).toContain("開発/a.md");
    expect(warn.mock.calls[1]?.join(" ")).toContain("../../x.md");
    expect(warn.mock.calls[1]?.join(" ")).not.toContain("b.md");
  });

  test("リンク先がないリンクがなければ、警告を出さない", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await put({ "開発/a.md": "[ある](b.md)", "開発/b.md": "本文" });

    await readNote(["開発", "a"], dir);

    expect(warn).not.toHaveBeenCalled();
  });

  test("一番上の index.md があれば、そこへのリンクは切れたリンクとして警告しない", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await put({ "index.md": "入り口", "開発/a.md": "[ホーム](../index.md)" });

    await readNote(["開発", "a"], dir);

    expect(warn).not.toHaveBeenCalled();
  });
});
