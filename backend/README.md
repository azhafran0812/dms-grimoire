# LAPORAN TUGAS PROYEK KOMPUTASI AWAN
## PENGEMBANGAN BACKEND: DM'S GRIMOIRE (D&D CAMPAIGN MANAGER & AI ASSISTANT)

---

### IDENTITAS TUGAS
- **Mata Kuliah:** Komputasi Awan (*Cloud Computing*)
- **Judul Proyek:** DM's Grimoire — Game Backend Server (Micro Architecture Layer)
- **Anggota Tim:**
  1. **Abyan Zhafran** — *Backend & Database Architect*
  2. **Galang Reisduanto** — *Frontend & AI Integration*
- **Teknologi Utama:** Node.js, Express.js, Firebase Authentication, Firebase Realtime Database, Zod Validation, Google Gemini AI (via MCP)
- **Status Implementasi:** Selesai (*100% Lulus Pengujian / 12 of 12 Tests Passed*)

---

## 1. PENDAHULUAN

Laporan ini disusun sebagai bukti pemenuhan dan dokumentasi teknis pengerjaan komponen **Backend** pada proyek **DM's Grimoire** untuk mata kuliah Komputasi Awan.

Pada arsitektur sistem ini, backend bertindak sebagai lapisan perantara (*middleware*) dan gateway terpusat yang menghubungkan antarmuka pengguna (*Frontend*) dengan layanan komputasi awan Google Cloud (Firebase Authentication, Firebase Realtime Database, dan Google Gemini AI).

### Tujuan Pengembangan Backend:
1. **Mengamankan Kredensial Cloud:** Mengisolasi kunci API (*API Keys*) sensitif dan logika verifikasi otentikasi agar tidak terekspos di browser sisi klien.
2. **Validasi & Integritas Data:** Memastikan seluruh data yang dikirimkan klien divalidasi secara ketat menggunakan skema Zod sebelum disimpan ke database cloud.
3. **Pembaruan Data Parsial yang Aman (*Safe Partial Updates*):** Mencegah terhapusnya data saudara (*sibling properties*) pada objek bersarang D&D (seperti *Armor Class* atau *Hit Dice* saat terjadi pengurangan sisa *HP*).
4. **Orkestrasi Otomatis Layanan Cloud AI:** Menyediakan endpoint generasi NPC berbasis AI yang secara otomatis menyisipkan data party aktif saat ini ke dalam prompt AI, lalu menyimpan hasilnya langsung ke Realtime Database.

---

## 2. PEMENUHAN SPESIFIKASI & FITUR TUGAS

### A. Sistem Autentikasi & Keamanan (Firebase Auth & Webmailer)

Backend mengimplementasikan alur otentikasi berbasis token dengan verifikasi email wajib:

1. **Registrasi Akun Pengguna (`POST /api/auth/register`):**
   - Mendaftarkan akun menggunakan Firebase Authentication.
   - Menyimpan profil peran pengguna (*role*: `dm` atau `player`) pada node `/users/{uid}` di Realtime Database.
2. **Fitur Webmailer (Verifikasi Email Otomatis):**
   - Sistem memicu pengiriman email verifikasi ke alamat email pendaftar secara otomatis sesaat setelah akun dibuat menggunakan fungsi `sendEmailVerification()`.
3. **Gatekeeper Akses Login (`POST /api/auth/login`):**
   - Server memeriksa status `user.emailVerified`.
   - Jika email belum diverifikasi oleh pengguna, login dibatalkan dan sistem mengembalikan galat `AUTH_EMAIL_UNVERIFIED` (HTTP 403) yang mewajibkan pengguna memeriksa kotak masuk email terlebih dahulu.
4. **Verifikasi Token Mandiri (`verifyIdToken` & `authMiddleware`):**
   - Setiap pemanggilan endpoint terlindungi mewajibkan header `Authorization: Bearer <ID_TOKEN>`.
   - Token divalidasi langsung melalui Google Identity Toolkit REST API secara efisien dan aman.

---

### B. Matriks 12 Operasi CRUD (Firebase Realtime Database)

