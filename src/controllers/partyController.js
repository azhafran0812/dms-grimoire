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

// Update Stat Karakter (Bisa untuk HP atau AC)
export const updateCharacterStat = async (characterId, statPath, newValue) => {
  try {
    // statPath contohnya: 'combat/hpCurrent' atau 'combat/ac'
    const statRef = ref(db, `party/${characterId}/${statPath}`);
    await set(statRef, newValue);
  } catch (error) {
    throw new Error(`Gagal update stat: ${error.message}`);
  }
};

// Hapus Karakter dari Party
export const removeCharacter = async (characterId) => {
  try {
    const characterRef = ref(db, `party/${characterId}`);
    await remove(characterRef);
  } catch (error) {
    throw new Error(`Gagal menghapus karakter: ${error.message}`);
  }
};