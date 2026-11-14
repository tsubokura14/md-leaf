// `npm run build` の最初に、コンテンツフォルダを用意して検査する。失敗したら exit 1 で終え、next build に進ませない。
// 流れの理由は docs/design.md の「ノートはビルドの最初に保管庫から取ってくる」
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { runCheck } from "./check-content.mjs";

const CONTENT = "content";

/**
 * 保管庫を cwd の content/ に取る
 * @returns {boolean} 取れたか
 */
function fetchVault({ env, cwd, run, log, error }) {
  const repo = env.VAULT_REPO;
  const token = env.VAULT_TOKEN;
  const missing = [!repo && "VAULT_REPO", !token && "VAULT_TOKEN"].filter(Boolean);
  if (missing.length > 0) {
    error(
      `保管庫を取るための環境変数 ${missing.join("・")} がありません（Vercel の環境変数に入れる。docs/vault.md）`,
    );
    return false;
  }

  const target = join(cwd, CONTENT);
  // ビルドのキャッシュなどに前の content/ が残っていても、保管庫の今の中身だけにする
  rmSync(target, { recursive: true, force: true });
  log(`保管庫 ${repo} を ${CONTENT}/ に取ります`);
  // 鍵は URL にも引数にも入れない（ログ・プロセスの一覧・.git/config に残さないため）。
  // GIT_CONFIG_* の環境変数で、github.com への通信にだけ Basic の認証のヘッダーを付ける（actions/checkout と同じ形）。
  // GIT_TERMINAL_PROMPT=0 で、鍵が効かないときに入力を待たずに失敗させる
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  const result = run(
    "git",
    ["clone", "--depth", "1", "--branch", "main", `https://github.com/${repo}.git`, target],
    {
      stdio: "inherit",
      env: {
        ...env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
      },
    },
  );
  if (result.error || result.status !== 0) {
    // 文言に鍵を入れない
    error(
      `保管庫 ${repo} を取れませんでした。VAULT_TOKEN の期限・権限と、VAULT_REPO の名前を確かめてください（docs/vault.md）`,
    );
    return false;
  }
  // サーバーの出力（outputFileTracingIncludes の content/**）に履歴を入れないため
  rmSync(join(target, ".git"), { recursive: true, force: true });
  return true;
}

/**
 * Vercel のビルドなら保管庫を content/ に取り、どこでもコンテンツフォルダを検査する
 * @param {{
 *   env: Record<string, string | undefined>,
 *   cwd: string,
 *   run: (command: string, args: string[], options: object) => { status: number | null, error?: Error },
 *   log: (line: string) => void,
 *   error: (line: string) => void,
 * }} options run はコマンドを実行する関数（spawnSync と同じ形。テストで差し替える）
 * @returns {number} 終わりのコード。失敗なら 1
 */
export function prepareContent({ env, cwd, run, log, error }) {
  // 取るのは Vercel のビルド（VERCEL がある）だけ。Vercel で鍵がないときに必ず失敗させ、
  // 手元・CI・画面のテスト（npx next build を直接呼ぶ）では保管庫を読まないため
  const onVercel = Boolean(env.VERCEL);
  if (onVercel && !fetchVault({ env, cwd, run, log, error })) return 1;

  // Vercel では取った content/ を、それ以外では CONTENT_DIR（なければ content/）を検査する
  const args = onVercel ? [CONTENT] : [];
  if (!existsSync(resolve(cwd, args[0] || env.CONTENT_DIR || CONTENT))) {
    runCheck({ args, env, cwd, error });
    error(
      "手元では、保管庫のフォルダを環境変数 CONTENT_DIR で指してください（例：.env.local に CONTENT_DIR=../learning-vault）",
    );
    return 1;
  }
  return runCheck({ args, env, cwd, error });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // next build と同じく .env.local などを読む。手元で CONTENT_DIR を .env.local に書いたとき、
  // 検査と next build が同じフォルダを見るため（@next/env は next に入っているもの）
  nextEnv.loadEnvConfig(process.cwd());
  process.exitCode = prepareContent({
    env: process.env,
    cwd: process.cwd(),
    run: spawnSync,
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  });
}
