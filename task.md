# Daftar Tugas Proyek: DM's Grimoire (D&D Campaign Manager & AI Assistant)

Dokumen ini memuat seluruh daftar tugas, spesifikasi operasional, kebutuhan arsitektur cloud, pembagian tanggung jawab, dan jadwal pengembangan proyek **DM's Grimoire** yang diekstraksi secara komprehensif dari proposal resmi dan materi presentasi proyek Cloud Computing.

---

## Bagian I: Setup Fondasi Infrastruktur & Konfigurasi Cloud

- [ ] 1. **Inisialisasi Proyek di Firebase Console**  
  *Deskripsi:* Membuat proyek baru pada Google Firebase Console, mengonfigurasi *Project Settings*, mengaktifkan Firebase Web App, dan mengunduh konfigurasi kredensial SDK klien (`firebaseConfig`).  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 2. **Inisialisasi Repositori Git & GitHub**  
  *Deskripsi:* Menyiapkan repositori bersama di GitHub, membuat branch utama (`main`/`master`), mengonfigurasi file `.gitignore` untuk melindungi API Keys dan file rahasia, serta menetapkan aturan kolaborasi tim.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

- [ ] 3. **Setup Lingkungan Kerja Proyek (Scaffolding)**  
  *Deskripsi:* Mengonfigurasi struktur direktori frontend dan backend, inisialisasi `package.json`, instalasi dependensi utama (Firebase SDK, Express.js, CORS, dotenv, Tailwind CSS).  
  *Penanggung Jawab:* Abyan Zhafran & Galang Reisduanto

- [ ] 4. **Konfigurasi Server Middleware Node.js & Express.js**  
  *Deskripsi:* Membangun server backend berbasis Express.js yang bertindak sebagai gateway aman untuk melindungi *Secret API Keys* (kunci API AI) agar tidak terekspos ke sisi klien.  
  *Penanggung Jawab:* Abyan Zhafran (didukung oleh Galang Reisduanto)

- [ ] 5. **Pengaturan Variabel Lingkungan (.env)**  
  *Deskripsi:* Mengamankan API keys Firebase, Google Gemini API Key, port server, dan kredensial layanan email dalam file konfigurasi lokal yang terisolasi.  
  *Penanggung Jawab:* Abyan Zhafran

---

## Bagian II: Sistem Autentikasi & Keamanan (Firebase Auth & Webmailer)

- [ ] 6. **Implementasi Sistem Registrasi Akun Pengguna (Player & DM)**  
  *Deskripsi:* Membangun formulir pendaftaran akun menggunakan Firebase Authentication (`createUserWithEmailAndPassword`) untuk memvalidasi email dan kata sandi pengguna baru.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 7. **Implementasi Fitur Webmailer (Email Verification Otomatis)**  
  *Deskripsi:* Mengintegrasikan pengiriman email verifikasi otomatis sesaat setelah registrasi menggunakan fungsi `sendEmailVerification()` atau integrasi Nodemailer/Firebase Webmailer.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 8. **Implementasi Gatekeeper Akses Dashboard (Verifikasi Wajib)**  
  *Deskripsi:* Memblokir akses ke dashboard utama jika atribut `user.emailVerified` masih bernilai `false`, serta menampilkan notifikasi instruksi pemeriksaan kotak masuk (*inbox*) email.  
  *Penanggung Jawab:* Abyan Zhafran & Galang Reisduanto

- [ ] 9. **Implementasi Sistem Login & Logout Akun**  
  *Deskripsi:* Membangun autentikasi masuk dengan `signInWithEmailAndPassword`, manajemen sesi login (*session persistence*), serta fitur keluar akun (*logout*).  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 10. **Konfigurasi Authorized Domains pada Firebase Console**  
  *Deskripsi:* Mendaftarkan domain hosting produksi (misal: domain Render/Vercel) ke daftar *Authorized Domains* di Firebase Console guna mencegah galat *unauthorized OAuth domain*.  
  *Penanggung Jawab:* Abyan Zhafran & Tim

---

## Bagian III: Implementasi 12 Operasi CRUD (Firebase Realtime Database)

