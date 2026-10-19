import { ref, push, set, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah cerita baru ke kampanye yang spesifik
export const addChronicle = async (campaignId, chronicleData) => {
  // Support flexible signature if single object is passed
  let targetCampaignId = campaignId;
  let data = chronicleData;
  if (typeof campaignId === 'object' && campaignId !== null && !chronicleData) {
    data = campaignId;
    targetCampaignId = data.campaignId || null;
  }

  try {
    const path = targetCampaignId ? `campaigns/${targetCampaignId}/chronicles` : 'chronicles';
    const chronRef = ref(db, path);
    const newEntryRef = push(chronRef);
    const entry = {
      id: newEntryRef.key,
      title: data.title || '',
      sessionNumber: data.sessionNumber || 1,
      description: data.description || '',
      createdAt: Date.now()
    };
    await set(newEntryRef, entry);
    return entry;
  } catch (error) {
    console.error("Error adding chronicle: ", error);
    throw new Error(`Gagal menambah cerita: ${error.message}`, { cause: error });
  }
};

// Hapus cerita dari kampanye yang spesifik
export const deleteChronicle = async (campaignId, id) => {
  let targetCampaignId = campaignId;
  let targetId = id;
  if (!id && typeof campaignId === 'string') {
    targetId = campaignId;
    targetCampaignId = null;
  }

  try {
    const path = targetCampaignId ? `campaigns/${targetCampaignId}/chronicles/${targetId}` : `chronicles/${targetId}`;
    const chronRef = ref(db, path);
    await remove(chronRef);
  } catch (error) {
    console.error("Error deleting chronicle: ", error);
    throw new Error(`Gagal menghapus cerita: ${error.message}`, { cause: error });
  }
};