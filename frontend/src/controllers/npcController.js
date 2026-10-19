import { db } from '../firebase';
import { ref, set, update, remove, push } from 'firebase/database';

const npcPath = 'campaign/active/npcs';
const catalogPath = 'npcs';

// Create NPC (CRUD NPC 1)
export const addNpc = async (npcData) => {
  try {
    const npcRef = ref(db, npcPath);
    const newNpcRef = push(npcRef);
    const id = newNpcRef.key;
    const entry = {
      id,
      name: npcData.name?.trim() || "Unknown Figure",
      role: npcData.role?.trim() || "Commoner",
      location: npcData.location?.trim() || "The Ashen Crown",
      description: npcData.description?.trim() || "",
      traits: npcData.traits?.trim() || "",
      disposition: npcData.disposition || "Neutral",
      secret: npcData.secret?.trim() || "",
      lore: npcData.lore?.trim() || "",
      source: npcData.source || "manual",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await set(newNpcRef, entry);
    // Dual sync to /npcs for backend parity
    await set(ref(db, `${catalogPath}/${id}`), entry).catch(() => {});
    return entry;
  } catch (error) {
    throw new Error(`Gagal menambah NPC: ${error.message}`, { cause: error });
  }
};

// Update NPC (CRUD NPC 3 - Transisi Status Hubungan Tokoh & Info)
export const updateNpc = async (id, updateData) => {
  try {
    const payload = {
      ...updateData,
      updatedAt: Date.now()
    };
    await update(ref(db, `${npcPath}/${id}`), payload);
    await update(ref(db, `${catalogPath}/${id}`), payload).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal update NPC: ${error.message}`, { cause: error });
  }
};

// Quick update for disposition: Friendly / Neutral / Hostile
export const updateNpcDisposition = async (id, disposition) => {
  return updateNpc(id, { disposition });
};

// Delete NPC (CRUD NPC 4)
export const deleteNpc = async (id) => {
  try {
    await remove(ref(db, `${npcPath}/${id}`));
    await remove(ref(db, `${catalogPath}/${id}`)).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal menghapus NPC: ${error.message}`, { cause: error });
  }
};