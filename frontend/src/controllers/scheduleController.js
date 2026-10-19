import { db } from '../firebase';
import { ref, set, update, push, remove } from 'firebase/database';

const schedulePath = 'campaign/active/schedule';
const sessionHistoryPath = 'campaign/active/sessionHistory';

// Default initial schedule structure
export const defaultSchedule = {
  sessionNumber: 19,
  title: 'The Catacombs of Greyfen',
  scheduledDate: '2026-10-24',
  scheduledTime: '19:30',
  durationHours: 3.5,
  location: 'Discord Voice #campaign-room / Tabletop',
  description: 'Descend beneath Blackwater Abbey to breach the seal before the Blood Moon rises.',
  dmNotes: 'Prepare map for encounter B3. Krakatoa has secret quest objective.',
  rsvp: {
    'Krakatoa Abysswhirl': 'confirmed',
    'Bryn': 'confirmed',
    'Elowen Starseeker': 'tentative',
    'Zephyr': 'confirmed'
  },
  updatedAt: Date.now()
};

// Update active schedule
export const updateSchedule = async (scheduleData) => {
  try {
    const schedRef = ref(db, schedulePath);
    await update(schedRef, {
      ...scheduleData,
      updatedAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal memperbarui jadwal: ${error.message}`, { cause: error });
  }
};

// Update a single player's RSVP
export const updatePlayerRsvp = async (characterName, status) => {
  try {
    const rsvpRef = ref(db, `${schedulePath}/rsvp`);
    await update(rsvpRef, {
      [characterName]: status
    });
  } catch (error) {
    throw new Error(`Gagal update RSVP: ${error.message}`, { cause: error });
  }
};

// Add past session record
export const addSessionRecord = async (sessionData) => {
  try {
    const histRef = ref(db, sessionHistoryPath);
    const newRecordRef = push(histRef);
    await set(newRecordRef, {
      id: newRecordRef.key,
      ...sessionData,
      createdAt: Date.now()
    });
  } catch (error) {
    throw new Error(`Gagal menambah riwayat sesi: ${error.message}`, { cause: error });
  }
};

// Delete session record
export const deleteSessionRecord = async (id) => {
  try {
    await remove(ref(db, `${sessionHistoryPath}/${id}`));
  } catch (error) {
    throw new Error(`Gagal menghapus riwayat sesi: ${error.message}`, { cause: error });
  }
};
