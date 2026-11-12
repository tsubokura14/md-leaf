// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  READING_SIZE_KEY,
  currentReadingSize,
  readingSizeScript,
  setReadingSize,
} from "./reading-size";

/** layout.tsx の <head> に埋めたときと同じく、文字列のスクリプトを動かす */
function runHeadScript() {
  new Function(readingSizeScript)();
}

function appliedSize() {
  return document.documentElement.style.getPropertyValue("--reading-size");
}

/** 保存が禁止されているブラウザと同じく、localStorage に触ると例外を投げる */
function denyStorage() {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("style");
});

describe("開いたときに当てる大きさ（<head> のスクリプト）", () => {
  test("保存した大きさを <html> に当てる", () => {
    window.localStorage.setItem(READING_SIZE_KEY, "14");
    runHeadScript();
    expect(appliedSize()).toBe("14px");
    expect(currentReadingSize()).toBe(14);
  });

  test("一度も選んでいなければ 16px", () => {
    runHeadScript();
    expect(currentReadingSize()).toBe(16);
  });

  test("保存した値が選択肢にないときは 16px", () => {
    window.localStorage.setItem(READING_SIZE_KEY, "15");
    runHeadScript();
    expect(currentReadingSize()).toBe(16);
  });

  test("保存を読めなくても、エラーを出さずに 16px", () => {
    denyStorage();
    expect(runHeadScript).not.toThrow();
    expect(currentReadingSize()).toBe(16);
  });
});

describe("選んだ大きさを当てて保存する", () => {
  test("その場で当てて、保存する", () => {
    setReadingSize(14);
    expect(appliedSize()).toBe("14px");
    expect(currentReadingSize()).toBe(14);
    expect(window.localStorage.getItem(READING_SIZE_KEY)).toBe("14");
  });

  test("保存できなくても、エラーを出さずにその場では当てる", () => {
    denyStorage();
    expect(() => setReadingSize(14)).not.toThrow();
    expect(currentReadingSize()).toBe(14);
  });
});
