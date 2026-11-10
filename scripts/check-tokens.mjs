// トークンファイル以外の .css から、トークンにない値（色コード・rgb()/hsl()・px）を見つける。
// `npm run lint` から呼ぶ。見つかれば一覧を出して exit 1 で終える。
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_FILE = "src/styles/tokens.css";
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
]);

const OFF_TOKEN = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(|\b\d*\.?\d+px\b/g;
// 宣言（`名前: 値;` か `名前: 値}`）の値だけを見る。セレクタ（`a:hover {`、`#main {`）は対象にしない
const DECLARATION = /[-\w]+\s*:([^;{}]*)(?=[;}])/g;

/**
 * CSS の中身から、トークンにない値を見つける
 * @param {string} css
 * @returns {{ line: number, value: string }[]}
 */
export function findOffTokenValues(css) {
  // 行の番号がずれないよう、コメントは改行だけを残して消す
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const found = [];
  for (const decl of text.matchAll(DECLARATION)) {
    const valueStart = decl.index + decl[0].length - decl[1].length;
    for (const hit of decl[1].matchAll(OFF_TOKEN)) {
      const offset = valueStart + hit.index;
      const line = text.slice(0, offset).split("\n").length;
      found.push({ line, value: hit[0] });
    }
  }
  return found;
}

function listCssFiles(dir, root) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...listCssFiles(join(dir, entry.name), root));
    } else if (entry.name.endsWith(".css")) {
      files.push(relative(root, join(dir, entry.name)).split(sep).join("/"));
    }
  }
  return files;
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const problems = [];
  for (const file of listCssFiles(root, root)) {
    if (file === TOKEN_FILE) continue;
    for (const { line, value } of findOffTokenValues(readFileSync(join(root, file), "utf8"))) {
      problems.push(`${file}:${line}  ${value}`);
    }
  }
  if (problems.length > 0) {
    console.error(`トークンにない値があります（値は ${TOKEN_FILE} にだけ書く）:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
