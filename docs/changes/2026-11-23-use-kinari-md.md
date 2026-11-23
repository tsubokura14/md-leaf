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
- 画面の画像（`docs/specs/screens/`）：変えない（下の「決まっていないこと」の答えで変わりうる）

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
- 下の「決まっていないこと」1つ目の答えによっては、kinari-md の直し（新しい版）

## 決まっていないこと

- [ ] kinari-md v0.1.0 の本文の文字の倍率が、md-leaf の今の倍率と少し違う。どう揃える？
  - 違い（本文の大きさを1として）：h2 は md-leaf 1.41 倍・kinari-md 1.5 倍、h3 は 1.18 倍・1.25 倍、小さめの字（コード・表・コールアウトの見出し・画像の代わりの文字）は 0.82 倍・0.875 倍。16px のとき、h2 が 22.6px から 24px に、コードが 13.1px から 14px になる。ほかの見た目（色・余白・枠・並び）と変換の HTML は同じだった
  - 原因の見立て：kinari-md は md-leaf の rem の値（h2 は 1.5rem）を、本文の大きさ（md-leaf では 1.0625rem）ではなく 1rem を1として倍率にしている。kinari-md のコメントも「md-leaf の値を、本文の大きさを 1 として書いた」としており、ずれは意図したものではないと思われる
  - 推す答え：**kinari-md を先に直し（md-leaf の今の倍率に合わせる）、新しい版（v0.1.1）を出してから、md-leaf はその版を入れる**。良い点：Issue のとおり画面が変わらず、正しい値が kinari-md の1か所に入る。kinari-md を使っているアプリはまだない（memory-forge はまだ入れていない）ので、ほかに影響しない。悪い点：kinari-md の Issue と PR が1つ先に要り、#34 はそれを待つ
  - 比べた案1：v0.1.0 の倍率をそのまま受け入れ、見出し・コードなどが少し大きくなった画像に撮り直す。良い点：すぐ進められる。悪い点：Issue の「画面は今と変えない」と食い違う。本文が写る画像がほとんど変わり、レビューで差を確かめにくい
  - 比べた案2：md-leaf の CSS で倍率を上書きする。良い点：kinari-md を待たない。悪い点：1か所で直すという目的に反し、kinari-md を直したときに上書きが残る

## 技術の確認表

| 項目 | 当てはまるもの | 決めた人 |
| --- | --- | --- |
| 保存するデータ | なし（変えない） | AI |
| 外部サービス | なし（GitHub の公開リポジトリから入れる。Vercel のビルドは鍵なしで取れる） | AI |
| 認証・権限 | なし（ログインの確かめは変えない） | AI |
| 費用 | なし | AI |
| 個人情報 | なし | AI |
| デプロイの環境 | 変えない（`npm install` が GitHub のタグから kinari-md を取る） | AI |
| 新しいライブラリ | kinari-md（`github:tsubokura14/kinari-md#v<版>`。npm には出していない。TypeScript のまま配るので `next.config.ts` の `transpilePackages` でビルドする）。直接使わなくなる unified・remark・rehype・highlight.js・KaTeX・yaml・mermaid は md-leaf の依存から外す（kinari-md が持つ） | 人（Issue）・AI |
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

<!-- /dev-build で書く -->

## AIが決めたこと

- プロトタイプは作らない。理由：読む人から見た画面が変わらない（内部の差し替え）
- 本文の入れ物のクラスは `.kinari-body` にし、本文の文字の大きさを変える `.reading` の入れ物は今のまま残す。理由：kinari-md は `.kinari-body` の中だけを描き、本文の文字の大きさは `--reading-size` を読む。ノートの題（h1）は md-leaf の部品なので `.reading` の倍率を使い続ける
- 見出しの `scroll-margin-top`（上の帯に隠れないため）は md-leaf の CSS に残す。理由：上の帯の高さは md-leaf の画面の決まりで、kinari-md は知らない（Issue のとおり）
- リンクと画像の書き換え（`note-links.ts`・`note-images.ts`）は md-leaf に残し、`renderMarkdown` の `resolve` に渡す1つの関数にまとめる。理由：ノートの URL とコンテンツフォルダの決まりは md-leaf のもの。保管庫の検査（`.mjs`）が同じ決まりを書き写しているので、そちらも今のまま合わせておく
- Markdown だけが使う色と表の列の幅は、md-leaf のトークンファイルから外す。理由：同じ値を2か所に持たない。値は kinari-md と同じなので、見た目は変わらない
- 直接使わなくなるパッケージ（unified・remark・rehype・highlight.js・KaTeX・yaml・mermaid）は md-leaf の依存から外す。理由：版を kinari-md の1か所で決める。md-leaf に残すと、版がずれて同じものが2つ入りうる
- kinari-md の版はタグで固定する（`#v0.1.x`）。理由：README の入れ方のとおり。npm には出していない

## 確かめ方

<!-- /dev-build で書く -->

## タスク

<!-- /dev-build で書く -->
