import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah karakter ke campaign spesifik
export const addCharacter = async (campaignId, characterData) => {
  if (!campaignId) throw new Error("Pilih kampanye terlebih dahulu.");
  try {
    const partyRef = ref(db, `campaigns/${campaignId}/party`);
    const newCharRef = push(partyRef);
    
    await set(newCharRef, {
      id: newCharRef.key,
      ...characterData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error adding character: ", error);
    throw error;
  }
};

// Update karakter di campaign spesifik
export const updateFullCharacter = async (campaignId, characterId, characterData) => {
  if (!campaignId || !characterId) return;
  try {
    const charRef = ref(db, `campaigns/${campaignId}/party/${characterId}`);
    await update(charRef, {
      ...characterData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating character: ", error);
    throw error;
  }
};