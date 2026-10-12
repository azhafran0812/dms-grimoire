import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyBtSJAs5nt9zEVV0wxdPxgKDSo1BuA3d5M",
  authDomain: "dms-grimoire.firebaseapp.com",
  databaseURL: "https://dms-grimoire-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dms-grimoire",
  storageBucket: "dms-grimoire.firebasestorage.app",
  messagingSenderId: "198175915063",
  appId: "1:198175915063:web:9115cd0543caccb9f853b2"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor instance Auth dan Database agar bisa dipakai di file lain (seperti Register.jsx)
export const auth = getAuth(app);
export const db = getDatabase(app);