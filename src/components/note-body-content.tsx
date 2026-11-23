"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { renderMermaid } from "./mermaid";

type NoteBodyContentProps = {
  html: string;
};

// 本文は src/lib/markdown.ts が作った HTML の文字列なので、リンクを next/link にできない。
// そこで本文のクリックを1か所で受け、ノートへのリンク（data-internal-link。kinari-md が、markdown.ts の渡す関数で
// ノートの URL に書き換えたリンクにだけ付ける）なら router.push で、ページを読み込み直さずに移る。
// href は markdown.ts が作った「/」か「/notes/...」だけなので、router.push に渡してよい（javascript: などは来ない）。
// 新しいタブで開く（Ctrl・⌘・Shift・Alt 付き、中ボタン）や、ほかで止めたクリック（defaultPrevented）は、
// ブラウザに任せる。React がつながる前に押したときも、ふつうのリンクとして移る

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

// 描くあいだと描いたあとの SVG の id。ページの中で重ならないよう、描くたびに数を進める
let diagramCount = 0;

// mermaid が付ける幅（width="100%" と、もとの幅の max-width）を、もとの幅に直す。
// 収まらない図は枠の中で横にスクロールする（note-body.css の .mermaid-figure。決まりは docs/ui.md の「図（Mermaid）」）
function keepNaturalWidth(svg: SVGSVGElement) {
  const naturalWidth = svg.style.maxWidth;
  if (!naturalWidth) return;
  svg.setAttribute("width", naturalWidth);
  svg.style.removeProperty("max-width");
}

// 本文の中の pre[data-mermaid]（kinari-md の変換が付ける）を、1つずつ図に替える。
// 描き終わるまでと、描けなかったときは pre（元のコード）を残す。
// 図（.mermaid-figure）には元のコードを data-mermaid-source に残し、ライト・ダークが変わったら、それから描き直す
// （renderMermaid は描くたびにトークンから色を読むので、描き直せば今の色になる）。
// 本文は dangerouslySetInnerHTML で入れてあり、React は html が変わるまで中に触らないので、ここで書き換えてよい
async function drawDiagrams(body: HTMLElement, isCancelled: () => boolean) {
  const targets = body.querySelectorAll<HTMLElement>(
    "pre[data-mermaid], .mermaid-figure[data-mermaid-source]",
  );
  for (const target of targets) {
    const source =
      target.tagName === "PRE" ? (target.textContent ?? "") : (target.dataset.mermaidSource ?? "");
    let svg: string;
    try {
      diagramCount += 1;
      svg = await renderMermaid(`mermaid-diagram-${diagramCount}`, source);
    } catch {
      continue;
    }
    if (isCancelled() || !target.isConnected) return;
    const figure = document.createElement("div");
    figure.className = "mermaid-figure";
    figure.dataset.mermaidSource = source;
    figure.innerHTML = svg;
    const svgElement = figure.querySelector("svg");
    if (svgElement) keepNaturalWidth(svgElement);
    target.replaceWith(figure);
  }
}

function isDark(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/** ノートの本文（HTML）。ノートへのリンクを押すと、読み込み直さずに移る。Mermaid の図はここで描き、ライト・ダークが変わると描き直す */
export function NoteBodyContent({ html }: NoteBodyContentProps) {
  const router = useRouter();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    // 描くたびに数を進め、新しく描き始めたら、前の描きかけ（古い色）は捨てる
    let run = 0;
    const draw = () => {
      run += 1;
      const current = run;
      void drawDiagrams(body, () => current !== run);
    };
    draw();
    // 今出している色は <html> の data-theme だけで決まる（src/components/theme.ts）。ボタンで選んだときも、
    // 「端末に合わせる」で端末の設定が変わったときも、ここで同じように描き直す
    let dark = isDark();
    const observer = new MutationObserver(() => {
      if (isDark() === dark) return;
      dark = isDark();
      draw();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      observer.disconnect();
      run += 1;
    };
  }, [html]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!isPlainLeftClick(event)) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[data-internal-link]");
    if (!(link instanceof HTMLAnchorElement) || !event.currentTarget.contains(link)) return;
    const href = link.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    router.push(href);
  }

  return (
    // クリックはリンク（a）で起きたものだけを扱い、キーボードの Enter もリンクのクリックとして届くので、
    // div 自身にキー操作や役割は要らない
    <div
      ref={bodyRef}
      className="note-body mt-6"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
