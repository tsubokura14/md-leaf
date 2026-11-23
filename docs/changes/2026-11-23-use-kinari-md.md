<!--
変更の仕様のひな形。コピーして docs/changes/<年-月-日>-<何をするか>.md を作る（例：2026-09-17-add-due-date.md）。
「なぜ」〜「調べたこと」は、AIが下書きし、人間がプロトタイプを触って直し、合意して決める（/dev-proto）。「画面」のスクリーンショットは、合意したときに足す。
「設計」以降はAIが書いて実装まで進め、人間は機能の PR でレビューする（/dev-build）。
スクリーンショットは、このファイルと同じ名前のフォルダに置く（例：2026-09-17-add-due-date/list-empty.png）。
-->

# Markdown の変換と本文の見た目を kinari-md に替えられる（#34）

## なぜ

- Markdown の変換と本文の見た目は、md-leaf から共通のパッケージ kinari-md に移り、v0.1.0 として出た（tsubokura14/kinari-md#2）。md-leaf の中には、同じものの元のコードが残っている
- md-leaf も kinari-md を使うように替え、Markdown の表示を kinari-md の1か所で直せるようにする。シリーズのアプリ（memory-forge）が kinari-md を使い始めたとき、表示の直しが片方にだけ入ることをなくす
- 読む人から見た画面は今と変えない

## 影響する今の仕様

- `docs/specs/notes.md` の「ノート」の本文の出し方と「本文のブロック」：動きは変えない（言い方を kinari-md に任せる形にそろえるだけ）
- `docs/specs/display.md` の「本文の文字の大きさ」：動きは変えない
- 画面の画像（`docs/specs/screens/`）：変えない

## 使う場面

1. 保管庫に、コールアウト・コード・表・数式・Mermaid の図・画像の入ったノートがある。本番のビルドのあとにスマホで開くと、今までと同じ見た目で読める。ライト・ダークを切り替えると、図も今までどおり描き直される
2. ノートの中の相対リンク `[Docker のメモ](Docker%20のメモ.md)` を押すと、今までどおり読み込み直さずにそのノートへ移る。リンク先のノートがなければ、今までどおりビルドのときに「リンク先のノートがありません」と警告が出て、押すと「ノートが見つかりません」の画面になる
3. あとでコードの色分けの崩れが見つかったとき、kinari-md を直して版を上げ、md-leaf はその版を入れるだけで直る

## 受け入れ条件

- ノート・ホーム（`index.md`）の本文が、今と同じ見た目で出る：見出し・段落・リスト・リンク・強調・コールアウト（種類・題・折りたたみ）・コード（色分け）・表（列の幅・横のスクロール）・数式・Mermaid の図・画像（代わりの文字）。ライトとダークのどちらでも
- 本文の文字の大きさ（14px・16px）を変えると、今と同じく本文だけが変わり、見出し・コード・表なども同じ比率で変わる
- フロントマターは本文に出ず、`title` があれば題に、なければファイル名を題にする
- 目次（h2・h3）が今と同じに出て、押すとその見出しが上の帯のすぐ下に来る
- ノートの中の相対リンクで、読み込み直さずに別のノートへ移る。リンク先がなければ「ノートが見つかりません」が出る。外へのリンクは別のタブで開く
- ノートの画像（相対パス）が今と同じに出る。ないファイル・コンテンツフォルダの外・対象外の拡張子の画像は、今と同じく出さず、ビルドのときに警告が出る
- ライト・ダークを切り替えたとき（「端末に合わせる」で端末の設定が変わったときも）、Mermaid の図がその場で新しい色で描き直される
- ノートの中の HTML のタグは、今と同じく文字として出る（動かない）
- 保管庫の検査（`npm run check:content`）とビルドの止め方は今と変わらない

## 画面

画面は変えない。今の画像（`docs/specs/screens/`）のまま、画像を比べるテストが通ることで確かめる。プロトタイプは作らない（画面が変わらないため）。

## やらないこと

- 本文の見た目・変換の動きを変えること（直したいものが見つかったら、kinari-md の Issue にする）
- kinari-md 側の未着手の機能（書き方を絞る・安全な HTML にする #4、コードの行番号）を md-leaf で使うこと
- `#見出し` のリンクで見出しへ移れるようにすること
- 保管庫の検査（`scripts/check-content.mjs`）を kinari-md に寄せること（リンクの決め方は md-leaf のもの）

## 先に要る機能

