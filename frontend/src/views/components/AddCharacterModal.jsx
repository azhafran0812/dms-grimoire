import { useState } from 'react';
import { X, UserPlus, Shield, Heart, Swords, Fingerprint } from 'lucide-react';
import { addCharacter } from '../../controllers/partyController';

export default function AddCharacterModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    characterClass: 'Fighter',
    race: 'Human',
    hpMax: 10,
    ac: 15,
    ownerEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Jika modal tidak dibuka, jangan render apa pun
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
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.name.trim())}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      await addCharacter({
        name: formData.name,
        characterClass: formData.characterClass,
        race: formData.race,
        hpMax: parseInt(formData.hpMax),
        hpCurrent: parseInt(formData.hpMax),
        ac: parseInt(formData.ac),
        ownerEmail: formData.ownerEmail.trim() || '',
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
      
      // Reset form dan tutup modal setelah sukses
      setFormData({ name: '', characterClass: 'Fighter', race: 'Human', hpMax: 10, ac: 15, ownerEmail: '' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50">
          <div className="flex items-center gap-3">
            <div className="bg-grimoire-dark p-2 rounded">
              <UserPlus className="text-grimoire-gold w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif uppercase">Add Party Member</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-grimoire-dark transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama Karakter */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                <Fingerprint className="w-3 h-3" /> Character Name
              </label>
              <input 
                type="text" 
                name="name"
                required 
                placeholder="e.g. Elowen Starseeker"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold focus:ring-1 focus:ring-grimoire-gold font-serif text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Race */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Race
                </label>
                <input 
                  type="text" 
                  name="race"
                  required 
                  placeholder="e.g. Elf"
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                />
              </div>

              {/* Class */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                  <Swords className="w-3 h-3" /> Class
                </label>
                <input 
                  type="text" 
                  name="characterClass"
                  required 
                  placeholder="e.g. Ranger"
                  value={formData.characterClass}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Max HP */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                  <Heart className="w-3 h-3" /> Max HP
                </label>
                <input 
                  type="number" 
                  name="hpMax"
                  required 
                  min="1"
                  value={formData.hpMax}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-lg font-bold font-serif text-center"
                />
              </div>

              {/* Armor Class (AC) */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                  <Shield className="w-3 h-3" /> Armor Class
                </label>
                <input 
                  type="number" 
                  name="ac"
                  required 
                  min="1"
                  value={formData.ac}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-lg font-bold font-serif text-center"
                />
              </div>
            </div>

            {/* Player Email (optional - for binding character to player) */}
            <div className="pt-2 border-t border-parchment-dark">
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                Player Email <span className="text-gray-400 normal-case tracking-normal font-normal">(optional — bind to player account)</span>
              </label>
              <input 
                type="email" 
                name="ownerEmail"
                placeholder="player@example.com"
                value={formData.ownerEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                If set, this character will appear on that player's dashboard when they log in.
              </p>
            </div>

            {/* Footer Modal / Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-parchment-dark mt-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-grimoire-dark transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2.5 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Summoning...' : 'Add to Party'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}