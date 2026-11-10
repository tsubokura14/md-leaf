import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals を使わない設定なので、Testing Library の自動の後片付けが動かない。ここで行う
afterEach(() => {
  cleanup();
});
