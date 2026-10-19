import { db } from '../firebase';
import { ref, set, update, remove, push } from 'firebase/database';

const getPath = (campaignId) => campaignId ? `campaigns/${campaignId}/npcs` : 'campaign/active/npcs';
const catalogPath = 'npcs';

// Create NPC (CRUD NPC 1)
export const addNpc = async (npcData, campaignId = null) => {
  try {
    const targetPath = getPath(campaignId || npcData?.campaignId);
    const npcRef = ref(db, targetPath);
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
export const updateNpc = async (id, updateData, campaignId = null) => {
  try {
    const payload = {
      ...updateData,
      updatedAt: Date.now()
    };
    const targetPath = getPath(campaignId || updateData?.campaignId);
    await update(ref(db, `${targetPath}/${id}`), payload);
    await update(ref(db, `campaign/active/npcs/${id}`), payload).catch(() => {});
    await update(ref(db, `${catalogPath}/${id}`), payload).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal update NPC: ${error.message}`, { cause: error });
  }
};

// Quick update for disposition: Friendly / Neutral / Hostile
export const updateNpcDisposition = async (id, disposition, campaignId = null) => {
  return updateNpc(id, { disposition }, campaignId);
};

// Delete NPC (CRUD NPC 4)
export const deleteNpc = async (id, campaignId = null) => {
  try {
    const targetPath = getPath(campaignId);
    await remove(ref(db, `${targetPath}/${id}`));
    await remove(ref(db, `campaign/active/npcs/${id}`)).catch(() => {});
    await remove(ref(db, `${catalogPath}/${id}`)).catch(() => {});
  } catch (error) {
    throw new Error(`Gagal menghapus NPC: ${error.message}`, { cause: error });
  }
};
