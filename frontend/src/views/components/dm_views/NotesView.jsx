import { useState, useEffect } from 'react';
import { ScrollText, Search, Plus, Trash2, Pin, Lock, Edit3 } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { addNote, updateNote, deleteNote, togglePinNote } from '../../../controllers/notesController';

export default function NotesView() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Quest Clues',
    content: '',
    isSecret: true,
    isPinned: false
  });

  const categories = ['All', 'Quest Clues', 'Plot Secrets', 'Battle Prep', 'Loot Drops', 'Worldbuilding', 'General'];

  useEffect(() => {
    const notesRef = ref(db, 'campaign/active/notes');
    const unsub = onValue(notesRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setNotes(list);
      } else {
        setNotes([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      category: 'Quest Clues',
      content: '',
      isSecret: true,
      isPinned: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      category: note.category || 'General',
      content: note.content || '',
      isSecret: Boolean(note.isSecret),
      isPinned: Boolean(note.isPinned)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, formData);
      } else {
        await addNote(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (note) => {
    if (window.confirm(`Burn note "${note.title}" from the grimoire?`)) {
      await deleteNote(note.id);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchSearch =
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'All' || n.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Dungeon Master Codex</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Session Notes & Secrets</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search codex..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          {/* New Note Button */}
          <button
            onClick={openAddModal}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-bold shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> Scribe Note
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
                : 'bg-white border border-parchment-dark text-gray-600 hover:border-grimoire-gold'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <p className="text-gray-400 animate-pulse">Unfolding parchment leaves...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white border rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-all flex flex-col h-full ${
                note.isPinned ? 'border-grimoire-gold/70 bg-gradient-to-b from-amber-50/30 to-white' : 'border-parchment-dark'
              }`}
            >
              {/* Header Badges & Actions */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-parchment border border-parchment-dark text-grimoire-dark px-2 py-0.5 rounded">
                    {note.category}
                  </span>
                  {note.isSecret && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" /> Secret
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePinNote(note.id, note.isPinned)}
                    title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                    className={`p-1 rounded hover:bg-parchment transition ${
                      note.isPinned ? 'text-grimoire-gold' : 'text-gray-400 hover:text-grimoire-dark'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(note)}
                    title="Edit note"
                    className="p-1 text-gray-400 hover:text-grimoire-dark transition rounded hover:bg-parchment"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
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
            onClick={openAddModal}
            className="text-grimoire-gold hover:text-grimoire-dark font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Scribe First Note
          </button>
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark my-8 overflow-hidden">
            <div className="p-6 border-b border-parchment-dark bg-white/50 flex justify-between items-center">
              <h3 className="font-serif text-2xl uppercase">
                {editingNote ? 'Edit Session Note' : 'Scribe Session Note'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-grimoire-dark">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Password for the Crypt of Whisperfen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 uppercase">
                  <input
                    type="checkbox"
                    checked={formData.isSecret}
                    onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
                    className="rounded text-grimoire-dark focus:ring-grimoire-gold"
                  />
                  <span>DM Secret (Hidden)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 uppercase">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded text-grimoire-dark focus:ring-grimoire-gold"
                  />
                  <span>Pin to Top</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
  );
}
