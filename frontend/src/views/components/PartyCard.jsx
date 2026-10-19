import { Shield, Minus, Plus, Trash2 } from 'lucide-react';
import { updateCharacterStat, removeCharacter } from '../../controllers/partyController';
import GrimoireAvatar from './shared/GrimoireAvatar';

export default function PartyCard({ id, character }) {
  // Destrukturisasi data dari Firebase dengan safe defaults
  const { name = 'Hero', race = 'Human', characterClass = 'Fighter' } = character || {};
  const { hpMax = 10, hpCurrent = 10, ac = 10 } = character?.combat || {};

  // Hitung persentase untuk progress bar HP
  const hpPercentage = Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100));
  
  // Tentukan warna bar berdasarkan sisa HP
  let barColor = "bg-green-700";
  if (hpPercentage < 30) barColor = "bg-red-600";
  else if (hpPercentage < 60) barColor = "bg-amber-500";

  // Ambil inisial nama (contoh: "Elowen Starseeker" -> "ES")
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleHPChange = (amount) => {
    const newHP = Math.max(0, Math.min(hpMax, hpCurrent + amount));
    if (newHP !== hpCurrent) {
      updateCharacterStat(id, 'combat/hpCurrent', newHP);
    }
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Keluarkan ${name} dari party?`);
    if (confirmDelete) {
      removeCharacter(id);
    }
  };

  return (
    <div className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors">
      
      {/* Tombol Delete (Muncul saat di-hover) */}
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
        {/* HP Section */}
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

        {/* AC & Live Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-parchment-dark">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">AC <span className="font-bold text-grimoire-dark">{ac}</span></span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleHPChange(-1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleHPChange(1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}