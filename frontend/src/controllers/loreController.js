import { db } from '../firebase';
import { ref, set, remove, push } from 'firebase/database';

const getLorePath = (campaignId) => campaignId ? `campaigns/${campaignId}/lore` : 'campaign/active/lore';

export const addLore = async (loreData, campaignId = null) => {
  try {
    const targetPath = getLorePath(campaignId || loreData?.campaignId);
    const loreRef = ref(db, targetPath);
    const newLoreRef = push(loreRef); 
    const entry = {
      id: newLoreRef.key,
      title: loreData.title,
      category: loreData.category,
      content: loreData.content,
      createdAt: Date.now()
    };
    await set(newLoreRef, entry);
    return entry;
  } catch (error) {
    throw new Error(`Gagal menambah Lore: ${error.message}`, { cause: error });
  }
};

export const deleteLore = async (id, campaignId = null) => {
  try {
    const targetPath = getLorePath(campaignId);
    const loreRef = ref(db, `${targetPath}/${id}`);
    await remove(loreRef);
  } catch (error) {
    throw new Error(`Gagal menghapus Lore: ${error.message}`, { cause: error });
  }
};