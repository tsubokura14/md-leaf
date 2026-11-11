import type { Element, Root as HastRoot } from "hast";

/** 表を、横にスクロールする枠（div.table-scroll）で包む */
export function wrapTables() {
  return (tree: HastRoot) => {
    const walk = (node: HastRoot | Element) => {
      node.children.forEach((child, index) => {
        if (child.type !== "element") return;
        if (child.tagName === "table") {
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