### A. Manajemen Karakter Player (4 Operasi CRUD)
- [ ] 11. **CRUD Karakter 1 - Create: Pendaftaran Profil Karakter Baru**  
  *Deskripsi:* Menyediakan antarmuka dan fungsi database untuk menambahkan profil karakter baru (nama karakter misal: *Krakatoa Abysswhirl* atau *Bryn*, class, race, level awal, total HP) ke node `/characters` di Firebase Realtime Database.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 12. **CRUD Karakter 2 - Read: Monitoring Status Karakter Real-Time**  
  *Deskripsi:* Mengambil dan menampilkan data seluruh karakter aktif secara real-time via WebSocket Firebase SDK, mencakup status sisa Hit Points (HP), level, race, dan class tanpa perlu memuat ulang halaman (*zero refresh*).  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 13. **CRUD Karakter 3 - Update: Mutasi Sisa Poin HP dan Level Karakter**  
  *Deskripsi:* Mengimplementasikan fungsi perubahan nilai dinamis sisa HP saat karakter terkena damage/healing atau kenaikan level saat petualangan berlangsung.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 14. **CRUD Karakter 4 - Delete: Pencabutan Karakter Mati Permanen (Permadeath)**  
  *Deskripsi:* Menyediakan mekanisme penghapusan entitas karakter dari database jika karakter gugur dalam kampanye sesuai aturan *permadeath* D&D.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

### B. Manajemen Inventaris Party (4 Operasi CRUD)
- [ ] 15. **CRUD Inventaris 1 - Create: Penambahan Item Loot Petualangan**  
  *Deskripsi:* Menambahkan item loot baru yang ditemukan party ke dalam node kolektif `/inventory` (nama item, tipe item, kuantitas, deskripsi item).  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 16. **CRUD Inventaris 2 - Read: Rekapitulasi Daftar Item Seluruh Party**  
  *Deskripsi:* Menampilkan katalog inventaris bersama secara live di layar semua pemain dan Dungeon Master secara instan melalui sinkronisasi Firebase Realtime Database.  
  *Penanggung Jawab:* Abyan Zhafran (Backend & Database Architect)

- [ ] 17. **CRUD Inventaris 3 - Update: Pengurangan Kuantitas Item Konsumsi**  
  *Deskripsi:* Mengurangi atau mengubah jumlah kuantitas item dalam inventaris saat digunakan dalam sesi bermain (contoh: konsumsi potion penyembuh).  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 18. **CRUD Inventaris 4 - Delete: Pembuangan Item dari Tas Petualang**  
  *Deskripsi:* Menghapus item secara permanen dari tas kolektif saat item dibuang, hancur, atau dijual oleh party.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

### C. Manajemen Database NPC & Lore (4 Operasi CRUD)
- [ ] 19. **CRUD NPC 1 - Create: Injeksi Profil Tokoh NPC Baru**  
  *Deskripsi:* Membuat entitas NPC baru ke node `/npcs` baik melalui input manual Dungeon Master maupun secara otomatis dari hasil output AI Generator.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 20. **CRUD NPC 2 - Read: Tampilan Katalog Penduduk Wilayah Aktif**  
  *Deskripsi:* Mengambil dan menampilkan daftar NPC, profil latar belakang (*lore*), lokasi wilayah/kota, serta status relasi di layar Dungeon Master.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 21. **CRUD NPC 3 - Update: Transisi Status Hubungan Tokoh (Ramah/Bermusuhan)**  
  *Deskripsi:* Memperbarui status disposisi NPC terhadap pemain (Ramah, Netral, Bermusuhan) seiring perkembangan interaksi naratif kampanye.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 22. **CRUD NPC 4 - Delete: Penghapusan Entitas NPC Cerita Lampau**  
  *Deskripsi:* Menghapus catatan profil NPC dari database ketika tokoh tersebut telah tewas atau alur cerita/quest tokoh tersebut telah selesai.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

---

## Bagian IV: Integrasi Layanan Cloud Tambahan (AI Assistant - Google Gemini API)

- [ ] 23. **Setup Kredensial & SDK Google Gemini API**  
  *Deskripsi:* Mengonfigurasi Google AI Studio, memperoleh API Key Gemini, dan mengintegrasikan pustaka klien AI pada sisi server Node.js.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 24. **Pembuatan Endpoint Backend AI Generator (`/api/generate-npc`)**  
  *Deskripsi:* Membangun endpoint Express.js untuk menerima request prompt singkat dari DM, menyusun sistem prompt, dan meneruskannya ke Google Gemini API secara aman.  
  *Penanggung Jawab:* Galang Reisduanto (didukung oleh Abyan Zhafran)

