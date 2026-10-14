import { useState, useEffect } from 'react';
import { Book, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase'; 
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { Link } from 'react-router-dom';

export default function Welcome() {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); 
  
  // State untuk form registrasi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Efek Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Fungsi Eksekusi Firebase Auth & Database
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Buat user di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Kirim email verifikasi (Webmailer)
      await sendEmailVerification(user);

      // 3. Simpan data role pengguna ke Realtime Database
      await set(ref(db, 'users/' + user.uid), {
        email: user.email,
        role: selectedRole,
        createdAt: Date.now()
      });

      setMessage(`Berhasil mendaftar sebagai ${selectedRole.toUpperCase()}! Silakan cek kotak masuk email Anda untuk verifikasi.`);
      setEmail('');
      setPassword('');
      
    } catch (err) {
      // Menangani error dari Firebase (misal: email sudah terdaftar, password terlalu pendek)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-grimoire-dark flex items-center justify-center overflow-hidden">
      
      {/* --- SPLASH SCREEN --- */}
      <div className={`flex flex-col items-center transition-opacity duration-1000 ${showModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-16 h-16 border border-grimoire-gold/30 rounded flex items-center justify-center mb-6">
          <Book className="text-grimoire-gold w-8 h-8" />
        </div>
        <p className="text-grimoire-gold text-xs tracking-[0.3em] font-sans uppercase mb-4">
          The Tome Awakens
        </p>
        <h1 className="text-5xl font-serif text-white tracking-wider">
          DM's Grimoire
        </h1>
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-grimoire-gold/50 to-transparent mt-8"></div>
      </div>

      {/* --- MODAL AREA --- */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-1000 ${showModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="bg-parchment-light w-full max-w-2xl rounded-lg shadow-2xl p-10 relative text-grimoire-dark overflow-hidden transition-all">
          
          {!selectedRole ? (
            /* --- TAMPILAN 1: PEMILIHAN ROLE --- */
            <div className="animate-fade-in">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="bg-grimoire-dark p-3 rounded mb-6">
                  <Book className="text-grimoire-gold w-6 h-6" />
                </div>
                <p className="text-grimoire-gold text-xs tracking-widest uppercase font-bold mb-2">Welcome To</p>
                <h2 className="text-4xl font-serif mb-4">DM's Grimoire</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose how you'll enter the adventure. Dungeon Masters shape the world; players bring its heroes to life.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setSelectedRole('dm')}
                  className="border border-parchment-dark bg-white hover:border-grimoire-gold hover:shadow-md transition-all p-8 rounded-lg text-left group"
                >
                  <div className="text-grimoire-dark mb-4 text-2xl">👑</div>
                  <h3 className="font-serif text-lg font-bold mb-2 group-hover:text-grimoire-gold transition-colors">DUNGEON MASTER</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">Create campaigns, lore, NPCs, and manage every session.</p>
                </button>

                <button 
                  onClick={() => setSelectedRole('player')}
                  className="border border-parchment-dark bg-white hover:border-grimoire-gold hover:shadow-md transition-all p-8 rounded-lg text-left group"
                >
                  <div className="text-grimoire-dark mb-4 text-2xl">🛡️</div>
                  <h3 className="font-serif text-lg font-bold mb-2 group-hover:text-grimoire-gold transition-colors">PLAYER</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">Join your party, track your hero, and follow the story.</p>
                </button>
              </div>
            </div>
          ) : (
            /* --- TAMPILAN 2: FORM REGISTRASI FIREBASE --- */
            <div className="animate-fade-in max-w-md mx-auto">
              <button 
                onClick={() => {
                  setSelectedRole(null);
                  setError('');
                  setMessage('');
                }}
                className="flex items-center text-sm text-gray-500 hover:text-grimoire-dark font-medium mb-6 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to roles
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif mb-2">
                  {selectedRole === 'dm' ? 'Become a Master' : 'Join the Party'}
                </h2>
                <p className="text-sm text-gray-600">
                  Register your account to begin your journey.
                </p>
              </div>

              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
              {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">{message}</div>}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold focus:ring-1 focus:ring-grimoire-gold text-grimoire-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold focus:ring-1 focus:ring-grimoire-gold text-grimoire-dark"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-3 px-4 rounded mt-4 transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Scribing your name...' : 'Forge Account'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center border-t border-parchment-dark pt-6">
            <p className="text-sm text-gray-500">
              Already have an account? <Link to="/login" className="font-bold text-grimoire-dark hover:text-grimoire-gold transition-colors">Sign in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}