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
    throw new Error(`Gagal menambahkan karakter: ${error.message}`, { cause: error });
  }
};

// Update HP Karakter (Contoh fungsi untuk Live HP)
export const updateCharacterHP = async (characterId, newCurrentHP) => {
  try {
    const hpRef = ref(db, `party/${characterId}/combat`);
    await update(hpRef, { hpCurrent: newCurrentHP });
  } catch (error) {
    throw new Error(`Gagal update HP: ${error.message}`, { cause: error });
  }
};

// Update Stat Karakter (Bisa untuk HP atau AC)
export const updateCharacterStat = async (characterId, statPath, newValue) => {
  try {
    // statPath contohnya: 'combat/hpCurrent' atau 'combat/ac'
    const statRef = ref(db, `party/${characterId}/${statPath}`);
    await set(statRef, newValue);
  } catch (error) {
    throw new Error(`Gagal update stat: ${error.message}`, { cause: error });
  }
};

// Hapus Karakter dari Party
export const removeCharacter = async (characterId) => {
  try {
    const characterRef = ref(db, `party/${characterId}`);
    await remove(characterRef);
  } catch (error) {
    throw new Error(`Gagal menghapus karakter: ${error.message}`, { cause: error });
  }
};

export const updateFullCharacter = async (characterId, updatedData) => {
  try {
    const characterRef = ref(db, `party/${characterId}`);
    await update(characterRef, updatedData);
  } catch (error) {
    throw new Error(`Gagal update karakter: ${error.message}`, { cause: error });
  }
};

// Style karakter menggunakan AI Stylist melalui backend proxy
export const styleCharacterWithAI = async (characterId, { prompt, render = true, simulate = false } = {}) => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/api/characters/${characterId}/style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, render, simulate }),
    });

    const envelope = await res.json();
    if (!res.ok || !envelope.ok) {
      throw new Error(envelope.error?.message || 'Gagal men-style karakter dengan AI Stylist');
    }

    return envelope.data;
  } catch (error) {
    throw new Error(`Gagal memanggil Arcane Stylist: ${error.message}`, { cause: error });
  }
};

// Generate karakter baru dengan AI Stylist melalui backend proxy
export const generateCharacterWithAI = async ({ prompt, render = true, simulate = false } = {}) => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/api/characters/generate-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, render, simulate }),
    });

    const envelope = await res.json();
    if (!res.ok || !envelope.ok) {
      throw new Error(envelope.error?.message || 'Gagal membuat karakter dengan AI');
    }

    return envelope.data;
  } catch (error) {
    throw new Error(`Gagal memanggil AI Character Generator: ${error.message}`, { cause: error });
  }
};