- #32（トークンの名前をシリーズで揃える）：main に入った
- #33（`<html>` の `data-theme` でライト・ダークを決める）：main に入った
- tsubokura14/kinari-md#7（本文の見出しと小さめの字の倍率を、移す前の md-leaf に合わせる）：閉じた。直した版 v0.1.1 のタグが出た（h2 1.41em・h3 1.18em・小さめの字 0.82em）。md-leaf はこの版を入れる（このブランチで `npm install github:tsubokura14/kinari-md#v0.1.1` 済み。`package.json`・`package-lock.json` だけで、まだどこからも使っていない）

## 決まっていないこと

- [x] kinari-md v0.1.0 の本文の文字の倍率が、md-leaf の今の倍率と少し違う。どう揃える？
  - 違い（本文の大きさを1として）：h2 は md-leaf 1.41 倍・kinari-md 1.5 倍、h3 は 1.18 倍・1.25 倍、小さめの字（コード・表・コールアウトの見出し・画像の代わりの文字）は 0.82 倍・0.875 倍。16px のとき、h2 が 22.6px から 24px に、コードが 13.1px から 14px になる。ほかの見た目（色・余白・枠・並び）と変換の HTML は同じだった
  - 原因の見立て：kinari-md は md-leaf の rem の値（h2 は 1.5rem）を、本文の大きさ（md-leaf では 1.0625rem）ではなく 1rem を1として倍率にしている。kinari-md のコメントも「md-leaf の値を、本文の大きさを 1 として書いた」としており、ずれは意図したものではないと思われる
  - 推す答え：**kinari-md を先に直し（md-leaf の今の倍率に合わせる）、新しい版（v0.1.1）を出してから、md-leaf はその版を入れる**。良い点：Issue のとおり画面が変わらず、正しい値が kinari-md の1か所に入る。kinari-md を使っているアプリはまだない（memory-forge はまだ入れていない）ので、ほかに影響しない。悪い点：kinari-md の Issue と PR が1つ先に要り、#34 はそれを待つ
  - 比べた案1：v0.1.0 の倍率をそのまま受け入れ、見出し・コードなどが少し大きくなった画像に撮り直す。良い点：すぐ進められる。悪い点：Issue の「画面は今と変えない」と食い違う。本文が写る画像がほとんど変わり、レビューで差を確かめにくい
  - 比べた案2：md-leaf の CSS で倍率を上書きする。良い点：kinari-md を待たない。悪い点：1か所で直すという目的に反し、kinari-md を直したときに上書きが残る
  - → 推す答えのとおり。kinari-md を先に直して新しい版を出し、md-leaf はその版を入れる（直しは tsubokura14/kinari-md#7）

## 技術の確認表

| 項目 | 当てはまるもの | 決めた人 |
| --- | --- | --- |
| 保存するデータ | なし（変えない） | AI |
| 外部サービス | なし（GitHub の公開リポジトリから入れる。Vercel のビルドは鍵なしで取れる） | AI |
| 認証・権限 | なし（ログインの確かめは変えない） | AI |
| 費用 | なし | AI |
| 個人情報 | なし | AI |
| デプロイの環境 | 変えない（`npm install` が GitHub のタグから kinari-md を取る） | AI |
| 新しいライブラリ | kinari-md（`github:tsubokura14/kinari-md#v0.1.1`。npm には出していない。TypeScript のまま配るので `next.config.ts` の `transpilePackages` でビルドする）。直接使わなくなる unified・remark・rehype・highlight.js・KaTeX・yaml・mermaid は md-leaf の依存から外す（kinari-md が持つ） | 人（Issue）・AI |
| 取り消せない操作 | なし | AI |
| 共通の部品・トークン | Markdown だけが使う色（コードの色分け・コールアウトの abstract・important・caution）と表の列の幅は、md-leaf のトークンファイルから外し、kinari-md の `tokens.css` に任せる（値は同じ）。本文の入れ物のクラスは `.note-body` から `.kinari-body` に | AI |
| `docs/design.md` の決まり | 「全体の構成」の `src/lib/`（Markdown の変換）・`note-body.css` の行、「画像を返す入口は…」「保管庫には…」の当てはまる場所を直す。「トークンにない値を書かない」の対象に、kinari-md のファイルは入らない（パッケージの中の決まりは kinari-md が持つ） | AI |

## 調べたこと