- [ ] 25. **Implementasi Konteks Otomatis Profil Party ke Sistem Prompt**  
  *Deskripsi:* Merancang logika backend yang secara otomatis menyisipkan data party saat ini (level rata-rata, status party seperti Krakatoa atau Bryn) ke dalam *secret prompt* di balik layar tanpa perlu diketik ulang oleh DM.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 26. **Formatting Output AI Menjadi Data JSON Terstruktur**  
  *Deskripsi:* Menyesuaikan prompt engineering agar AI tidak sekadar mengembalikan teks mentah, melainkan objek JSON valid (nama NPC, kepribadian, stat, lore latar belakang, status relasi) yang siap disimpan ke Firebase.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 27. **Integrasi Tombol "Generate NPC AI" pada Dashboard DM**  
  *Deskripsi:* Menghubungkan antarmuka tombol pada dasbor dengan endpoint AI, menampilkan indikator pemrosesan (*loading state*), dan otomatis memicu fungsi Create NPC ke database.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 28. **Penyimpanan Permanen Hasil Generasi AI ke Firebase Realtime Database**  
  *Deskripsi:* Memastikan riwayat cerita dan statistik NPC hasil generasi AI tersimpan permanen di cloud agar tidak hilang akibat keterbatasan *context window* model AI standar.  
  *Penanggung Jawab:* Galang Reisduanto & Abyan Zhafran

---

## Bagian V: Desain Antarmuka Pengguna & Frontend Dashboard (UI/UX)

- [ ] 29. **Perancangan Konsep UI/UX Dasbor Bertema D&D / Grimoire**  
  *Deskripsi:* Merancang tata letak visual estetis bertema fantasi gelap/grimoire menggunakan CSS modern/Tailwind CSS yang ergonomis dan mudah dibaca saat sesi permainan berlangsung.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 30. **Implementasi Arsitektur 3 Panel Utama Dashboard**  
  *Deskripsi:* Membangun tata letak dasbor yang terbagi rapi menjadi 3 panel interaktif: Panel Karakter Player, Panel Inventaris Party, dan Panel NPC & Lore.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 31. **Implementasi Panel Karakter (Kartu Pemain & Indikator HP)**  
  *Deskripsi:* Merender kartu profil pemain dengan bilah visual HP dinamis, tombol mutasi damage/heal, indikator level, class, dan race.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 32. **Implementasi Panel Inventaris (Daftar Loot & Counter Kuantitas)**  
  *Deskripsi:* Merender tabel/kisi inventaris bersama dengan filter tipe item, kontrol tambah/kurang kuantitas secara langsung, dan tombol hapus item.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 33. **Implementasi Panel NPC & Dialog Modal AI Generator**  
  *Deskripsi:* Merender daftar NPC dengan badge status permusuhan (Ramah/Netral/Bermusuhan), modal input prompt AI, dan form penambahan manual.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 34. **Implementasi Responsivitas Antarmuka (Multi-Device Layout)**  
  *Deskripsi:* Memastikan tampilan web responsif diakses dari perangkat laptop/desktop Dungeon Master maupun smartphone/tablet para pemain.  
  *Penanggung Jawab:* Galang Reisduanto (Frontend & AI Integration)

- [ ] 35. **Koneksi Frontend ke Firebase Client SDK (Real-Time Listener)**  
  *Deskripsi:* Mengikat state aplikasi lokal dengan listener `onValue()` Firebase SDK agar perubahan data tersinkronisasi instan di layar seluruh pemain tanpa membebani server Node.js.  
  *Penanggung Jawab:* Galang Reisduanto & Abyan Zhafran

---

## Bagian VI: Pembagian Tugas & Tanggung Jawab Anggota (Task Allocation)

### A. Rincian Tanggung Jawab Abyan Zhafran (Backend & Database Architect)
- [ ] 36. **Setup Proyek & Lingkungan Firebase Cloud**  
  *Deskripsi:* Bertanggung jawab penuh atas inisialisasi Firebase Console, konfigurasi database rules, dan penyediaan konfigurasi SDK klien.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 37. **Pengembangan Sistem Autentikasi Firebase Auth**  
  *Deskripsi:* Bertanggung jawab atas logika registrasi, login, dan manajemen sesi pengguna.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 38. **Konfigurasi & Pengujian Fitur Webmailer**  
  *Deskripsi:* Bertanggung jawab atas alur verifikasi email otomatis dan pembatasan akses sebelum verifikasi selesai.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 39. **Penyelesaian 6 Fungsi CRUD Utama (Karakter 1-4 & Inventaris 1-2)**  
  *Deskripsi:* Mengembangkan dan memvalidasi operasi Create Karakter, Read Karakter, Update Karakter, Delete Karakter, Create Inventaris, dan Read Inventaris pada Firebase Realtime Database.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 40. **Deployment Aplikasi Final ke Cloud Hosting (Render)**  
  *Deskripsi:* Mengonfigurasi layanan cloud hosting publik (Render Web Service) untuk menjalankan aplikasi secara online.  
  *Penanggung Jawab:* Abyan Zhafran

