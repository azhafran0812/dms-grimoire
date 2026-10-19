import { db } from '../firebase';
import { ref, set, update, remove, push } from 'firebase/database';

const prepPath = 'quickPrep';

export const addPrepItem = async (text) => {
  try {
    const prepRef = ref(db, prepPath);
    const newItemRef = push(prepRef);
    await set(newItemRef, {
      id: newItemRef.key,
      text: text,
      isCompleted: false,
      createdAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal menambah prep item: ${error.message}`, { cause: error });
  }
};

export const togglePrepItem = async (itemId, currentStatus) => {
  try {
    const itemRef = ref(db, `${prepPath}/${itemId}`);
    await update(itemRef, { isCompleted: !currentStatus });
  } catch (error) {
    throw new Error(`Gagal update status: ${error.message}`, { cause: error });
  }
};

export const deletePrepItem = async (itemId) => {
  try {
    const itemRef = ref(db, `${prepPath}/${itemId}`);
    await remove(itemRef);
  } catch (error) {
    throw new Error(`Gagal menghapus item: ${error.message}`, { cause: error });
  }
};