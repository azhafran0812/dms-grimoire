import { useState } from 'react';
import { Sparkles, Swords, Heart, Shield, Fingerprint, UserPlus, Dice5, Wand2 } from 'lucide-react';
import { addCharacter } from '../../../controllers/partyController';
import GrimoireAvatar from '../shared/GrimoireAvatar';

// D&D Random Name Generators
const FIRST_NAMES = {
  Human: ['Aldric', 'Brynn', 'Cedric', 'Dara', 'Eldric', 'Fiona', 'Gareth', 'Helena', 'Isolde', 'Jareth', 'Kira', 'Lyra', 'Magnus', 'Nara', 'Orin', 'Petra'],
  Elf: ['Aelindra', 'Brenwyn', 'Caelith', 'Doranei', 'Erevan', 'Faelynn', 'Galadren', 'Halcyon', 'Ilythria', 'Joramiel', 'Kelvaris', 'Lirael'],
  Dwarf: ['Bruenor', 'Dagna', 'Flint', 'Gimra', 'Helmgar', 'Ingra', 'Kaldra', 'Moradin', 'Norin', 'Thora', 'Ulfgar', 'Vondra'],
  Halfling: ['Bilbo', 'Cora', 'Drogo', 'Elanor', 'Frodo', 'Glinda', 'Hob', 'Ivy', 'Jasper', 'Kip', 'Lila', 'Milo'],
  Tiefling: ['Akiros', 'Bryseis', 'Criella', 'Damakos', 'Ekemon', 'Falira', 'Ghash', 'Hex', 'Inaris', 'Jhessail'],
  Dragonborn: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Rhogar', 'Torinn'],
};

const SURNAMES = ['Shadowstep', 'Starweaver', 'Ironforge', 'Nightwhisper', 'Stormborn', 'Frostmane', 'Brightheart', 'Thornfield', 'Silverblaze', 'Darkhollow', 'Windrider', 'Ashwalker', 'Moonsong', 'Emberveil', 'Dawnseeker'];

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Tiefling', 'Dragonborn', 'Half-Orc', 'Gnome'];
const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock'];

export default function PlayerCreateCharacterView({ currentUser, onCharacterCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    hpMax: 10,
    ac: 15,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRandomName = () => {
    const race = formData.race || 'Human';
    const names = FIRST_NAMES[race] || FIRST_NAMES.Human;
    const firstName = names[Math.floor(Math.random() * names.length)];
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    setFormData(prev => ({ ...prev, name: `${firstName} ${surname}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Character name is required!');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.name.trim())}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      await addCharacter({
        name: formData.name.trim(),
        characterClass: formData.characterClass,
        race: formData.race,
        hpMax: parseInt(formData.hpMax),
        hpCurrent: parseInt(formData.hpMax),
        ac: parseInt(formData.ac),
        ownerEmail: currentUser?.email || '',
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

      if (onCharacterCreated) onCharacterCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Hero Banner with Dynamic Avatar Preview */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <GrimoireAvatar
            name={formData.name.trim() || 'Hero'}
            size="xl"
            className="w-24 h-24 shadow-xl border-4 border-grimoire-gold"
          />
        </div>
        <h2 className="font-serif text-3xl uppercase text-grimoire-dark mb-2">Forge Your Hero</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Create your adventurer to join the campaign. Your character will be bound to your account
          (<strong className="text-grimoire-gold">{currentUser?.email || 'your account'}</strong>).
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-parchment-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-grimoire-dark p-5 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-grimoire-gold" />
          <h3 className="font-serif font-bold text-lg text-white uppercase tracking-wider">Character Creation</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Name + Randomizer */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5">
              <Fingerprint className="w-3 h-3" /> Character Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Lyra Nightwhisper"
                value={formData.name}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-parchment-light border border-parchment-dark rounded-xl focus:outline-none focus:border-grimoire-gold font-serif text-lg"
              />
              <button
                type="button"
                onClick={handleRandomName}
                title="Generate random name"
                className="px-4 bg-parchment border border-parchment-dark hover:border-grimoire-gold rounded-xl transition flex items-center gap-1.5 text-xs font-bold text-grimoire-dark whitespace-nowrap"
              >
                <Dice5 className="w-4 h-4 text-grimoire-gold" /> Random
              </button>
            </div>
          </div>

          {/* Race & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5">
                Race
              </label>
              <select
                name="race"
                value={formData.race}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-parchment-light border border-parchment-dark rounded-xl focus:outline-none focus:border-grimoire-gold text-sm font-medium"
              >
                {RACES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5">
                <Swords className="w-3 h-3" /> Class
              </label>
              <select
                name="characterClass"
                value={formData.characterClass}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-parchment-light border border-parchment-dark rounded-xl focus:outline-none focus:border-grimoire-gold text-sm font-medium"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* HP & AC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5">
                <Heart className="w-3 h-3 text-red-500" /> Max HP
              </label>
              <input
                type="number"
                name="hpMax"
                required
                min="1"
                value={formData.hpMax}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-parchment-light border border-parchment-dark rounded-xl focus:outline-none focus:border-grimoire-gold text-lg font-bold font-serif text-center"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5">
                <Shield className="w-3 h-3" /> Armor Class
              </label>
              <input
                type="number"
                name="ac"
                required
                min="1"
                value={formData.ac}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-parchment-light border border-parchment-dark rounded-xl focus:outline-none focus:border-grimoire-gold text-lg font-bold font-serif text-center"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-parchment-dark">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-grimoire-dark hover:bg-grimoire-light text-grimoire-gold font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Summoning Hero...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Create & Join Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
