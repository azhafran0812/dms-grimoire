import { Shield, Minus, Plus, Trash2 } from 'lucide-react';
import { ref, update, remove } from 'firebase/database';
import { db } from '../../firebase'; // Sesuaikan path jika perlu

export default function PartyCard({ activeCampaignId, id, character }) {
  const { name, race, characterClass } = character;
  
  // PERBAIKAN: Deteksi cerdas! Baca dari sub-folder 'combat' (jika diedit) ATAU dari root (jika baru di-add)
  const hpMax = character.combat?.hpMax || character.hpMax || 10;
  
  // HP Current butuh pengecekan khusus karena nilainya bisa "0" (mati)
  const hpCurrent = character.combat?.hpCurrent !== undefined 
    ? character.combat.hpCurrent 
    : (character.hpCurrent !== undefined ? character.hpCurrent : hpMax);
    
  const ac = character.combat?.ac || character.ac || 10;

  // Hitung persentase bar
  const hpPercentage = Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100));
  
  let barColor = "bg-green-700";
  if (hpPercentage < 30) barColor = "bg-red-600";
  else if (hpPercentage < 60) barColor = "bg-amber-500";

  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  const handleHPChange = async (amount) => {
    if (!activeCampaignId) return;
    
    // Kalkulasi HP baru (tidak boleh kurang dari 0, tidak boleh lebih dari hpMax)
    const newHP = Math.max(0, Math.min(hpMax, hpCurrent + amount));
    
    if (newHP !== hpCurrent) {
      const charRef = ref(db, `campaigns/${activeCampaignId}/party/${id}`);
      
      // PERBAIKAN: Simpan nilai HP ke kedua struktur sekaligus!
      // Jadi tidak akan pernah bentrok lagi dengan modal Add maupun Edit
      await update(charRef, { 
        hpCurrent: newHP,
        'combat/hpCurrent': newHP 
      });
    }
  };

  const handleDelete = async () => {
    if (!activeCampaignId) return;
    const confirmDelete = window.confirm(`Keluarkan ${name} dari party?`);
    if (confirmDelete) {
      const charRef = ref(db, `campaigns/${activeCampaignId}/party/${id}`);
      await remove(charRef);
    }
  };

  return (
    <div className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors">
      
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-grimoire-dark text-parchment flex items-center justify-center rounded-full font-serif text-lg relative">
          {initials}
          <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${hpCurrent > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
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