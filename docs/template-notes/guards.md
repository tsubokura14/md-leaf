# 止める仕組み

## 止めるのは、確実に止められるものだけ

今の形と理由は、permissions スキルの「フック」にある（使う側でフックを直すときにも要るため）。

この形にしたきっかけ：作り直しの前、使う側でフックの誤作動が問題になった。

## PR と Issue の作成は確認しない

今の形：`gh pr create`・`gh issue create`・`gh issue edit` は allow。マージの deny と `.githooks/pre-push` は残す。

理由：人の判断を「プロトタイプでの合意」と「確認とマージ」の2回にまとめる（Issue #1〜#7 の作り直し）。PR の作成は取り消せ（閉じればよい）、中身はマージの前にレビューで見るので、作成のたびに止める意味が薄い。止めると、AIが続けて作る（`/dev-run`）ときに、人がいないと進まなくなる。

## implementer は、リポジトリの外をすべて止める

今の形：guard.mjs の `implementer` は、作業中のリポジトリ（`git rev-parse --show-toplevel`。worktree ならその worktree）の外を、ファイルのツールで触るのを止める。コマンドの中のパスは見ない。

理由：作り直しの前は、プロトタイプを本番の作業に持ち込まない守りを、人が会話を区切ってコマンドを打ち直すことと、作業ディレクトリの外を読むときの確認に頼っていた。どちらも人の操作が要る。実装をサブエージェントに任せれば会話は分かれるが、プロトタイプのフォルダを `/add-dir` した会話から起こすと、サブエージェントも読めてしまうため、フックで止める。

とらなかった案：

- プロトタイプの場所を設定に書き、その場所だけを止める：場所は人が決め、使う側ごとに違う。書き忘れると守りが消える
- コマンドの中のパスも読み解いて止める：`cat`・`Get-Content`・`node -e` など書き方が何通りもあり、止めすぎるか抜けるかになる（「止めるのは、確実に止められるものだけ」）

## フックのパスは `${CLAUDE_PROJECT_DIR}` から書く

今の形：`.claude/settings.json` のフックは、`${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.mjs` のように書く。

とらなかった案：相対パス（`.claude/hooks/guard.mjs`）。Claude が `cd` したあと、guard.mjs が見つからなくなるため。

## Copilot で効かない守り

どの守りが効かないかは、`docs/how-we-work.md` の「GitHub Copilot で使うとき」にある。人間がこの差を受け入れたうえで、Copilot でも同じルールを使っている（[structure.md](structure.md#claude-code-と-github-copilot-で同じルールを使う)）。

## 試すときの前提

- guard.mjs と pre-push のテストは `.github/template-tests/` にあり、`node --test ".github/template-tests/*.test.mjs"` で走る（Node と Git のほかに入れるものはない）
  - pre-push のテストは、一時フォルダに送り先と手元のリポジトリを作り、実際に `git push` して確かめる。フックを直接起こさないのは、push の書き方（`HEAD:main`、`+` の refspec など）を Git が pre-push に渡す形に直すところまで含めて試すため
  - guard.mjs を直すときは、きっかけの Issue の再現手順にあるコマンドと、止めてはいけない書き方を、テストの表に1行ずつ足す。行の最後には、その Issue の番号を書く
  - テストは、フックが実際に呼ばれるときと同じ形（標準入力の JSON と引数）で guard.mjs を起こし、終了コードだけを見る。シェルを通さずに渡すので、下の `MSYS_NO_PATHCONV=1` の話は、手で試すときだけに当たる
  - 止めすぎや抜け道が見つかって、すぐには直さないものは、直ってほしい結果で書いて `todo` を付け、Issue を立てる。今の動きのまま書くと、間違った動きを正しいものとして固めてしまう
  - PR ごとに `.github/workflows/template-tests.yml` が、同じコマンドを Ubuntu と Windows で走らせる。両方なのは、人間とAIが Windows で使っていて、`\` の読み方や Git Bash の違いで結果が変わりうるため。失敗しても、PR のマージは止まらない（このリポジトリは非公開で GitHub Free のため、ブランチの保護もルールセットも使えない。失敗は PR のチェックの表示で気づく）
  - 置き場所を `.github/template-tests/` にしたのは、`.github/` の下で「テンプレートのもの」なのは決まったパスだけで、集める・取り込むときに除外の指定が要らないため。対象の隣（`.claude/hooks/`、`.githooks/`）は、「テンプレートのもの」のフォルダなので、除外の指定が要る。使う側では、テンプレートとつなぐときに消す（`docs/template-files.md`）
- `Read(.env)` のように `/` のない deny は、gitignore と同じく、どの階層の `.env` にも当たる。`**/` は要らない（2026-10-12 に、ダミーのファイルで確かめた）。当たり方を疑うときは、指摘する前にダミーのファイルで試す
- guard.mjs に Git Bash から例のコマンドを渡して試すときは、`MSYS_NO_PATHCONV=1` を付ける。付けないと、`X=/dev/null` のような引数が Windows のパスに書き換えられ、止まるはずのコマンドが通るように見える
- サブエージェントの frontmatter の `hooks` は、そのファイルができたあとに始めた会話でしか効かない。試すときは `claude -p --agent <名前>` を使う
- このリポジトリでは、確認に許可を出すと、そのコマンドが `.claude/settings.json` に書き込まれる。コミットの前に `git diff main -- .claude/settings.json` で、意図しない行がないかを確かめる

## 決まっていないこと

- Windows の VS Code で、`.claude/settings.json` のフックのせいで、Copilot がすべての操作を断ることがある（microsoft/vscode#339223）。人間が VS Code で試した結果（PR #40 のとき）が出るまで、フックの設定は変えない
