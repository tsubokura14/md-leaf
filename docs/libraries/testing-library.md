# Testing Library（React・DOM・jest-dom）

書いた時点のバージョン：`@testing-library/react` 16.3.3、`@testing-library/dom` 10.4.2、`@testing-library/jest-dom` 6.9.1

## 何か

部品を描いて、使う人と同じように「見えている文字」や「役割（ボタン、見出し）」で要素を探してテストする道具。

- 公式：https://testing-library.com/docs/react-testing-library/intro/
- jest-dom：https://github.com/testing-library/jest-dom

## このプロジェクトで使っている部分

- `@testing-library/react`：`render`、`screen`（`getByRole` など）
- `@testing-library/dom`：`@testing-library/react` が使う本体
- `@testing-library/jest-dom`：`toBeInTheDocument` などの判定を足す
- `vitest.setup.ts`：jest-dom の読み込みと、テストごとの後片付け（`cleanup`）。`dom` のテストだけで読む
