// コンテンツフォルダが docs/content-rules.md の決まりに合うかを検査する。
// `npm run check:content -- <フォルダ>` から呼ぶ。合わないものがあれば一覧を出して exit 1 で終える。
// 決まりの理由は docs/design.md の「保管庫には決まりに合うものだけを置く」
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";
// 分類の名前は、アプリの一覧の並び（src/lib/notes.ts）と同じ1か所から読む
import categories from "../src/lib/note-categories.json" with { type: "json" };

export const RULES = {
  fileType: "ノート（.md）と画像（png・jpg・jpeg・gif・webp・svg）以外は置かない",
  topLevel: "一番上には index.md と、資格・実践・基礎・スポットのフォルダだけを置く",
  courseCategoryFile: "資格・実践・基礎の直下には教材のフォルダだけを置く",
  themeCategoryFile: "スポットの直下にはテーマのフォルダだけを置く",
  noHome: "一番上にホームの index.md を置く",
  homeLink: "index.md から、この教材の入口へのリンクを置く",
  noEntry: "教材のフォルダに入口（index_<教材名>.md）を置く",
  manyEntries: "教材の入口（index_ で始まる .md）は1つだけにする",
  noGuide: "教材のフォルダに学習ガイド（00_ガイド.md）を置く",
  chapterGap: "章の番号は 01 から抜けなく続ける。抜けている番号",
  chapterDuplicate: "章の番号を重ねない",
  notChapter: "章でないノートと画像は、教材のフォルダの下のフォルダに置く",
  noTitle: "フロントマターに空でない title を書く",
  brokenLink: "リンク先のノートがない",
  brokenImage: "画像のファイルがない",
  wikiLink: "[[ ]]・![[ ]] は表示できないので、ふつうのリンク・画像に直す",
};

const HOME_FILE = "index.md";
const GUIDE_FILE = "00_ガイド.md";
const NOTE_EXTENSION = ".md";
// docs/design.md の「保管庫には決まりに合うものだけを置く」
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const CHAPTER = /^(\d{2})_.+\.md$/;
const SCHEME = /^[a-z][a-z\d+.-]*:/i;
// コードなどの中の [[ は表示に関わらないので、その範囲を伏せてから探す
const MASKED_NODES = new Set(["code", "inlineCode", "math", "inlineMath", "yaml"]);

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter).use(remarkMath);

function isImage(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 && IMAGE_EXTENSIONS.has(name.slice(dot + 1).toLowerCase());
}

function isNote(name) {
  return name.endsWith(NOTE_EXTENSION);
}

function childPath(parent, name) {
  return parent === "" ? name : `${parent}/${name}`;
}

/**
 * フォルダの中を集める。「.」で始まるものは飛ばし、ノート・画像以外は problems に入れる。どちらも中は見ない
 * @returns {{ name: string, path: string, isDir: boolean }[]} 名前の順
 */
