import { Shield, Minus, Plus, Trash2 } from 'lucide-react';
import { updateCharacterHP, removeCharacter } from '../../controllers/partyController';
import GrimoireAvatar from './shared/GrimoireAvatar';

export default function PartyCard({ activeCampaignId, id, character = {} }) {
  const { name = 'Hero', race = 'Human', characterClass = 'Fighter' } = character || {};

  // Deteksi cerdas: baca dari sub-folder combat atau root
  const hpMax = character?.combat?.hpMax || character?.hpMax || 10;
  const hpCurrent = character?.combat?.hpCurrent !== undefined 
    ? character.combat.hpCurrent 
    : (character?.hpCurrent !== undefined ? character.hpCurrent : hpMax);
  const ac = character?.combat?.ac || character?.ac || 10;

  // Hitung persentase bar
  const hpPercentage = Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100));

  let barColor = "bg-green-700";
  if (hpPercentage < 30) barColor = "bg-red-600";
  else if (hpPercentage < 60) barColor = "bg-amber-500";

  const handleHPChange = async (amount) => {
    const newHP = Math.max(0, Math.min(hpMax, hpCurrent + amount));
    if (newHP !== hpCurrent) {
      if (activeCampaignId) {
        await updateCharacterHP(activeCampaignId, id, newHP);
      } else {
        await updateCharacterHP(id, newHP);
      }
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Keluarkan ${name} dari party?`);
    if (confirmDelete) {
      if (activeCampaignId) {
        await removeCharacter(activeCampaignId, id);
      } else {
        await removeCharacter(id);
      }
    }
  };

  return (
    <div className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors">
      
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Keluarkan dari Party"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 mb-5">
        <GrimoireAvatar
          entity={character}
          size="md"
          statusDot={hpCurrent > 0 ? 'alive' : 'dead'}
        />
        <div>
          <h4 className="font-serif font-bold text-lg uppercase tracking-wide text-grimoire-dark leading-tight">{name}</h4>
          <p className="text-xs text-gray-500">{race} · {characterClass}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1 text-xs font-bold text-gray-500 tracking-widest uppercase">
            <span>Hit Points</span>
            <span className="text-grimoire-dark text-sm"><span className="text-lg">{hpCurrent}</span> / {hpMax}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${barColor} transition-all duration-300 ease-out`} 
              style={{ width: `${hpPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-parchment-dark">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">AC <span className="font-bold text-grimoire-dark">{ac}</span></span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleHPChange(-1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              title="Damage (-1 HP)"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleHPChange(1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
              title="Heal (+1 HP)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}