Seluruh 12 operasi CRUD berbasis cloud database telah diimplementasikan dan diuji secara penuh:

| No | Kategori | Operasi | Endpoint & Method | Node Firebase | Keterangan Fungsional |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | Karakter | **Create** | `POST /api/characters` | `/party/{id}` | Mendaftarkan profil karakter petualang baru beserta atribut stat tempur awal. |
| **2** | Karakter | **Read** | `GET /api/characters`<br>`GET /api/characters/:id` | `/party` | Mengambil seluruh data karakter party aktif atau satu karakter berdasarkan ID. |
| **3** | Karakter | **Update** | `PATCH /api/characters/:id`<br>`PATCH /api/characters/:id/stat` | `/party/{id}` | Memperbarui sisa HP, level, atau atribut tempur secara dinamis dan aman. |
| **4** | Karakter | **Delete** | `DELETE /api/characters/:id` | `/party/{id}` | Menghapus karakter permanen jika gugur dalam petualangan (*permadeath*). |
| **5** | Inventaris | **Create** | `POST /api/inventory` | `/inventory/{id}` | Menambahkan item loot baru (potion, senjata, scroll, gold) ke tas bersama. |
| **6** | Inventaris | **Read** | `GET /api/inventory`<br>`GET /api/inventory/:id` | `/inventory` | Mengambil seluruh daftar inventaris party secara kolektif. |
| **7** | Inventaris | **Update** | `PATCH /api/inventory/:id` | `/inventory/{id}` | Memperbarui kuantitas atau deskripsi item saat digunakan pemain. |
| **8** | Inventaris | **Delete** | `DELETE /api/inventory/:id` | `/inventory/{id}` | Menghapus item dari tas ketika dibuang, habis dikonsumsi, atau dihancurkan. |
| **9** | NPC & Lore | **Create** | `POST /api/npcs` | `/npcs/{id}` &<br>`/campaign/active/npcs/{id}` | Menambahkan tokoh NPC baru ke database (baik input manual maupun dari AI). |
| **10** | NPC & Lore | **Read** | `GET /api/npcs`<br>`GET /api/npcs/:id` | `/campaign/active/npcs` | Mengambil katalog profil tokoh penduduk wilayah, latar belakang, dan statistik. |
| **11** | NPC & Lore | **Update** | `PATCH /api/npcs/:id` | `/campaign/active/npcs/{id}` | Memperbarui status disposisi tokoh (Ramah, Netral, Bermusuhan) atau lore. |
| **12** | NPC & Lore | **Delete** | `DELETE /api/npcs/:id` | `/campaign/active/npcs/{id}` | Menghapus entitas NPC yang alur ceritanya telah selesai atau tewas. |

---

### C. Integrasi Layanan Cloud Tambahan (Google Gemini AI via MCP)

Sebagai pemenuhan nilai tambah integrasi layanan cloud pihak ketiga (*Third-Party Cloud AI Integration*):

1. **Proxy Endpoint AI:** Tersedia endpoint `POST /api/npcs/generate` dan `POST /api/generate-npc`.
2. **Injeksi Konteks Otomatis (*Auto Party Context Injection*):**
   - Sebelum request dikirimkan ke model AI, backend mengambil data karakter party aktif dari Firebase Realtime Database.
   - Backend menghitung jumlah anggota party, rata-rata level party, serta komposisi kelas/ras karakter.
   - Informasi ini disisipkan ke dalam konteks prompt AI sehingga NPC atau tantangan yang di-generate seimbang dengan level pemain.
3. **Penyimpanan Permanen Otomatis (*Auto-Persistence*):**
   - Hasil generasi AI berupa struktur data JSON otomatis disimpan ke Realtime Database pada node `/npcs` dan node terkait lainnya (`/campaign/active/lore`, `/chronicles`, `/inventory`), memastikan data tidak hilang saat sesi ditutup.

---

## 3. ARSITEKTUR & STRUKTUR KODE

Kode backend disusun dengan pendekatan modular 6 lapisan (*Layered Architecture*) agar mudah dipelihara dan diuji:

