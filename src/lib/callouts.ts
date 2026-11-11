import type { Element, ElementContent } from "hast";
import type { Blockquote, Paragraph, PhrasingContent, Root as MdastRoot, RootContent } from "mdast";

type CalloutColor = "note" | "tip" | "warning" | "danger";

// Obsidian 標準の種類（別名を含む）を、トークンの4色にまとめる（docs/specs/notes.md の「本文のブロック」の表）
const colorOfKind: Record<string, CalloutColor> = {
  note: "note",
  abstract: "note",
  summary: "note",
  tldr: "note",
  info: "note",
  todo: "note",
  example: "note",
  quote: "note",
  cite: "note",
  tip: "tip",
  hint: "tip",
  important: "tip",
  success: "tip",
  check: "tip",
  done: "tip",
  warning: "warning",
  caution: "warning",
  attention: "warning",
  question: "warning",
  help: "warning",
  faq: "warning",
  danger: "danger",
  error: "danger",
  failure: "danger",
  fail: "danger",
  missing: "danger",
  bug: "danger",
};

function path(d: string): Element {
  return { type: "element", tagName: "path", properties: { d }, children: [] };
}

function circle(cx: string, cy: string, r: string): Element {
  return {
    type: "element",
    tagName: "circle",
    properties: { cx, cy, r },
    children: [],
  };
}

// アイコンは src/components/icons.tsx と同じ形（24 の枠、線で描き、色は currentColor）
const iconShapes: Record<CalloutColor, Element[]> = {
  // 丸に「i」
  note: [circle("12", "12", "9"), path("M12 11v5"), path("M12 8h.01")],
  // 電球
  tip: [
    path("M9 18h6"),
    path("M10 21h4"),
    path("M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"),
  ],
  // 三角に「!」
  warning: [path("M12 3 2 20h20L12 3Z"), path("M12 9v5"), path("M12 17h.01")],
  // 丸に「!」
  danger: [circle("12", "12", "9"), path("M12 7v6"), path("M12 16h.01")],
};

function svg(className: string, children: Element[]): Element {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      className: [className],
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
    },
    children,
  };
}

// 中身のない mdast の段落を、hast の要素（アイコンなど）として出すための入れ物
function hastNode(element: Element): Paragraph {
  return {
    type: "paragraph",
    children: [],
    data: {
      hName: element.tagName,
      hProperties: element.properties,
      hChildren: element.children as ElementContent[],
    },
  };
}

const markerPattern = /^\[!([^\]\s]+)\]([-+]?)[ \t]*/;

type Header = {
  kind: string;
  fold: "" | "-" | "+";
  title: PhrasingContent[];
  /** 1行目より後の、最初の段落の残り */
  rest: PhrasingContent[];
};

// 引用の最初の段落の1行目から、種類・開閉・題を読む。[!種類] で始まらなければ undefined
function readHeader(first: RootContent | undefined): Header | undefined {
  if (first?.type !== "paragraph") return undefined;
  const head = first.children[0];
  if (head?.type !== "text") return undefined;
  const marker = head.value.match(markerPattern);
  if (!marker) return undefined;

  const children: PhrasingContent[] = [
    { ...head, value: head.value.slice(marker[0].length) },
    ...first.children.slice(1),
  ];
  const title: PhrasingContent[] = [];
  const rest: PhrasingContent[] = [];
  let inTitle = true;
  for (const child of children) {
    if (!inTitle) {
      rest.push(child);
      continue;
    }
    const newline = child.type === "text" ? child.value.indexOf("\n") : -1;
    if (child.type === "text" && newline >= 0) {
      title.push({ type: "text", value: child.value.slice(0, newline) });
      const after = child.value.slice(newline + 1);
      if (after !== "") rest.push({ type: "text", value: after });
      inTitle = false;
    } else if (child.type === "break") {
      inTitle = false;
    } else {
      title.push(child);
    }
  }
  return { kind: marker[1], fold: marker[2] as Header["fold"], title: trimTitle(title), rest };
}

function trimTitle(title: PhrasingContent[]): PhrasingContent[] {
  const trimmed = title.map((node, index) => {
    if (node.type !== "text") return node;
    let value = node.value;
    if (index === 0) value = value.trimStart();
    if (index === title.length - 1) value = value.trimEnd();
    return { ...node, value };
  });
  return trimmed.filter((node) => node.type !== "text" || node.value !== "");
}

function defaultTitle(kind: string): string {
  const lower = kind.toLowerCase();
  // 知らない種類は、書いたままの種類名を題にする
  if (!(lower in colorOfKind)) return kind;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toCallout(node: Blockquote, header: Header): Blockquote {
  const color = colorOfKind[header.kind.toLowerCase()] ?? "note";
  const foldable = header.fold !== "";

  const titleText: Paragraph = {
    type: "paragraph",
    children:
      header.title.length > 0 ? header.title : [{ type: "text", value: defaultTitle(header.kind) }],
    data: { hName: "span", hProperties: { className: ["callout-title-text"] } },
  };
  const titleRow: Paragraph = {
    type: "paragraph",
    children: [
      hastNode(svg("callout-icon", iconShapes[color])),
      titleText,
      ...(foldable ? [hastNode(svg("callout-chevron", [path("m9 6 6 6-6 6")]))] : []),
    ] as unknown as PhrasingContent[],
    data: {
      hName: foldable ? "summary" : "div",
      hProperties: { className: ["callout-title"] },
    },
  };

  const contentChildren = [
    ...(header.rest.length > 0 ? [{ type: "paragraph", children: header.rest } as Paragraph] : []),
    ...node.children.slice(1),
  ];
  const content: Blockquote | undefined =
    contentChildren.length > 0
      ? {
          type: "blockquote",
          children: contentChildren,
          data: { hName: "div", hProperties: { className: ["callout-content"] } },
        }
      : undefined;

  return {
    type: "blockquote",
    children: content ? [titleRow, content] : [titleRow],
    data: {
      hName: foldable ? "details" : "div",
      hProperties: {
        className: ["callout"],
        dataCallout: color,
        ...(header.fold === "+" ? { open: true } : {}),
      },
    },
  };
}

type Parent = { children: RootContent[] };

/**
 * `> [!種類]` で始まる引用を、コールアウトにする（mdast の段階。hast の形は data.hName などで指定する）。
 * 開閉するもの（`-`・`+`）は details ＋ summary、開閉しないものは div。色は data-callout で CSS が決める
 */
export function callouts() {
  return (tree: MdastRoot) => {
    const walk = (parent: Parent) => {
      parent.children.forEach((child, index) => {
        if (child.type === "blockquote") {
          const header = readHeader(child.children[0]);
          if (header) {
            const callout = toCallout(child, header);
            parent.children[index] = callout;
            // 中身の入れ物そのものは調べない（中身の1行目が [!種類] で始まっても、文字のまま出すため）
            const content = callout.children[1];
            if (content?.type === "blockquote") walk(content);
            return;
          }
        }
        if ("children" in child && Array.isArray(child.children)) walk(child as Parent);
      });
    };
    walk(tree);
  };
}
