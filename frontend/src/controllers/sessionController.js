import { ref, push, set, update, remove, get } from 'firebase/database';
import { db } from '../firebase';

const getSessionPath = (campaignId) => campaignId ? `campaigns/${campaignId}/sessions` : 'campaign/active/sessions';

// Tambah sesi baru
export const addSession = async (title = 'Sesi Baru', campaignId = null) => {
  try {
    const targetPath = getSessionPath(campaignId);
    const sessionListRef = ref(db, targetPath);
    const newSessionRef = push(sessionListRef);
    
    await set(newSessionRef, {
      id: newSessionRef.key,
      title: title,
      content: '',
      inGameDate: '',
      isCompleted: false, 
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return newSessionRef.key;
  } catch (error) {
    console.error("Error adding session: ", error);
    throw error;
  }
};

// Update sesi dengan auto-chronicle jika status completed
export const updateSession = async (arg1, arg2, arg3) => {
  let campaignId = null;
  let sessionId = null;
  let updatedData = {};

  if (arg3 !== undefined) {
    campaignId = arg1;
    sessionId = arg2;
    updatedData = arg3;
  } else {
    sessionId = arg1;
    updatedData = arg2;
  }

  if (!sessionId) return;

  try {
    const targetPath = getSessionPath(campaignId);
    const sessionRef = ref(db, `${targetPath}/${sessionId}`);
    
    // Ambil data lama sesi untuk dicek status isCompleted-nya
    const snapshot = await get(sessionRef);
    if (snapshot.exists()) {
      const oldData = snapshot.val();
      
      // Jika sebelumnya belum selesai, dan sekarang diubah menjadi selesai (true)
      if (!oldData.isCompleted && updatedData.isCompleted === true) {
        const chronPath = campaignId ? `campaigns/${campaignId}/chronicles` : 'chronicles';
        const chronRef = ref(db, chronPath);
        const newChronRef = push(chronRef);
        await set(newChronRef, {
          id: newChronRef.key,
          title: updatedData.title || oldData.title,
          sessionNumber: oldData.sessionNumber || 1,
          description: updatedData.content || oldData.content,
          createdAt: Date.now()
        });
      }
    }

    // Lakukan update data sesi
    await update(sessionRef, {
      ...updatedData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating session: ", error);
    throw error;
  }
};

// Hapus sesi
export const deleteSession = async (arg1, arg2) => {
  let campaignId = null;
  let sessionId = null;

  if (arg2 !== undefined) {
    campaignId = arg1;
    sessionId = arg2;
  } else {
    sessionId = arg1;
  }

  if (!sessionId) return;

  try {
    const targetPath = getSessionPath(campaignId);
    const sessionRef = ref(db, `${targetPath}/${sessionId}`);
    await remove(sessionRef);
  } catch (error) {
    console.error("Error deleting session: ", error);
    throw error;
  }
};