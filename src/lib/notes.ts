import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { NoteHeading } from "./headings";
import noteCategories from "./note-categories.json";
import { renderMarkdown } from "./markdown";
import { imageContentType } from "./note-files";
import { decodeSegment, toNotePath } from "./note-url";

export type NoteTreeNote = {
  type: "note";
  /** フロントマターの title か、ファイル名から .md を除いたもの */
  name: string;
  /** URL のパス（/notes/ のあと）。コンテンツフォルダからのパスで、.md を除く。区切りは / */
  path: string;
};

export type NoteTreeFolder = {
  type: "folder";
  name: string;
  /** コンテンツフォルダからのパス。区切りは / */
  path: string;
  /** フォルダが先、ノートがあと。それぞれ名前の順 */
  children: NoteTreeEntry[];
};

export type NoteTreeEntry = NoteTreeFolder | NoteTreeNote;

export type NoteTree = {
  /** 一番上に index.md があるか */
  hasHome: boolean;
  children: NoteTreeEntry[];
};

export type Note = {
  path: string;
  title: string;
  html: string;
  headings: NoteHeading[];
};

const HOME_FILE = "index.md";
const NOTE_EXTENSION = ".md";

const collator = new Intl.Collator("ja", { numeric: true });

// 分類の名前と順は note-categories.json の1か所に置き、検査（scripts/check-content.mjs）も同じものを読む。
// 書き写すと「検査に通るのに並ばない」ずれが起きるため（.mjs は .ts を読めないので JSON にした）
const categoryOrder: readonly string[] = noteCategories.order;

// 一番上のフォルダだけ、分類の順に並べる。分類にない名前は、分類のあとに名前の順で並べる。
// 隠さないのは、合わない形は検査が本番のビルドで止めるので、アプリに隠す分かれ道を作らないため
function compareTopFolders(a: ScannedFolder, b: ScannedFolder): number {
  const rank = (name: string) => {
    const index = categoryOrder.indexOf(name);
    return index === -1 ? categoryOrder.length : index;
  };
  return rank(a.name) - rank(b.name) || collator.compare(a.name, b.name);
}

// docs/design.md の「`content/` をサーバーの出力に入れる」
export function contentDir(): string {
  const override = process.env.CONTENT_DIR;
  if (override) return resolve(/* turbopackIgnore: true */ override);
  return join(process.cwd(), "content");
}

type ScannedNote = { path: string; file: string; name: string };

/** ノートの画像のファイル。path はコンテンツフォルダからのパス（拡張子つき、区切りは /） */
type ScannedFile = { path: string; file: string; contentType: string };

type ScannedFolder = {
  name: string;
  path: string;
  folders: ScannedFolder[];
  notes: ScannedNote[];
};

function stripExtension(fileName: string): string {
  return fileName.slice(0, -NOTE_EXTENSION.length);
}

// 名前が「.」で始まるもの（Obsidian の .obsidian・.trash など）は読まない。
// .trash には消した md が残るため、一覧に出すと消したノートが見えてしまう
// withNames が false なら、ノートを読まずにファイル名を名前にする（ノート1つを探すときは名前が要らない。
// 全部のノートを変換し直さないため）
// 画像のファイルは files に集める。一覧（ツリー）には出さないので、画像だけのフォルダの画像も集める
async function scanFolder(
  dir: string,
  folderPath: string,
  name: string,
  withNames: boolean,
  files: ScannedFile[],
): Promise<ScannedFolder> {
  const entries = await readdir(dir, { withFileTypes: true });
  const folder: ScannedFolder = { name, path: folderPath, folders: [], notes: [] };
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const childPath = folderPath === "" ? entry.name : `${folderPath}/${entry.name}`;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      const child = await scanFolder(file, childPath, entry.name, withNames, files);
      if (hasNotes(child)) folder.folders.push(child);
    } else if (entry.isFile() && entry.name.endsWith(NOTE_EXTENSION)) {
      const fallback = stripExtension(entry.name);
      const title = withNames ? renderMarkdown(await readFile(file, "utf8")).title : undefined;
      folder.notes.push({ path: stripExtension(childPath), file, name: title ?? fallback });
    } else if (entry.isFile()) {
      const contentType = imageContentType(entry.name);
      if (contentType) files.push({ path: childPath, file, contentType });
    }
  }
  folder.folders.sort((a, b) => collator.compare(a.name, b.name));
  folder.notes.sort((a, b) => collator.compare(a.name, b.name));
  return folder;
}

function hasNotes(folder: ScannedFolder): boolean {
  return folder.notes.length > 0 || folder.folders.length > 0;
}

