# ノートを学習用の保管庫（別のリポジトリ）から読んでビルドできる（#34）

## なぜ

今は、Obsidian の保管庫で作った教材を、アプリのリポジトリの `content/` へ手でコピーし、PR を出して入れている。

- コピーするたびに、保管庫とずれたり、作業ファイルが紛れ込んだりする
- 教材の更新が、アプリのリポジトリの履歴（コミット・PR）に混ざる。アプリのリポジトリは公開する予定（#35）で、教材の更新がアプリの修正に見えてしまう
- PC で書いてからスマホで読めるまでに、コピーと PR の手間がかかる

ノートの正本を学習用の保管庫（アプリとは別の非公開のリポジトリ `learning-vault`）1つにし、アプリはビルドのときにそこからノートを読む。毎日の流れを「PC の Obsidian で書く → push → 数分でスマホで読める」にする。

## 影響する今の仕様

- `docs/specs/notes.md` の「コンテンツフォルダ」（ノートの置き場所と、足し方・変え方）
- `docs/content-rules.md`（「.」で始まるものの扱い、足し方の手順、検査の流し方）
- `docs/overview.md` の技術の「ノートの置き場所」、主な機能・やらないことのうち、置き場所に関わる所
- `docs/design.md` の「`content/` をサーバーの出力に入れる」「見つからないノートは、Proxy で 404 にする」「`content/` には決まりに合うものだけを置く」
- `CLAUDE.project.md` のノートを読む場所、コマンド

## 使う場面

1. PC の Obsidian で「Python 基礎」の章の誤りを直し、保管庫で commit して push する。数分後、スマホでアプリを開き直すと、直した章が出ている。アプリのリポジトリには何も起きていない（コミットも PR もない）
2. ノートのリンク先のファイル名を書き間違えたまま push する。本番のアプリは前の版のまま変わらず、Vercel から「ビルドに失敗した」というメールが届く。手元で保管庫を検査すると、どのノートのどのリンクが切れているかが出る。直して push し直すと反映される
3. アプリの修正の PR を出すと、プレビューのアプリでも、保管庫の今のノートで画面を確かめられる

## 受け入れ条件

- 保管庫の main に push すると、PR やコピーなしに、本番のアプリに数分で反映される
- 保管庫が決まり（`docs/content-rules.md`）に合わないときは、本番に出さない。本番は前の版のまま残り、失敗したことがメールで届く
- 保管庫の一番上と教材のフォルダにある、名前が「.」で始まるもの（`.obsidian/`・`.github/`・`.gitignore`・作業ファイルの `.claude/`）は、検査で合わないものにならず、アプリにも出ない
- 保管庫の一番上に `index.md` と教材のフォルダ以外（`CLAUDE.md`・`README.md` など）があると、検査で合わないものになる（今の決まりのまま）
- 手元で、保管庫のフォルダを指定して検査できる。合わないものは今と同じ形（ファイル・どの決まりに合わないか）で出る
- 手元の `npm run dev` で、手元の保管庫のノートを読んで画面を確かめられる
- アプリのリポジトリの PR のプレビューも、保管庫のノートでビルドされる
- 保管庫を読めないとき（読むための鍵がない・期限切れ・保管庫がない）は、ビルドが失敗する。ノートが0件のアプリを本番に出さない。本番は前の版のまま残る
- アプリのリポジトリの main から `content/` がなくなる（履歴から消すのは #35）
- 画面を動かすテスト・画像を比べるテストは、今のテスト用のノート（`e2e/fixtures/`）で動き、保管庫を読まない

## 画面

画面は変わらない（ノートの読み込み元とビルドの仕方だけが変わる）。

## やらないこと

- 開いたときにノートを読む作り・データベース（ノートはビルドのときに HTML にする作りのまま）
- `[[ ]]` 記法を読むこと（保管庫の側で普通のリンクに直す）
- 保管庫の中身の片付け（リンクの変換、フォルダ名の変更、`index.md` を作るなど）。保管庫の側の作業として、人が行う（下の「保管庫の側で行うこと」）
- アプリのリポジトリの履歴から `content/` を消すこと（#35）
- 下書きの印（公開しない教材を置いておく仕組み）