- kinari-md v0.1.0（公開リポジトリ、MIT）の入口は `kinari-md/markdown`（`renderMarkdown(source, { resolve })`）、`kinari-md/body.css`（`.kinari-body`）、`kinari-md/mermaid`（`drawMermaid(body)`。`data-theme` の変化で描き直し、返した関数でやめる）、`kinari-md/tokens.css`
- md-leaf の今のコードと比べた
  - 変換：`callouts.ts`・`tables.ts`・`math.ts`・`highlight.ts` は中身が同じ。`markdown.ts` の流れ（プラグインの順・HTML のタグを文字にする・外へのリンク）と見出しの一覧も同じ。違いは、リンクと画像の書き換えがアプリから渡す関数（`resolve`）になったこと、書き換えたリンクの印が `data-note-link` から `data-internal-link` になったこと
  - 見た目：`note-body.css` と `body.css` は、クラス名・トークンの名前（`--color-code-bg`・`--color-callout-abstract` など）・文字の倍率（上の「決まっていないこと」）・見出しの `scroll-margin-top`（md-leaf に残す）のほかは同じ。kinari-md の Markdown の色の値は、md-leaf のトークンと同じ
  - 図：Mermaid の色と字の大きさの読み方は同じ
  - 依存の版（unified・remark・highlight.js・KaTeX・mermaid・yaml）は md-leaf と同じ

---

## 設計

データの変更はない。ノートの読み込み（`src/lib/notes.ts`）と、ページ・目次への渡し方（題・HTML・見出しの一覧）は今のまま。中で使う変換と、本文の見た目・図を kinari-md に替える。

### 変換（`src/lib/`）

- `src/lib/markdown.ts` を、kinari-md の `renderMarkdown` を呼ぶだけの薄い入口にする。今の `renderMarkdown(source, links?)` と `NoteLinkContext` の形は変えない（`notes.ts` は今のまま呼べる）
  - `links` があれば、`resolve` に渡す関数を作る。リンク（`kind: "link"`）は `note-links.ts` の `resolveNoteLink`、画像（`kind: "image"`）は `note-images.ts` の `resolveImageSrc` で決め、今と同じ条件で `missing` を返す（リンク：外を指す・一覧にない。画像：外を指す・対象外の拡張子・ファイルがない）。どちらも対象でなければ `undefined`（書き換えない）
  - 見出しの型は kinari-md の `Heading` を使う（形は今の `NoteHeading` と同じ）。`toc.tsx`・`note-body.tsx`・`notes.ts` はここから読む
- `note-images.ts` は `resolveImageSrc` だけを残す（hast のプラグイン `noteImages` と figure にする処理は kinari-md に任せる）。`note-links.ts` は変えない
- 消す：`callouts.ts`・`tables.ts`・`math.ts`・`highlight.ts`・`headings.ts` と、そのテスト（中身は kinari-md にあり、kinari-md がテストする）
- `next.config.ts` に `transpilePackages: ["kinari-md"]` を足す。Vitest で kinari-md（TS のまま）を読めなければ、`vitest.config.mts` で kinari-md を変換の対象にする（`server.deps.inline`）
- `next.config.ts` は `src/lib/notes.ts`（→ `markdown.ts` → kinari-md）を読む。設定を読むときに kinari-md を読めなければ、`listNotePaths`・`contentDir` が変換を読まずに済むようにファイルを分ける（どこで分けたかは「AIが決めたこと」に書く）

### 本文の見た目と図（`src/components/`・`src/styles/`）

- 本文の入れ物のクラスを `.note-body` から `.kinari-body` にする。`note-body.tsx` は `kinari-md/body.css` を読み（KaTeX の CSS は body.css が読むので、`katex/dist/katex.min.css` の読み込みを消す）、`kinari-md/tokens.css` は `globals.css` でトークンのあとに読む（`:root` と `[data-theme="dark"]` の変数なので、どのページでも同じに効かせる）
- `note-body.css` は、見出しの `scroll-margin-top`（`.kinari-body [data-heading]`）だけを残す。ほかに body.css との違いが見つかったら、仕様の「やらないこと」のとおり md-leaf では上書きせず、止まって伝える
- `src/styles/tokens.css` から、Markdown だけが使う色（`--color-abstract`・`--color-important`・`--color-caution`・`--color-code-keyword`・`--color-code-string`・`--color-code-comment` と、その `--c-*` のライト・ダークの値）と表の列の幅（`--table-col-m`・`--table-col-l`）を消す（kinari-md の tokens.css が同じ値を持つ）。`.reading` の `--text-*` の倍率は、ノートの題（h1）が使うので残す
- `note-body-content.tsx`：図は kinari-md の `drawMermaid(body)` を `useEffect` で呼び、返った関数で後片付けする。ノートへのリンクを見分ける印を `a[data-note-link]` から `a[data-internal-link]` にする（`router.push` の動きと、渡してよい href の前提は今のまま）。`src/components/mermaid.ts` を消す
- `eslint.config.mjs` の `no-unknown-classes` の `ignore` を `^note-body$` から `^kinari-body$` に替える
- 画面を動かすテスト（`e2e/`）の `.note-body` を `.kinari-body` に替える。画像の基準（`docs/specs/screens/`）は変えない

