import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export const loginUser = async (email, password) => {
  try {
    // 1. Sign In
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Cek Verifikasi Email
    if (!user.emailVerified) {
      throw new Error('Email belum diverifikasi. Silakan cek kotak masuk Anda.');
    }

    // 3. Ambil Role (Model)
    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val(); // Mengembalikan data user (termasuk role)
    } else {
      throw new Error('Data user tidak ditemukan di database.');
    }
  } catch (error) {
    throw error; // Lempar error kembali ke View untuk ditampilkan
  }
};