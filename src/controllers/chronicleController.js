import { db } from '../firebase';
import { ref, set, remove, push } from 'firebase/database';

const chroniclePath = 'chronicles';

// Tambah riwayat cerita baru
export const addChronicle = async (sessionNumber, title, description) => {
  try {
    const chronicleRef = ref(db, chroniclePath);
    const newEntryRef = push(chronicleRef); 
    await set(newEntryRef, {
      id: newEntryRef.key,
      sessionNumber: parseInt(sessionNumber),
      title,
      description,
      createdAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal menambah cerita: ${error.message}`);
  }
};

// Hapus riwayat cerita
export const deleteChronicle = async (id) => {
  try {
    const entryRef = ref(db, `${chroniclePath}/${id}`);
    await remove(entryRef);
  } catch (error) {
    throw new Error(`Gagal menghapus cerita: ${error.message}`);
  }
};