import { useState } from 'react';
import { X, UserPlus, MapPin, Lock } from 'lucide-react';
import { addNpc } from '../../controllers/npcController';

export default function AddNpcModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    disposition: 'Neutral',
    traits: '',
    description: '',
    secret: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      const avatarUrl = formData.avatarUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.name.trim())}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      await addNpc({
        ...formData,
        avatarUrl,
        aiMeta: {
          image: {
            rendered: true,
            dataUrl: avatarUrl,
            dimensions: '256x256',
            format: 'svg',
          },
        },
      });
      setFormData({
        name: '',
        role: '',
        location: '',
        disposition: 'Neutral',
        traits: '',
        description: '',
        secret: '',
        avatarUrl: '',
      });
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
            <div className="bg-grimoire-dark p-2 rounded">
              <UserPlus className="text-grimoire-gold w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif uppercase">Add Non-Player Character</h2>
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
              placeholder="e.g. Garrick Ironthorn" 
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
                placeholder="e.g. Blacksmith, Inquisitor" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Disposition</label>
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
              placeholder="e.g. The Drunken Griffin, Greyfen" 
              value={formData.location} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Traits & Appearance</label>
            <input 
              type="text" 
              name="traits" 
              placeholder="e.g. Heavy scarred hands, missing left eye, quiet voice" 
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
              placeholder="Background story, demeanor, and how the party encounters them..." 
              value={formData.description} 
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
            ></textarea>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase mb-1">
              <Lock className="w-3.5 h-3.5" /> Secret / DM Clue (Hidden from Players)
            </label>
            <input 
              type="text" 
              name="secret" 
              placeholder="e.g. Actually an undercover agent for the Cult of the Ashen Maw" 
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
              {loading ? 'Recording in Grimoire...' : 'Save NPC'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
