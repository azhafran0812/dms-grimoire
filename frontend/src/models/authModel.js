import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

export const registerUserInFirebase = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginUserInFirebase = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const sendVerification = async (user) => {
  await sendEmailVerification(user);
};

export const saveUserRole = async (uid, email, role) => {
  await set(ref(db, `users/${uid}`), {
    email,
    role,
    createdAt: Date.now()
  });
};

export const getUserRole = async (uid) => {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
};