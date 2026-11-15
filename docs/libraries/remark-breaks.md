# remark-breaks

書いた時点のバージョン：4.0.0

## 何か

段落などの中の1つの改行を、mdast の `break`（HTML の `<br>`）にする remark のプラグイン（unified の仲間。`docs/libraries/unified.md`）。Obsidian の既定（「厳密な改行」を切った状態）と同じ読み方にする。

- 公式：https://github.com/remarkjs/remark-breaks

## このプロジェクトで使っている部分

- `src/lib/markdown.ts` で、`callouts` のあとに `.use(remarkBreaks)` で足す（オプションはない）。順番の理由は `.use()` の隣のコメント
- `text` の節の中の改行だけを変えるので、コード・数式のブロックは変わらない