### B. Rincian Tanggung Jawab Galang Reisduanto (Frontend & AI Integration)
- [ ] 41. **Desain & Implementasi UI/UX Dashboard Kampanye**  
  *Deskripsi:* Bertanggung jawab penuh atas perancangan antarmuka visual, layout 3 panel, responsivitas, dan interaktivitas komponen klien.  
  *Penanggung Jawab:* Galang Reisduanto

- [ ] 42. **Integrasi Layanan Cloud Tambahan (Google Gemini AI API)**  
  *Deskripsi:* Bertanggung jawab atas integrasi fitur ekstra cloud AI, pembuatan endpoint proxy, dan orkestrasi pemanggilan model AI.  
  *Penanggung Jawab:* Galang Reisduanto

- [ ] 43. **Prompt Engineering & Kontekstualisasi AI NPC Generator**  
  *Deskripsi:* Bertanggung jawab atas penyusunan prompt otomatis, injeksi data party, dan penataan output JSON terstruktur dari AI.  
  *Penanggung Jawab:* Galang Reisduanto

- [ ] 44. **Penyelesaian 6 Fungsi CRUD Pendukung (NPC 1-4 & Inventaris 3-4)**  
  *Deskripsi:* Mengembangkan dan memvalidasi operasi Create NPC, Read NPC, Update NPC, Delete NPC, Update Inventaris, dan Delete Inventaris pada Firebase Realtime Database.  
  *Penanggung Jawab:* Galang Reisduanto

### C. Tanggung Jawab Bersama Tim (Shared Collaboration Tasks)
- [ ] 45. **Manajemen Repositori GitHub & Kolaborasi Version Control**  
  *Deskripsi:* Melakukan commit dan push berkala secara teratur, penyelesaian merge conflict, dan dokumentasi commit message yang jelas.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

- [ ] 46. **Pengujian Sinkronisasi End-to-End (UI to Firebase Realtime)**  
  *Deskripsi:* Memverifikasi bahwa seluruh aksi pengguna dari UI masuk secara akurat ke Firebase Console dan ter-update seketika di semua klien aktif.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

- [ ] 47. **Validasi Bebas Galat pada Tautan Hosting Publik (Authorized Domain Audit)**  
  *Deskripsi:* Menguji aplikasi pada tautan hosting Render dan memastikan tidak ada pesan error *Unauthorized Domain* pada alur autentikasi.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

- [ ] 48. **Produksi Video Demonstrasi Proyek untuk YouTube**  
  *Deskripsi:* Menyusun naskah demo, merekam alur fungsionalitas (registrasi, verifikasi email, 12 CRUD, sinkronisasi real-time dua layar, pembuatan NPC AI), mengedit video, dan mengunggahnya ke YouTube.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

---

## Bagian VII: Roadmap & Timeline Pengerjaan Proyek (Milestones 4 Minggu)

### Minggu 1: Setup Lingkungan & Sistem Autentikasi
- [ ] 49. **Milestone Minggu 1 - Setup Proyek, Firebase Console, dan Repositori GitHub**  
  *Deskripsi:* Inisialisasi Firebase project, pengaturan dependensi proyek, setup repositori GitHub bersama, dan konfigurasi environment.  
  *Penanggung Jawab:* Tim (PIC: Abyan Zhafran)

- [ ] 50. **Milestone Minggu 1 - Implementasi Sistem Auth & Webmailer**  
  *Deskripsi:* Pembangunan sistem Register & Login, pengiriman email verifikasi pendaftaran, serta pengujian mekanisme proteksi dashboard bagi email belum terverifikasi.  
  *Penanggung Jawab:* Abyan Zhafran

### Minggu 2: Core CRUD & Arsitektur Database Real-Time
- [ ] 51. **Milestone Minggu 2 - Perancangan Skema Node JSON Firebase Realtime Database**  
  *Deskripsi:* Menetapkan struktur tree JSON untuk `/characters`, `/inventory`, dan `/npcs` beserta aturan keamanan (*Security Rules*) baca/tulis.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 52. **Milestone Minggu 2 - Implementasi CRUD Karakter & CRUD Inventaris Party**  
  *Deskripsi:* Menyelesaikan fungsi CRUD 1 s.d. 8 (Karakter: Create/Read/Update/Delete; Inventaris: Create/Read/Update/Delete) dan menguji koneksi WebSockets real-time antar perangkat.  
  *Penanggung Jawab:* Tim (Abyan Zhafran: Karakter & Inventaris C/R; Galang Reisduanto: Inventaris U/D)

