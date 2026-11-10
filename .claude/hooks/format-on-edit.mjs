// 編集したあと（.claude/settings.json の PostToolUse、matcher は Edit|Write）に、編集したファイルだけを整形する
// - Prettier（--write）と、JS・TS には ESLint（--fix）をかける。対象でない種類（.md、画像など）では何もしない
// - 何があっても exit 0 で終える（作業を止めない）。Lint のエラーは npm run lint と CI で見る
// - npx を使わず、node_modules の中の起動ファイルを node で直接起動する（Windows では .cmd を shell なしで起動できないため）
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PRETTIER_ONLY = new Set([".css", ".json"]);
const PRETTIER_AND_ESLINT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx"]);

const BINS = {
  prettier: (file) => [
    "node_modules/prettier/bin/prettier.cjs",
    "--write",
    "--log-level",
    "silent",
    file,
  ],
  eslint: (file) => ["node_modules/eslint/bin/eslint.js", "--fix", "--no-warn-ignored", file],
};

// file にかける道具の名前（"prettier"・"eslint"）。かけないときは空
// exists はファイルがあるかを確かめる関数（テストで差し替える）。もうないファイルには何もかけない
export function toolsFor(file, root, exists = fs.existsSync) {
  if (typeof file !== "string" || file === "") return [];
  const abs = path.resolve(root, file);
  const rel = path.relative(root, abs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return [];
  const ext = path.extname(file).toLowerCase();
  let tools = [];
  if (PRETTIER_AND_ESLINT.has(ext)) tools = ["prettier", "eslint"];
  else if (PRETTIER_ONLY.has(ext)) tools = ["prettier"];
  if (tools.length === 0 || !exists(abs)) return [];
  return tools;
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  let file;
  try {
    file = JSON.parse(readStdin())?.tool_input?.file_path;
  } catch {
    return;
  }
  const tools = toolsFor(file, root);
  if (tools.length === 0) return;
  for (const tool of tools) {
    try {
      // cwd をリポジトリにして、.prettierrc.json・.prettierignore・eslint.config.mjs を読ませる
      execFileSync(process.execPath, BINS[tool](path.resolve(root, file)), {
        cwd: root,
        stdio: "ignore",
        timeout: 60_000,
      });
    } catch {
      // 整形できない・Lint のエラーが残る、は作業を止めずに続ける
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch {
    // 何があっても止めない
  }
  process.exit(0);
}