## 先に要る機能

- なし（#33 の検査はもう main にある）

### 保管庫の側で行うこと（人が行う。この機能が本番で動く前に）

この PR を本番に出す前に、保管庫が検査に通る状態にしておく。通らないと、本番のビルドが失敗し続ける（前の版のまま）。

- `[[ ]]` のリンクを相対リンクに直す。md-leaf の `content/` にある5つの教材は、もうリンクを直してあり、名前も日付なしなので、保管庫の同じ教材をこれで置き換えるのが早い
- 残りの教材（`20261113_Python Flask`、`Google Cloud`、`クラウド設計_入門`・`_初級`）は、決まりに合わせるか、合うまで保管庫から外す
- `_claude/` を `.claude/` に、`CLAUDE.md` を `.claude/CLAUDE.md` に移し、`README.md` を消す
- 一番上に `index.md` を置く（md-leaf の `content/index.md` を元に）
- `.gitignore` に `.obsidian/workspace*.json` を書く
- 読むだけの鍵（fine-grained のトークン）を作って Vercel の環境変数に入れ、Vercel の Deploy Hook を作って保管庫の secret に入れる（手順は、作るときに `docs/` に書く）

## 決まっていないこと

- [x] **ノートの取り方**：ビルドの最初に、保管庫をどう取ってくるか（推す答え：B） → 推す答えのとおり
  - A. GitHub の API で tarball を取って展開する。良い点：git がなくても動く。悪い点：展開に `tar` のコマンドかライブラリが要る
  - B. `git clone --depth 1` で `content/` に取る（鍵は URL に入れず、ヘッダーで渡す）。良い点：Vercel のビルドの環境に git があり、新しいライブラリが要らない。手元でも同じ手順を試せる。悪い点：`.git` が付くので取ったあと消す
  - どちらも、取る先は今と同じ `content/`（`.gitignore` に入れる）。`docs/design.md` の「`content/` をサーバーの出力に入れる」と Proxy の 404 の作りを変えずに済む
- [x] **読むための鍵の持ち方**（推す答え：fine-grained のトークンを、`learning-vault` だけ・Contents の読むだけで作り、Vercel の環境変数（Production と Preview）に置く。期限は1年にして、切れたらビルドの失敗で気づく） → 推す答えのとおり
  - 比べた案：GitHub App（期限なしで安全だが、個人の1つのリポジトリには手間が大きい）、Deploy key（SSH の鍵を Vercel に置くことになり、扱いが面倒）
- [x] **検査をどこで流すか**（推す答え：A） → 推す答えのとおり
  - A. アプリのビルドの中で、取ってきたあと・`next build` の前に検査する。合わなければビルドが失敗し、本番は前の版のまま、Vercel から失敗のメールが届く。保管庫の CI は Deploy Hook を呼ぶだけ。良い点：検査とアプリの版がいつも一致し、アプリのリポジトリが非公開の間も動く。保管庫の CI に Node や依存を入れなくてよい。悪い点：失敗に気づくのが Vercel のメールで、保管庫の GitHub の画面には出ない
  - B. Issue に書いた案：保管庫の CI が、アプリのリポジトリから検査を取ってきて流し、通ったら Deploy Hook を呼ぶ。良い点：保管庫の GitHub の画面で結果が分かる。悪い点：アプリのリポジトリが非公開の間は、保管庫の CI にもう1つ鍵が要る。検査とアプリの版がずれうる。保管庫の CI に依存を入れる手間
