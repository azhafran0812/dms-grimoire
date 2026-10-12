import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useNavigate, Link } from 'react-router-dom';
import { Book } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Sign in ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Cek apakah email sudah diverifikasi (Syarat Webmailer)
      if (!user.emailVerified) {
        setError('Email belum diverifikasi. Silakan cek kotak masuk Anda.');
        setLoading(false);
        return; // Hentikan proses login jika belum diverifikasi
      }

      // 3. Ambil data Role dari Realtime Database
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // 4. Arahkan ke dasbor yang sesuai berdasarkan Role
        if (userData.role === 'dm') {
          navigate('/dashboard/dm');
        } else {
          navigate('/dashboard/player');
        }
      } else {
        setError('Data user tidak ditemukan di database.');
      }
    } catch (err) {
      setError('Email atau Password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grimoire-dark flex items-center justify-center p-4">
      <div className="bg-parchment-light w-full max-w-md rounded-lg shadow-2xl p-10 text-grimoire-dark">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-grimoire-dark p-3 rounded mb-4">
            <Book className="text-grimoire-gold w-6 h-6" />
          </div>
          <h2 className="text-3xl font-serif">Sign In</h2>
          <p className="text-sm text-gray-600 mt-2">Enter your campaign credentials</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-grimoire-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-grimoire-dark"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-3 px-4 rounded mt-2 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Opening the Grimoire...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-parchment-dark pt-6">
          <p className="text-sm text-gray-500">
            Don't have an account? <Link to="/" className="font-bold text-grimoire-dark hover:text-grimoire-gold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}