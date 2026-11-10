// 画面を動かすテストのサーバーに渡す、テストのときだけの値。本番の値は使わない（許可するアドレスも example.com のもの）。
// Google のクライアントはダミーで、テストでは Google へ向かうリクエストの URL だけを確かめる。
// ログイン中の Cookie を作る e2e/session.ts も、同じ AUTH_SECRET を使う
export const testServerEnv = {
  AUTH_SECRET: "test-only-secret-not-used-in-production-0123456789",
  AUTH_GOOGLE_ID: "test-google-client-id",
  AUTH_GOOGLE_SECRET: "test-google-client-secret",
  ALLOWED_EMAILS: "allowed@example.com",
  AUTH_TRUST_HOST: "true",
};

export const allowedTestEmail = "allowed@example.com";