async function scan(
  dir: string,
  withNames = false,
): Promise<{ root: ScannedFolder; homeFile: string | undefined; files: ScannedFile[] }> {
  const files: ScannedFile[] = [];
  const root = await scanFolder(dir, "", "", withNames, files);
  root.folders.sort(compareTopFolders);
  const homePath = stripExtension(HOME_FILE);
  const home = root.notes.find((note) => note.path === homePath);
  root.notes = root.notes.filter((note) => note !== home);
  return { root, homeFile: home?.file, files };
}

function toEntries(folder: ScannedFolder): NoteTreeEntry[] {
  return [
    ...folder.folders.map((child): NoteTreeFolder => ({
      type: "folder",
      name: child.name,
      path: child.path,
      children: toEntries(child),
    })),
    ...folder.notes.map((note): NoteTreeNote => ({
      type: "note",
      name: note.name,
      path: note.path,
    })),
  ];
}

function flatten(folder: ScannedFolder): ScannedNote[] {
  return [...folder.folders.flatMap(flatten), ...folder.notes];
}

export async function readNoteTree(dir = contentDir()): Promise<NoteTree> {
  const { root, homeFile } = await scan(dir, true);
  return { hasHome: homeFile !== undefined, children: toEntries(root) };
}

/** generateStaticParams 用。ホーム以外の全部のノートの、/ で分けたパス */
export async function listNotePaths(dir = contentDir()): Promise<string[][]> {
  const { root } = await scan(dir);
  return flatten(root).map((note) => note.path.split("/"));
}

// ファイルのパスを組み立てず、読み込んだ一覧の中から探す。
// 「..」などでコンテンツフォルダの外を読ませないため
export async function readNote(segments: string[], dir = contentDir()): Promise<Note | undefined> {
  const path = toNotePath(segments);
  const { root, homeFile, files } = await scan(dir);
  const notes = flatten(root);
  const found = notes.find((note) => note.path === path);
  if (!found) return undefined;
  return toNote(found.path, found.file, notePathsOf(notes, homeFile), filePathsOf(files));
}

export async function readHome(dir = contentDir()): Promise<Note | undefined> {
  const { root, homeFile, files } = await scan(dir);
  if (!homeFile) return undefined;
  return toNote(
    stripExtension(HOME_FILE),
    homeFile,
    notePathsOf(flatten(root), homeFile),
    filePathsOf(files),
  );
}

export type ContentFile = { body: Buffer; contentType: string };

/**
 * 画像を返す入口（/files/）用。URL の部分から、コンテンツフォルダの中の画像を読む。
 * readNote と同じく、ファイルのパスを組み立てず、集めた画像の中から探す
 */
export async function readContentFile(
  segments: string[],
  dir = contentDir(),
): Promise<ContentFile | undefined> {
  const path = segments.map(decodeSegment).join("/");
  const { files } = await scan(dir);
  const found = files.find((file) => file.path === path);
  if (!found) return undefined;
  return { body: await readFile(found.file), contentType: found.contentType };
}

function filePathsOf(files: ScannedFile[]): Set<string> {
  return new Set(files.map((file) => file.path));
}

function notePathsOf(notes: ScannedNote[], homeFile: string | undefined): Set<string> {
  const paths = new Set(notes.map((note) => note.path));
  if (homeFile) paths.add(stripExtension(HOME_FILE));
  return paths;
}

// 切れたリンクの警告は、ノートを変換するここで出す。ビルドのときに全部のノートを変換するので、
// ここなら漏れなく見つかる（"use cache" で同じノートは1回だけ変換されるので、警告も重ならない）。
// ビルドは止めない（1つのリンク切れで、ほかのノートの更新まで出せなくならないように）
// 切れた画像も、同じ理由でここで警告する
async function toNote(
  path: string,
  file: string,
  notePaths: ReadonlySet<string>,
  filePaths: ReadonlySet<string>,
): Promise<Note> {
  const { title, html, brokenLinks, brokenImages, headings } = renderMarkdown(
    await readFile(file, "utf8"),
    {
      fromPath: path,
      notePaths,
      filePaths,
    },
  );
  if (brokenLinks.length > 0) {
    console.warn(
      `リンク先のノートがありません: ${path}${NOTE_EXTENSION} → ${brokenLinks.join(", ")}`,
    );
  }
  if (brokenImages.length > 0) {
    console.warn(
      `画像のファイルがありません: ${path}${NOTE_EXTENSION} → ${brokenImages.join(", ")}`,
    );
  }
  const fileName = path.split("/").at(-1) ?? path;
  return { path, title: title ?? fileName, html, headings };
}
