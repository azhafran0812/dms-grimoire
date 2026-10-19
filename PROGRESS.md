# LAPORAN PROGRES PENGEMBANGAN SISTEM: DM'S GRIMOIRE
## D&D Campaign Manager & AI Assistant (Cloud Computing Project)

---

### IDENTITAS PROYEK
- **Mata Kuliah:** Komputasi Awan (*Cloud Computing*)
- **Judul Proyek:** DM's Grimoire — D&D Campaign Manager & AI Assistant
- **Repositori GitHub:** `azhafran0812/dms-grimoire` (Branch: `dev-init`)
- **Anggota Tim & Pembagian Tugas:**
  1. **Abyan Zhafran** (*Backend & Database Architect*)
     - Arsitektur Cloud Firebase (Auth & Realtime Database)
     - Server Middleware Express.js, Validasi Zod, & Unit Testing (12/12 Tests Passed)
     - Implementasi 6 Operasi CRUD Utama (Karakter & Inventaris)
  2. **Galang Reisduanto** (*Frontend & AI Integration*)
     - Desain UI/UX Dashboard Interaktif Bertema Fantasi Gelap (Dungeon Master & Player Views)
     - Integrasi Layanan Cloud Tambahan (Google Gemini AI via MCP Architecture)
     - Implementasi 6 Operasi CRUD Pendukung (NPC/Lore & Inventaris U/D)
     - Player View (Hero Sheet, Fellowship, Chronicles, Schedule, Character Stylist)

---

## 1. RINGKASAN STATUS KELENGKAPAN FITUR

| No | Modul Fungsional | Target Spesifikasi | Status | Keterangan |
|:---:|:---|:---|:---:|:---|
| 1 | **Sistem Autentikasi** | Firebase Auth (Register, Login, Session) | ✅ Selesai | Token-based auth & role redirection |
| 2 | **Webmailer Security Gatekeeper** | Verifikasi Email Wajib | ✅ Selesai | Memblokir akses jika `emailVerified: false` |
| 3 | **CRUD Karakter (1 - 4)** | Create, Read, Update, Delete | ✅ Selesai | Sinkronisasi stat HP, level, permadeath |
| 4 | **CRUD Inventaris (5 - 8)** | Create, Read, Update, Delete | ✅ Selesai | Shared stash, personal backpack, auto-remove |
| 5 | **CRUD NPC & Lore (9 - 12)** | Create, Read, Update, Delete | ✅ Selesai | Multi-disposisi (Friendly, Neutral, Hostile) |
| 6 | **Integrasi Cloud AI (Gemini)** | Prompt Injeksi Konteks & Auto-Save | ✅ Selesai | Injeksi otomatis komposisi party aktif |
| 7 | **Antarmuka DM & Player** | Dashboard Khusus DM & Dashboard Player | ✅ Selesai | Role guard & navigasi modular |
| 8 | **Sinkronisasi Real-Time** | Firebase WebSockets (`onValue`) | ✅ Selesai | *Zero refresh* sinkron antar layar klien |

---

## 2. DETAIL FUNGSI-FUNGSI YANG SUDAH SELESAI & CAPTURE CODING

### A. Sistem Autentikasi & Gatekeeper Verifikasi Email (Webmailer)
Sistem memvalidasi pendaftaran dan login pengguna. Setelah mendaftar, sistem otomatis memicu pengiriman email verifikasi. Akses ke dashboard diblokir secara ketat apabila atribut `emailVerified` masih bernilai `false`.

#### 📌 Capture Coding: `frontend/src/controllers/authController.js`
```javascript
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export const loginUser = async (email, password) => {
  // 1. Sign In ke Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Gatekeeper: Cek Verifikasi Email Wajib (Webmailer)
  if (!user.emailVerified) {
    throw new Error('Email belum diverifikasi. Silakan cek kotak masuk Anda.');
  }

  // 3. Ambil Role Pengguna dari Realtime Database (dm atau player)
  const userRef = ref(db, 'users/' + user.uid);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val(); // Mengembalikan data user beserta role
  } else {
    throw new Error('Data user tidak ditemukan di database.');
  }
};
```

---

### B. Proteksi Rute Berdasarkan Peran Pengguna (Role-Based Access Control)
Aplikasi membedakan hak akses secara ketat antara **Dungeon Master** (`/dashboard/dm`) dan **Player** (`/dashboard/player`). Jika pemain biasa mencoba membuka halaman DM, sistem otomatis mengalihkannya ke dashboard Player.

