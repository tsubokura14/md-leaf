# リポジトリを公開する

アプリのリポジトリ（md-leaf）を、非公開のノートを履歴から消して公開したときの手順と、やったことの記録。決めたことと理由は `docs/changes/2026-11-14-publish-app-repo.md`。

- 今の `tsubokura14/md-leaf` は、`content/` を消した main の履歴を、新しいリポジトリに入れたもの
- コミットメッセージの `(#36)` などの番号は、古いリポジトリ（`tsubokura14/md-leaf-archive`、非公開）の PR の番号。新しいリポジトリの Issue・PR の番号とは合わない。古い Issue・PR の議論は古いリポジトリに残っている

## 進め方

- 上から順に、1つずつ進める。「承認」と書いた手順は取り消せないので、AI が実行する場合も、1つごとに人の承認をとる。「人」と書いた手順は人が行う
- 書き換えは、今の作業フォルダではなく、一時フォルダに取った新しいクローンで行う
- 公開は最後にする。非公開のうちなら、間違えても新しいリポジトリを消して作り直せる。公開して一度でも読まれたら、取り消せない
- コマンドは Git Bash で打つ。`$WORK` は一時フォルダ（作業フォルダの外。終わったら消す）。始めに `WORK=<一時フォルダ>` で決めておく

## 0. 準備

1. この手順書の PR を古いリポジトリでマージし、ほかに開いている PR・作業中のブランチがないことを確かめる（マージしていない変更は、新しいリポジトリに入らない）
2. `git filter-repo` を入れる（Python のパッケージ）

```bash
pip install --user git-filter-repo
python -m git_filter_repo --version
```

## 1. 書き換える

一時フォルダに main だけを新しくクローンし、`content/` を履歴ごと消す。

```bash
mkdir -p "$WORK" && cd "$WORK"
git clone --single-branch --branch main --no-tags https://github.com/tsubokura14/md-leaf.git orig
git clone --single-branch --branch main --no-tags https://github.com/tsubokura14/md-leaf.git md-leaf
# 消す前に、content/ にあったファイルの中身（blob）の一覧を取っておく（確かめ A で使う）
cd orig && for c in $(git rev-list main); do git ls-tree -r "$c" -- content/ | awk '{print $3}'; done | sort -u > ../content-blobs.txt && cd ..
cd md-leaf && python -m git_filter_repo --path content/ --invert-paths
```

