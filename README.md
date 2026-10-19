# DM's Grimoire — D&D Campaign Manager & AI Assistant
> Proyek Besar Mata Kuliah Komputasi Awan (Cloud Computing)

[![Tests](https://img.shields.io/badge/tests-12%20passed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/cloud-Google%20Firebase%20%7C%20Gemini%20AI-orange.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg)]()
[![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Express-darkgreen.svg)]()

DM's Grimoire adalah platform manajemen sesi tabletop RPG (Dungeons & Dragons 5e) interaktif berbasis cloud yang menyinkronkan data petualangan secara *real-time* antara Dungeon Master (DM) dan Player, dilengkapi integrasi Google Gemini AI untuk asistensi kreatif kampanye.

---

## 👥 Tim Pengembang
1. **Abyan Zhafran** — *Backend & Database Architect*
2. **Galang Reisduanto** — *Frontend & AI Integration*

---

## 📑 Dokumentasi & Laporan Progres
- 📖 **[Laporan Progres Lengkap & Capture Coding](PROGRESS.md)** — Dokumen detail daftar 12 operasi CRUD, autentikasi Webmailer, integrasi Gemini AI, dan cuplikan kode implementasi.
- ⚙️ **[Dokumentasi Teknis Backend](backend/README.md)** — Arsitektur REST API, skema Zod, endpoint, dan hasil pengujian otomatis 12/12 lulus.
- 📋 **[Daftar Tugas & Milestone](task.md)** — Matriks alokasi tugas tim dan checklist pengerjaan.

---

## 🚀 Fitur Utama
1. **Sistem Autentikasi & Webmailer:** Registrasi, login, dan gatekeeper verifikasi email otomatis via Firebase Auth.
2. **12 Operasi CRUD Cloud Database:**
   - **Karakter (1 - 4):** Create profil, Live HP sync, Update stat tempur, dan Permadeath.
   - **Inventaris (5 - 8):** Tas bersama (*Shared Stash*), tas pribadi (*Backpack*), dan penyesuaian kuantitas.
   - **NPC & Lore (9 - 12):** Database penduduk, relasi faksi (Friendly/Neutral/Hostile), dan rahasia cerita.
3. **Integrasi Cloud AI (Google Gemini via MCP):** Injeksi otomatis konteks level & ras party aktif ke sistem prompt, serta penyimpanan otomatis ke database.
4. **Dashboard Khusus Multi-Role:** Tampilan DM untuk memimpin game dan Hero Sheet interaktif untuk Player.
5. **Zero-Refresh Real-Time Sync:** Sinkronisasi instan via Firebase WebSockets (`onValue`).

---

## 💻 Cara Menjalankan Secara Lokal

### 1. Menjalankan Backend:
```bash
cd backend
npm install
npm run dev
# Server berjalan di http://localhost:4000
# Jalankan test: npm test
```

### 2. Menjalankan Frontend:
```bash
cd frontend
npm install
npm run dev
# Client aktif di http://localhost:5173
```
