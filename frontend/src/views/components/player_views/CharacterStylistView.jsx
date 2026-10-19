import { useState, useEffect } from 'react';
import { 
  Sparkles, Shirt, Swords, RefreshCw, Palette, 
  Search, CheckCircle2, AlertCircle, Eye, 
  Award 
} from 'lucide-react';
import { styleCharacterWithAI } from '../../../controllers/partyController';
import { getAvatarUrl } from '../shared/GrimoireAvatar';
import { cropGrowtopiaHead } from '../../../utils/growtopiaCropper';

// Slot icons helper
const SLOT_ICONS = {
  Hat: '🎩',
  Hair: '💇',
  Face: '👓',
  Shirt: '👕',
  Pants: '👖',
  Feet: '👞',
  Back: '🎒',
  Hand: '🗡️',
};

const PRESETS = [
  { label: '🧙 Necromancer', text: 'Dark necromancer raising undead in the cursed cemetery with obsidian robes and skull staff' },
  { label: '⚔️ Paladin', text: 'Holy paladin guardian in luminous golden plate with radiant blade and angel wings' },
  { label: '🤖 Cyberpunk', text: 'Cyberpunk rogue hacker with neon visor, trench coat, and cybernetic katana' },
  { label: '🏴‍☠️ Pirate', text: 'Dread pirate captain sailing cursed waters with tricorn hat and cutlass' },
  { label: '🥷 Ninja', text: 'Shadow ninja assassin in obsidian shinobi gi with throwing stars and demon mask' },
  { label: '⚙️ Steampunk', text: 'Steampunk clockwork inventor with brass goggles, leather waistcoat, and wrench' },
  { label: '🌿 Druid', text: 'Ancient forest druid adorned in leaf mantle, antler headdress, and spirit staff' },
  { label: '😇 Celestial', text: 'Fallen celestial seraph seeking mortal redemption with feathered wings and halo' },
];