- [x] **失敗の知らせ方**（推す答え：Vercel の標準のメール（デプロイの失敗）だけ。新しくつなぐものはない） → 推す答えのとおり
- [x] **手元の `npm run dev` で読む場所**（推す答え：手元の保管庫のフォルダを、環境変数 `CONTENT_DIR` で指す（例：`.env.local` に `CONTENT_DIR=../learning-vault` を人が書く）。手元ではビルドのたびに取ってこない） → 推す答えのとおり
  - 比べた案：手元でも GitHub から取ってくる（手元にも鍵が要り、まだ push していない書きかけを確かめられない）
- [x] **「.」で始まるもの**（推す答え：検査では飛ばし、合わないものにしない。アプリはもともと読まない。今の「名前が「.」で始まるものを置かない」の決まりはなくす） → 推す答えのとおり
- [x] **一番上に置いてよいもの・Obsidian のテンプレート**（推す答え：一番上は今のまま `index.md` と教材のフォルダだけ。AI への指示は `.claude/CLAUDE.md` に置く。テンプレートのフォルダは今は置かない（要るようになったら、外す名前の決まりと一緒に別の Issue で決める）） → 推す答えのとおり
- [x] **精査（`/content-review`）の流し方**（推す答え：保管庫のフォルダをこの会話に加え（`/add-dir`）、`/content-review <保管庫のパス>/<教材名>` で流す。精査のコマンドとサブエージェントはアプリのリポジトリに置いたまま） → 推す答えのとおり
- [x] **アプリのリポジトリの `content/`**（推す答え：この PR で消し、`.gitignore` に入れる（ビルドのときに取ってくる先になる）） → 推す答えのとおり
- [x] **フォルダ名の日付**（推す答え：保管庫でフォルダ名から日付を外す。アプリは何も外さない。フォルダ名がそのまま一覧の名前になる、今の決まりを1つに保つため） → 推す答えのとおり
  - 比べた案：アプリが `YYYYMMDD_` を外して出す（保管庫で日付順に並ぶが、URL とリンクには日付が残り、決まりが2つになる）
- [x] **教材の形に合わないもの**（推す答え：今の検査のまま厳しく扱う。入口・ガイドがない教材は、合わせるまで保管庫に置かない。ゆるめると、何を置いてよいかがまた曖昧になる） → 推す答えのとおり

## 技術の確認表

| 項目 | 当てはまるもの | 決めた人 |
| --- | --- | --- |
| 保存するデータ | なし（ノートの置き場所がリポジトリの `content/` から保管庫に移るだけで、データベースは使わない） | AI |
| 外部サービス | GitHub（保管庫のリポジトリを読む）、Vercel の Deploy Hook（保管庫の push からビルドを始める） | 人 |
| 認証・権限 | 保管庫を読むだけの鍵（fine-grained のトークン）。アプリのログインは変わらない | 人 |
| 費用 | なし（GitHub の非公開リポジトリと Actions の無料の範囲、Vercel Hobby のビルド。push のたびに1回ビルドする） | AI |
| 個人情報 | なし（新しく扱わない。鍵は Vercel の環境変数と保管庫の secret にだけ置く） | AI |
| デプロイの環境 | ビルドの最初に保管庫を取って検査する。Vercel の環境変数に、保管庫の名前と鍵を足す | 人 |
| 新しいライブラリ | なし（git と今ある検査のスクリプトを使う） | AI |
| 取り消せない操作 | なし（`content/` を main から消すが、履歴には残る。履歴から消すのは #35） | AI |
| 共通の部品・トークン | なし | AI |
| `docs/design.md` の決まり | 変える：「`content/` をサーバーの出力に入れる」（取ってくる先）、「`content/` には決まりに合うものだけを置く」（「.」で始まるものを飛ばす、検査の流れ）。足す：「ノートはビルドの最初に保管庫から取ってくる」 | 人 |

## 調べたこと

- 新しい保管庫を今の検査にかけると、合わないものが706件（`[[ ]]` のリンク687件など）。結果は Issue #34 のコメント
- md-leaf の `content/` の5つの教材は、リンクが直してあり、名前に日付がない（保管庫の同じ教材は、日付つきで `[[ ]]` のまま）

