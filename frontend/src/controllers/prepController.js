import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

const getPrepPath = (campaignId) => campaignId ? `campaigns/${campaignId}/quickPrep` : 'prepList';

// Tambah item prep ke kampanye spesifik
export const addPrepItem = async (arg1, arg2) => {
  let campaignId = null;
  let text = '';
  if (arg2 !== undefined) {
    campaignId = arg1;
    text = arg2;
  } else {
    text = arg1;
  }

  if (!text || !text.trim()) return;

  try {
    const path = getPrepPath(campaignId);
    const prepRef = ref(db, path);
    const newItemRef = push(prepRef);
    const item = {
      id: newItemRef.key,
      text: text.trim(),
      isCompleted: false,
      createdAt: Date.now()
    };
    await set(newItemRef, item);
    return item;
  } catch (error) {
    console.error("Error adding prep item: ", error);
    throw new Error(`Gagal menambah prep item: ${error.message}`, { cause: error });
  }
};

// Toggle status selesai/belum selesai
export const togglePrepItem = async (arg1, arg2, arg3) => {
  let campaignId = null;
  let itemId = null;
  let currentStatus = false;

  if (arg3 !== undefined) {
    campaignId = arg1;
    itemId = arg2;
    currentStatus = arg3;
  } else {
    itemId = arg1;
    currentStatus = arg2;
  }

  if (!itemId) return;

  try {
    const path = getPrepPath(campaignId);
    const itemRef = ref(db, `${path}/${itemId}`);
    await update(itemRef, {
      isCompleted: !currentStatus
    });
  } catch (error) {
    console.error("Error toggling prep item: ", error);
    throw new Error(`Gagal update status: ${error.message}`, { cause: error });
  }
};

// Hapus item prep
export const deletePrepItem = async (arg1, arg2) => {
  let campaignId = null;
  let itemId = null;

  if (arg2 !== undefined) {
    campaignId = arg1;
    itemId = arg2;
  } else {
    itemId = arg1;
  }

  if (!itemId) return;

  try {
    const path = getPrepPath(campaignId);
    const itemRef = ref(db, `${path}/${itemId}`);
    await remove(itemRef);
  } catch (error) {
    console.error("Error deleting prep item: ", error);
    throw new Error(`Gagal menghapus item: ${error.message}`, { cause: error });
  }
};