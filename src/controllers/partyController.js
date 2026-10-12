// src/controllers/partyController.js
import { db } from '../firebase';
import { ref, set, update, remove } from 'firebase/database';
import { createCharacterPayload } from '../models/characterModel';

// Tambah Karakter Baru
export const addCharacter = async (characterInput) => {
  try {
    // Gunakan Model untuk membentuk data komprehensif
    const newCharacter = createCharacterPayload(characterInput);
    
    // Simpan ke Firebase di path: party/{characterId}
    const characterRef = ref(db, `party/${newCharacter.id}`);
    await set(characterRef, newCharacter);
    
    return newCharacter;
  } catch (error) {
    throw new Error(`Gagal menambahkan karakter: ${error.message}`);
  }
};

// Update HP Karakter (Contoh fungsi untuk Live HP)
export const updateCharacterHP = async (characterId, newCurrentHP) => {
  try {
    const hpRef = ref(db, `party/${characterId}/combat`);
    await update(hpRef, { hpCurrent: newCurrentHP });
  } catch (error) {
    throw new Error(`Gagal update HP: ${error.message}`);
  }
};