1. **Layer 0 - Konfigurasi (`src/config/`):**
   - `env.js`: Membaca variabel `.env`, memvalidasi port, dan mengunci objek konfigurasi.
   - `firebase.js`: Inisialisasi Firebase Client SDK untuk Auth dan Realtime Database.
2. **Layer 1 - Unified I/O & Validasi (`src/io/`):**
   - `request.js`: Validasi skema Zod untuk Character, Inventory, NPC, dan AI request.
   - `response.js`: Standarisasi format amplop respons JSON (`{ ok, data, error, meta }`).
   - `AppError.js` & `errorHandler.js`: Penanganan error terpusat dengan kode error terstruktur.
3. **Layer 2 - Akses Data / Models (`src/models/`):**
   - `characterModel.js`: Operasi database `/party` dengan fungsi *dot-notation flattening* untuk update parsial.
   - `inventoryModel.js`: Operasi database `/inventory`.
   - `npcModel.js`: Operasi database `/campaign/active/npcs` dan `/npcs`.
4. **Layer 3 - Logika Bisnis / Services (`src/services/`):**
   - `characterService.js`: Aturan bisnis karakter, penanganan HP, dan validasi ID.
   - `inventoryService.js`: Logika kuantitas item dan penghapusan otomatis jika jumlah nol.
   - `npcService.js`: Logika NPC dan integrasi party context untuk generasi AI.
   - `mcpClient.js`: Klien HTTP ke server MCP AI dengan batas waktu (*timeout*) 60 detik.
5. **Layer 4 - Controllers (`src/controllers/`):**
   - Menangani request/response HTTP, memanggil auth middleware, dan mengeksekusi service.
6. **Layer 5 - Transport & Routing (`src/server/` & `src/index.js`):**
   - Konfigurasi Express, middleware CORS, parser JSON, dan pemetaan seluruh rute API.

---

## 4. DOKUMENTASI ENDPOINT REST API

### Format Standar Amplop Respons (Response Envelope)
Setiap endpoint mengembalikan respons dengan format seragam:
```json
{
  "ok": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-10-15T09:45:00.000Z"
  }
}
```

### Rangkuman Endpoint Backend

| Method | Endpoint | Otentikasi | Keterangan |
| :---: | :--- | :---: | :--- |
| `GET` | `/health` | Publik | Health check status server dan runtime environment |
| `POST` | `/api/auth/register` | Publik | Registrasi pengguna baru dan pengiriman email verifikasi |
| `POST` | `/api/auth/login` | Publik | Autentikasi pengguna dengan gatekeeper verifikasi email |
| `POST` | `/api/auth/logout` | Publik | Keluar dari sesi login |
| `POST` | `/api/characters` | Bearer Token | Membuat karakter petualang baru |
| `GET` | `/api/characters` | Bearer Token | Mengambil seluruh karakter party |
| `GET` | `/api/characters/:id` | Bearer Token | Mengambil satu karakter berdasarkan ID |
| `PATCH` | `/api/characters/:id` | Bearer Token | Update parsial data karakter |
| `PATCH` | `/api/characters/:id/stat` | Bearer Token | Update satu nilai stat (contoh: `combat/hpCurrent`) |
| `DELETE` | `/api/characters/:id` | Bearer Token | Menghapus karakter (permadeath) |
| `POST` | `/api/inventory` | Bearer Token | Menambahkan item baru ke inventaris |
| `GET` | `/api/inventory` | Bearer Token | Mengambil seluruh item inventaris |
| `GET` | `/api/inventory/:id` | Bearer Token | Mengambil rincian satu item |
| `PATCH` | `/api/inventory/:id` | Bearer Token | Mengubah kuantitas/detail item |
| `DELETE` | `/api/inventory/:id` | Bearer Token | Menghapus item dari inventaris |
| `POST` | `/api/npcs` | Bearer Token | Menambahkan tokoh NPC manual |
| `GET` | `/api/npcs` | Bearer Token | Mengambil daftar seluruh tokoh NPC |
| `GET` | `/api/npcs/:id` | Bearer Token | Mengambil rincian satu tokoh NPC |
| `PATCH` | `/api/npcs/:id` | Bearer Token | Memperbarui status disposisi/lore NPC |
| `DELETE` | `/api/npcs/:id` | Bearer Token | Menghapus tokoh NPC |
| `POST` | `/api/npcs/generate` | Opsional/Bearer | Generate NPC via AI dengan konteks party |
| `POST` | `/api/generate-npc` | Opsional/Bearer | Alias endpoint generasi AI |