#### 📌 Capture Coding: `frontend/src/App.jsx`
```javascript
function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      try {
        const snap = await get(ref(db, `users/${currentUser.uid}/role`));
        const rawRole = (snap.val() || "").toLowerCase();
        const normalized = (rawRole === "dungeon_master" || rawRole === "dm") ? "dm" : "player";
        setRole(normalized);
      } catch (err) {
        console.warn("Role fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="loading-spinner">Consulting the Grimoire...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Jika rute DM diminta namun peran bukan DM, redirect ke dashboard player
  if (requiredRole === "dm" && role !== "dm") {
    return <Navigate to="/dashboard/player" replace />;
  }

  return children;
}
```

---

### C. 4 Operasi CRUD Karakter Player (Node: `/party`)
1. **Create:** Menambahkan profil petualang baru beserta atribut stat tempur lengkap.
2. **Read:** Membaca daftar anggota party secara live.
3. **Update:** Memperbarui sisa HP, Level, Armor Class, atau stat tempur tanpa menimpa data bersarang (*safe partial update*).
4. **Delete:** Menghapus karakter permanen jika gugur dalam petualangan (*Permadeath*).

#### 📌 Capture Coding: `frontend/src/controllers/partyController.js`
```javascript
import { db } from '../firebase';
import { ref, set, update, remove } from 'firebase/database';
import { createCharacterPayload } from '../models/characterModel';

// 1. Create Character (CRUD 1)
export const addCharacter = async (characterInput) => {
  const newCharacter = createCharacterPayload(characterInput);
  const characterRef = ref(db, `party/${newCharacter.id}`);
  await set(characterRef, newCharacter);
  return newCharacter;
};

// 2. Update Live HP (CRUD 3)
export const updateCharacterHP = async (characterId, newCurrentHP) => {
  const hpRef = ref(db, `party/${characterId}/combat`);
  await update(hpRef, { hpCurrent: newCurrentHP });
};

// 3. Update Stat Spesifik (Safe Partial Update)
export const updateCharacterStat = async (characterId, statPath, newValue) => {
  const statRef = ref(db, `party/${characterId}/${statPath}`);
  await set(statRef, newValue);
};

// 4. Delete Character Permanen / Permadeath (CRUD 4)
export const removeCharacter = async (characterId) => {
  const characterRef = ref(db, `party/${characterId}`);
  await remove(characterRef);
};
```

---

### D. 4 Operasi CRUD Inventaris Party (Node: `/inventory` & `/party/:id/inventory`)
1. **Create:** Menambahkan item baru (senjata, armor, potion, scroll, dll.).
2. **Read:** Menampilkan katalog loot tas bersama (*Shared Stash*) dan tas pribadi (*Personal Backpack*).
3. **Update:** Menyesuaikan kuantitas item (+ / -) dan mentransfer item antar tas.
4. **Delete:** Menghapus item saat dibuang atau otomatis dihapus saat kuantitas mencapai 0.

#### 📌 Capture Coding: `frontend/src/views/components/dm_views/InventoryView.jsx`
```javascript
// 1. Tambah Item Baru ke Shared Stash atau Personal Backpack (CRUD 5)
const handleAddItem = async (e) => {
  e.preventDefault();
  if (targetContainer === 'shared') {
    const sharedRef = ref(db, 'inventory');
    const newRef = push(sharedRef);
    await set(newRef, {
      id: newRef.key,
      name: itemName.trim(),
      type: itemType,
      quantity: parseInt(itemQuantity) || 1,
      description: itemDesc.trim(),
      createdAt: Date.now()
    });
  } else {
    const personalRef = ref(db, `party/${selectedHero.id}/inventory/items`);
    const newRef = push(personalRef);
    await set(newRef, {
      id: newRef.key,
      name: itemName.trim(),
      type: itemType,
      quantity: parseInt(itemQuantity) || 1,
      description: itemDesc.trim(),
      ownerId: selectedHero.id,
      createdAt: Date.now()
    });
  }
};

// 2. Update Kuantitas & Auto-Delete saat 0 (CRUD 7 & 8)
const handleSharedQty = async (item, delta) => {
  const newQty = (item.quantity || 1) + delta;
  if (newQty <= 0) {
    if (window.confirm(`Item "${item.name}" habis. Hapus dari Shared Stash?`)) {
      await remove(ref(db, `inventory/${item.id}`));
    }
  } else {
    await update(ref(db, `inventory/${item.id}`), {
      quantity: newQty,
      updatedAt: Date.now()
    });
  }
};
```

---

