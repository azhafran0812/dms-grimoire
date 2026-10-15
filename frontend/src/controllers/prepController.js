import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah item prep ke kampanye spesifik
export const addPrepItem = async (campaignId, text) => {
  if (!campaignId || !text.trim()) return;
  try {
    const prepRef = ref(db, `campaigns/${campaignId}/quickPrep`);
    const newItemRef = push(prepRef);
    await set(newItemRef, {
      id: newItemRef.key,
      text: text.trim(),
      isCompleted: false,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("Error adding prep item: ", error);
    throw error;
  }
};

// Toggle status selesai/belum selesai
export const togglePrepItem = async (campaignId, itemId, currentStatus) => {
  if (!campaignId || !itemId) return;
  try {
    const itemRef = ref(db, `campaigns/${campaignId}/quickPrep/${itemId}`);
    await update(itemRef, {
      isCompleted: !currentStatus
    });
  } catch (error) {
    console.error("Error toggling prep item: ", error);
    throw error;
  }
};

// Hapus item prep
export const deletePrepItem = async (campaignId, itemId) => {
  if (!campaignId || !itemId) return;
  try {
    const itemRef = ref(db, `campaigns/${campaignId}/quickPrep/${itemId}`);
    await remove(itemRef);
  } catch (error) {
    console.error("Error deleting prep item: ", error);
    throw error;
  }
};