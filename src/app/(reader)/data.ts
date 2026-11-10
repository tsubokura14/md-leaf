"use cache";

import { listNotePaths, readHome, readNote, readNoteTree } from "@/lib/notes";

export async function getNoteTree() {
  return readNoteTree();
}

export async function getNotePaths() {
  return listNotePaths();
}

export async function getNote(segments: string[]) {
  return readNote(segments);
}

export async function getHome() {
  return readHome();
}