---

## 設計

### ビルドの流れ

- `package.json` の `build` を `node scripts/prepare-content.mjs && next build` にする。Vercel はビルドに `npm run build` を使うので、Vercel の設定は変えない
- `scripts/prepare-content.mjs`（新しく作る）
  1. Vercel のビルド（環境変数 `VERCEL` がある）なら、保管庫を `content/` に取る
     - 環境変数 `VAULT_REPO`（`<持ち主>/<リポジトリ名>`）と `VAULT_TOKEN` のどちらかがなければ、取らずに失敗する
     - 取る前に `content/` を消し、`git clone --depth 1 --branch main https://github.com/<VAULT_REPO>.git content` で取る。鍵は URL にもコマンドの引数にも入れず、`GIT_CONFIG_COUNT`・`GIT_CONFIG_KEY_0`・`GIT_CONFIG_VALUE_0` の環境変数で `http.https://github.com/.extraheader` に `AUTHORIZATION: basic <base64(x-access-token:<鍵>)>` を渡す。`GIT_TERMINAL_PROMPT=0` で、鍵が効かないときに入力を待たずに失敗させる
     - 取れなければ（鍵の期限切れ・権限なし・保管庫がない）失敗する。出す文言に鍵を入れない
     - 取れたら `content/.git` を消す
  2. どこでも、コンテンツフォルダ（`CONTENT_DIR`、なければ `content/`）を `scripts/check-content.mjs` の `checkContent` で検査し、合わないものがあれば一覧を出して失敗する。フォルダがなければ、`CONTENT_DIR` で保管庫を指すよう案内して失敗する
  - 失敗は exit 1。`next build` に進まないので、Vercel では本番が前の版のまま残り、Vercel の標準のメールが届く
  - 鍵の受け渡しと git の呼び出しはテストできるよう、コマンドを実行する関数を差し替えられる形にする
- 画面のテスト（`playwright.config.ts`）と CI は `npx next build` を直接呼ぶので、取りも検査もしない（今のテスト用のノートのまま）

### 検査（`scripts/check-content.mjs`）

- 名前が「.」で始まるもの（どの階層でも）は、合わないものにせず、中も見ずに飛ばす。`RULES.hidden` はなくす
- 検査するフォルダを引数で指定できる：`npm run check:content -- <フォルダ>`。引数がなければ `CONTENT_DIR`、それもなければ `content/`。合わないものは `<指定したフォルダ>/<ファイル>  <決まり>` の形で出す（今の `content/<ファイル>` の形と同じ）。フォルダがなければ、そう出して失敗する
- `npm run lint` から検査を外す（アプリのリポジトリに `content/` がなくなるため。検査は Vercel のビルドで走る）

### アプリのリポジトリ

- `content/` を消し、`.gitignore` に `/content/` を足す（Vercel のビルドで取ってくる先）
- `next.config.ts`：コンテンツフォルダがないときは、`readdir` の ENOENT のままにせず、`CONTENT_DIR` で保管庫を指すよう案内する文言で止める（`npm run dev`・`npm run typecheck` を手元で保管庫なしに動かしたとき）
- `.github/workflows/ci.yml` の `check`：`npm run typecheck`（`next typegen` が `next.config.ts` を読む）に `CONTENT_DIR: e2e/fixtures/content` を渡す
- `.env.example`：手元の `CONTENT_DIR`（例：`../learning-vault`）を足す。`VAULT_REPO`・`VAULT_TOKEN` は Vercel にだけ置く値として書く（手元では使わない）

### 文書

