import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Save, Trash2, CheckCircle, Clock, 
  StickyNote, Search, Pin, Lock, Edit3, ScrollText, Filter 
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { addSession, updateSession, deleteSession } from '../../../controllers/sessionController';
import { addNote, updateNote, togglePinNote, deleteNote } from '../../../controllers/notesController';

export default function NotesView({ activeCampaignId }) {
  // Tab navigation: 'sessions' or 'scratchpad'
  const [activeTab, setActiveTab] = useState('sessions');

  // --- TAB 1: SESSIONS LOGS STATE ---
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // --- TAB 2: SCRATCHPAD NOTES STATE ---
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    category: 'General',
    content: '',
    isSecret: false,
    isPinned: false
  });

  // Listener for Sessions
  useEffect(() => {
    const sessionPath = activeCampaignId ? `campaigns/${activeCampaignId}/sessions` : 'campaign/active/sessions';
    const sessionsRef = ref(db, sessionPath);
    const unsubSessions = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionArray = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setSessions(sessionArray);
        if (!activeSession && sessionArray.length > 0) {
          selectSession(sessionArray[0]);
        }
      } else {
        setSessions([]);
        setActiveSession(null);
      }
      setSessionsLoading(false);
    });

    return () => unsubSessions();
  }, [activeCampaignId]);

  // Listener for Scratchpad Notes
  useEffect(() => {
    const notesPath = activeCampaignId ? `campaigns/${activeCampaignId}/notes` : 'campaign/active/notes';
    const notesRef = ref(db, notesPath);
    const unsubNotes = onValue(notesRef, (snapshot) => {
      if (snapshot.exists()) {
        const notesArray = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setNotes(notesArray);
      } else {
        setNotes([]);
      }
      setNotesLoading(false);
    });

    return () => unsubNotes();
  }, [activeCampaignId]);

  // Session Handlers
  const selectSession = (session) => {
    setActiveSession(session);
    setEditTitle(session.title || '');
    setEditContent(session.content || '');
  };

  const handleCreateSession = async () => {
    const title = prompt("Masukkan judul sesi (misal: Sesi 12 - Pertempuran di Gua Goblin):");
    if (title) {
      await addSession(title, activeCampaignId);
    }
  };

  const handleSaveSession = async () => {
    if (!activeSession) return;
    setIsSavingSession(true);
    await updateSession(activeCampaignId, activeSession.id, {
      title: editTitle,
      content: editContent
    });
    setActiveSession(prev => ({ ...prev, title: editTitle, content: editContent }));
    setIsSavingSession(false);
  };

  const handleToggleCompleteSession = async () => {
    if (!activeSession) return;
    const newStatus = !activeSession.isCompleted;
    await updateSession(activeCampaignId, activeSession.id, { isCompleted: newStatus });
    setActiveSession(prev => ({ ...prev, isCompleted: newStatus }));
  };

  // Scratchpad Note Handlers
  const openAddNoteModal = () => {
    setEditingNote(null);
    setNoteForm({
      title: '',
      category: 'General',
      content: '',
      isSecret: false,
      isPinned: false
    });
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title || '',
      category: note.category || 'General',
      content: note.content || '',
      isSecret: Boolean(note.isSecret),
      isPinned: Boolean(note.isPinned)
    });
    setIsNoteModalOpen(true);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (editingNote) {
      await updateNote(editingNote.id, noteForm, activeCampaignId);
    } else {
      await addNote(noteForm, activeCampaignId);
    }
    setIsNoteModalOpen(false);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-parchment-dark shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-serif text-sm uppercase tracking-wider font-bold flex items-center gap-2 transition ${
              activeTab === 'sessions'
                ? 'bg-grimoire-dark text-parchment shadow-sm'
                : 'bg-parchment/50 text-grimoire-dark hover:bg-parchment'
            }`}
          >
            <BookOpen className="w-4 h-4 text-grimoire-gold" /> Session Logs
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`px-4 py-2 rounded-lg font-serif text-sm uppercase tracking-wider font-bold flex items-center gap-2 transition ${
              activeTab === 'scratchpad'
                ? 'bg-grimoire-dark text-parchment shadow-sm'
                : 'bg-parchment/50 text-grimoire-dark hover:bg-parchment'
            }`}
          >
            <StickyNote className="w-4 h-4 text-grimoire-gold" /> DM Scratchpad & Clues ({notes.length})
          </button>
        </div>

        {activeTab === 'sessions' ? (
          <button
            onClick={handleCreateSession}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> New Session Log
          </button>
        ) : (
          <button
            onClick={openAddNoteModal}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> Scribe Quick Note
          </button>
        )}
      </div>

      {/* --- CONTENT TAB 1: SESSIONS --- */}
      {activeTab === 'sessions' && (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[450px]">
          {/* Sidebar Sesi */}
          <div className="w-full md:w-1/3 flex flex-col bg-white border border-parchment-dark rounded-xl overflow-hidden shadow-sm h-full">
            <div className="p-4 bg-grimoire-dark flex justify-between items-center">
              <h3 className="font-serif text-parchment uppercase tracking-wider font-bold text-sm">Campaign Timeline</h3>
              <span className="text-xs text-grimoire-gold">{sessions.length} recorded</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessionsLoading ? (
                <p className="text-center text-xs text-gray-400 py-6">Memuat sesi...</p>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400 mb-3">Belum ada catatan sesi.</p>
                  <button onClick={handleCreateSession} className="text-xs font-bold text-grimoire-gold hover:underline">
                    + Buat Sesi Pertama
                  </button>
                </div>
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
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 ml-1" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {new Date(session.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Editor Sesi */}
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
                      onClick={handleToggleCompleteSession}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                        activeSession.isCompleted 
                          ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' 
                          : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      {activeSession.isCompleted ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {activeSession.isCompleted ? 'Completed (Recorded to Chronicle)' : 'Active Session (In Progress)'}
                    </button>
                  </div>
                </div>

                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Tulis kejadian, loot, rahasia yang terungkap, atau status NPC di sini..."
                  className="flex-1 w-full p-6 bg-transparent border-none focus:outline-none resize-none text-gray-700 leading-relaxed font-sans"
                />

                <div className="p-4 bg-gray-50 border-t border-parchment-dark flex justify-between items-center">
                  <button 
                    onClick={() => { if(window.confirm('Hapus sesi ini secara permanen?')) deleteSession(activeCampaignId, activeSession.id) }}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Sesi
                  </button>
                  
                  <button 
                    onClick={handleSaveSession}
                    disabled={isSavingSession || (editTitle === activeSession.title && editContent === activeSession.content)}
                    className="bg-grimoire-dark hover:bg-black disabled:bg-gray-300 text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {isSavingSession ? 'Menyimpan...' : 'Simpan Catatan'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-serif text-xl uppercase tracking-widest mb-1">Pilih Sesi</p>
                <p className="text-sm text-center">Pilih atau buat sesi baru di panel sebelah kiri untuk mencatat kejadian petualangan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CONTENT TAB 2: SCRATCHPAD NOTES --- */}
      {activeTab === 'scratchpad' && (
        <div className="space-y-6">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes, clues, loot tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md text-sm focus:outline-none focus:border-grimoire-gold font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {['All', 'Quest Clues', 'Plot Secrets', 'Battle Prep', 'Loot Drops', 'Worldbuilding', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-grimoire-dark text-white border-grimoire-dark'
                      : 'bg-white text-gray-600 border-parchment-dark hover:border-grimoire-gold'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Grid */}
          {notesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white/50 border border-parchment-dark rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white border rounded-xl p-5 shadow-sm transition relative group flex flex-col hover:border-grimoire-gold ${
                    note.isPinned ? 'border-grimoire-gold/60 bg-amber-50/20' : 'border-parchment-dark'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-parchment text-grimoire-dark">
                        {note.category || 'General'}
                      </span>
                      {note.isSecret && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Secret
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePinNote(note.id, note.isPinned, activeCampaignId)}
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                        className={`p-1 rounded hover:bg-parchment transition ${
                          note.isPinned ? 'text-grimoire-gold' : 'text-gray-400 hover:text-grimoire-dark'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditNoteModal(note)}
                        title="Edit note"
                        className="p-1 text-gray-400 hover:text-grimoire-dark transition rounded hover:bg-parchment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus catatan "${note.title}"?`)) {
                            deleteNote(note.id, activeCampaignId);
                          }
                        }}
                        title="Delete note"
                        className="p-1 text-gray-400 hover:text-red-500 transition rounded hover:bg-parchment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight mb-2">
                    {note.title}
                  </h3>

                  {/* Content */}
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap flex-1 mb-4 font-sans">
                    {note.content}
                  </p>

                  {/* Footer Date */}
                  <div className="mt-auto pt-3 border-t border-parchment-dark flex justify-between items-center text-[10px] text-gray-400">
                    <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recent'}</span>
                    {note.isPinned && (
                      <span className="font-bold text-grimoire-gold uppercase tracking-wider flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <ScrollText className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">The Scratchpad is Clean</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Record session prep reminders, hidden traps, loot to reveal, or unexpected plot branches.
              </p>
              <button
                onClick={openAddNoteModal}
                className="text-grimoire-gold hover:text-grimoire-dark font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Scribe First Note
              </button>
            </div>
          )}

          {/* Add / Edit Note Modal */}
          {isNoteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
              <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark my-8 overflow-hidden">
                <div className="p-6 border-b border-parchment-dark bg-white/50 flex justify-between items-center">
                  <h3 className="font-serif text-2xl uppercase">
                    {editingNote ? 'Edit Session Note' : 'Scribe Session Note'}
                  </h3>
                  <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-400 hover:text-grimoire-dark">
                    &times;
                  </button>
                </div>

                <form onSubmit={handleNoteSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Password for the Crypt of Whisperfen"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                    <select
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm font-semibold"
                    >
                      <option value="Quest Clues">Quest Clues</option>
                      <option value="Plot Secrets">Plot Secrets</option>
                      <option value="Battle Prep">Battle Prep</option>
                      <option value="Loot Drops">Loot Drops</option>
                      <option value="Worldbuilding">Worldbuilding</option>
                      <option value="General">General Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                    <textarea
                      rows="6"
                      required
                      placeholder="Write secrets, clues, loot tables, or encounter notes..."
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                      className="w-full p-3 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 uppercase">
                      <input
                        type="checkbox"
                        checked={noteForm.isSecret}
                        onChange={(e) => setNoteForm({ ...noteForm, isSecret: e.target.checked })}
                        className="rounded text-grimoire-dark focus:ring-grimoire-gold"
                      />
                      <span>DM Secret (Hidden)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 uppercase">
                      <input
                        type="checkbox"
                        checked={noteForm.isPinned}
                        onChange={(e) => setNoteForm({ ...noteForm, isPinned: e.target.checked })}
                        className="rounded text-grimoire-dark focus:ring-grimoire-gold"
                      />
                      <span>Pin to Top</span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark">
                    <button
                      type="button"
                      onClick={() => setIsNoteModalOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded"
                    >
                      {editingNote ? 'Save Note' : 'Scribe to Codex'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
