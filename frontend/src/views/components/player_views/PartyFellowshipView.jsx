import { Users, Heart, Shield, Zap, Activity, Sparkles } from 'lucide-react';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function PartyFellowshipView({ 
  partyMembers = [], 
  onSelectHero, 
  onNavigateTab 
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Companions</p>
          <h2 className="font-serif text-3xl uppercase text-grimoire-dark">Party Fellowship</h2>
        </div>
        <span className="self-start sm:self-auto bg-grimoire-dark text-grimoire-gold text-xs font-bold px-3 py-1.5 rounded-full border border-grimoire-gold/40">
          {partyMembers.length} Adventurers Bound in Destiny
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partyMembers.map((member) => {
          const mHpMax = member.combat?.hpMax || 10;
          const mHpCur = member.combat?.hpCurrent ?? mHpMax;
          const mPercent = Math.max(0, Math.min(100, Math.round((mHpCur / mHpMax) * 100)));
          let mColor = 'bg-emerald-600';
          if (mPercent < 30) mColor = 'bg-red-600';
          else if (mPercent < 60) mColor = 'bg-amber-500';

          return (
            <div
              key={member.id}
              className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-grimoire-gold transition-colors group"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GrimoireAvatar entity={member} size="md" statusDot={mPercent > 0 ? 'alive' : 'dead'} />
                  <div>
                    <h4 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight">
                      {member.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Lvl {member.level || 1} {member.race} · {member.characterClass}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 bg-parchment-light/50 p-3 rounded-xl border border-parchment-dark">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Vitality
                    </span>
                    <span className="text-grimoire-dark font-serif">{mHpCur} / {mHpMax} HP ({mPercent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${mColor} transition-all duration-300`} style={{ width: `${mPercent}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-parchment-light/40 border border-parchment-dark rounded-lg p-2">
                    <Shield className="w-3.5 h-3.5 text-gray-500 mx-auto mb-0.5" />
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">AC</span>
                    <strong className="text-grimoire-dark font-serif">{member.combat?.ac || 10}</strong>
                  </div>
                  <div className="bg-parchment-light/40 border border-parchment-dark rounded-lg p-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Init</span>
                    <strong className="text-grimoire-dark font-serif">
                      {(member.combat?.initiativeModifier || 0) >= 0 ? '+' : ''}{member.combat?.initiativeModifier || 0}
                    </strong>
                  </div>
                  <div className="bg-parchment-light/40 border border-parchment-dark rounded-lg p-2">
                    <Activity className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Speed</span>
                    <strong className="text-grimoire-dark font-serif">{member.combat?.speed || 30}ft</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-parchment-dark flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (onSelectHero) onSelectHero(member.id);
                    if (onNavigateTab) onNavigateTab('hero');
                  }}
                  className="text-xs font-bold text-grimoire-dark hover:text-grimoire-gold uppercase tracking-wider transition"
                >
                  Inspect Sheet &rarr;
                </button>
                <button
                  onClick={() => {
                    if (onSelectHero) onSelectHero(member.id);
                    if (onNavigateTab) onNavigateTab('stylist');
                  }}
                  className="px-2.5 py-1 bg-grimoire-dark text-grimoire-gold hover:bg-grimoire-light rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" /> Stylist
                </button>
              </div>
            </div>
          );
        })}

        {partyMembers.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif text-xl uppercase text-gray-500 mb-1">No Fellowship Members Yet</h3>
            <p className="text-xs text-gray-400">Ask the Dungeon Master to add players to this campaign.</p>
          </div>
        )}
      </div>
    </div>
  );
}
