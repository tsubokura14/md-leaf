import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkContent, RULES, runCheck } from "./check-content.mjs";

const dirs = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const note = (title, body = "") => `---\ntitle: ${title}\n---\n\n${body}\n`;

// 決まりに合う最小の content/。テストごとに足す・消すで、合わない形を作る
function validContent() {
  return {
    "index.md": note("ホーム", "- [Docker 入門](<資格/Docker 入門/index_Docker入門.md>)"),
    "資格/Docker 入門/index_Docker入門.md": note("Docker 入門"),
    "資格/Docker 入門/00_ガイド.md": note("ガイド"),
    "資格/Docker 入門/01_はじめに.md": note("はじめに"),
    "資格/Docker 入門/02_イメージ.md": note("イメージ"),
    "資格/Docker 入門/図/構成.svg": "<svg></svg>",
    "資格/Docker 入門/演習/02_問題_パート1.md": note("問題1"),
    "資格/Docker 入門/演習/02_問題_パート2.md": note("問題2"),
    "スポット/GCP/gcloud の認証.md": note("gcloud の認証", "![画面](詳しく/画面.png)"),
    "スポット/GCP/詳しく/画面.png": "png",
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
    it("「.」で始まるファイル・フォルダは、どの階層でも中を見ずに飛ばす", () => {
      expect(
        check({
          ".gitignore": "content/",
          ".obsidian/app.json": "{}",
          "資格/Docker 入門/.claude/construction-plan.md": "[[計画]]",
          "資格/Docker 入門/図/.DS_Store": "",
        }),
      ).toEqual([]);
    });

    it("ノートと画像以外のファイルを見つける", () => {
      expect(check({ "資格/Docker 入門/図/元データ.pdf": "pdf" })).toEqual([
        { file: "資格/Docker 入門/図/元データ.pdf", rule: RULES.fileType },
      ]);
    });

    it("大文字の拡張子の画像は通る", () => {
      expect(
        check({
          "資格/Docker 入門/図/画面.PNG": "png",
          "資格/Docker 入門/01_はじめに.md": note("はじめに", "![画面](図/画面.PNG)"),
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

    it("資格・実践・基礎・スポット以外のフォルダを見つける", () => {
      expect(check({ "Docker 入門/01_はじめに.md": note("はじめに") })).toEqual([
        { file: "Docker 入門", rule: RULES.topLevel },
      ]);
    });

    it("4つの分類はないものがあってもよい（資格とスポットだけでも通る）", () => {
      expect(check()).toEqual([]);
    });

    it("index.md がなければ見つける", () => {
      expect(check({ "index.md": null })).toEqual([{ file: "index.md", rule: RULES.noHome }]);
    });

    it("index.md から入口へのリンクがない教材を見つける", () => {
      expect(
        check({
          "実践/Git 入門/index_Git入門.md": note("Git 入門"),
          "実践/Git 入門/00_ガイド.md": note("ガイド"),
          "実践/Git 入門/01_はじめに.md": note("はじめに"),
        }),
      ).toEqual([{ file: "実践/Git 入門/index_Git入門.md", rule: RULES.homeLink }]);
    });
  });

  describe("資格・実践・基礎", () => {
    it("直下のファイルを見つける", () => {
      expect(check({ "資格/メモ.md": note("メモ"), "基礎/図.png": "png" })).toEqual([
        { file: "基礎/図.png", rule: RULES.courseCategoryFile },
        { file: "資格/メモ.md", rule: RULES.courseCategoryFile },
      ]);
    });

    it("実践・基礎の教材も、教材の決まりで検査する", () => {
      expect(check({ "基礎/Linux 入門/01_はじめに.md": note("はじめに") })).toEqual([
        { file: "基礎/Linux 入門", rule: RULES.noEntry },
        { file: "基礎/Linux 入門", rule: RULES.noGuide },
      ]);
    });
  });

  describe("スポット", () => {
    it("直下のファイルを見つける", () => {
      expect(check({ "スポット/メモ.md": note("メモ") })).toEqual([
        { file: "スポット/メモ.md", rule: RULES.themeCategoryFile },
      ]);
    });

    it("テーマのフォルダの中は、入口・ガイド・番号なしで、どの深さにも置ける", () => {
      expect(
        check({
          "スポット/AWS/メモ.md": note("メモ"),
          "スポット/AWS/a/b/c/深いメモ.md": note("深いメモ", "[戻る](../../../メモ.md)"),
        }),
      ).toEqual([]);
    });

    it("テーマのフォルダの中でも、種類・title・リンク切れ・[[ ]] を見つける", () => {
      expect(
        check({
          "スポット/GCP/元データ.pdf": "pdf",
          "スポット/GCP/gcloud の認証.md": "# 認証\n\n[ない](ない.md) [[x]]\n",
        }),
      ).toEqual([
        { file: "スポット/GCP/gcloud の認証.md", rule: RULES.noTitle },
        { file: "スポット/GCP/gcloud の認証.md", rule: `${RULES.brokenLink}（ない.md）` },
        { file: "スポット/GCP/gcloud の認証.md", rule: `${RULES.wikiLink}（3 行目）` },
        { file: "スポット/GCP/元データ.pdf", rule: RULES.fileType },
      ]);
    });
  });

  describe("教材のフォルダ", () => {
    it("入口がなければ見つける", () => {
      expect(
        check({ "index.md": note("ホーム"), "資格/Docker 入門/index_Docker入門.md": null }),
      ).toEqual([{ file: "資格/Docker 入門", rule: RULES.noEntry }]);
    });

    it("入口が2つあれば、両方を見つける", () => {
      expect(check({ "資格/Docker 入門/index_別.md": note("別") })).toEqual([
        { file: "資格/Docker 入門/index_Docker入門.md", rule: RULES.manyEntries },
        { file: "資格/Docker 入門/index_別.md", rule: RULES.manyEntries },
      ]);
    });

    it("ガイドがなければ見つける", () => {
      expect(check({ "資格/Docker 入門/00_ガイド.md": null })).toEqual([
        { file: "資格/Docker 入門", rule: RULES.noGuide },
      ]);
    });

    it("章の番号の抜けを見つける", () => {
      expect(check({ "資格/Docker 入門/04_ネットワーク.md": note("ネットワーク") })).toEqual([
        { file: "資格/Docker 入門", rule: `${RULES.chapterGap}（03）` },
      ]);
    });

    it("01 から始まらない章を見つける", () => {
      expect(check({ "資格/Docker 入門/01_はじめに.md": null })).toEqual([
        { file: "資格/Docker 入門", rule: `${RULES.chapterGap}（01）` },
      ]);
    });

    it("章の番号の重なりを見つける", () => {
      expect(check({ "資格/Docker 入門/02_コンテナ.md": note("コンテナ") })).toEqual([
        { file: "資格/Docker 入門/02_イメージ.md", rule: RULES.chapterDuplicate },
        { file: "資格/Docker 入門/02_コンテナ.md", rule: RULES.chapterDuplicate },
      ]);
    });

    it("直下の章でないノートと画像を見つける", () => {
      expect(
        check({
          "資格/Docker 入門/メモ.md": note("メモ"),
          "資格/Docker 入門/構成.png": "png",
        }),
      ).toEqual([
        { file: "資格/Docker 入門/メモ.md", rule: RULES.notChapter },
        { file: "資格/Docker 入門/構成.png", rule: RULES.notChapter },
      ]);
    });
  });

  describe("title", () => {
    it("フロントマターがないノートを見つける", () => {
      expect(check({ "資格/Docker 入門/01_はじめに.md": "# はじめに\n" })).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });

    it("title がないノートを見つける", () => {
      expect(check({ "資格/Docker 入門/01_はじめに.md": "---\ntags: [a]\n---\n" })).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });

    it("title が空のノートを見つける", () => {
      expect(check({ "資格/Docker 入門/01_はじめに.md": '---\ntitle: " "\n---\n' })).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: RULES.noTitle },
      ]);
    });
  });

  describe("リンク切れ", () => {
    const withBody = (body) => check({ "資格/Docker 入門/01_はじめに.md": note("はじめに", body) });

    it("ある先へのリンクと、# つきのリンクは通る", () => {
      expect(
        withBody("[次](02_イメージ.md) [見出し](./02_イメージ.md#手順) [外](https://x.test/a.md)"),
      ).toEqual([]);
    });

    it("ない先へのリンクを見つける", () => {
      expect(withBody("[次](03_ない.md)")).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: `${RULES.brokenLink}（03_ない.md）` },
      ]);
    });

    it("content/ の外を指すリンクを見つける", () => {
      expect(withBody("[外](../../README.md)")).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: `${RULES.brokenLink}（../../README.md）` },
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
        { file: "資格/Docker 入門/01_はじめに.md", rule: `${RULES.brokenImage}（図/ない.svg）` },
      ]);
    });
  });

  describe("表示できない書き方", () => {
    const withBody = (body) => check({ "資格/Docker 入門/01_はじめに.md": note("はじめに", body) });

    it("本文の [[ ]] と ![[ ]] を、行の番号つきで見つける", () => {
      expect(withBody("[[02_イメージ]] を読む\n\n![[構成.svg]]")).toEqual([
        { file: "資格/Docker 入門/01_はじめに.md", rule: `${RULES.wikiLink}（5 行目）` },
        { file: "資格/Docker 入門/01_はじめに.md", rule: `${RULES.wikiLink}（7 行目）` },
      ]);
    });

    it("コードブロック・インラインコード・数式の中の [[ ]] は見つけない", () => {
      expect(withBody("```\na = [[1]]\n```\n\n`b = [[2]]`\n\n$$\n[[x]]\n$$")).toEqual([]);
    });
  });
});

