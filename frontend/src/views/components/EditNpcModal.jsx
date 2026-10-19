import { useState } from 'react';
import { X, UserCheck, MapPin, Lock } from 'lucide-react';
import { updateNpc } from '../../controllers/npcController';
import GrimoireAvatar from './shared/GrimoireAvatar';

export default function EditNpcModal({ isOpen, onClose, npcData }) {
  const [prevNpc, setPrevNpc] = useState(npcData);
  const [formData, setFormData] = useState({
    name: npcData?.name || '',
    role: npcData?.role || '',
    location: npcData?.location || '',
    disposition: npcData?.disposition || 'Neutral',
    traits: npcData?.traits || '',
    description: npcData?.description || '',
    secret: npcData?.secret || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (npcData !== prevNpc) {
    setPrevNpc(npcData);
    setFormData({
      name: npcData?.name || '',
      role: npcData?.role || '',
      location: npcData?.location || '',
      disposition: npcData?.disposition || 'Neutral',
      traits: npcData?.traits || '',
      description: npcData?.description || '',
      secret: npcData?.secret || ''
    });
  }

  if (!isOpen || !npcData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateNpc(npcData.id, formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
      <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark my-8 overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50">
          <div className="flex items-center gap-3">
            <GrimoireAvatar entity={npcData} size="md" />
            <h2 className="text-2xl font-serif uppercase">Edit NPC: {formData.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-grimoire-dark transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NPC Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title / Role</label>
              <input 
                type="text" 
                name="role" 
                required 
                value={formData.role} 
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Disposition (Hubungan)</label>
              <select 
                name="disposition"
                value={formData.disposition}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm font-semibold"
              >
                <option value="Friendly">Friendly (Ramah)</option>
                <option value="Neutral">Neutral (Netral)</option>
                <option value="Hostile">Hostile (Bermusuhan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase mb-1">
              <MapPin className="w-3.5 h-3.5" /> Location / Settlement
            </label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Traits & Key Quirks</label>
            <input 
              type="text" 
              name="traits" 
              value={formData.traits} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description & Lore</label>
            <textarea 
              name="description" 
              rows="3"
              value={formData.description} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
            ></textarea>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase mb-1">
              <Lock className="w-3.5 h-3.5" /> Secret / DM Clue
            </label>
            <input 
              type="text" 
              name="secret" 
              value={formData.secret} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-grimoire-dark transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded transition disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Update NPC'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
