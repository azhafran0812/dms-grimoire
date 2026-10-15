import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

// Tambah sesi baru
export const addSession = async (title = 'Sesi Baru') => {
  try {
    const sessionListRef = ref(db, 'campaign/active/sessions');
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

// Pastikan fungsi updateSession menerima campaignId
export const updateSession = async (campaignId, sessionId, updatedData) => {
  if (!campaignId || !sessionId) return;
  try {
    const sessionRef = ref(db, `campaigns/${campaignId}/sessions/${sessionId}`);
    
    // Ambil data lama sesi untuk dicek status isCompleted-nya
    const snapshot = await get(sessionRef);
    if (snapshot.exists()) {
      const oldData = snapshot.val();
      
      // Jika sebelumnya belum selesai, dan sekarang diubah menjadi selesai (true)
      if (!oldData.isCompleted && updatedData.isCompleted === true) {
        // Otomatis buat entri baru ke Chronicle campaign tersebut
        const chronRef = ref(db, `campaigns/${campaignId}/chronicles`);
        const newChronRef = push(chronRef);
        await set(newChronRef, {
          id: newChronRef.key,
          title: updatedData.title || oldData.title,
          sessionNumber: oldData.sessionNumber || 1, // Atau ambil dari format judul
          description: updatedData.content || oldData.content,
          createdAt: Date.now()
        });
      }
    }

    // Lakukan update data sesi seperti biasa
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
export const deleteSession = async (id) => {
  try {
    const sessionRef = ref(db, `campaign/active/sessions/${id}`);
    await remove(sessionRef);
  } catch (error) {
    console.error("Error deleting session: ", error);
    throw error;
  }
};