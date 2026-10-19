import { useState } from 'react';
import { 
  Heart, Shield, Zap, Activity, RotateCcw, 
  Sparkles, Skull, CheckCircle, MapPin, Calendar, Users 
} from 'lucide-react';
import { updateCharacterStat } from '../../../controllers/partyController';
import { update, ref } from 'firebase/database';
import { db } from '../../../firebase';
import GrimoireAvatar from '../shared/GrimoireAvatar';

// Helper D&D modifier
const getModifier = (score) => {
  const mod = Math.floor(((score || 10) - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export default function HeroSheetView({ 
  partyMembers = [], 
  selectedCharId, 
  onSelectCharId, 
  campaignData = {}, 
  schedule = {}, 
  onNavigateTab,
  isDmPreview = false,
  currentUser = null,
}) {
  const [customHpVal, setCustomHpVal] = useState('');

  const activeChar = partyMembers.find((c) => c.id === selectedCharId) || partyMembers[0];

  const isOwner = !activeChar?.ownerEmail || !currentUser || activeChar.ownerEmail === currentUser?.email;
  const canEdit = isDmPreview || isOwner;

  // Combat HP Adjustments
  const handleHpChange = async (delta) => {
    if (!activeChar) return;
    const hpMax = activeChar.combat?.hpMax || 10;
    const currentHp = activeChar.combat?.hpCurrent ?? hpMax;
    const newHp = Math.max(0, Math.min(hpMax, currentHp + delta));
    await updateCharacterStat(activeChar.id, 'combat/hpCurrent', newHp);
  };

  const handleApplyCustomHp = async (isHeal) => {
    const amount = parseInt(customHpVal);
    if (!amount || isNaN(amount) || !activeChar) return;
    await handleHpChange(isHeal ? amount : -amount);
    setCustomHpVal('');
  };

  const handleFullRest = async () => {
    if (!activeChar) return;
    const hpMax = activeChar.combat?.hpMax || 10;
    if (window.confirm(`Lakukan Long Rest? HP ${activeChar.name} akan pulih penuh ke ${hpMax}.`)) {
      await updateCharacterStat(activeChar.id, 'combat/hpCurrent', hpMax);
      // Reset death saves
      await update(ref(db, `party/${activeChar.id}/combat/deathSaves`), {
        successes: 0,
        failures: 0,
      });
    }
  };

  const handleDeathSaveChange = async (type, index) => {
    if (!activeChar) return;
    const current = activeChar.combat?.deathSaves?.[type] || 0;
    const nextVal = current === index + 1 ? current - 1 : index + 1;
    await update(ref(db, `party/${activeChar.id}/combat/deathSaves`), {
      [type]: nextVal,
    });
  };

  // HP Bar percentage & styling
  const hpMax = activeChar?.combat?.hpMax || 10;
  const hpCurrent = activeChar?.combat?.hpCurrent ?? hpMax;
  const hpPercent = Math.max(0, Math.min(100, Math.round((hpCurrent / hpMax) * 100)));

  let hpBarColor = 'bg-emerald-600';
  if (hpPercent < 30) hpBarColor = 'bg-red-600';
  else if (hpPercent < 60) hpBarColor = 'bg-amber-500';

  if (!activeChar) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center animate-fade-in">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-serif text-2xl uppercase text-gray-600 mb-2">No Character Assigned</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Ask your Dungeon Master to scribe your character profile in the campaign party overview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Character Selector Pills (if multiple heroes exist) */}
      {partyMembers.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Switch Hero:</span>
          {partyMembers.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCharId(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex items-center gap-1.5 ${
                activeChar?.id === c.id
                  ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
                  : 'bg-white border border-parchment-dark text-gray-600 hover:border-grimoire-gold'
              }`}
            >
              <GrimoireAvatar entity={c} size="xs" border={false} className="w-5 h-5" />
              <span>{c.name} (Lvl {c.level || 1} {c.characterClass})</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
        {/* Left 2 Cols: Hero Portrait, Live HP, Combat Actions, Stats */}
        <div className="2xl:col-span-2 space-y-6">
          {/* Hero Header Card */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <GrimoireAvatar entity={activeChar} size="lg" className="w-16 h-16 shadow-md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-2xl sm:text-3xl uppercase text-grimoire-dark leading-tight">
                      {activeChar.name}
                    </h2>
                    <span className="bg-parchment border border-parchment-dark px-2 py-0.5 rounded text-xs font-bold text-grimoire-dark font-serif">
                      LVL {activeChar.level || 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 font-medium">
                    {activeChar.race} · {activeChar.characterClass} ({activeChar.background || 'Hero'}) · {activeChar.alignment || 'Neutral'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateTab && canEdit && (
                  <button
                    onClick={() => onNavigateTab('stylist')}
                    className="bg-grimoire-dark hover:bg-grimoire-light text-grimoire-gold border border-grimoire-gold/40 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Character Stylist
                  </button>
                )}
                {canEdit ? (
                  <button
                    onClick={handleFullRest}
                    className="bg-parchment hover:bg-parchment-dark text-grimoire-dark border border-parchment-dark px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-grimoire-gold" /> Long Rest
                  </button>
                ) : (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    🔒 Spectator Mode
                  </span>
                )}
              </div>
            </div>

            {!canEdit && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2 rounded-xl text-xs font-medium mb-4 flex items-center justify-between">
                <span>Belonging to <strong>{activeChar.ownerEmail || 'Companion'}</strong>. Spectator mode active.</span>
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">Companion Sheet</span>
              </div>
            )}

            {/* LIVE HIT POINTS (HP) INTERACTIVE SECTION */}
            <div className="bg-parchment-light/60 border border-parchment-dark rounded-xl p-5 mb-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Current Hit Points
                  </p>
                  <p className="font-serif text-3xl font-bold text-grimoire-dark">
                    {hpCurrent} <span className="text-base text-gray-400 font-sans">/ {hpMax} HP</span>
                  </p>
                </div>
                <span className="text-sm font-bold font-serif text-grimoire-dark">
                  {hpPercent}%
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-4">
                <div
                  className={`h-full ${hpBarColor} transition-all duration-300 ease-out`}
                  style={{ width: `${hpPercent}%` }}
                ></div>
              </div>

              {/* Quick Adjust Buttons (Only if canEdit) */}
              {canEdit ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-parchment-dark">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Damage:</span>
                    <button
                      onClick={() => handleHpChange(-1)}
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-xs border border-red-300 transition"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleHpChange(-5)}
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-xs border border-red-300 transition"
                    >
                      -5
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Heal:</span>
                    <button
                      onClick={() => handleHpChange(1)}
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-xs border border-emerald-300 transition"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleHpChange(5)}
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-xs border border-emerald-300 transition"
                    >
                      +5
                    </button>
                  </div>

                  {/* Custom HP Input */}
                  <div className="flex items-center gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                    <input
                      type="number"
                      min="1"
                      placeholder="Amt"
                      value={customHpVal}
                      onChange={(e) => setCustomHpVal(e.target.value)}
                      className="w-16 px-2 py-1 bg-white border border-parchment-dark rounded text-xs text-center focus:outline-none focus:border-grimoire-gold"
                    />
                    <button
                      onClick={() => handleApplyCustomHp(false)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition"
                    >
                      Dmg
                    </button>
                    <button
                      onClick={() => handleApplyCustomHp(true)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition"
                    >
                      Heal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-parchment-dark text-[11px] text-gray-500 italic text-center">
                  Live HP adjustments are reserved for the character owner and Dungeon Master.
                </div>
              )}
            </div>

            {/* Combat Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-4 text-center">
                <Shield className="w-5 h-5 text-gray-700 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Armor Class</p>
                <p className="font-serif text-2xl font-bold text-grimoire-dark">{activeChar.combat?.ac || 10}</p>
              </div>

              <div className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-4 text-center">
                <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initiative</p>
                <p className="font-serif text-2xl font-bold text-grimoire-dark">
                  {(activeChar.combat?.initiativeModifier || 0) >= 0 ? '+' : ''}{activeChar.combat?.initiativeModifier || 0}
                </p>
              </div>

              <div className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-4 text-center">
                <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Speed</p>
                <p className="font-serif text-2xl font-bold text-grimoire-dark">{activeChar.combat?.speed || 30}ft</p>
              </div>

              <div className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-4 text-center">
                <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hit Die</p>
                <p className="font-serif text-2xl font-bold text-grimoire-dark">
                  {activeChar.combat?.hitDice?.current || 1}{activeChar.combat?.hitDice?.dieType || 'd10'}
                </p>
              </div>
            </div>
          </div>

          {/* ABILITY SCORES (6 Attributes) */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
            <h3 className="font-serif font-bold text-lg uppercase tracking-wider text-grimoire-dark mb-4 border-b border-parchment-dark pb-2">
              Ability Scores & Modifiers
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'STR', val: activeChar.stats?.str || 10 },
                { label: 'DEX', val: activeChar.stats?.dex || 10 },
                { label: 'CON', val: activeChar.stats?.con || 10 },
                { label: 'INT', val: activeChar.stats?.int || 10 },
                { label: 'WIS', val: activeChar.stats?.wis || 10 },
                { label: 'CHA', val: activeChar.stats?.cha || 10 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-3 text-center"
                >
                  <span className="text-xs font-bold text-grimoire-gold uppercase tracking-wider block mb-1">
                    {stat.label}
                  </span>
                  <span className="font-serif text-2xl font-bold text-grimoire-dark block">
                    {stat.val}
                  </span>
                  <span className="inline-block mt-1 bg-white border border-parchment-dark px-2 py-0.5 rounded-full text-xs font-bold text-gray-700">
                    {getModifier(stat.val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Death Saves, Campaign Status, Quick Actions (3 cards in row on mid screens) */}
        <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-1 gap-6">
          {/* Death Saves Card */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Skull className="w-5 h-5 text-gray-700" />
              <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark">Death Saving Throws</h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">
                  Successes (3 to Stabilize)
                </span>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => {
                    const isChecked = (activeChar.combat?.deathSaves?.successes || 0) > i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleDeathSaveChange('successes', i)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-parchment-dark hover:border-emerald-500 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1.5">
                  Failures (3 to Perish)
                </span>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => {
                    const isChecked = (activeChar.combat?.deathSaves?.failures || 0) > i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleDeathSaveChange('failures', i)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-parchment-dark hover:border-red-500 bg-white'
                        }`}
                      >
                        {isChecked && <Skull className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Location Card */}
          <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-grimoire-gold text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" /> Current Location
            </div>
            <h4 className="font-serif font-bold text-xl uppercase text-grimoire-dark mb-1">
              {campaignData.locationName || 'Blackwater Abbey'}
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              {campaignData.locationDesc || 'Ruined sanctuary · The Greyfen'}
            </p>
            <div className="pt-3 border-t border-parchment-dark text-xs text-gray-500">
              Progress: <strong className="text-grimoire-dark">{campaignData.progress || 68}%</strong>
            </div>
          </div>

          {/* Quick Next Session Reminder */}
          <div className="bg-grimoire-dark text-parchment rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-grimoire-gold text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" /> Next Session
            </div>
            <h4 className="font-serif font-bold text-lg text-white uppercase mb-1">
              {schedule.title || 'Session 19: The Catacombs'}
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              {schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString() : 'TBA'} at {schedule.scheduledTime || '19:30'}
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('schedule')}
                className="text-grimoire-gold hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition"
              >
                View Schedule & RSVP &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
