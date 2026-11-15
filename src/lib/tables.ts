import type { Element, ElementContent, Root as HastRoot } from "hast";

/*
 * 列の幅の段階の境目（いちばん長いセルの文字数。全角2・半角1）。
 * 幅の値はトークン（--table-col-m・--table-col-l）にある。境目はビルドのときに使うので、CSS のトークンに置けずここに置く。
 * 本番のスマホで表を見て調整する前提の値（Issue #19）
 */
const SHORT_MAX = 10; // 全角5文字まで：折り返さない
const MEDIUM_MAX = 24; // 全角12文字まで：中くらいの幅で折り返す。超えたら長い列

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

/** 全角（ASCII 以外）を2、半角を1として数える */
function widthOf(text: string): number {
  let width = 0;
  for (const char of text.trim()) width += char.charCodeAt(0) < 0x80 ? 1 : 2;
  return width;
}

function columnClass(width: number): string {
  if (width <= SHORT_MAX) return "col-s";
  if (width <= MEDIUM_MAX) return "col-m";
  return "col-l";
}

const isElement = (node: ElementContent, tag: string): node is Element =>
  node.type === "element" && node.tagName === tag;

/** 表の各セルに、列のいちばん長いセルの文字数で決めた段階のクラスを付ける */
function classifyColumns(table: Element) {
  const rows: Element[] = [];
  for (const section of table.children) {
    if (section.type !== "element") continue;
    if (section.tagName === "tr") rows.push(section);
    else rows.push(...section.children.filter((row) => isElement(row, "tr")));
  }
  const cellsOf = (row: Element) =>
    row.children.filter((cell) => isElement(cell, "th") || isElement(cell, "td")) as Element[];

  const widths: number[] = [];
  for (const row of rows) {
    cellsOf(row).forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, widthOf(textOf(cell)));
    });
  }
  for (const row of rows) {
    cellsOf(row).forEach((cell, i) => {
      cell.properties = { ...cell.properties, className: [columnClass(widths[i])] };
    });
  }
}

/** 表を、横にスクロールする枠（div.table-scroll）で包み、列に幅の段階のクラスを付ける */
export function wrapTables() {
  return (tree: HastRoot) => {
    const walk = (node: HastRoot | Element) => {
      node.children.forEach((child, index) => {
        if (child.type !== "element") return;
        if (child.tagName === "table") {
          classifyColumns(child);
          node.children[index] = {
            type: "element",
            tagName: "div",
            properties: { className: ["table-scroll"] },
            children: [child],
          };
          return;
        }
        walk(child);
      });
    };
    walk(tree);
  };
}
