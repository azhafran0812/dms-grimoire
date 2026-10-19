import { ref, set, update, push } from 'firebase/database';
import { db } from '../firebase';

export const createNewCampaign = async (title = 'Untitled Campaign') => {
  try {
    const campaignsRef = ref(db, 'campaigns');
    const newCampRef = push(campaignsRef); 
    const campaignId = newCampRef.key;
    
    // 1. Buat Info Kampanye
    await set(newCampRef, {
      info: {
        title: title,
        chapterTitle: 'Chapter 1: The Beginning',
        system: 'D&D 5e',
        status: 'Active',
        description: 'Sebuah petualangan baru dimulai...',
        progress: 0,
        currentLocation: 'Unknown',
        locationDesc: '',
        createdAt: Date.now()
      }
    });

    // 2. Buat Chapter pertama sebagai awalan
    const chaptersRef = ref(db, `campaigns/${campaignId}/chapters`);
    const newChapRef = push(chaptersRef);
    await set(newChapRef, {
      title: 'Chapter 1: The Beginning',
      createdAt: Date.now()
    });
    
    return campaignId;
  } catch (error) {
    console.error("Error creating campaign: ", error);
    throw new Error(`Gagal membuat kampanye baru: ${error.message}`, { cause: error });
  }
};

export const updateCampaignInfo = async (campaignId, updatedData) => {
  if (!campaignId) return;
  try {
    const infoRef = ref(db, `campaigns/${campaignId}/info`);
    await update(infoRef, {
      ...updatedData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating campaign info: ", error);
    throw new Error(`Gagal update campaign info: ${error.message}`, { cause: error });
  }
};

export const addChapterToCampaign = async (campaignId, chapterTitle) => {
  if (!campaignId || !chapterTitle) return;
  try {
    const chaptersRef = ref(db, `campaigns/${campaignId}/chapters`);
    const newChapRef = push(chaptersRef);
    await set(newChapRef, {
      title: chapterTitle,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("Error adding chapter: ", error);
    throw new Error(`Gagal menambah chapter: ${error.message}`, { cause: error });
  }
};

export const updateCampaignStatus = async (updateData, campaignId = null) => {
  try {
    if (campaignId) {
      return await updateCampaignInfo(campaignId, updateData);
    }
    const campaignRef = ref(db, 'campaign/active');
    await update(campaignRef, updateData);
  } catch (error) {
    throw new Error(`Gagal update status kampanye: ${error.message}`, { cause: error });
  }
};