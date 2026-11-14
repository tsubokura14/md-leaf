// `npm run build` の最初に、コンテンツフォルダを用意して検査する。失敗したら exit 1 で終え、next build に進ませない。
// 流れの理由は docs/design.md の「ノートはビルドの最初に保管庫から取ってくる」
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { runCheck } from "./check-content.mjs";

const CONTENT = "content";
// 保管庫を取る一時のフォルダと、保管庫の中のコンテンツフォルダ。
// notes/ だけを content/ に移す理由は docs/design.md の「ノートはビルドの最初に保管庫から取ってくる」
const VAULT_DIR = ".vault";
const VAULT_NOTES = "notes";

/**
 * 保管庫を cwd の .vault/ に取り、その中の notes/ を content/ に移す
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

  const content = join(cwd, CONTENT);
  const target = join(cwd, VAULT_DIR);
  // ビルドのキャッシュなどに前の content/・.vault/ が残っていても、保管庫の今の中身だけにする
  rmSync(content, { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
  log(`保管庫 ${repo} を取り、${VAULT_NOTES}/ を ${CONTENT}/ にします`);
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
  const notes = join(target, VAULT_NOTES);
  const found = existsSync(notes);
  // .git は notes/ の外にあるので、移したあとに一時のフォルダごと消せば、出力に履歴も入らない
  if (found) renameSync(notes, content);
  rmSync(target, { recursive: true, force: true });
  if (!found) {
    error(
      `保管庫に ${VAULT_NOTES}/ フォルダがありません（${repo}。コンテンツは notes/ の下に置く。docs/content-rules.md）`,
    );
    return false;
  }
  return true;
}

/**
 * Vercel のビルドなら保管庫の notes/ を content/ に取り、どこでもコンテンツフォルダを検査する
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