### 依存と文書

- `package.json` から、直接使わなくなるものを外す：`highlight.js`・`katex`・`mermaid`・`rehype-stringify`・`remark-breaks`・`remark-cjk-friendly`・`remark-rehype`、devDependencies の `@types/hast`・`@types/mdast`・`vfile`（`src/` と `scripts/` で読まなくなったものだけ）。保管庫の検査（`scripts/check-content.mjs`）が直接読む `unified`・`remark-parse`・`remark-gfm`・`remark-frontmatter`・`remark-math`・`yaml` は残す（版は kinari-md と同じなので1つにまとまる）
- `docs/libraries/kinari-md.md` を書く。外したライブラリの `docs/libraries/`（highlight.js・katex・mermaid・remark-breaks・remark-cjk-friendly）は消し、`unified.md`・`remark-math.md`・`yaml.md` は保管庫の検査での使い方だけにする
- `docs/design.md`（「全体の構成」の `src/lib/`・`note-body.css`、「トークンにない値を書かない」の `.note-body`、当てはまる場所）、`docs/overview.md`（技術の Markdown の変換・図の行）、`docs/ui.md`（abstract・important・caution の色が kinari-md のトークンになること）、`docs/specs/notes.md`（本文の出し方の言い方）、`CLAUDE.project.md`（技術の Markdown の変換の行）を合わせる

### 理由と残す場所

- 変換の入口（`markdown.ts`）を残して中だけ替える：`notes.ts` とページを変えずに済み、レビューで差を追いやすい。理由はコメントではなく、この仕様に残す（コードに経緯を書かない）
- リンクと画像の決め方を md-leaf に残す理由（ノートの URL とコンテンツフォルダの決まりは md-leaf のもの、保管庫の検査が書き写している）は、`docs/design.md` の「保管庫には決まりに合うものだけを置く」の前提に残す
- 本文の HTML を `dangerouslySetInnerHTML` で入れてよい前提（HTML のタグは文字にし、raw を作るのは KaTeX と highlight.js だけ）は kinari-md が持つ。`note-body-content.tsx` のコメントで kinari-md の決まりを指す
- `scroll-margin-top` を md-leaf に残す理由（上の帯の高さは md-leaf の画面の決まり）は `note-body.css` のコメントに残す

## AIが決めたこと

- プロトタイプは作らない。理由：読む人から見た画面が変わらない（内部の差し替え）
- 本文の入れ物のクラスは `.kinari-body` にし、本文の文字の大きさを変える `.reading` の入れ物は今のまま残す。理由：kinari-md は `.kinari-body` の中だけを描き、本文の文字の大きさは `--reading-size` を読む。ノートの題（h1）は md-leaf の部品なので `.reading` の倍率を使い続ける
- 見出しの `scroll-margin-top`（上の帯に隠れないため）は md-leaf の CSS に残す。理由：上の帯の高さは md-leaf の画面の決まりで、kinari-md は知らない（Issue のとおり）
- リンクと画像の書き換え（`note-links.ts`・`note-images.ts`）は md-leaf に残し、`renderMarkdown` の `resolve` に渡す1つの関数にまとめる。理由：ノートの URL とコンテンツフォルダの決まりは md-leaf のもの。保管庫の検査（`.mjs`）が同じ決まりを書き写しているので、そちらも今のまま合わせておく
- Markdown だけが使う色と表の列の幅は、md-leaf のトークンファイルから外す。理由：同じ値を2か所に持たない。値は kinari-md と同じなので、見た目は変わらない
- 直接使わなくなるパッケージ（unified・remark・rehype・highlight.js・KaTeX・yaml・mermaid）は md-leaf の依存から外す。理由：版を kinari-md の1か所で決める。md-leaf に残すと、版がずれて同じものが2つ入りうる
- kinari-md の版はタグで固定する（`#v0.1.1`）。理由：README の入れ方のとおり。npm には出していない
- 外す依存は「`src/` と `scripts/` で直接読まなくなったもの」だけにした。理由：保管庫の検査（`scripts/check-content.mjs`）が unified・remark・yaml を直接読んでおり、仕様の「やらないこと」で検査は md-leaf に残す。比べた案：全部外して kinari-md から引き込まれるものに頼る（npm の置き方しだいで読めなくなるので選ばない）
- 変換のテストは、md-leaf が持つもの（リンクと画像の決め方、`resolve` のつなぎ方、題の扱い、HTML のタグが文字になること1件）だけを残し、コールアウト・表・数式・コード・見出しの一覧のテストは消す。理由：同じテストを kinari-md と2か所に持たない。見た目は画像を比べるテストが基準の画像のまま通ることで確かめる
- Vitest の `server.deps.inline` は足さない。理由：足さずに `npm test` で kinari-md（TS のまま）を読めた（Vitest は `node_modules` の中でも `.ts` のファイルは外に出さずに変換する）
- `next.config.ts` が `notes.ts` 経由で kinari-md を読むままにし、ファイルは分けない。理由：`next typegen`（`npm run typecheck`）と `next build`（`CONTENT_DIR=e2e/fixtures/content`）で設定を読めた
- `kinari-md/tokens.css` は `globals.css` で、`kinari-md/body.css` は `note-body.tsx` で読む。理由：トークンは `:root` の変数で、ほかのトークンと同じ場所にそろえる。本文の CSS（KaTeX を含む）は、今の KaTeX の CSS と同じく本文の部品が読む

