import type { Element, ElementContent } from "hast";
import type { Blockquote, Paragraph, PhrasingContent, Root as MdastRoot, RootContent } from "mdast";

type CalloutKind =
  | "abstract"
  | "info"
  | "note"
  | "example"
  | "tip"
  | "important"
  | "question"
  | "success"
  | "warning"
  | "caution"
  | "danger";

type CalloutColor = "abstract" | "note" | "tip" | "important" | "warning" | "caution" | "danger";

// 書いた種類（別名を含む）を、本来の種類（保管庫の決まりの11種類）に直す（docs/specs/notes.md の「本文のブロック」の表）。
// todo・quote・failure・bug など決まりにない種類は note にする。ここにない種類も note
const kindOfName: Record<string, CalloutKind> = {
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  note: "note",
  todo: "note",
  quote: "note",
  cite: "note",
  failure: "note",
  fail: "note",
  missing: "note",
  bug: "note",
  example: "example",
  tip: "tip",
  hint: "tip",
  important: "important",
  question: "question",
  help: "question",
  faq: "question",
  success: "success",
  check: "success",
  done: "success",
  warning: "warning",
  attention: "warning",
  caution: "caution",
  danger: "danger",
  error: "danger",
};

// 色はトークンの7色、アイコンは種類ごとの11個と数が違うので、表を分ける（docs/ui.md のコールアウト）
const colorOfKind: Record<CalloutKind, CalloutColor> = {
  abstract: "abstract",
  info: "note",
  note: "note",
  example: "abstract",
  tip: "tip",
  important: "important",
  question: "warning",
  success: "tip",
  warning: "warning",
  caution: "caution",
  danger: "danger",
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
const iconShapes: Record<CalloutKind, Element[]> = {
  // 横線を並べた紙
  abstract: [
    path("M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"),
    path("M9 8h6"),
    path("M9 12h6"),
    path("M9 16h3"),
  ],
  // 丸に「i」
  info: [circle("12", "12", "9"), path("M12 11v5"), path("M12 8h.01")],
  // 鉛筆
  note: [path("M16 3.5a2.1 2.1 0 0 1 3 3L7.5 18 3 19.5 4.5 15 16 3.5Z"), path("m14 5.5 3 3")],
  // リスト
  example: [
    path("M9 6h11"),
    path("M9 12h11"),
    path("M9 18h11"),
    path("M4 6h.01"),
    path("M4 12h.01"),
    path("M4 18h.01"),
  ],
  // 星
  important: [
    path("m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z"),
  ],
  // 丸に「?」
  question: [
    circle("12", "12", "9"),
    path("M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7"),
    path("M12 17h.01"),
  ],
  // チェック
  success: [path("M20 6 9 17l-5-5")],
  // 八角形に「!」
  caution: [
    path("M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3L8.3 3Z"),
    path("M12 8v4"),
    path("M12 16h.01"),
  ],
  // 稲妻
  danger: [path("M13 2 4 14h7l-1 8 9-12h-7l1-8Z")],
  // 電球
  tip: [
    path("M9 18h6"),
    path("M10 21h4"),
    path("M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"),
  ],
  // 三角に「!」
  warning: [path("M12 3 2 20h20L12 3Z"), path("M12 9v5"), path("M12 17h.01")],
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
  if (!(lower in kindOfName)) return kind;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toCallout(node: Blockquote, header: Header): Blockquote {
  const kind = kindOfName[header.kind.toLowerCase()] ?? "note";
  const color = colorOfKind[kind];
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
      hastNode(svg("callout-icon", iconShapes[kind])),
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
