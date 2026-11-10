// 画面の画像を撮る・比べる Playwright を、Playwright 公式の Docker イメージの中で走らせる。
// docs/design.md の「画面の画像は、Playwright 公式の Docker イメージで撮って比べる」
//
// 使い方：node scripts/playwright-docker.mjs [Playwright に渡す引数...]
//   npm run screenshots -- e2e/home-placeholder.spec.ts のように、後ろの引数はそのまま渡す
//
// - 環境変数 CI があるとき（CI ではすでにこのイメージのコンテナの中）は、Docker を起動せずにそのまま走らせる
// - Windows の Git Bash から docker を呼ぶとパスが書き換えられる（MSYS）ので、
//   シェルを通さずに child_process から docker を直接起動する
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit", ...options });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

if (process.env.CI) {
  const cli = resolve(root, "node_modules/@playwright/test/cli.js");
  process.exit(run(process.execPath, [cli, "test", ...args], { cwd: root }));
}

// イメージのタグは、入れた Playwright と同じバージョンにする（違うとブラウザが見つからない）
const { version } = JSON.parse(
  readFileSync(resolve(root, "node_modules/@playwright/test/package.json"), "utf8"),
);
const image = `mcr.microsoft.com/playwright:v${version}-noble`;

// node_modules と .next は、フォルダごとの名前つきボリュームに分ける。
// Windows で入れた node_modules は Linux で動かず、手元の .next とも混ざらないようにするため。
// worktree で並べても混ざらないよう、名前にフォルダの場所から作った値を入れる
const id = createHash("sha256").update(root).digest("hex").slice(0, 12);
const work = "/work";

// package-lock.json が前回と同じなら npm ci を飛ばす（毎回入れ直すと遅いため）
const inner = [
  "stamp=node_modules/.package-lock.stamp",
  'if ! cmp -s package-lock.json "$stamp"; then npm ci && cp package-lock.json "$stamp"; fi',
  'exec npx playwright test "$@"',
].join(" && ");

const dockerArgs = [
  "run",
  "--rm",
  "--init",
  "--ipc=host",
  "--mount",
  `type=bind,source=${root},target=${work}`,
  "--mount",
  `type=volume,source=md-leaf-${id}-node_modules,target=${work}/node_modules`,
  "--mount",
  `type=volume,source=md-leaf-${id}-next,target=${work}/.next`,
  "--workdir",
  work,
  "--env",
  "NEXT_TELEMETRY_DISABLED=1",
  "--env",
  "NPM_CONFIG_UPDATE_NOTIFIER=false",
  ...(process.env.PORT ? ["--env", `PORT=${process.env.PORT}`] : []),
  ...(process.stdout.isTTY ? ["-t"] : []),
  image,
  "sh",
  "-c",
  inner,
  "sh",
  ...args,
];

process.exit(run("docker", dockerArgs));
