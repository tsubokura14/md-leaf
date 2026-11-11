# remark-math

書いた時点のバージョン：6.0.0

## 何か

Markdown の中の数式の書き方（`$...$`・`$$...$$`）を読み、mdast の `inlineMath`・`math` の節にする remark のプラグイン（unified の仲間。`docs/libraries/unified.md`）。式の形にする（描く）ことはしない。

- 公式：https://github.com/remarkjs/remark-math

## このプロジェクトで使っている部分

- `src/lib/markdown.ts` で、`remark-gfm` のあとに `.use(remarkMath)` で足す（オプションは既定のまま）
  - 既定では `$` 1つで囲んだものも文の中の数式になる。`$` が1つだけ（「100$」）なら数式にならない
- remark-rehype が、文の中の数式を `code.math-inline`、段落の外の `$$...$$` を `pre > code.math-display` にする。これを `src/lib/math.ts` が KaTeX で式にする（`docs/libraries/katex.md`）
