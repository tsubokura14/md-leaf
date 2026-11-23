# remark-math

書いた時点のバージョン：6.0.0

## 何か

Markdown の中の数式の書き方（`$...$`・`$$...$$`）を読み、mdast の `inlineMath`・`math` の節にする remark のプラグイン（unified の仲間。`docs/libraries/unified.md`）。式の形にする（描く）ことはしない。

- 公式：https://github.com/remarkjs/remark-math

## このプロジェクトで使っている部分

- 保管庫の検査（`scripts/check-content.mjs`）で、`remark-frontmatter` のあとに `.use(remarkMath)` で足す（オプションは既定のまま）
  - 数式の中の `[[` を `[[ ]]` の書き方と見間違えないよう、`inlineMath`・`math` の節の範囲を伏せてから探す
  - 既定では `$` 1つで囲んだものも文の中の数式になる。`$` が1つだけ（「100$」）なら数式にならない
- 表示の数式（KaTeX で描く）は kinari-md の中で行う（`docs/libraries/kinari-md.md`）
