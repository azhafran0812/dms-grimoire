import { db, ref, get, update } from '../src/config/firebase.js';

async function syncAvatars() {
  console.log('[Sync] Starting avatar sync for party and NPCs...');

  // 1. Party characters
  const partySnap = await get(ref(db, 'party'));
  if (partySnap.exists()) {
    const party = partySnap.val();
    for (const [id, c] of Object.entries(party)) {
      const avatarUrl =
        c.avatarUrl ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      const aiMeta = c.aiMeta || {};
      if (!aiMeta.image || !aiMeta.image.dataUrl) {
        aiMeta.image = {
          rendered: true,
          dataUrl: avatarUrl,
          dimensions: '256x256',
          format: 'svg',
        };
      }
      await update(ref(db, `party/${id}`), { avatarUrl, aiMeta });
      console.log(`[Sync] Updated avatar for character: ${c.name}`);
    }
  }

  // 2. NPCs
  const npcsSnap = await get(ref(db, 'campaign/active/npcs'));
  if (npcsSnap.exists()) {
    const npcs = npcsSnap.val();
    for (const [id, n] of Object.entries(npcs)) {
      const avatarUrl =
        (n.avatarUrl && n.avatarUrl.startsWith('http') && !n.avatarUrl.includes('data:'))
          ? n.avatarUrl
          : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(n.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      await update(ref(db, `campaign/active/npcs/${id}`), { avatarUrl });
      console.log(`[Sync] Updated avatar for NPC: ${n.name}`);
    }
  }

  console.log('[Sync] All character and NPC avatars synced successfully!');
  process.exit(0);
}

syncAvatars().catch((err) => {
  console.error('[Sync] Error syncing avatars:', err);
  process.exit(1);
});