### E. 4 Operasi CRUD Database NPC & Lore (Node: `/campaign/active/npcs` & `/npcs`)
1. **Create:** Mendaftarkan profil tokoh NPC baru (nama, peran, lokasi, disposisi, rahasia/lore).
2. **Read:** Menampilkan katalog penduduk wilayah aktif lengkap dengan badge status disposisi.
3. **Update:** Memperbarui hubungan naratif (Friendly, Neutral, Hostile) atau detail rahasia tokoh.
4. **Delete:** Menghapus entitas NPC cerita lampau atau tokoh yang telah gugur.

#### 📌 Capture Coding: `frontend/src/controllers/npcController.js`
```javascript
import { db } from '../firebase';
import { ref, set, update, remove, push } from 'firebase/database';

const npcPath = 'campaign/active/npcs';
const catalogPath = 'npcs';

// 1. Create NPC (CRUD 9)
export const addNpc = async (npcData) => {
  const npcRef = ref(db, npcPath);
  const newNpcRef = push(npcRef);
  const id = newNpcRef.key;
  const entry = {
    id,
    name: npcData.name?.trim() || "Unknown Figure",
    role: npcData.role?.trim() || "Commoner",
    location: npcData.location?.trim() || "The Ashen Crown",
    disposition: npcData.disposition || "Neutral",
    secret: npcData.secret?.trim() || "",
    source: npcData.source || "manual",
    createdAt: Date.now()
  };
  await set(newNpcRef, entry);
  await set(ref(db, `${catalogPath}/${id}`), entry).catch(() => {});
  return entry;
};

// 2. Update Status Hubungan / Disposisi (CRUD 11)
export const updateNpcDisposition = async (id, disposition) => {
  const payload = { disposition, updatedAt: Date.now() };
  await update(ref(db, `${npcPath}/${id}`), payload);
  await update(ref(db, `${catalogPath}/${id}`), payload).catch(() => {});
};

// 3. Delete NPC Permanen (CRUD 12)
export const deleteNpc = async (id) => {
  await remove(ref(db, `${npcPath}/${id}`));
  await remove(ref(db, `${catalogPath}/${id}`)).catch(() => {});
};
```

---

### F. Integrasi Layanan Cloud Tambahan (Google Gemini AI via MCP Architecture)
Fitur ekstra komputasi awan menggunakan AI untuk men-generate profil NPC dan lore secara otomatis:
1. **Context-Aware Prompt Injection:** Mengambil komposisi party aktif (rata-rata level, ras, kelas) dari Firebase lalu menyisipkannya ke prompt AI di balik layar.
2. **Auto-Persistence:** Hasil output AI dalam format JSON terstruktur otomatis disimpan langsung ke Firebase Realtime Database.

#### 📌 Capture Coding: `backend/src/services/npcService.js`
```javascript
export async function generateNpcWithAi({ prompt, type }) {
  // 1. Injeksi Konteks Otomatis: Ambil data party aktif dari Realtime Database
  let partyContext = null;
  try {
    const party = await CharacterModel.findAll();
    if (party && Object.keys(party).length > 0) {
      const members = Object.values(party);
      partyContext = {
        memberCount: members.length,
        averageLevel: Math.round(
          members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length
        ),
        members: members.map((m) => ({
          name: m.name,
          class: m.characterClass || m.class || "Fighter",
          race: m.race || "Human",
          level: m.level || 1,
        })),
      };
    }
  } catch {
    console.warn("[NpcService] Could not fetch party context, proceeding without it");
  }

  // 2. Panggil Layanan AI (Google Gemini via MCP Client)
  const mcpResponse = await mcpClient.generateNpc({ prompt, type, partyContext, render: true });

  // 3. Simpan Hasil Generasi AI secara Permanen ke Cloud Database Firebase
  const npcData = mcpResponse.data?.npc;
  const createdNpc = await NpcModel.create({
    name: npcData.name,
    title: npcData.title,
    race: npcData.race,
    class: npcData.class,
    level: npcData.level,
    disposition: npcData.disposition || "Neutral",
    lore: npcData.lore,
    secret: npcData.secret,
    source: "ai"
  });

  return createdNpc;
}
```

---

### G. Player View Interaktif (Hero Sheet, Fellowship, & Chronicles)
Menyediakan pengalaman bermain khusus bagi para Player, mencakup:
- **Hero Sheet View:** Lembar karakter D&D dinamis lengkap dengan slot mantra (*spell slots*), *hit dice*, koin kekayaan, dan aksi tempur.
- **Fellowship View:** Pemantauan kondisi teman satu tim secara real-time.
- **Chronicles:** Catatan riwayat petualangan dan pengumuman dari DM.

