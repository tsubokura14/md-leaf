import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareContent } from "./prepare-content.mjs";

const dirs = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const TOKEN = "github_pat_secret123";
const VAULT = { VERCEL: "1", VAULT_REPO: "owner/learning-vault", VAULT_TOKEN: TOKEN };

const note = (title, body = "") => `---\ntitle: ${title}\n---\n\n${body}\n`;

// 決まりに合う最小のコンテンツフォルダ
const validFiles = {
  "index.md": note("ホーム", "- [入門](<入門/index_入門.md>)"),
  "入門/index_入門.md": note("入門"),
  "入門/00_ガイド.md": note("ガイド"),
  "入門/01_はじめに.md": note("はじめに"),
};

function writeFiles(root, files) {
  for (const [path, body] of Object.entries(files)) {
    const file = join(root, ...path.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
}

function makeCwd() {
  const dir = mkdtempSync(join(tmpdir(), "prepare-content-"));
  dirs.push(dir);
  return dir;
}

// git の代わり。呼ばれた引数を残し、files を取る先（引数の最後）に書いて status を返す
function fakeGit({ status = 0, files = validFiles } = {}) {
  const calls = [];
  const run = (command, args, options) => {
    calls.push({ command, args, options });
    if (status === 0) writeFiles(args.at(-1), { ...files, ".git/HEAD": "ref: refs/heads/main" });
    return { status };
  };
  return { run, calls };
}

function prepare({ env = {}, cwd = makeCwd(), run = fakeGit().run } = {}) {
  const lines = [];
  const code = prepareContent({
    env,
    cwd,
    run,
    log: (line) => lines.push(line),
    error: (line) => lines.push(line),
  });
  return { code, lines, cwd };
}

describe("prepareContent", () => {
  describe("Vercel のビルド", () => {
    it("保管庫を content/ に取って .git を消し、検査が通れば 0 を返す", () => {
      const git = fakeGit();
      const { code, cwd } = prepare({ env: VAULT, run: git.run });
      expect(code).toBe(0);
      expect(git.calls).toHaveLength(1);
      expect(git.calls[0].command).toBe("git");
      expect(git.calls[0].args).toEqual([
        "clone",
        "--depth",
        "1",
        "--branch",
        "main",
        "https://github.com/owner/learning-vault.git",
        join(cwd, "content"),
      ]);
      expect(existsSync(join(cwd, "content", "index.md"))).toBe(true);
      expect(existsSync(join(cwd, "content", ".git"))).toBe(false);
    });

    it("鍵は引数に入れず、環境変数でヘッダーとして渡し、入力を待たせない", () => {
      const git = fakeGit();
      prepare({ env: VAULT, run: git.run });
      const { args, options } = git.calls[0];
      expect(args.join(" ")).not.toContain(TOKEN);
      expect(options.env).toMatchObject({
        GIT_TERMINAL_PROMPT: "0",
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${TOKEN}`).toString("base64")}`,
      });
    });

    it("取る前に、前からある content/ を消す", () => {
      const cwd = makeCwd();
      writeFiles(join(cwd, "content"), { "古いノート.md": note("古い") });
      const { code } = prepare({ env: VAULT, cwd });
      expect(code).toBe(0);
      expect(existsSync(join(cwd, "content", "古いノート.md"))).toBe(false);
    });

    it.each(["VAULT_REPO", "VAULT_TOKEN"])("%s がなければ、git を呼ばずに 1 を返す", (name) => {
      const git = fakeGit();
      const { code, lines } = prepare({ env: { ...VAULT, [name]: "" }, run: git.run });
      expect(code).toBe(1);
      expect(git.calls).toHaveLength(0);
      expect(lines.join("\n")).toContain(name);
    });

    it("git が失敗したら（鍵の期限切れ・保管庫がないなど）1 を返し、文言に鍵を入れない", () => {
      const { code, lines } = prepare({ env: VAULT, run: fakeGit({ status: 128 }).run });
      expect(code).toBe(1);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.join("\n")).not.toContain(TOKEN);
    });

    it("git を起動できなければ 1 を返す", () => {
      const run = () => ({ status: null, error: new Error("spawn git ENOENT") });
      expect(prepare({ env: VAULT, run }).code).toBe(1);
    });

    it("取った保管庫が決まりに合わなければ、一覧を出して 1 を返す", () => {
      const files = { ...validFiles, "README.md": "# 保管庫" };
      const { code, lines } = prepare({ env: VAULT, run: fakeGit({ files }).run });
      expect(code).toBe(1);
      expect(lines.join("\n")).toContain("content/README.md");
    });
  });

  describe("Vercel でないとき", () => {
    it("git を呼ばずに CONTENT_DIR を検査し、通れば 0 を返す", () => {
      const vault = makeCwd();
      writeFiles(vault, validFiles);
      const git = fakeGit();
      const { code } = prepare({
        env: { CONTENT_DIR: vault, VAULT_REPO: "owner/learning-vault", VAULT_TOKEN: TOKEN },
        run: git.run,
      });
      expect(code).toBe(0);
      expect(git.calls).toHaveLength(0);
    });

    it("コンテンツフォルダが決まりに合わなければ 1 を返す", () => {
      const cwd = makeCwd();
      writeFiles(join(cwd, "content"), { ...validFiles, "メモ.txt": "" });
      const { code, lines } = prepare({ cwd });
      expect(code).toBe(1);
      expect(lines.join("\n")).toContain("content/メモ.txt");
    });

    it("コンテンツフォルダがなければ、CONTENT_DIR で保管庫を指すよう案内して 1 を返す", () => {
      const { code, lines } = prepare();
      expect(code).toBe(1);
      expect(lines.join("\n")).toContain("CONTENT_DIR");
    });
  });
});
