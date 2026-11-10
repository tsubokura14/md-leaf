# next-auth（Auth.js）

書いた時点のバージョン：5.0.0-beta.32（beta のため、版を固定している）

## 何か

Next.js にログインの仕組みを足すライブラリ。Auth.js の Next.js 向けの版。Google などの OAuth でのログイン、ログインの状態を持つ Cookie、ログイン・ログアウトの処理をまとめて受け持つ。

- 公式：https://authjs.dev/
- Next.js での使い方：https://authjs.dev/reference/nextjs
- Google：https://authjs.dev/getting-started/providers/google

## このプロジェクトで使っている部分

- `src/auth.ts`：設定。`NextAuth({...})` が返す `handlers`・`auth`・`signIn`・`signOut` を出す
  - `providers: [Google]`：Google でログインする。ID と秘密の値は、環境変数 `AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET` から自動で読まれる。Cookie の暗号化には `AUTH_SECRET` が使われる
  - `session`：`strategy: "jwt"`（暗号化した Cookie にログインの状態を持つ。データベースを使わない）、`maxAge`（ログインの期限）
  - `pages`：ログインの画面と、失敗したときに戻る先を `/login` にする。失敗したときは `?error=<種類>`（`AccessDenied` など）が付く
  - `callbacks.signIn`：Google から戻ったときに呼ばれ、`false` を返すとログインさせない
- `src/app/api/auth/[...nextauth]/route.ts`：`handlers` の `GET`・`POST` を出す。Google から戻る先（`/api/auth/callback/google`）などは、ここで受ける
