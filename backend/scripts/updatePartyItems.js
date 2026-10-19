import https from 'node:https';
import fs from 'node:fs';
import { db, ref, get, update } from '../src/config/firebase.js';

// Load items cache to guarantee accuracy
const itemsCache = JSON.parse(
  fs.readFileSync(new URL('../../mcp/data/items_cache.json', import.meta.url), 'utf8')
);
const itemMap = new Map(itemsCache.map((i) => [String(i.itemID), i]));

function getItem(id, defaultName, defaultCat) {
  const found = itemMap.get(String(id));
  if (found) {
    return {
      category: found.category,
      name: found.nameWithCaps || found.name,
      itemID: String(found.itemID),
    };
  }
  return {
    category: defaultCat,
    name: defaultName,
    itemID: String(id),
  };
}

const DEFAULT_PAYLOAD = {
  searchQuery: '',
  selectedType: 'All',
  expression: 0,
  skincolor: 0,
  roleskin: 0,
  dyes: [255, 255, 255],
  drops: [255, 255, 255],
  lenses: [0, 0, 0],
  customskincolor: [240, 240, 240, 255],
  purebeingtrigger: 0,
  equinox: 0,
  crownseasons: [0, 0],
  willofthewild: 0,
  golgift: 0,
  perilous: 0,
  eqaura: 0,
  anomaly: 0,
  bbandolier: ['harlequin', null],
  infinitycrown: [[255, 200, 37], [255, 0, 64], [26, 45, 140], false, true, true, true],
  infinityaura: [[63, 251, 255], [255, 255, 255], [255, 255, 255], false, true, true, true, false, true, true],
  infinityfist: [[122, 10, 250], [65, 65, 65], [78, 255, 0], 0],
  wingsofinfinity: [[0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [1, 1, 1, 1], [0, 0, 0, 0]],
  riftcape: [[147, 56, 143], [147, 56, 143], true, false, 3],
  riftwings: [[93, 22, 200], [220, 72, 255], true, 0],
  minokawa: [true, true],
  ahool: [true, true],
  celesdragcharm: 0,
  artlevel: [0, 0, 0, 0, 0],
};

function renderGt(equippedTuples) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ...DEFAULT_PAYLOAD,
      equipped: equippedTuples,
    });

    const req = https.request(
      'https://gtsetplanner.com/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.setimage) {
              resolve(data.setimage);
            } else {
              reject(new Error('No setimage in response'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 8-slot formula for Elowen (Holy Knight) & Eldric (Shadow Ninja)
const CHARACTER_FORMULAS = {
  Elowen: {
    theme: 'Fantasy',
    archetype: 'Knight',
    mood: 'Heroic',
    items: [
      getItem('1736', 'Knight Helmet', 'Hat'),
      getItem('90', 'Blonde Bombshell', 'Hair'),
      getItem('692', 'Iron Mask', 'Face'),
      getItem('7262', "Knight's Chainmail - Sun", 'Shirt'),
      getItem('76', 'Black Pants', 'Pants'),
      getItem('42', 'Boots', 'Feet'),
      getItem('350', 'Heroman Cape', 'Back'),
      getItem('604', 'Golden Sword', 'Hand'),
    ],
  },
  'Eldric Shadowstep': {
    theme: 'Shadow',
    archetype: 'Ninja',
    mood: 'Mysterious',
    items: [
      getItem('3416', 'Dark Cult Hood', 'Hat'),
      getItem('290', 'Ninja Mask', 'Hair'),
      getItem('314', 'Eyepatch', 'Face'),
      getItem('294', 'Ninja Vest', 'Shirt'),
      getItem('292', 'Ninja Tights', 'Pants'),
      getItem('296', 'Ninja Slippers', 'Feet'),
      getItem('1166', 'Vampire Cape', 'Back'),
      getItem('2592', 'Legendary Katana', 'Hand'),
    ],
  },
};

async function main() {
  console.log('[UpdatePartyItems] Fetching party from Firebase...');
  const partySnap = await get(ref(db, 'party'));

  if (!partySnap.exists()) {
    console.log('No characters in party');
    process.exit(0);
  }

  const party = partySnap.val();

  for (const [id, c] of Object.entries(party)) {
    const formula = CHARACTER_FORMULAS[c.name];
    if (!formula) {
      console.log(`Skipping ${c.name} (no predefined formula)`);
      continue;
    }

    console.log(`[UpdatePartyItems] Updating 8-slot equipment & render for: ${c.name}`);
    const equippedTuples = formula.items.map((i) => [String(i.itemID), String(i.category)]);

    try {
      const base64 = await renderGt(equippedTuples);
      const dataUrl = `data:image/png;base64,${base64}`;

      const aiMeta = c.aiMeta || {};
      aiMeta.avatar = {
        theme: formula.theme,
        archetype: formula.archetype,
        mood: formula.mood,
        items: formula.items,
        colorPalette: formula.theme === 'Fantasy'
          ? ['Radiant Gold', 'Polished Steel', 'Royal White', 'Crimson Red']
          : ['Midnight Black', 'Shadow Obsidian', 'Stealth Grey', 'Blood Crimson'],
        searchRegex: `/(growtopia|${formula.theme}|${formula.archetype})/gi`,
        review: {
          synergyScore: formula.theme === 'Fantasy' ? 94 : 96,
          critique: `Equipped with authentic Growtopia gear: ${formula.items.map((i) => i.name).join(', ')}. The visual cohesion commands high prestige across the realm.`,
          stylistAdvice: `The 8-slot formula perfectly matches ${c.name}'s combat specialization and visual heritage.`,
        },
        compatibility: { autoResolved: false, removedItems: [] },
      };

      aiMeta.image = {
        rendered: true,
        imageBase64: base64,
        dataUrl,
        dimensions: '992x640',
        format: 'png',
        source: 'growtopia-gtsetplanner',
      };

      await update(ref(db, `party/${id}`), {
        avatarUrl: dataUrl,
        aiMeta,
      });

      console.log(`[UpdatePartyItems] ✅ Successfully updated ${c.name} with real Growtopia items!`);
      console.log(formula.items.map((i) => ` - [${i.category}] ${i.name} (ID: ${i.itemID})`).join('\n'));
    } catch (err) {
      console.error(`[UpdatePartyItems] ❌ Failed to update ${c.name}:`, err.message);
    }
  }

  console.log('[UpdatePartyItems] Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
