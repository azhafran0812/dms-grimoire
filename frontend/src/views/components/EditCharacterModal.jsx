import { useState } from 'react';
import { X, UserCog } from 'lucide-react';
import { updateFullCharacter } from '../../controllers/partyController';
import GrimoireAvatar from './shared/GrimoireAvatar';

export default function EditCharacterModal({ isOpen, onClose, characterData }) {
  const [prevChar, setPrevChar] = useState(characterData);
  const [formData, setFormData] = useState(() => (characterData ? JSON.parse(JSON.stringify(characterData)) : null));
  const [loading, setLoading] = useState(false);

  if (characterData !== prevChar) {
    setPrevChar(characterData);
    setFormData(characterData ? JSON.parse(JSON.stringify(characterData)) : null);
  }

  if (!isOpen || !formData) return null;

  // Fungsi helper untuk handle perubahan input nested (seperti stats.str atau combat.hpCurrent)
  const handleChange = (category, field, value) => {
    setFormData(prev => {
      if (category) {
        return { ...prev, [category]: { ...prev[category], [field]: Number(value) || value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateFullCharacter(characterData.id, formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
      <div className="bg-parchment-light w-full max-w-3xl rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark my-8">
        
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50 sticky top-0 z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <GrimoireAvatar entity={formData} size="md" />
            <h2 className="text-2xl font-serif uppercase">Edit Character Sheet: {formData.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-grimoire-dark">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* BAGIAN 1: Basic Info */}
          <div>
            <h3 className="text-sm font-bold text-grimoire-gold tracking-widest uppercase mb-4 border-b border-parchment-dark pb-2">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleChange(null, 'name', e.target.value)} required className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                <input type="text" value={formData.characterClass} onChange={(e) => handleChange(null, 'characterClass', e.target.value)} required className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level</label>
                <input type="number" value={formData.level || 1} onChange={(e) => handleChange(null, 'level', e.target.value)} required className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avatar URL (Optional)</label>
                <input type="text" placeholder="https://..." value={formData.avatarUrl || ''} onChange={(e) => handleChange(null, 'avatarUrl', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif text-xs" />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: Combat Stats */}
          <div>
            <h3 className="text-sm font-bold text-grimoire-gold tracking-widest uppercase mb-4 border-b border-parchment-dark pb-2">Combat Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max HP</label>
                <input type="number" value={formData.combat?.hpMax || 0} onChange={(e) => handleChange('combat', 'hpMax', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current HP</label>
                <input type="number" value={formData.combat?.hpCurrent || 0} onChange={(e) => handleChange('combat', 'hpCurrent', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Armor Class</label>
                <input type="number" value={formData.combat?.ac || 10} onChange={(e) => handleChange('combat', 'ac', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initiative (+/-)</label>
                <input type="number" value={formData.combat?.initiativeModifier || 0} onChange={(e) => handleChange('combat', 'initiativeModifier', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Speed (ft)</label>
                <input type="number" value={formData.combat?.speed || 30} onChange={(e) => handleChange('combat', 'speed', e.target.value)} className="w-full px-3 py-2 border border-parchment-dark rounded font-serif" />
              </div>
            </div>
          </div>

          {/* BAGIAN 3: Main Attributes */}
          <div>
            <h3 className="text-sm font-bold text-grimoire-gold tracking-widest uppercase mb-4 border-b border-parchment-dark pb-2">Ability Scores</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((stat) => (
                <div key={stat}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{stat}</label>
                  <input 
                    type="number" min="1" max="30"
                    value={formData.stats?.[stat] || 10} 
                    onChange={(e) => handleChange('stats', stat, e.target.value)} 
                    className="w-full px-3 py-2 border border-parchment-dark rounded font-serif text-center text-xl font-bold" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-6 flex justify-end gap-3 border-t border-parchment-dark sticky bottom-0 bg-parchment-light/90 py-4 -mx-6 px-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded shadow-md">
              {loading ? 'Scribing...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}