import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { updateNpc } from "../../controllers/npcController";

export default function EditNPCModal({ isOpen, onClose, npcData }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    traits: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Isi form secara otomatis dengan data NPC yang dipilih
  useEffect(() => {
    if (npcData) {
      setFormData({
        name: npcData.name || '',
        role: npcData.role || '',
        location: npcData.location || '',
        traits: npcData.traits || '',
        description: npcData.description || npcData.content || ''
      });
    }
  }, [npcData]);

  if (!isOpen || !npcData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateNpc(npcData.id, formData);
      onClose(); // Tutup modal setelah sukses
    } catch (error) {
      console.error("Error updating NPC:", error);
      alert("Gagal memperbarui data NPC.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-parchment-dark">
        <div className="bg-grimoire-dark px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="font-serif text-xl text-parchment uppercase tracking-wider">Edit Character</h3>
            <p className="text-xs text-grimoire-gold uppercase tracking-widest">{npcData.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-grimoire-gold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title / Role</label>
              <input type="text" name="role" required value={formData.role} onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-grimoire-gold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-grimoire-gold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Traits / Disposition</label>
              <input type="text" name="traits" value={formData.traits} onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-grimoire-gold text-sm" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description & Backstory</label>
            <textarea name="description" required rows="5" value={formData.description} onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-grimoire-gold text-sm resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-grimoire-dark hover:bg-black text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors">
              <Save className="w-4 h-4 text-grimoire-gold" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}