export default function CharacterStylistView({
  partyMembers = [],
  selectedCharId,
  onSelectCharId,
}) {
  const activeChar = partyMembers.find((c) => c.id === selectedCharId) || partyMembers[0];

  // Stylist Modal / Form State
  const [isStylingOpen, setIsStylingOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [renderImage, setRenderImage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleApplyPreset = (text) => {
    setPromptText(text);
  };

  const handleRunAIStylist = async (e) => {
    e?.preventDefault();
    if (!activeChar) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const finalPrompt = promptText.trim() || `${activeChar.name}, a Level ${activeChar.level || 1} ${activeChar.race} ${activeChar.characterClass} adventurer`;
      await styleCharacterWithAI(activeChar.id, {
        prompt: finalPrompt,
        render: renderImage,
        simulate: false,
      });

      setSuccessMsg(`Karakter ${activeChar.name} berhasil di-styling dengan Arcane AI Stylist!`);
      setIsStylingOpen(false);
      setPromptText('');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memanggil Arcane Stylist');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeChar) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center animate-fade-in">
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-serif text-2xl uppercase text-gray-600 mb-2">No Hero Selected</h3>
        <p className="text-sm text-gray-500">Please choose a character from your campaign fellowship.</p>
      </div>
    );
  }

  const aiMeta = activeChar.aiMeta || {};
  const avatar = aiMeta.avatar;
  const image = aiMeta.image;
  const simulation = aiMeta.simulation;
  const selectedAgent = aiMeta.selectedAgent;
  const items = avatar?.items || [];
  const synergyScore = avatar?.review?.synergyScore || 85;
  const displayAvatarUrl = image?.dataUrl || activeChar.avatarUrl || getAvatarUrl(activeChar);

  const [croppedHeadUrl, setCroppedHeadUrl] = useState(null);

  useEffect(() => {
    let active = true;
    if (displayAvatarUrl && displayAvatarUrl.startsWith('data:image/png')) {
      cropGrowtopiaHead(displayAvatarUrl).then((res) => {
        if (active) setCroppedHeadUrl(res);
      });
    } else {
      setCroppedHeadUrl(null);
    }
    return () => {
      active = false;
    };
  }, [displayAvatarUrl]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Hero Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-grimoire-gold uppercase tracking-widest">Arcane Character Stylist</p>
            <span className="bg-grimoire-gold/20 text-grimoire-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-grimoire-gold/30">
              Visual Pipeline
            </span>
          </div>
          <h2 className="font-serif text-3xl uppercase text-grimoire-dark">Character Visual Avatar & Stylist</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dynamic AI Item Discovery across 3,948 equipment relics and aesthetic synergy scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {partyMembers.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1 rounded-xl border border-parchment-dark shadow-sm">
              {partyMembers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCharId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    activeChar?.id === c.id
                      ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
                      : 'text-gray-600 hover:bg-parchment'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsStylingOpen(true)}
            className="bg-grimoire-dark hover:bg-grimoire-light text-grimoire-gold border border-grimoire-gold/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-md whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-grimoire-gold" /> Style with AI
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-700 hover:text-emerald-900">&times;</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="font-bold text-red-700 hover:text-red-900">&times;</button>
        </div>
      )}

      {/* Main Grid: Avatar & Profile Card vs Equipment & Review */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
        
        {/* Left Column (5 Cols): Avatar Visual Render & Vitals */}
        <div className="2xl:col-span-5 space-y-6">
          
          {/* Composite Pixel Avatar Card */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b border-parchment-dark pb-3">
              <div>
                <span className="text-[10px] font-bold text-grimoire-gold uppercase tracking-widest block">Character Visual</span>
                <h3 className="font-serif font-bold text-xl uppercase text-grimoire-dark">{activeChar.name}</h3>
              </div>
              <span className="bg-parchment border border-parchment-dark px-2.5 py-1 rounded text-xs font-serif font-bold text-grimoire-dark">
                LVL {activeChar.level || 1} {activeChar.characterClass}
              </span>
            </div>

            {/* Rendered Avatar Showcase */}
            <div className="bg-grimoire-dark/95 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px] text-center shadow-inner relative group">
              {displayAvatarUrl ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-black/40 rounded-2xl border border-grimoire-gold/40 shadow-xl relative group">
                    <img
                      src={croppedHeadUrl || displayAvatarUrl}
                      alt={`Avatar of ${activeChar.name}`}
                      className="w-36 h-36 object-cover rounded-xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105 bg-amber-50/10"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute top-2 right-2 bg-grimoire-dark/90 backdrop-blur-xs text-grimoire-gold text-[9px] font-bold px-2 py-0.5 rounded border border-grimoire-gold/40 uppercase">
                      Hero Portrait
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <p className="text-[10px] text-gray-400 font-mono">
                      {image?.dimensions || '256x256'} • {avatar?.theme ? `${avatar.theme} ${avatar.archetype || ''}` : 'Active Visual'}
                    </p>
                    <button
                      onClick={() => setIsStylingOpen(true)}
                      className="text-grimoire-gold hover:text-white text-xs underline font-bold transition ml-2"
                    >
                      Conjure New Look
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  <div className="w-20 h-20 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center mx-auto text-grimoire-gold font-serif text-3xl font-bold shadow-md">
                    {activeChar.name.substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs text-gray-400 max-w-xs">
                    No composite avatar rendered yet for {activeChar.name}.
                  </p>
                  <button
                    onClick={() => setIsStylingOpen(true)}
                    className="bg-grimoire-gold hover:bg-yellow-500 text-grimoire-dark font-bold text-xs uppercase px-3 py-1.5 rounded-lg transition"
                  >
                    ✨ Conjure Outfit
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Metadata (Theme, Archetype, Mood) */}
            {avatar && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-parchment-light/60 border border-parchment-dark rounded-xl p-2.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Theme</span>
                    <strong className="text-xs text-grimoire-dark font-serif capitalize truncate block">
                      {avatar.theme || 'Fantasy'}
                    </strong>
                  </div>
                  <div className="bg-parchment-light/60 border border-parchment-dark rounded-xl p-2.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Archetype</span>
                    <strong className="text-xs text-grimoire-dark font-serif capitalize truncate block">
                      {avatar.archetype || 'Warrior'}
                    </strong>
                  </div>
                  <div className="bg-parchment-light/60 border border-parchment-dark rounded-xl p-2.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Mood</span>
                    <strong className="text-xs text-grimoire-dark font-serif capitalize truncate block">
                      {avatar.mood || 'Heroic'}
                    </strong>
                  </div>
                </div>

                {/* Color Palette */}
                {avatar.colorPalette && avatar.colorPalette.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-grimoire-gold" /> Palette Harmonics
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {avatar.colorPalette.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-parchment border border-parchment-dark text-gray-700 shadow-2xs"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Search Regex & Keywords */}
                {avatar.searchRegex && (
                  <div className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Search className="w-3 h-3 text-grimoire-gold" /> AI Regex Scanning (3,948 Items)
                    </span>
                    <code className="text-[10px] text-blue-700 font-mono break-all block bg-white p-1.5 rounded border border-parchment-dark">
                      {avatar.searchRegex}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stylist Specialist Agent Badge */}
          {selectedAgent && (
            <div className="bg-gradient-to-r from-gray-900 to-grimoire-dark text-parchment p-5 rounded-2xl border border-grimoire-gold/30 shadow-sm flex items-start gap-3">
              <Award className="w-6 h-6 text-grimoire-gold shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-grimoire-gold uppercase tracking-widest block">
                  Art Director Agent Assigned
                </span>
                <h4 className="font-serif font-bold text-sm text-white">{selectedAgent.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{selectedAgent.title || selectedAgent.domain}</p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (7 Cols): 8-Slot Equipment Formula & Art Director Review */}
        <div className="2xl:col-span-7 space-y-6">
          
          {/* 8-SLOT EQUIPMENT FORMULA CARD */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-parchment-dark pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-grimoire-gold" />
                  <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark">
                    8-Slot Equipment Formula
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Exact items curated and styled for {activeChar.name}.
                </p>
              </div>

              {avatar?.review && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    Synergy: {synergyScore}/100
                  </span>
                </div>
              )}
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-parchment-light/50 border border-parchment-dark rounded-xl p-3 flex items-center justify-between gap-3 hover:border-grimoire-gold transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-parchment-dark flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {SLOT_ICONS[item.category] || '🛡️'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-grimoire-gold uppercase tracking-wider block leading-none">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold text-grimoire-dark truncate mt-0.5" title={item.name}>
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-gray-400 bg-white px-2 py-0.5 rounded border border-parchment-dark shrink-0">
                      ID: {item.itemID}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-parchment-light/30 rounded-xl border border-dashed border-parchment-dark">
                <Shirt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No equipment formula mapped yet.</p>
                <button
                  onClick={() => setIsStylingOpen(true)}
                  className="mt-2 text-xs font-bold text-grimoire-dark hover:text-grimoire-gold uppercase tracking-wider"
                >
                  Generate Outfit Formula &rarr;
                </button>
              </div>
            )}

            {/* Collision Auto-Resolution Note */}
            {avatar?.compatibility?.autoResolved && (
              <div className="mt-4 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Smart Visual Auto-Resolution Applied:</strong>
                  <span>{(avatar.compatibility.removedItems || []).map((r) => `${r.slot} (${r.reason})`).join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* ART DIRECTOR REVIEW & CRITIQUE CARD */}
          {avatar?.review && (
            <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-grimoire-gold" />
                <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark">
                  Art Director Critique & Advice
                </h3>
              </div>

              {avatar.review.critique && (
                <div className="bg-parchment-light/60 border-l-4 border-grimoire-gold rounded-r-xl p-4 mb-3">
                  <p className="text-xs text-gray-700 italic leading-relaxed">
                    "{avatar.review.critique}"
                  </p>
                </div>
              )}

              {avatar.review.stylistAdvice && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2">
                  <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Stylist Advice:</strong>
                    <span>{avatar.review.stylistAdvice}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL STYLIST / FORM --- */}
      {isStylingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-parchment-light w-full max-w-xl rounded-2xl shadow-2xl border border-parchment-dark text-grimoire-dark overflow-hidden relative">
            <div className="bg-grimoire-dark text-parchment p-6 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-grimoire-gold/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-grimoire-gold" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white uppercase">Arcane AI Character Stylist</h3>
                  <p className="text-xs text-gray-400">Styling for {activeChar.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsStylingOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRunAIStylist} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Character Concept / Outfit Vision
                </label>
                <textarea
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={`Describe ${activeChar.name}'s appearance, weapons, aesthetic, or colors...`}
                  className="w-full p-3 bg-white border border-parchment-dark rounded-xl text-xs text-grimoire-dark focus:outline-none focus:border-grimoire-gold resize-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Quick Archetype Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p.text)}
                      className="px-2.5 py-1 bg-white border border-parchment-dark hover:border-grimoire-gold rounded-lg text-[11px] font-medium text-gray-700 transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox for Render */}
              <div className="pt-2 border-t border-parchment-dark">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renderImage}
                    onChange={(e) => setRenderImage(e.target.checked)}
                    className="w-4 h-4 accent-grimoire-dark rounded"
                  />
                  <span>Render Composite Avatar Visual</span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-700 rounded-lg text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-parchment-dark">
                <button
                  type="button"
                  onClick={() => setIsStylingOpen(false)}
                  className="px-4 py-2 border border-parchment-dark rounded-xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-parchment transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-grimoire-dark hover:bg-grimoire-light text-grimoire-gold font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Conjuring AI Style...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-grimoire-gold" />
                      Conjure & Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