### Minggu 3: Integrasi Layanan Cloud Tambahan (AI) & Penyempurnaan Dashboard
- [ ] 53. **Milestone Minggu 3 - Implementasi Server Middleware Node.js/Express & Integrasi Gemini API**  
  *Deskripsi:* Membangun backend proxy aman untuk request AI, menyusun prompt generator dengan injeksi konteks party, dan mengonversi output menjadi entitas data JSON.  
  *Penanggung Jawab:* Galang Reisduanto

- [ ] 54. **Milestone Minggu 3 - Implementasi CRUD NPC & Integrasi Dashboard Penuh**  
  *Deskripsi:* Menyelesaikan fungsi CRUD 9 s.d. 12 (NPC: Create/Read/Update/Delete), menghubungkan tombol AI ke form database, serta menyempurnakan interaktivitas 3 panel dashboard.  
  *Penanggung Jawab:* Galang Reisduanto

### Minggu 4: Deployment Cloud, Pengujian Menyeluruh & Demo Final
- [ ] 55. **Milestone Minggu 4 - Deployment ke Cloud Hosting (Render) & CI/CD Pipeline**  
  *Deskripsi:* Menghubungkan repositori GitHub ke Render, mengonfigurasi build command, environment variables di Render, dan memastikan proses auto-deploy berjalan mulus.  
  *Penanggung Jawab:* Abyan Zhafran

- [ ] 56. **Milestone Minggu 4 - Konfigurasi Authorized Domain & Pengujian Stabilitas Domain**  
  *Deskripsi:* Memastikan domain Render terdaftar di Firebase Console, memverifikasi tidak ada galat CORS atau unauthorized domain saat diakses secara publik.  
  *Penanggung Jawab:* Abyan Zhafran & Tim

- [ ] 57. **Milestone Minggu 4 - Pengujian Integrasi Menyeluruh (End-to-End Testing)**  
  *Deskripsi:* Melakukan uji coba lengkap skenario simulasi permainan D&D: Player mendaftar, verifikasi email, login, DM menambah loot, status HP tersinkronisasi langsung, dan DM men-generate NPC AI saat sesi permainan.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

- [ ] 58. **Milestone Minggu 4 - Perekaman, Editing, dan Publikasi Video Demo YouTube**  
  *Deskripsi:* Merekam demonstrasi fungsionalitas sinkronisasi WebSocket dua layar simultan, pengujian 12 operasi CRUD, fitur Webmailer, dan integrasi AI, lalu mengunggah video ke YouTube sebagai bukti penyelesaian tugas.  
  *Penanggung Jawab:* Tim (Abyan Zhafran & Galang Reisduanto)

---

## Ringkasan Matriks Pembagian Tugas (Task Summary Matrix)

| Kategori Kebutuhan | Abyan Zhafran | Galang Reisduanto | Kolaborasi Tim |
| :--- | :---: | :---: | :---: |
| **Infrastruktur & Setup** | Setup Firebase Console & Node.js Server | Setup AI Studio & Klien UI | Setup GitHub Repo & Config |
| **Autentikasi & Keamanan** | Firebase Auth & Webmailer Verification | UI Login/Register & Guard View | Validasi Authorized Domains |
| **CRUD Karakter (1-4)** | Create, Read, Update, Delete (Penuh) | Integrasi Tampilan UI Karakter | Uji Sinkronisasi Real-Time |
| **CRUD Inventaris (5-8)** | Create & Read (Tambah & Lihat Loot) | Update & Delete (Ubah & Buang Item) | Uji Konsistensi Data Tas |
| **CRUD NPC & Lore (9-12)** | Dukungan Skema Node DB Firebase | Create, Read, Update, Delete (Penuh) | Validasi Data Lore NPC |
| **Integrasi Ekstra Cloud (AI)** | Backend API Guard & Server Config | Integrasi Gemini API & Prompting | Uji Aliran Data AI ke DB |
| **Desain Antarmuka (UI/UX)** | Review Integrasi State Klien | Desain 3 Panel Dashboard & Responsif | Uji Pengalaman Pengguna |
| **Deployment & Video Demo** | Deployment Render & Web Service | UI Polish & Naskah Demo | Pengujian E2E & Video YouTube |
