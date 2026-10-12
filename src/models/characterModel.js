import { v4 as uuidv4 } from 'uuid';

export const createCharacterPayload = (basicData) => {
  return {
    id: uuidv4(),
    playerId: null, // Saat ini null. Nanti akan diisi UID Firebase dari akun Player
    
    // --- Identitas Dasar ---
    name: basicData.name || "Unknown Hero",
    race: basicData.race || "Human",
    characterClass: basicData.characterClass || "Fighter",
    level: basicData.level || 1,
    background: basicData.background || "Folk Hero",
    alignment: basicData.alignment || "True Neutral",
    xp: 0,

    // --- Status Pertempuran (Combat) ---
    combat: {
      hpMax: basicData.hpMax || 10,
      hpCurrent: basicData.hpCurrent || 10,
      hpTemp: 0,
      ac: basicData.ac || 10,
      initiativeModifier: 0,
      speed: 30,
      hitDice: { total: 1, current: 1, dieType: "d10" },
      deathSaves: { successes: 0, failures: 0 }
    },

    // --- Atribut Utama (Ability Scores) ---
    stats: {
      str: basicData.str || 10,
      dex: basicData.dex || 10,
      con: basicData.con || 10,
      int: basicData.int || 10,
      wis: basicData.wis || 10,
      cha: basicData.cha || 10
    },

    // --- Proficiencies & Skills ---
    proficiencies: {
      savingThrows: [], 
      skills: [],       
      languages: ['Common'],
      tools: []
    },

    // --- Inventaris & Kekayaan ---
    inventory: {
      wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      equipment: [], 
      attunedItems: []
    },

    // --- Spellcasting (Khusus kelas Magic) ---
    spellcasting: {
      spellcastingAbility: "", 
      spellSaveDC: 8,
      spellAttackBonus: 0,
      spellSlots: {
        level1: { total: 0, current: 0 }
      }
    },

    // --- Metadata Sistem ---
    createdAt: Date.now()
  };
};