#### 📌 Capture Coding: `frontend/src/views/pages/DashboardPlayer.jsx`
```javascript
// Listener Real-Time Karakter Aktif Milik Player
useEffect(() => {
  if (!activeCharacter?.id) return;
  const charRef = ref(db, `party/${activeCharacter.id}`);
  const unsub = onValue(charRef, (snap) => {
    if (snap.exists()) {
      setActiveCharacter({ id: activeCharacter.id, ...snap.val() });
    }
  });
  return () => unsub();
}, [activeCharacter?.id]);

// Sinkronisasi Seluruh Anggota Party untuk Fellowship View
useEffect(() => {
  const partyRef = ref(db, "party");
  const unsub = onValue(partyRef, (snap) => {
    if (snap.exists()) {
      const list = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
      setPartyMembers(list);
    } else {
      setPartyMembers([]);
    }
  });
  return () => unsub();
}, []);
```

---

### H. Sistem Sinkronisasi Real-Time (Zero-Refresh WebSockets)
Setiap mutasi data (misalnya saat DM mengurangi HP karakter, atau pemain memindahkan potion di inventaris) tersinkronisasi instan ke seluruh layar pemain aktif menggunakan listener WebSocket Firebase.

#### 📌 Capture Coding: `frontend/src/views/pages/DashboardDM.jsx`
```javascript
useEffect(() => {
  const partyRef = ref(db, 'party');
  const inventoryRef = ref(db, 'inventory');
  const npcsRef = ref(db, 'campaign/active/npcs');

  // Realtime Listener untuk Karakter
  const unsubParty = onValue(partyRef, (snapshot) => {
    if (snapshot.exists()) {
      const partyData = snapshot.val();
      const partyList = Object.keys(partyData).map(key => ({ id: key, ...partyData[key] }));
      setCharacters(partyList);
    } else {
      setCharacters([]);
    }
  });

  // Realtime Listener untuk Inventaris
  const unsubInv = onValue(inventoryRef, (snapshot) => {
    setInventory(snapshot.exists() ? Object.values(snapshot.val()) : []);
  });

  // Realtime Listener untuk NPC
  const unsubNpcs = onValue(npcsRef, (snapshot) => {
    setNpcs(snapshot.exists() ? Object.values(snapshot.val()) : []);
  });

  return () => {
    unsubParty();
    unsubInv();
    unsubNpcs();
  };
}, []);
```

---

## 3. HASIL PENGUJIAN OTOMATIS (AUTOMATED TEST SUITE)

Pengujian backend dijalankan menggunakan Node.js Native Test Runner pada seluruh modul CRUD dan integrasi database:

```
> dms-grimoire-backend@1.0.0 test
> node --test tests/**/*.test.js

# Subtest: Frontend <-> Backend Schema Alignment
  ok 1 - should parse flat AddCharacterModal form data into nested structure
  ok 2 - should parse full characterModel.js payload and preserve all fields
  ok 3 - should parse UpdateCharacterSchema with flat hpCurrent
  ok 4 - should parse UpdateCharacterSchema with nested combat object
  ok 5 - should map ArcaneScribe presets correctly into full type and provide fallback prompt
  ok 6 - should coerce string values into numbers
ok 1 - Frontend <-> Backend Schema Alignment

# Subtest: Firebase Live CRUD Operations & Partial Merging
  ok 1 - should create character and verify nested combat fields in Realtime Database
  ok 2 - should update single stat path without overwriting other combat fields
  ok 3 - should update nested combat object without overwriting sibling fields
  ok 4 - should delete character permanently (permadeath)
  ok 5 - should test inventory CRUD and auto-delete on quantity zero
  ok 6 - should test NPC CRUD operations
ok 2 - Firebase Live CRUD Operations & Partial Merging

# Total: 12 tests | 2 suites | 12 passed (100%) | 0 failed
```

---

## 4. KESIMPULAN

Seluruh spesifikasi tugas besar mata kuliah Komputasi Awan telah berhasil diimplementasikan:
1. **12 Operasi CRUD Cloud Database** beroperasi penuh tanpa data clobbering.
2. **Sistem Autentikasi & Webmailer** menjamin keamanan akses akun pengguna.
3. **Layanan Cloud AI (Google Gemini)** terintegrasi dengan context injection otomatis.
4. **Antarmuka Pengguna Modern** memisahkan wewenang DM dan Player dengan sinkronisasi instan dua arah.
