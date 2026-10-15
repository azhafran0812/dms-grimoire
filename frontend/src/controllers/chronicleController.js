import { ref, push, set, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah cerita baru ke kampanye yang spesifik
export const addChronicle = async (campaignId, chronicleData) => {
  if (!campaignId) return;
  try {
    const chronRef = ref(db, `campaigns/${campaignId}/chronicles`);
    const newEntryRef = push(chronRef);
    await set(newEntryRef, {
      id: newEntryRef.key,
      title: chronicleData.title,
      sessionNumber: chronicleData.sessionNumber,
      description: chronicleData.description,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("Error adding chronicle: ", error);
    throw error;
  }
};

// Hapus cerita dari kampanye yang spesifik
export const deleteChronicle = async (campaignId, id) => {
  if (!campaignId || !id) return;
  try {
    const chronRef = ref(db, `campaigns/${campaignId}/chronicles/${id}`);
    await remove(chronRef);
  } catch (error) {
    console.error("Error deleting chronicle: ", error);
    throw error;
  }
};