- `docs/vault.md`（新しく作る）：保管庫とつなぐ手順（人が一度だけ行う）。読むだけの鍵の作り方（fine-grained、`learning-vault` だけ、Contents の読むだけ、期限1年）、Vercel の環境変数（`VAULT_REPO`・`VAULT_TOKEN` を Production と Preview）、Deploy Hook の作り方と保管庫の secret、保管庫の GitHub Actions のワークフローの例（main に push したら Deploy Hook を呼ぶだけ）、鍵が切れたときの直し方。README の「本番（Vercel）へのデプロイ」からリンクする
- `docs/content-rules.md`：保管庫が正本で、置き場所は保管庫。「.」で始まるものは飛ばす、足し方の手順（保管庫で書いて push）、検査の流し方（`npm run check:content -- <保管庫のパス>`、Vercel のビルドで走る）
- `docs/specs/notes.md` の「コンテンツフォルダ」、`docs/overview.md` の技術・主な機能・用語、`CLAUDE.project.md` のノートを読む場所とコマンド、README の「使っている技術」「セットアップ」
- `docs/design.md`：「ノートはビルドの最初に保管庫から取ってくる」を足す。「`content/` をサーバーの出力に入れる」（取ってくる先）、「`content/` には決まりに合うものだけを置く」（保管庫、「.」を飛ばす、検査はビルドの中）を直す
- `/content-review` と `content-reviewer`：渡すパスを「コンテンツフォルダ（保管庫）の下」に直す

### 理由と残す場所

- Vercel のビルドだけで取る（`VERCEL` で見分ける）：Vercel で鍵がないときに必ず失敗させ、手元・CI・画面のテストでは保管庫を読まないため → `scripts/prepare-content.mjs` のコメント
- 検査をビルドの中で流す・「.」を飛ばす・取ってくる先を `content/` にする：複数の場所に関わる → `docs/design.md`
- 鍵をヘッダーで渡す・環境変数で渡す：そのコードだけ → `scripts/prepare-content.mjs` のコメント

## AIが決めたこと

- 取るかどうかの見分け方：環境変数 `VERCEL` があるときだけ取る。理由：受け入れ条件の「鍵がないときはビルドが失敗する」を、Vercel のビルドで必ず守れる。比べた案：`VAULT_REPO` があれば取る（Vercel で設定し忘れると、取らずに `content/` なしで進み、検査の「フォルダがない」で止まるが、原因が分かりにくい）、ビルドのコマンドを Vercel の設定で別にする（人が Vercel の設定を変える手間が増える）
- 環境変数の名前：`VAULT_REPO`（`<持ち主>/<リポジトリ名>`）と `VAULT_TOKEN`。比べた案：URL を丸ごと持つ（`https://github.com/` は決まっているので、名前だけのほうが書き間違えにくい）
- 鍵の渡し方：`GIT_CONFIG_*` の環境変数で `http.extraheader` に Basic の認証を渡す（GitHub の actions/checkout と同じ形）。比べた案：`-c http.extraheader=...` の引数（プロセスの一覧やログに鍵が出うる）、URL に鍵を入れる（`.git/config` とログに残りうる）
- 取ったあとに `.git` を消す：仕様のとおり。サーバーの出力（`outputFileTracingIncludes` の `content/**`）に履歴が入らないため
- `npm run lint` から検査を外す：アプリのリポジトリに `content/` がなくなるため。検査のスクリプトの単体テストは `npm test` に残る
- CI の型チェックに `CONTENT_DIR: e2e/fixtures/content` を渡す：`next typegen` が `next.config.ts` を読み、ノートのパスの一覧を作るため。比べた案：フォルダがなければ0件として進める（手元で保管庫を指し忘れたときに、ノートのないアプリが黙って動く）
- `scripts/prepare-content.mjs` が、`next build` と同じく `.env.local` などを読む（`next` に入っている `@next/env` の `loadEnvConfig`）。理由：手元で `.env.local` に `CONTENT_DIR` を書いたとき、検査と `next build` が同じフォルダを見るため。比べた案：読まない（手元の `npm run build` で検査だけが `content/` を探して止まる）、Node の `process.loadEnvFile`（Next.js とファイルの読む順が違いうる）
- Vercel のビルドでは、`CONTENT_DIR` にかかわらず取った `content/` を検査する。理由：取ったものと検査するものを必ず一致させるため
- 保管庫の手順の置き場所：`docs/vault.md` を新しく作り、README からリンクする。比べた案：README に全部書く（README がさらに長くなる）
- 保管庫の secret の名前は `VERCEL_DEPLOY_HOOK_URL`、保管庫のワークフローの例には手で流すための `workflow_dispatch` を付ける。理由：鍵の期限を直したあとなどに、push せずに本番をビルドし直せるため。比べた案：push だけ（直したあとに空のコミットが要る）
- `npm run check:content` は `.env.local` を読まず、手元の保管庫はフォルダを引数で渡す。理由：検査のスクリプトを Next.js に依存させない。比べた案：`prepare-content.mjs` と同じく `@next/env` で読む

