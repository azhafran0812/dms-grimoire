import { useState } from 'react';
import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // email verifikasi
      await sendEmailVerification(user);

      // role ke Realtime Database
      await set(ref(db, 'users/' + user.uid), {
        email: user.email,
        role: role,
        createdAt: Date.now()
      });

      setMessage('Registrasi berhasil! Silakan cek email untuk verifikasi sebelum login.');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-bold text-amber-500 mb-6 text-center">DM's Grimoire</h1>
        <h2 className="text-xl text-white mb-6 text-center">Bergabung ke Party</h2>
        
        {message && <p className="text-sm text-center mb-4 text-amber-400">{message}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Pilih Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="player">Player (Member)</option>
              <option value="dm">Dungeon Master (DM)</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Daftar Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}