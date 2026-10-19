import { useState, useEffect } from 'react';
import { Users, Shield, Heart, Zap, Edit3, Activity } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import EditCharacterModal from '../EditCharacterModal';
import GrimoireAvatar from '../shared/GrimoireAvatar';

// Fungsi bantuan untuk menghitung modifier D&D (misal: Stat 16 -> +3)
const getModifier = (score) => {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : mod;
};

export default function PartyView() {
  const [partyMembers, setPartyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleEditClick = (character) => {
  setSelectedCharacter(character);
  setIsEditModalOpen(true);
};   

  useEffect(() => {
    const partyRef = ref(db, 'party');
    const unsubParty = onValue(partyRef, (snapshot) => {
      if (snapshot.exists()) {
        const membersArray = Object.values(snapshot.val());
        setPartyMembers(membersArray);
      } else {
        setPartyMembers([]);
      }
      setLoading(false);
    });

    return () => unsubParty();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">The Fellowship</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Party Members</h2>
        </div>
      </div>

      {/* Grid Karakter Lengkap */}
      {loading ? (
        <div className="flex justify-center py-20"><p className="text-gray-400 animate-pulse">Reading the character sheets...</p></div>
      ) : partyMembers.length > 0 ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
          {partyMembers.map((char) => (
            <div key={char.id} className="bg-white border border-parchment-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Card Header (Identitas Dasar) */}
              <div className="bg-grimoire-dark p-5 text-white flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <GrimoireAvatar entity={char} size="lg" className="w-14 h-14" />
                  <div>
                    <h3 className="font-serif font-bold text-2xl uppercase tracking-wide leading-tight">{char.name}</h3>
                    <p className="text-sm text-gray-300">
                      Level {char.level || 1} {char.race} {char.characterClass}
                    </p>
                  </div>
                </div>
                <button 
                onClick={() => handleEditClick(char)}
                className="text-gray-400 hover:text-grimoire-gold transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
                >
                <Edit3 className="w-4 h-4" /> Edit
                </button>
              </div>

              {/* Card Body (Status & Attributes) */}
              <div className="p-6 bg-parchment-light/30 flex-1">
                
                {/* Combat Stats Mini-Grid */}
                <div className="flex justify-between items-center bg-white border border-parchment-dark rounded-lg p-4 mb-6 shadow-sm">
                  <div className="text-center px-4">
                    <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">HP</p>
                    <p className="font-serif text-xl font-bold text-grimoire-dark">{char.combat?.hpCurrent} <span className="text-sm text-gray-400">/ {char.combat?.hpMax}</span></p>
                  </div>
                  <div className="w-px h-10 bg-parchment-dark"></div>
                  <div className="text-center px-4">
                    <Shield className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">AC</p>
                    <p className="font-serif text-xl font-bold text-grimoire-dark">{char.combat?.ac || 10}</p>
                  </div>
                  <div className="w-px h-10 bg-parchment-dark"></div>
                  <div className="text-center px-4">
                    <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Init</p>
                    <p className="font-serif text-xl font-bold text-grimoire-dark">
                      {char.combat?.initiativeModifier >= 0 ? '+' : ''}{char.combat?.initiativeModifier || 0}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-parchment-dark"></div>
                  <div className="text-center px-4">
                    <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Speed</p>
                    <p className="font-serif text-xl font-bold text-grimoire-dark">{char.combat?.speed || 30}ft</p>
                  </div>
                </div>

                {/* Main Attributes (Ability Scores) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'STR', value: char.stats?.str || 10 },
                    { label: 'DEX', value: char.stats?.dex || 10 },
                    { label: 'CON', value: char.stats?.con || 10 },
                    { label: 'INT', value: char.stats?.int || 10 },
                    { label: 'WIS', value: char.stats?.wis || 10 },
                    { label: 'CHA', value: char.stats?.cha || 10 }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white border border-parchment-dark rounded-md p-2 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-grimoire-gold tracking-widest uppercase mb-1">{stat.label}</p>
                      <p className="font-serif text-xl font-bold text-grimoire-dark">{stat.value}</p>
                      <div className="mt-1 bg-parchment-light border border-parchment rounded-full text-xs font-bold text-gray-600 py-0.5">
                        {getModifier(stat.value)}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">No Party Members</h3>
          <p className="text-sm text-gray-400">Return to the Overview to add characters to your party.</p>
        </div>
      )}
      
      <EditCharacterModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        characterData={selectedCharacter} 
      />
    </div>
  );
}