// Mermaid の図をブラウザで描く。mermaid は大きいので、図のあるノートを開いたときにだけ読み込む

function token(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

/**
 * Mermaid の図を描き、SVG の文字列を返す。書き方が間違っていて描けなければ例外を投げる。
 * id は、描くあいだだけ mermaid がページに置く要素の id（ページの中で重ならないもの）
 */
export async function renderMermaid(id: string, source: string): Promise<string> {
  const { default: mermaid } = await import("mermaid");
  // 色と文字は、描くたびにトークンから読む（ライト・ダークが変わったときの描き直しは note-body-content.tsx）。
  // 箱の地は、図の枠（surface）の上で見分けられるよう bg にする
  const styles = getComputedStyle(document.documentElement);
  const text = token(styles, "--color-text");
  const border = token(styles, "--color-border");
  const surface = token(styles, "--color-surface");
  const accent = token(styles, "--color-accent");
  // 図の文字は画面の部品と同じ小さめの字（:root の --text-sm。rem で書いてあるので、ルートの字の大きさで px にする。
  // mermaid は字の大きさを px の数として測る）
  const fontSize = `${parseFloat(token(styles, "--text-sm")) * parseFloat(styles.fontSize)}px`;
  mermaid.initialize({
    startOnLoad: false,
    // securityLevel は既定の strict（図の中のスクリプト・クリックの動作を許さない）
    securityLevel: "strict",
    theme: "base",
    // mermaid 12 の流れ図の既定は、影つきの look "neo" と、箱の幅をそろえる minNodeWidth（120）。
    // 箱が大きく、スマホの幅で小さな図も収まらないので、線だけの classic にし、箱は字の幅に合わせ、間を詰める
    // （padding は箱の中の字のまわりの余白で、左右には2倍で効く）
    look: "classic",
    flowchart: { minNodeWidth: 0, padding: 4, nodeSpacing: 20, rankSpacing: 20 },
    fontFamily: token(styles, "--font-ui"),
    themeVariables: {
      background: surface,
      primaryColor: token(styles, "--color-bg"),
      primaryTextColor: text,
      primaryBorderColor: text,
      secondaryColor: surface,
      secondaryBorderColor: accent,
      tertiaryColor: surface,
      tertiaryBorderColor: border,
      lineColor: text,
      textColor: text,
      clusterBkg: surface,
      clusterBorder: border,
      fontFamily: token(styles, "--font-ui"),
      fontSize,
    },
  });
  try {
    const { svg } = await mermaid.render(id, source);
    return svg;
  } finally {
    // 描けなかったとき、描くために置いた要素がページに残ることがあるので消す
    document.getElementById(`d${id}`)?.remove();
    document.getElementById(id)?.remove();
  }
}