## 確かめ方

| 受け入れ条件 | 確かめ方 |
| --- | --- |
| 保管庫の main に push すると、本番に数分で反映される | 触って確かめる（`docs/vault.md` の設定のあと、保管庫で1行直して push し、数分後に本番で見る） |
| 合わないときは本番に出さない・メールが届く | テスト（`scripts/prepare-content.test.mjs`：検査で合わないものがあると失敗し、`next build` に進まない形で終わる）＋触って確かめる（わざとリンクを切って push し、メールと本番が前の版のままを見る） |
| 「.」で始まるものは合わないものにならず、アプリにも出ない | テスト（`scripts/check-content.test.mjs`。アプリが読まないことは `src/lib/notes.test.ts` に今ある） |
| 一番上に `index.md` と教材以外があると合わないものになる | テスト（`scripts/check-content.test.mjs` に今ある） |
| 手元で保管庫のフォルダを指定して検査できる | テスト（`scripts/check-content.test.mjs`：引数のフォルダを検査し、`<フォルダ>/<ファイル>` の形で出す） |
| 手元の `npm run dev` で手元の保管庫を読める | 触って確かめる（`.env.local` に `CONTENT_DIR` を書いて `npm run dev`） |
| PR のプレビューも保管庫のノートでビルドされる | 触って確かめる（`docs/vault.md` の設定のあと、この PR のプレビューのビルドのログで、取ったことと検査が通ったことを見る） |
| 保管庫を読めないときはビルドが失敗する | テスト（`scripts/prepare-content.test.mjs`：`VAULT_REPO`・`VAULT_TOKEN` がない、git が失敗する、のそれぞれで失敗し、文言に鍵が入らない）＋コードを見て確かめる（`GIT_TERMINAL_PROMPT=0`） |
| main から `content/` がなくなる | コードを見て確かめる（`git ls-files content` が空、`.gitignore` の `/content/`） |
| 画面のテストは `e2e/fixtures/` で動き、保管庫を読まない | コードを見て確かめる（`playwright.config.ts` の `CONTENT_DIR` と `npx next build`、`scripts/prepare-content.mjs` が `VERCEL` のときだけ取る）＋CI の画像を比べるテストが通る |

## タスク

- [x] 検査が「.」で始まるものを飛ばし、指定したフォルダを検査でき、`npm run lint` から外れたら完了（`scripts/check-content.mjs`・テスト・`package.json`）
- [x] `npm run build` が、Vercel では保管庫を `content/` に取って検査し、どこでもコンテンツフォルダを検査してから `next build` に進むようになったら完了（`scripts/prepare-content.mjs`・テスト・`package.json`）
- [x] アプリのリポジトリから `content/` を消し、保管庫なしでも CI と手元の案内が動くようになったら完了（`content/` の削除・`.gitignore`・`next.config.ts`・`.github/workflows/ci.yml`・`.env.example`）
- [x] 保管庫とつなぐ手順と、置き場所が変わったことを文書に書いたら完了（`docs/vault.md`・README・`docs/content-rules.md`・`docs/specs/notes.md`・`docs/overview.md`・`docs/design.md`・`CLAUDE.project.md`・`/content-review` と `content-reviewer`）
