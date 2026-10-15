import { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Trash2, CheckCircle, Clock } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { addSession, updateSession, deleteSession } from '../../../controllers/sessionController';

export default function NotesView() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk form input di editor
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Tarik data dari Firebase secara Real-time
  useEffect(() => {
    const sessionsRef = ref(db, 'campaign/active/sessions');
    const unsub = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionArray = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setSessions(sessionArray);
        
        // Auto-select sesi teratas jika belum ada yang dipilih
        if (!activeSession && sessionArray.length > 0) {
          selectSession(sessionArray[0]);
        }
      } else {
        setSessions([]);
        setActiveSession(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const selectSession = (session) => {
    setActiveSession(session);
    setEditTitle(session.title);
    setEditContent(session.content);
  };

  const handleCreateSession = async () => {
    const title = prompt("Masukkan judul sesi (misal: Sesi 12 - Pertempuran di Gua Goblin):");
    if (title) {
      const newId = await addSession(title);
      // Data akan otomatis ter-update via onValue
    }
  };

  const handleSave = async () => {
    if (!activeSession) return;
    setIsSaving(true);
    await updateSession(activeSession.id, {
      title: editTitle,
      content: editContent
    });
    
    // Perbarui state lokal sementara agar UI langsung responsif
    setActiveSession(prev => ({...prev, title: editTitle, content: editContent}));
    setIsSaving(false);
  };

  const handleToggleComplete = async () => {
    if (!activeSession) return;
    const newStatus = !activeSession.isCompleted;
    await updateSession(activeSession.id, { isCompleted: newStatus });
    setActiveSession(prev => ({...prev, isCompleted: newStatus}));
  };

  if (loading) return <div className="animate-pulse text-gray-400 p-8">Membuka catatan...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)] animate-fade-in">
      
      {/* Sidebar Kiri: Daftar Sesi */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border border-parchment-dark rounded-xl overflow-hidden shadow-sm h-full">
        <div className="p-4 bg-grimoire-dark flex justify-between items-center">
          <h3 className="font-serif text-parchment uppercase tracking-wider font-bold">Session Logs</h3>
          <button 
            onClick={handleCreateSession}
            className="text-grimoire-gold hover:text-white transition-colors"
            title="Sesi Baru"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">Belum ada catatan sesi.</p>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => selectSession(session)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeSession?.id === session.id 
                    ? 'border-grimoire-gold bg-amber-50 shadow-sm' 
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-grimoire-dark line-clamp-1">{session.title}</h4>
                  {session.isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Area Kanan: Editor Sesi */}
      <div className="w-full md:w-2/3 flex flex-col bg-white border border-parchment-dark rounded-xl shadow-sm h-full overflow-hidden relative">
        {activeSession ? (
          <>
            <div className="p-6 border-b border-parchment-dark bg-parchment/30">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-2xl font-serif font-bold text-grimoire-dark bg-transparent border-none focus:outline-none focus:ring-0 mb-2"
                placeholder="Judul Sesi..."
              />
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                <button 
                  onClick={handleToggleComplete}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                    activeSession.isCompleted 
                      ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' 
                      : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  {activeSession.isCompleted ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {activeSession.isCompleted ? 'Completed (Ready for Chronicle)' : 'Active Session'}
                </button>
              </div>
            </div>

            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Tulis kejadian, loot, rahasia yang terungkap, atau status NPC di sini..."
              className="flex-1 w-full p-6 bg-transparent border-none focus:outline-none resize-none text-gray-700 leading-relaxed"
            />

            <div className="p-4 bg-gray-50 border-t border-parchment-dark flex justify-between items-center">
              <button 
                onClick={() => { if(window.confirm('Hapus sesi ini secara permanen?')) deleteSession(activeSession.id) }}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
              
              <button 
                onClick={handleSave}
                disabled={isSaving || (editTitle === activeSession.title && editContent === activeSession.content)}
                className="bg-grimoire-dark hover:bg-black disabled:bg-gray-300 text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-serif text-xl uppercase tracking-widest">Kosong</p>
            <p className="text-sm">Pilih atau buat sesi baru di panel kiri.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}