## 確かめ方

| 受け入れ条件 | 確かめ方 |
| --- | --- |
| 本文が今と同じ見た目（ライト・ダーク） | テスト：画像を比べるテスト（`npm run test:visual`）が、基準の画像（`docs/specs/screens/`）を撮り直さずに通る。画面を動かすテスト（`e2e/notes.spec.ts`）のコールアウト・数式・表・図の確かめも通る |
| 文字の大きさを変えると本文だけが同じ比率で変わる | テスト：`e2e/reading-size.spec.ts` と、文字の大きさごとの画像のテストが基準のまま通る |
| フロントマターを出さず、`title` かファイル名を題にする | テスト：`src/lib/markdown.test.ts`・`src/lib/notes.test.ts` |
| 目次が今と同じに出て、押すと見出しが上の帯のすぐ下に来る | テスト：`e2e/toc.spec.ts` |
| 相対リンクで読み込み直さずに移る・ないときは「ノートが見つかりません」・外へのリンクは別のタブ | テスト：`src/lib/markdown.test.ts`（書き換えと `data-internal-link`・切れたリンクの一覧・外へのリンク）、`src/components/note-body-content.test.tsx`、`e2e/notes.spec.ts` |
| 画像が今と同じに出る・切れた画像は出さず警告 | テスト：`src/lib/markdown.test.ts`（`/files/` への書き換えと切れた画像の一覧）、`src/lib/notes.test.ts`（警告）、画像の入ったノートの画像のテスト |
| ライト・ダークを切り替えると図が描き直される | テスト：`e2e/theme.spec.ts`（ボタンで選んだときと、端末の設定が変わったとき） |
| HTML のタグは文字として出る | テスト：`src/lib/markdown.test.ts` |
| 保管庫の検査とビルドの止め方は変わらない | テスト：`scripts/check-content.test.mjs`・`scripts/prepare-content.test.mjs`。触って確かめる：PR の Vercel のプレビューのビルドが成功する（GitHub のタグから kinari-md を取れる） |

## タスク

- [ ] 変換を kinari-md に替える：`markdown.ts` が kinari-md の `renderMarkdown` に `resolve` を渡す入口になり、消すファイル（callouts・tables・math・highlight・headings）を消し、本文のリンクの印が `data-internal-link` になって、`npm test`・`npm run typecheck` が通ったら完了（本文の CSS はまだ `.note-body` のまま。HTML は今と同じなので見た目は変わらない）
- [ ] 本文の見た目と図を kinari-md に替える：本文が `.kinari-body` と kinari-md の CSS・トークンで出て、図が `drawMermaid` で描かれ、md-leaf のトークンから Markdown だけの値が消え、画像を比べるテストが基準の画像（`docs/specs/screens/` のすべて。撮り直さない）のまま通ったら完了
- [ ] 依存と文書を整える：直接使わなくなるパッケージを `package.json` から外し、`docs/libraries/kinari-md.md` を書き、`docs/design.md`・`docs/overview.md`・`docs/ui.md`・`docs/specs/notes.md`・`CLAUDE.project.md`・`docs/libraries/` が今のコードに合ったら完了
