import { db } from '../firebase';
import { ref, set, remove, push } from 'firebase/database';

const npcPath = 'campaign/active/npcs';

export const addNpc = async (npcData) => {
  try {
    const npcRef = ref(db, npcPath);
    const newNpcRef = push(npcRef); 
    await set(newNpcRef, {
      id: newNpcRef.key,
      name: npcData.name || "Unknown Figure",
      role: npcData.role || "Commoner",
      location: npcData.location || "Unknown",
      description: npcData.description || "",
      traits: npcData.traits || "",
      createdAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal menambah NPC: ${error.message}`);
  }
};

export const deleteNpc = async (id) => {
  try {
    const npcRef = ref(db, `${npcPath}/${id}`);
    await remove(npcRef);
  } catch (error) {
    throw new Error(`Gagal menghapus NPC: ${error.message}`);
  }
};