import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderMarkdown } from "./markdown";

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
};

const HOME_FILE = "index.md";
const NOTE_EXTENSION = ".md";

const collator = new Intl.Collator("ja", { numeric: true });

// docs/design.md の「`content/` をサーバーの出力に入れる」
export function contentDir(): string {
  const override = process.env.CONTENT_DIR;
  if (override) return resolve(/* turbopackIgnore: true */ override);
  return join(process.cwd(), "content");
}

type ScannedNote = { path: string; file: string; name: string };

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
async function scanFolder(
  dir: string,
  folderPath: string,
  name: string,
  withNames: boolean,
): Promise<ScannedFolder> {
  const entries = await readdir(dir, { withFileTypes: true });
  const folder: ScannedFolder = { name, path: folderPath, folders: [], notes: [] };
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const childPath = folderPath === "" ? entry.name : `${folderPath}/${entry.name}`;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      const child = await scanFolder(file, childPath, entry.name, withNames);
      if (hasNotes(child)) folder.folders.push(child);
    } else if (entry.isFile() && entry.name.endsWith(NOTE_EXTENSION)) {
      const fallback = stripExtension(entry.name);
      const title = withNames ? renderMarkdown(await readFile(file, "utf8")).title : undefined;
      folder.notes.push({ path: stripExtension(childPath), file, name: title ?? fallback });
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
): Promise<{ root: ScannedFolder; homeFile: string | undefined }> {
  const root = await scanFolder(dir, "", "", withNames);
  const homePath = stripExtension(HOME_FILE);
  const home = root.notes.find((note) => note.path === homePath);
  root.notes = root.notes.filter((note) => note !== home);
  return { root, homeFile: home?.file };
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

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // 「100%」のように、符号化されていない % を含む名前はそのまま使う
    return segment;
  }
}

// ファイルのパスを組み立てず、読み込んだ一覧の中から探す。
// 「..」などでコンテンツフォルダの外を読ませないため
export async function readNote(segments: string[], dir = contentDir()): Promise<Note | undefined> {
  const path = segments.map(decodeSegment).join("/");
  const { root } = await scan(dir);
  const found = flatten(root).find((note) => note.path === path);
  if (!found) return undefined;
  return toNote(found.path, found.file);
}

export async function readHome(dir = contentDir()): Promise<Note | undefined> {
  const { homeFile } = await scan(dir);
  if (!homeFile) return undefined;
  return toNote(stripExtension(HOME_FILE), homeFile);
}

async function toNote(path: string, file: string): Promise<Note> {
  const { title, html } = renderMarkdown(await readFile(file, "utf8"));
  const fileName = path.split("/").at(-1) ?? path;
  return { path, title: title ?? fileName, html };
}
