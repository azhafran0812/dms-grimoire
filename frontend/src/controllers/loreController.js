import { db } from '../firebase';
import { ref, set, remove, push } from 'firebase/database';

const lorePath = 'campaign/active/lore';

export const addLore = async (loreData) => {
  try {
    const loreRef = ref(db, lorePath);
    const newLoreRef = push(loreRef); 
    await set(newLoreRef, {
      id: newLoreRef.key,
      title: loreData.title,
      category: loreData.category,
      content: loreData.content,
      createdAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal menambah Lore: ${error.message}`);
  }
};

export const deleteLore = async (id) => {
  try {
    const loreRef = ref(db, `${lorePath}/${id}`);
    await remove(loreRef);
  } catch (error) {
    throw new Error(`Gagal menghapus Lore: ${error.message}`);
  }
};