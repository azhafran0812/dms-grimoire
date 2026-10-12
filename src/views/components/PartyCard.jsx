import { ref, update } from 'firebase/database';
import { db } from '../../firebase';
import { Shield } from 'lucide-react';

export default function PartyCard({ id, character }) {
  // Fungsi untuk mengupdate HP ke Firebase
  const updateHP = async (newHP) => {
    // Mencegah HP turun di bawah 0 atau melebihi batas maksimal
    if (newHP < 0 || newHP > character.maxHp) return;
    
    try {
      const charRef = ref(db, `party/${id}`);
      await update(charRef, { currentHp: newHP });
    } catch (error) {
      console.error("Gagal mengupdate HP:", error);
    }
  };

  const hpPercentage = (character.currentHp / character.maxHp) * 100;
  
  // Menentukan warna indikator HP berdasarkan persentase
  let hpColor = "bg-green-600";
  if (hpPercentage <= 25) hpColor = "bg-red-600";
  else if (hpPercentage <= 50) hpColor = "bg-amber-500";

  return (
    <div className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm hover:border-grimoire-gold transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-grimoire-dark text-grimoire-gold flex items-center justify-center font-serif text-lg">
            {character.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-serif font-bold text-grimoire-dark uppercase tracking-wider">{character.name}</h4>
            <p className="text-xs text-gray-500">{character.race} · {character.class}</p>
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${character.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      </div>

      <div className="flex justify-between items-end mb-1 text-sm font-bold">
        <span className="text-gray-500 text-xs">HIT POINTS</span>
        <div>
          <span className="text-grimoire-dark text-lg">{character.currentHp}</span>
          <span className="text-gray-400"> / {character.maxHp}</span>
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div className={`h-full ${hpColor} transition-all duration-300`} style={{ width: `${hpPercentage}%` }}></div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Shield className="w-4 h-4" /> AC {character.ac}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => updateHP(character.currentHp - 1)}
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition text-gray-600"
          >-</button>
          <button 
            onClick={() => updateHP(character.currentHp + 1)}
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition text-gray-600"
          >+</button>
        </div>
      </div>
    </div>
  );
}