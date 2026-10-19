import https from 'node:https';
import { db, ref, get, update } from '../src/config/firebase.js';

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

async function main() {
  console.log('[Growtopia Avatars] Fetching characters from Firebase...');
  const partySnap = await get(ref(db, 'party'));

  if (!partySnap.exists()) {
    console.log('No characters found');
    process.exit(0);
  }

  const party = partySnap.val();

  // Themed sets for characters
  const sets = {
    'Eldric Shadowstep': [
      ['290', 'Hair'], // ninja mask
      ['294', 'Shirt'], // ninja vest
      ['292', 'Pants'], // ninja tights
      ['2592', 'Hand'], // legendary katana
      ['1166', 'Back'], // vampire cape
      ['42', 'Feet'], // boots
    ],
    'Elowen': [
      ['1736', 'Hat'], // knight helmet
      ['7262', 'Shirt'], // knight's chainmail - sun
      ['28', 'Pants'], // jeans
      ['604', 'Hand'], // golden sword
      ['350', 'Back'], // heroman cape
      ['42', 'Feet'], // boots
    ],
  };

  for (const [id, c] of Object.entries(party)) {
    console.log(`[Growtopia Avatars] Generating set for: ${c.name}`);
    const equipped = sets[c.name] || [
      ['354', 'Hat'], // viking helmet
      ['94', 'Hand'], // sword
      ['58', 'Shirt'], // chainmail
      ['28', 'Pants'], // jeans
    ];

    try {
      const base64 = await renderGt(equipped);
      const dataUrl = `data:image/png;base64,${base64}`;

      const aiMeta = c.aiMeta || {};
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

      console.log(`[Growtopia Avatars] ✅ Successfully generated & updated Growtopia avatar for ${c.name}!`);
    } catch (err) {
      console.error(`[Growtopia Avatars] ❌ Failed to render set for ${c.name}:`, err.message);
    }
  }

  console.log('[Growtopia Avatars] All characters updated!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