function listEntries(root, path, problems) {
  const entries = readdirSync(join(root, ...path.split("/").filter(Boolean)), {
    withFileTypes: true,
  })
    .map((entry) => ({
      name: entry.name,
      path: childPath(path, entry.name),
      isDir: entry.isDirectory(),
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return entries.filter((entry) => {
    if (entry.name.startsWith(".")) return false;
    if (!entry.isDir && !isNote(entry.name) && !isImage(entry.name)) {
      problems.push({ file: entry.path, rule: RULES.fileType });
      return false;
    }
    return true;
  });
}

function collectFiles(root, path, problems, notes, images) {
  for (const entry of listEntries(root, path, problems)) {
    if (entry.isDir) collectFiles(root, entry.path, problems, notes, images);
    else if (isNote(entry.name)) notes.push(entry.path);
    else images.push(entry.path);
  }
}

function checkCourse(root, folder, problems, notes, images) {
  const entries = listEntries(root, folder, problems);
  const files = entries.filter((entry) => !entry.isDir);

  const entryNotes = files.filter((f) => f.name.startsWith("index_") && isNote(f.name));
  if (entryNotes.length === 0) problems.push({ file: folder, rule: RULES.noEntry });
  if (entryNotes.length > 1) {
    for (const f of entryNotes) problems.push({ file: f.path, rule: RULES.manyEntries });
  }
  if (!files.some((f) => f.name === GUIDE_FILE)) {
    problems.push({ file: folder, rule: RULES.noGuide });
  }

  const byNumber = new Map();
  for (const f of files) {
    if (entryNotes.includes(f) || f.name === GUIDE_FILE) continue;
    const match = CHAPTER.exec(f.name);
    const number = match ? Number(match[1]) : 0;
    if (number === 0) {
      problems.push({ file: f.path, rule: RULES.notChapter });
      continue;
    }
    byNumber.set(number, [...(byNumber.get(number) ?? []), f]);
  }
  const max = Math.max(0, ...byNumber.keys());
  const gaps = [];
  for (let n = 1; n <= max; n++) {
    if (!byNumber.has(n)) gaps.push(String(n).padStart(2, "0"));
  }
  if (gaps.length > 0) {
    problems.push({ file: folder, rule: `${RULES.chapterGap}（${gaps.join("・")}）` });
  }
  for (const same of byNumber.values()) {
    if (same.length > 1) {
      for (const f of same) problems.push({ file: f.path, rule: RULES.chapterDuplicate });
    }
  }

  for (const entry of entries) {
    if (entry.isDir) collectFiles(root, entry.path, problems, notes, images);
    else if (isNote(entry.name)) notes.push(entry.path);
    else images.push(entry.path);
  }
  return entryNotes.length === 1 ? entryNotes[0].path : undefined;
}

function hasTitle(tree) {
  const first = tree.children[0];
  if (first?.type !== "yaml") return false;
  let data;
  try {
    data = parseYaml(first.value);
  } catch {
    return false;
  }
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.title === "string" &&
    data.title.trim() !== ""
  );
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// リンク・画像の先の決め方は、アプリの src/lib/note-links.ts（resolveNoteLink）・
// src/lib/note-images.ts（resolveImageSrc）と同じにする。.mjs から .ts を読めないので書き写しており、
// アプリの決め方を変えたらここも合わせる（ずれると、アプリでは切れていないリンクを検査が止める、またはその逆になる）。
// mdast の url は符号化される前の形だが、部分ごとに decode すればアプリ（hast の符号化された href を decode）と同じパスになる
// 対象でなければ undefined、コンテンツフォルダの外なら null を返す
function resolveTarget(url, fromFile) {
  if (SCHEME.test(url) || url.startsWith("/") || url.startsWith("#")) return undefined;
  const rawPath = url.split(/[#?]/, 1)[0] ?? "";
  const decoded = rawPath.split("/").map(decodeSegment).join("/");
  const joined = posix.join(posix.dirname(fromFile), decoded);
  return { decoded, path: joined.startsWith("../") ? null : joined };
}

function visit(node, fn) {
  fn(node);
  if (node.children) for (const child of node.children) visit(child, fn);
}

function checkNote(file, source, noteSet, imageSet, problems) {
  const tree = parser.parse(source);
  if (!hasTitle(tree)) problems.push({ file, rule: RULES.noTitle });

  const masked = source.split("");
  visit(tree, (node) => {
    if (MASKED_NODES.has(node.type) && node.position) {
      for (let i = node.position.start.offset; i < node.position.end.offset; i++) {
        if (masked[i] !== "\n") masked[i] = " ";
      }
    }
    if (node.type === "link") {
      const target = resolveTarget(node.url, file);
      if (target && target.decoded.endsWith(NOTE_EXTENSION)) {
        if (target.path === null || !noteSet.has(target.path)) {
          problems.push({ file, rule: `${RULES.brokenLink}（${node.url}）` });
        }
      }
    }
    if (node.type === "image") {
      const target = resolveTarget(node.url, file);
      if (target && (target.path === null || !imageSet.has(target.path))) {
        problems.push({ file, rule: `${RULES.brokenImage}（${node.url}）` });
      }
    }
  });

  const text = masked.join("");
  for (const hit of text.matchAll(/\[\[/g)) {
    const line = text.slice(0, hit.index).split("\n").length;
    problems.push({ file, rule: `${RULES.wikiLink}（${line} 行目）` });
  }
}

/**
 * コンテンツフォルダを検査し、決まりに合わないものを返す
 * @param {string} root コンテンツフォルダ
 * @returns {{ file: string, rule: string }[]} file はコンテンツフォルダからのパス。file の順
 */
export function checkContent(root) {
  const problems = [];
  const notes = [];
  const images = [];
  const entryNotes = [];

  for (const entry of listEntries(root, "", problems)) {
    if (entry.isDir && categories.courseCategories.includes(entry.name)) {
      for (const child of listEntries(root, entry.path, problems)) {
        if (!child.isDir) {
          problems.push({ file: child.path, rule: RULES.courseCategoryFile });
          continue;
        }
        const entryNote = checkCourse(root, child.path, problems, notes, images);
        if (entryNote) entryNotes.push(entryNote);
      }
    } else if (entry.isDir && categories.themeCategories.includes(entry.name)) {
      // テーマのフォルダの中は単発の資料なので、入口・ガイド・番号を見ない（ホームからのリンクも要らない）
      for (const child of listEntries(root, entry.path, problems)) {
        if (child.isDir) collectFiles(root, child.path, problems, notes, images);
        else problems.push({ file: child.path, rule: RULES.themeCategoryFile });
      }
    } else if (entry.name === HOME_FILE && !entry.isDir) {
      notes.push(entry.path);
    } else {
      problems.push({ file: entry.path, rule: RULES.topLevel });
    }
  }

  const noteSet = new Set(notes);
  const imageSet = new Set(images);
  if (!noteSet.has(HOME_FILE)) {
    problems.push({ file: HOME_FILE, rule: RULES.noHome });
  } else {
    const linked = new Set();
    visit(parser.parse(readFileSync(join(root, HOME_FILE), "utf8")), (node) => {
      if (node.type !== "link") return;
      const target = resolveTarget(node.url, HOME_FILE);
      if (target?.path) linked.add(target.path);
    });
    for (const entryNote of entryNotes) {
      if (!linked.has(entryNote)) problems.push({ file: entryNote, rule: RULES.homeLink });
    }
  }

  for (const file of notes) {
    checkNote(
      file,
      readFileSync(join(root, ...file.split("/")), "utf8"),
      noteSet,
      imageSet,
      problems,
    );
  }

  // 同じファイルの中は見つけた順のまま、ファイルの順に並べる
  return problems.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
}

/**
 * 引数のフォルダ（なければ CONTENT_DIR、それもなければ content/）を検査し、合わないものを出す
 * @param {{ args: string[], env: Record<string, string | undefined>, cwd: string, error: (line: string) => void }} options
 * @returns {number} 終わりのコード。合わないもの・フォルダがなければ 1
 */
export function runCheck({ args, env, cwd, error }) {
  const given = args[0] || env.CONTENT_DIR || "content";
  // 出すときは指定されたままの書き方にする（末尾の区切りだけ外す）
  const label = given.replace(/[\\/]+$/, "") || given;
  const root = resolve(cwd, given);
  if (!existsSync(root)) {
    error(`${label} がありません`);
    return 1;
  }
  const problems = checkContent(root);
  if (problems.length === 0) return 0;
  error(`${label} に決まりに合わないものがあります（決まりは docs/content-rules.md）:`);
  for (const { file, rule } of problems) error(`  ${label}/${file}  ${rule}`);
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = runCheck({
    args: process.argv.slice(2),
    env: process.env,
    cwd: process.cwd(),
    error: (line) => console.error(line),
  });
}
