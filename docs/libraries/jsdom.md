# jsdom

書いた時点のバージョン：31.0.0

## 何か

ブラウザの DOM を Node.js の中でまねる道具。ブラウザを起動せずに部品のテストができる。見た目（配置や色）は計算しない。

- 公式：https://github.com/jsdom/jsdom

## このプロジェクトで使っている部分

- Vitest の `dom` のテスト（`src/` の `*.test.tsx`）の環境として使う（`vitest.config.mts` の `environment: "jsdom"`）
