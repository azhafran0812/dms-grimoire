import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah karakter ke campaign spesifik atau root party (mendukung multi-campaign & legacy)
export const addCharacter = async (arg1, arg2) => {
  let campaignId = null;
  let characterData = null;
  if (typeof arg1 === 'string' && typeof arg2 === 'object') {
    campaignId = arg1;
    characterData = arg2;
  } else if (typeof arg1 === 'object') {
    characterData = arg1;
    campaignId = characterData.campaignId || null;
  }

  try {
    const targetPath = campaignId ? `campaigns/${campaignId}/party` : 'party';
    const partyRef = ref(db, targetPath);
    const newCharRef = push(partyRef);
    const charId = newCharRef.key;

    const payload = {
      id: charId,
      ...characterData,
      createdAt: characterData.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    await set(newCharRef, payload);

    // Dual-write ke root party jika dalam campaign agar Player View dapat mengaksesnya
    if (campaignId) {
      await set(ref(db, `party/${charId}`), payload).catch(() => {});
    }

    return payload;
  } catch (error) {
    console.error("Error adding character: ", error);
    throw new Error(`Gagal menambahkan karakter: ${error.message}`, { cause: error });
  }
};

// Update karakter di campaign spesifik atau root party
export const updateFullCharacter = async (arg1, arg2, arg3) => {
  let campaignId = null;
  let characterId = null;
  let updatedData = null;

  if (arg3 !== undefined) {
    campaignId = arg1;
    characterId = arg2;
    updatedData = arg3;
  } else {
    characterId = arg1;
    updatedData = arg2;
    campaignId = updatedData?.campaignId || null;
  }

  if (!characterId) return;

  try {
    const payload = {
      ...updatedData,
      updatedAt: Date.now()
    };

    if (campaignId) {
      await update(ref(db, `campaigns/${campaignId}/party/${characterId}`), payload);
    }
    // Always sync root party/${characterId} as well
    await update(ref(db, `party/${characterId}`), payload).catch(() => {});
  } catch (error) {
    console.error("Error updating character: ", error);
    throw new Error(`Gagal update karakter: ${error.message}`, { cause: error });
  }
};

// Update HP Karakter (Live HP)
export const updateCharacterHP = async (arg1, arg2, arg3) => {
  let campaignId = null;
  let characterId = null;
  let newCurrentHP = null;

  if (arg3 !== undefined) {
    campaignId = arg1;
    characterId = arg2;
    newCurrentHP = arg3;
  } else {
    characterId = arg1;
    newCurrentHP = arg2;
  }

  try {
    if (campaignId) {
      const hpRef = ref(db, `campaigns/${campaignId}/party/${characterId}/combat`);
      await update(hpRef, { hpCurrent: newCurrentHP });
    }
    const rootHpRef = ref(db, `party/${characterId}/combat`);
    await update(rootHpRef, { hpCurrent: newCurrentHP }).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal update HP: ${error.message}`, { cause: error });
  }
};

// Update Stat Karakter (Bisa untuk HP atau AC)
export const updateCharacterStat = async (arg1, arg2, arg3, arg4) => {
  let campaignId = null;
  let characterId = null;
  let statPath = null;
  let newValue = null;

  if (arg4 !== undefined) {
    campaignId = arg1;
    characterId = arg2;
    statPath = arg3;
    newValue = arg4;
  } else {
    characterId = arg1;
    statPath = arg2;
    newValue = arg3;
  }

  try {
    if (campaignId) {
      const statRef = ref(db, `campaigns/${campaignId}/party/${characterId}/${statPath}`);
      await set(statRef, newValue);
    }
    const rootStatRef = ref(db, `party/${characterId}/${statPath}`);
    await set(rootStatRef, newValue).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal update stat: ${error.message}`, { cause: error });
  }
};

// Hapus Karakter dari Party
export const removeCharacter = async (arg1, arg2) => {
  let campaignId = null;
  let characterId = null;
  if (arg2) {
    campaignId = arg1;
    characterId = arg2;
  } else {
    characterId = arg1;
  }

  try {
    if (campaignId) {
      await remove(ref(db, `campaigns/${campaignId}/party/${characterId}`));
    }
    await remove(ref(db, `party/${characterId}`)).catch(() => {});
  } catch (error) {
    console.error("Error removing character: ", error);
    throw new Error(`Gagal menghapus karakter: ${error.message}`, { cause: error });
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