describe("runCheck", () => {
  // 出した行を集めて、終わりのコードと一緒に返す
  function run({ args = [], env = {}, cwd = tmpdir() } = {}) {
    const lines = [];
    const code = runCheck({ args, env, cwd, error: (line) => lines.push(line) });
    return { code, lines };
  }

  const broken = () => makeContent({ ...validContent(), "資格/Docker 入門/00_ガイド.md": null });

  it("引数のフォルダを検査し、合わないものを <フォルダ>/<ファイル> の形で出して 1 を返す", () => {
    const { code, lines } = run({ args: [broken()], env: { CONTENT_DIR: "ない" } });
    expect(code).toBe(1);
    expect(lines.slice(1)).toEqual([`  ${dirs.at(-1)}/資格/Docker 入門  ${RULES.noGuide}`]);
  });

  it("引数がなければ CONTENT_DIR を検査する", () => {
    const dir = broken();
    expect(run({ env: { CONTENT_DIR: `${dir}/` } }).lines.slice(1)).toEqual([
      `  ${dir}/資格/Docker 入門  ${RULES.noGuide}`,
    ]);
  });

  it("引数も CONTENT_DIR もなければ、cwd の content/ を検査する", () => {
    const cwd = mkdtempSync(join(tmpdir(), "check-content-cwd-"));
    dirs.push(cwd);
    mkdirSync(join(cwd, "content"));
    writeFileSync(join(cwd, "content", "メモ.txt"), "");
    expect(run({ cwd }).lines.slice(1)).toEqual([
      `  content/index.md  ${RULES.noHome}`,
      `  content/メモ.txt  ${RULES.fileType}`,
    ]);
  });

  it("合うフォルダなら、何も出さずに 0 を返す", () => {
    expect(run({ args: [makeContent(validContent())] })).toEqual({ code: 0, lines: [] });
  });

  it("フォルダがなければ、そう出して 1 を返す", () => {
    const missing = join(tmpdir(), "check-content-ない");
    const { code, lines } = run({ args: [missing] });
    expect(code).toBe(1);
    expect(lines).toEqual([`${missing} がありません`]);
  });
});
