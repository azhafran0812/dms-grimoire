import { db } from '../firebase';
import { ref, update } from 'firebase/database';

const campaignPath = 'campaign/active';

export const updateCampaignStatus = async (updateData) => {
  try {
    const campaignRef = ref(db, campaignPath);
    await update(campaignRef, updateData);
  } catch (error) {
    throw new Error(`Gagal update status kampanye: ${error.message}`);
  }
};