---

## 5. VARIABEL LINGKUNGAN (.ENV)

Konfigurasi backend disimpan secara aman pada berkas `.env` dan diatur melalui `.env.example`:

```ini
PORT=4000
NODE_ENV=development

# Firebase Cloud SDK Credentials
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=dms-grimoire.firebaseapp.com
FIREBASE_DATABASE_URL=https://dms-grimoire-default-rtdb.firebasedatabase.app
FIREBASE_PROJECT_ID=dms-grimoire
FIREBASE_STORAGE_BUCKET=dms-grimoire.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=000000000000
FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxx

# Third-Party AI Service (MCP Server)
MCP_BASE_URL=http://localhost:3000

# Keamanan CORS
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 6. PANDUAN MENJALANKAN SERVER & PENGUJIAN

### Langkah Instalasi & Menjalankan:
1. Buka terminal pada direktori `backend/`.
2. Instal pustaka dependensi:
   ```bash
   npm install
   ```
3. Siapkan file konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
4. Jalankan server dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   Server aktif pada: `http://localhost:4000`.

5. Jalankan server dalam mode produksi:
   ```bash
   npm start
   ```

6. Jalankan pengujian otomatis:
   ```bash
   npm test
   ```

---

## 7. LAPORAN HASIL PENGUJIAN SISTEM (TEST REPORT)

Pengujian otomatis dijalankan menggunakan Node.js Native Test Runner (`node --test tests/**/*.test.js`). Pengujian mencakup keselarasan skema input frontend, validasi parsial update Firebase, dan operasi live CRUD:

### Ringkasan Hasil Pengujian:
- **Total Test Suites:** 2
- **Total Tests:** 12
- **Passed:** 12 (100%)
- **Failed:** 0
- **Durasi Eksekusi:** ~3.3 detik

### Daftar Kasus Uji yang Lulus:
1. `should parse flat AddCharacterModal form data into nested structure` (Lulus)
2. `should parse full characterModel.js payload and preserve all fields` (Lulus)
3. `should parse UpdateCharacterSchema with flat hpCurrent` (Lulus)
4. `should parse UpdateCharacterSchema with nested combat object` (Lulus)
5. `should map ArcaneScribe presets correctly into full type and provide fallback prompt` (Lulus)
6. `should coerce string values into numbers` (Lulus)
7. `should create character and verify nested combat fields in Realtime Database` (Lulus)
8. `should update single stat path without overwriting other combat fields` (Lulus)
9. `should update nested combat object without overwriting sibling fields` (Lulus)
10. `should delete character permanently (permadeath)` (Lulus)
11. `should test inventory CRUD and auto-delete on quantity zero` (Lulus)
12. `should test NPC CRUD operations` (Lulus)

---

## 8. KESIMPULAN

Berdasarkan implementasi dan hasil pengujian otomatis:
1. Komponen backend telah berhasil dibangun sesuai dengan spesifikasi tugas besar mata kuliah Komputasi Awan.
2. Seluruh 12 operasi CRUD berbasis cloud database Firebase Realtime Database beroperasi dengan normal dan aman dari penimpaan data (*data clobbering*).
3. Sistem autentikasi pengguna telah dilengkapi mekanisme verifikasi email otomatis (*Webmailer*) dan proteksi gatekeeper sebelum pengguna diizinkan masuk ke dashboard.
4. Integrasi layanan cloud AI Google Gemini melalui proxy backend telah berhasil mengimplementasikan *context-aware prompt injection* dan penyimpanan data permanen.
5. Backend telah siap dihubungkan dengan antarmuka frontend dan siap untuk tahap deployment cloud publik.
