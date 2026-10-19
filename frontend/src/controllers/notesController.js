import { db } from '../firebase';
import { ref, set, update, remove, push } from 'firebase/database';

const notesPath = 'campaign/active/notes';

export const addNote = async (noteData) => {
  try {
    const notesRef = ref(db, notesPath);
    const newNoteRef = push(notesRef);
    const id = newNoteRef.key;
    const entry = {
      id,
      title: noteData.title?.trim() || "Untitled Note",
      category: noteData.category || "General",
      content: noteData.content?.trim() || "",
      isSecret: Boolean(noteData.isSecret),
      isPinned: Boolean(noteData.isPinned),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await set(newNoteRef, entry);
    return entry;
  } catch (error) {
    throw new Error(`Gagal membuat catatan: ${error.message}`, { cause: error });
  }
};

export const updateNote = async (id, noteData) => {
  try {
    const noteRef = ref(db, `${notesPath}/${id}`);
    await update(noteRef, {
      ...noteData,
      updatedAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal update catatan: ${error.message}`, { cause: error });
  }
};

export const togglePinNote = async (id, currentPinned) => {
  try {
    const noteRef = ref(db, `${notesPath}/${id}`);
    await update(noteRef, {
      isPinned: !currentPinned,
      updatedAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal pin catatan: ${error.message}`, { cause: error });
  }
};

export const deleteNote = async (id) => {
  try {
    const noteRef = ref(db, `${notesPath}/${id}`);
    await remove(noteRef);
  } catch (error) {
    throw new Error(`Gagal menghapus catatan: ${error.message}`, { cause: error });
  }
};