- `git filter-repo` は、`content/` だけを変えたコミットを空にして消す。消えるのは「ノートを content/ に追加する (#26)」の1つ（2026-11-14 に試した結果）
- 書き換えたあと、`origin` は外れている（`git filter-repo` が外す）。間違えて古いリポジトリに push することはない
- 最後の版が、main から `content/` を除いたものと同じかを確かめる。何も出なければよい

```bash
diff <(git -C ../orig ls-tree -r main | grep -v $'\tcontent/') <(git ls-tree -r main)
```

続けて、このクローンで「確かめ A」を行う（`<フォルダ>` は `$WORK/md-leaf`）。

## 確かめ A：ノートと秘密の値がない

`<フォルダ>` で行う。どれも、書いた結果になればよい。

```bash
cd <フォルダ>
# どのコミットの木にも content/ がない → 0
for c in $(git rev-list --all); do git ls-tree -r --name-only "$c"; done | grep -c '^content/'
# content/ にあったファイルの中身が残っていない → e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 だけ（長さ0のファイルの中身。どのリポジトリにもある）
git cat-file --batch-all-objects --batch-check='%(objectname)' | sort -u | comm -12 "$WORK/content-blobs.txt" -
# トークンの形の文字列（.githooks/pre-push と同じ式）→ 0
git log --all -p | grep -cE -e '-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[abposr]-[A-Za-z0-9-]{10,}|sk_live_[A-Za-z0-9]{20,}'
# .env のファイル → .env.example だけ
for c in $(git rev-list --all); do git ls-tree -r --name-only "$c"; done | grep -E '(^|/)\.env' | sort -u
# メールアドレス → GitHub の noreply（本人のものと、Squash merge のコミッターの noreply@github.com）、noreply@anthropic.com、@example.com だけ（@AGENTS.md などは CLAUDE.md の取り込みの書き方）
git log --all --format='%ae%n%ce' | sort -u
git log --all -p | grep -oiE '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' | sort -u
# 手元のパス → 0（`C:/Users/` のあとに英字が続くものだけを数える。仕様ファイルの例 `C:/Users/...` と、この検査の前の版の行は当たらない）
git log --all -p | grep -cE 'C:[/\\]Users[/\\][A-Za-z]'
# ブランチは main だけ、タグはない
git for-each-ref --format='%(refname)'
```

- 許可するメールアドレスの実際の値は、Vercel の環境変数にだけある。メールアドレスの一覧にテスト用以外のものが出たら、止まって人が確かめる

## 2. 古いリポジトリの名前を変える（承認）

```bash
gh repo rename md-leaf-archive --repo tsubokura14/md-leaf --yes
```

すぐに、手元の古いクローンの `origin` を古いリポジトリに向け直す（worktree も同じ設定を使う）。

```bash
git -C <手元の古い md-leaf のフォルダ> remote set-url origin https://github.com/tsubokura14/md-leaf-archive.git
git -C <手元の古い md-leaf のフォルダ> remote -v
```

- 理由：次の手順で同じ名前の `md-leaf` を作ると、古いクローンの `origin`（`.../md-leaf.git`）が新しいリポジトリを指す。そのままだと、書き換えていない古いブランチ（ノート入り）を新しいリポジトリに push できてしまう（`.githooks/pre-push` は、新しいブランチの push は止めない）
- ほかの会話で古いフォルダを使っている Claude Code があれば、この前に止めておく
- 名前を変えても、Vercel はリポジトリの ID でつながっているので、本番のデプロイは古いリポジトリから続く（手順 5 まで）

## 3. 新しいリポジトリを非公開で作る（承認）

```bash
gh repo create tsubokura14/md-leaf --private --description "Obsidian のノートをスマホで読みやすく見る、自分専用の閲覧アプリ"
```

## 4. main を push する（人）

AI は main に push しない決まりなので、人が打つ。書き換えたクローンでは `.githooks` を有効にしていないので、フックでは止まらない。

```bash
cd "$WORK/md-leaf"
git remote add origin https://github.com/tsubokura14/md-leaf.git
git push -u origin main
```

- `--all`・`--tags`・`--mirror` は使わない（main だけを送る）

GitHub から取り直したもので確かめる。

```bash
cd "$WORK" && git clone --no-tags https://github.com/tsubokura14/md-leaf.git check
gh api repos/tsubokura14/md-leaf/branches --jq '.[].name'   # main だけ
gh pr list --repo tsubokura14/md-leaf --state all           # 0件
```

`$WORK/check` で「確かめ A」をもう一度行う（`<フォルダ>` は `$WORK/check`）。

## 5. Vercel のつながりを変える（承認・人）

Vercel の画面で行う。環境変数とドメインはプロジェクトに付いているので、そのまま残る。

1. GitHub の「Settings」→「Applications」→ Vercel の「Configure」で、Vercel が読めるリポジトリに新しい `md-leaf` が入っているか確かめる（「Only select repositories」なら足す）
2. Vercel のプロジェクトの「Settings」→「Git」で「Disconnect」し、「Connect Git Repository」で新しい `tsubokura14/md-leaf` を選ぶ。本番のブランチが `main` のままか確かめる
3. 同じ画面の「Deploy Hooks」を見る。なくなっていたら、`docs/vault.md` の「Vercel の Git のつながりを変えたとき」のとおり作り直し、保管庫の secret を入れ替える

## 確かめ B：本番が前と同じに動く（人）

1. 保管庫の「Actions」で `アプリを再ビルドする` を手で流す。Vercel で新しいリポジトリの main のビルドが始まり、成功することを確かめる（ログに「保管庫 … を content/ に取ります」）
2. 本番の URL（前と同じ）を開き、許可したアカウントでログインでき、ノートが開けることを確かめる。許可していないアカウントでは入れないことを確かめる
3. 保管庫で1行直して push し、数分で本番に出ることを確かめる

## 6. 公開する（承認）

ここまでの確かめがすべて通ってから行う。

```bash
gh repo edit tsubokura14/md-leaf --visibility public --accept-visibility-change-consequences
```

## 7. 手元を切り替え、GitHub の設定をする（承認）

古い作業フォルダの名前を変え、新しいリポジトリを同じ場所にクローンする。

```bash
cd <アプリのフォルダの親>
mv md-leaf md-leaf-archive
# worktree の側からのつながりも直すため、worktree のフォルダを並べて渡す（git -C md-leaf-archive worktree list で出たもの）
git -C md-leaf-archive worktree repair <worktree のフォルダ…>
git clone https://github.com/tsubokura14/md-leaf.git md-leaf
cd md-leaf && npm install
bash scripts/setup-github.sh
```

- `scripts/setup-github.sh` は、Squash merge だけ・マージしたブランチを消す・main の保護・push protection を設定し、最後に `scripts/link-template.sh` で Git のフックを有効にして、remote `template` を足す。公開したので、main の保護と push protection も「設定しました」と出る
- `.env.local` は古いフォルダからコピーする（リポジトリには入っていない）
- `mv` で失敗したら（「Device or resource busy」。ほかのプログラムがフォルダを使っている）、`md-leaf` を開いているエディタ・エクスプローラー・ターミナルを閉じ、Claude のアプリで `md-leaf` を作業場所にした会話をアーカイブしてからやり直す。アプリは、アーカイブしていない会話のフォルダを、動いていなくてもつかんでいることがある（2026-11-14 はこれが原因だった）

## 確かめ C：GitHub の設定とテンプレートとのつながり

新しい `md-leaf` のフォルダで行う。

```bash
gh api repos/tsubokura14/md-leaf/branches/main/protection --jq '.enforce_admins.enabled'   # true
gh api repos/tsubokura14/md-leaf --jq '.security_and_analysis.secret_scanning_push_protection.status'   # enabled
cat .template-version
git fetch template main && git remote get-url --push template   # no-push
git config core.hooksPath   # .githooks
```

## 8. 記録の PR（AI・人がマージ）

新しいリポジトリで、`/dev-fix` と同じ流れで PR を出す。中身は、下の「やったことの記録」を埋めること。

1. CI（テスト・Lint・型チェック、画像を比べるテスト）が動いて通ることを確かめる
2. 人がマージし、Vercel が本番にデプロイすることを確かめる
3. 古いリポジトリの Issue #35 に、新しいリポジトリの URL を書いて閉じる

## 9. 片付ける（承認）

1つずつ、中身を確かめてから消す。

- 古い作業フォルダ `md-leaf-archive` と、その worktree（`.claude/worktrees/` の中のもの、`md-leaf.worktrees/` の中のもの）。消す前に、`git -C md-leaf-archive status`・`git -C md-leaf-archive worktree list` で、まだ要る変更がないかを見る
- 一時フォルダ `$WORK`
- テンプレートのリポジトリの `docs/template-harvest.md` に記録した md-leaf の「最後に見たコミット」は、書き換えで新しいリポジトリにはなくなる。テンプレートの側の作業として伝える（新しいリポジトリでの同じコミットは、コミットメッセージで探せる）

## やったことの記録

2026-11-14 に行った。

| 手順 | 日付 | 結果 |
| --- | --- | --- |
| 1. 書き換える | 2026-11-14 | 古いリポジトリの main（`66a1770`、この手順書の PR を取り込んだもの）を書き換えた。21 コミット → 20（「ノートを content/ に追加する (#26)」が消えた）。最後の版の中身は、main から `content/` を除いたものと一致。`content/` にあったファイルの中身は 121 個 |
| 確かめ A（書き換えたクローン） | 2026-11-14 | 通った。`content/` 0、残った中身は長さ0のファイルのもの（`e69de29`）だけ、トークン 0、`.env` は `.env.example` だけ、メールアドレスは noreply と `@example.com` だけ、ref は main だけ。手元のパスの検査は、検査のコマンドの前の版の行自身に当たって 1 になった（本物のパスではない。この PR で式を直した） |
| 2. 古いリポジトリの名前を変える | 2026-11-14 | `tsubokura14/md-leaf-archive`（非公開）にした。手元の古いクローンの `origin` を向け直した。古いリポジトリには、使っていないブランチ `7-theme-toggle` が残っている（持ち込んでいない） |
| 3. 新しいリポジトリを作る | 2026-11-14 | `tsubokura14/md-leaf` を非公開で作った |
| 4. main を push する・確かめ A（取り直したクローン） | 2026-11-14 | 人が push した。main の先頭は `cfa17e1`。ブランチは main だけ、PR 0件、タグ 0件。取り直したクローンで確かめ A が通った |
| 5. Vercel のつながりを変える | 2026-11-14 | 人が画面でつなぎ直した。Deploy Hook は残っていた（作り直しと保管庫の secret の入れ替えは要らなかった） |
| 確かめ B | 2026-11-14 | 通った。保管庫のワークフローを手で流して成功し、新しいリポジトリの main で本番がビルドされた。本番でログイン・ノートの表示、保管庫の push からの反映を人が確かめた |
| 6. 公開する | 2026-11-14 | Public にした。ログインしていない状態で開けることを確かめた |
| 7. 手元の切り替え・確かめ C | 2026-11-14 | 古いフォルダを `md-leaf-archive` に名前を変えた（Claude のアプリの会話がフォルダをつかんでいて、アーカイブするまで失敗した）。worktree のつながりを直し、新しいリポジトリを `md-leaf` にクローンした。`scripts/setup-github.sh` で main の保護と push protection が設定でき、確かめ C が通った |
| 8. 記録の PR | 2026-11-14 | この PR |
| 9. 片付ける | | 古い作業フォルダと worktree は、人が確かめてから消す |
