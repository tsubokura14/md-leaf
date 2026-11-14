import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkContent, RULES } from "./check-content.mjs";

const dirs = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const note = (title, body = "") => `---\ntitle: ${title}\n---\n\n${body}\n`;

// 決まりに合う最小の content/。テストごとに足す・消すで、合わない形を作る
function validContent() {
  return {
    "index.md": note("ホーム", "- [Docker 入門](<Docker 入門/index_Docker入門.md>)"),
    "Docker 入門/index_Docker入門.md": note("Docker 入門"),
    "Docker 入門/00_ガイド.md": note("ガイド"),
    "Docker 入門/01_はじめに.md": note("はじめに"),
    "Docker 入門/02_イメージ.md": note("イメージ"),
    "Docker 入門/図/構成.svg": "<svg></svg>",
    "Docker 入門/演習/02_問題_パート1.md": note("問題1"),
    "Docker 入門/演習/02_問題_パート2.md": note("問題2"),
  };
}

function makeContent(files) {
  const dir = mkdtempSync(join(tmpdir(), "check-content-"));
  dirs.push(dir);
  for (const [path, body] of Object.entries(files)) {
    if (body === null) continue;
    const file = join(dir, ...path.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  return dir;
}

function check(changes = {}) {
  return checkContent(makeContent({ ...validContent(), ...changes }));
}

describe("checkContent", () => {
  it("決まりに合う content/ なら、何も見つけない", () => {
    expect(check()).toEqual([]);
  });

  describe("置いてよいもの", () => {
    it("「.」で始まるフォルダは、中を見ずに1つだけ見つける", () => {
      expect(
        check({
          "Docker 入門/.claude/construction-plan.md": "計画",
          "Docker 入門/.claude/memo.txt": "メモ",
        }),
      ).toEqual([{ file: "Docker 入門/.claude", rule: RULES.hidden }]);
    });

    it("「.」で始まるファイルを見つける", () => {
      expect(check({ ".gitkeep": "" })).toEqual([{ file: ".gitkeep", rule: RULES.hidden }]);
    });

    it("ノートと画像以外のファイルを見つける", () => {
      expect(check({ "Docker 入門/図/元データ.pdf": "pdf" })).toEqual([
        { file: "Docker 入門/図/元データ.pdf", rule: RULES.fileType },
      ]);
    });

    it("大文字の拡張子の画像は通る", () => {
      expect(
        check({
          "Docker 入門/図/画面.PNG": "png",
          "Docker 入門/01_はじめに.md": note("はじめに", "![画面](図/画面.PNG)"),
        }),
      ).toEqual([]);
    });
  });

  describe("一番上", () => {
    it("index.md 以外のファイルを見つける", () => {
      expect(check({ "メモ.md": note("メモ") })).toEqual([
        { file: "メモ.md", rule: RULES.topLevel },
      ]);
    });

    it("index.md がなければ見つける", () => {
      expect(check({ "index.md": null })).toEqual([{ file: "index.md", rule: RULES.noHome }]);
    });

    it("index.md から入口へのリンクがない教材を見つける", () => {
      expect(
        check({
          "Git 入門/index_Git入門.md": note("Git 入門"),
          "Git 入門/00_ガイド.md": note("ガイド"),
          "Git 入門/01_はじめに.md": note("はじめに"),
        }),
      ).toEqual([{ file: "Git 入門/index_Git入門.md", rule: RULES.homeLink }]);
    });
  });

  describe("教材のフォルダ", () => {
    it("入口がなければ見つける", () => {
      expect(
        check({ "index.md": note("ホーム"), "Docker 入門/index_Docker入門.md": null }),
      ).toEqual([{ file: "Docker 入門", rule: RULES.noEntry }]);
    });

    it("入口が2つあれば、両方を見つける", () => {
      expect(check({ "Docker 入門/index_別.md": note("別") })).toEqual([
        { file: "Docker 入門/index_Docker入門.md", rule: RULES.manyEntries },
        { file: "Docker 入門/index_別.md", rule: RULES.manyEntries },
      ]);
    });

    it("ガイドがなければ見つける", () => {
      expect(check({ "Docker 入門/00_ガイド.md": null })).toEqual([
        { file: "Docker 入門", rule: RULES.noGuide },
      ]);
    });

    it("章の番号の抜けを見つける", () => {
      expect(check({ "Docker 入門/04_ネットワーク.md": note("ネットワーク") })).toEqual([
        { file: "Docker 入門", rule: `${RULES.chapterGap}（03）` },
      ]);
    });

    it("01 から始まらない章を見つける", () => {
      expect(check({ "Docker 入門/01_はじめに.md": null })).toEqual([
        { file: "Docker 入門", rule: `${RULES.chapterGap}（01）` },
      ]);
    });

    it("章の番号の重なりを見つける", () => {
      expect(check({ "Docker 入門/02_コンテナ.md": note("コンテナ") })).toEqual([
        { file: "Docker 入門/02_イメージ.md", rule: RULES.chapterDuplicate },
        { file: "Docker 入門/02_コンテナ.md", rule: RULES.chapterDuplicate },
      ]);
    });

    it("直下の章でないノートと画像を見つける", () => {
      expect(
        check({
          "Docker 入門/メモ.md": note("メモ"),
          "Docker 入門/構成.png": "png",
        }),
      ).toEqual([
        { file: "Docker 入門/メモ.md", rule: RULES.notChapter },
        { file: "Docker 入門/構成.png", rule: RULES.notChapter },
      ]);
    });
  });

  describe("title", () => {
    it("フロントマターがないノートを見つける", () => {
      expect(check({ "Docker 入門/01_はじめに.md": "# はじめに\n" })).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });

    it("title がないノートを見つける", () => {
      expect(check({ "Docker 入門/01_はじめに.md": "---\ntags: [a]\n---\n" })).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });

    it("title が空のノートを見つける", () => {
      expect(check({ "Docker 入門/01_はじめに.md": '---\ntitle: " "\n---\n' })).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });
  });

  describe("リンク切れ", () => {
    const withBody = (body) => check({ "Docker 入門/01_はじめに.md": note("はじめに", body) });

    it("ある先へのリンクと、# つきのリンクは通る", () => {
      expect(
        withBody("[次](02_イメージ.md) [見出し](./02_イメージ.md#手順) [外](https://x.test/a.md)"),
      ).toEqual([]);
    });

    it("ない先へのリンクを見つける", () => {
      expect(withBody("[次](03_ない.md)")).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: `${RULES.brokenLink}（03_ない.md）` },
      ]);
    });

    it("content/ の外を指すリンクを見つける", () => {
      expect(withBody("[外](../../README.md)")).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: `${RULES.brokenLink}（../../README.md）` },
      ]);
    });

    it("符号化したパスのリンクは、元の名前で探す", () => {
      expect(
        withBody(
          "[演習](%E6%BC%94%E7%BF%92/02_%E5%95%8F%E9%A1%8C_%E3%83%91%E3%83%BC%E3%83%881.md)",
        ),
      ).toEqual([]);
    });

    it("ある画像は通り、ない画像を見つける", () => {
      expect(withBody("![構成](図/構成.svg)\n\n![ない](図/ない.svg)")).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: `${RULES.brokenImage}（図/ない.svg）` },
      ]);
    });
  });

  describe("表示できない書き方", () => {
    const withBody = (body) => check({ "Docker 入門/01_はじめに.md": note("はじめに", body) });

    it("本文の [[ ]] と ![[ ]] を、行の番号つきで見つける", () => {
      expect(withBody("[[02_イメージ]] を読む\n\n![[構成.svg]]")).toEqual([
        { file: "Docker 入門/01_はじめに.md", rule: `${RULES.wikiLink}（5 行目）` },
        { file: "Docker 入門/01_はじめに.md", rule: `${RULES.wikiLink}（7 行目）` },
      ]);
    });

    it("コードブロック・インラインコード・数式の中の [[ ]] は見つけない", () => {
      expect(withBody("```\na = [[1]]\n```\n\n`b = [[2]]`\n\n$$\n[[x]]\n$$")).toEqual([]);
    });
  });
});
