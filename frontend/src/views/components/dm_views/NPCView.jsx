import { useState, useEffect } from 'react';
import { Users, Search, Plus, Sparkles, MapPin, Trash2, Edit3, ShieldAlert, HeartHandshake, Eye, Lock } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { deleteNpc, updateNpcDisposition } from '../../../controllers/npcController';
import AddNpcModal from '../AddNpcModal';
import EditNpcModal from '../EditNpcModal';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function NpcView({ onOpenScribe, activeCampaignId }) {
  const [npcs, setNpcs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisposition, setFilterDisposition] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNpcToEdit, setSelectedNpcToEdit] = useState(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const targetPath = activeCampaignId ? `campaigns/${activeCampaignId}/npcs` : 'campaign/active/npcs';
    const npcRef = ref(db, targetPath);
    const unsubNpc = onValue(npcRef, (snapshot) => {
      if (snapshot.exists()) {
        const npcArray = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNpcs(npcArray);
      } else {
        setNpcs([]);
      }
      setLoading(false);
    });

    return () => unsubNpc();
  }, [activeCampaignId]);

  const handleEditClick = (npc) => {
    setSelectedNpc(npc);
    setIsEditOpen(true);
  };

  const handleCycleDisposition = async (npc, e) => {
    e.stopPropagation();
    const cycle = {
      'Friendly': 'Neutral',
      'Neutral': 'Hostile',
      'Hostile': 'Friendly'
    };
    const current = npc.disposition || 'Neutral';
    const next = cycle[current] || 'Neutral';
    try {
      await updateNpcDisposition(npc.id, next);
    } catch (err) {
      console.error(err);
    }
  };

  const getDispositionBadge = (disposition, npc) => {
    const disp = disposition || 'Neutral';
    if (disp === 'Friendly') {
      return (
        <button
          onClick={(e) => handleCycleDisposition(npc, e)}
          title="Klik untuk ubah status hubungan"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
        >
          <HeartHandshake className="w-3 h-3 text-emerald-700" />
          <span>Friendly</span>
        </button>
      );
    } else if (disp === 'Hostile') {
      return (
        <button
          onClick={(e) => handleCycleDisposition(npc, e)}
          title="Klik untuk ubah status hubungan"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 transition cursor-pointer"
        >
          <ShieldAlert className="w-3 h-3 text-red-700" />
          <span>Hostile</span>
        </button>
      );
    } else {
      return (
        <button
          onClick={(e) => handleCycleDisposition(npc, e)}
          title="Klik untuk ubah status hubungan"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition cursor-pointer"
        >
          <Eye className="w-3 h-3 text-amber-700" />
          <span>Neutral</span>
        </button>
      );
    }
  };

  // Filter NPC
  const filteredNpcs = npcs.filter(npc => {
    const matchSearch =
      (npc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (npc.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (npc.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDisp = filterDisposition === 'All' || (npc.disposition || 'Neutral') === filterDisposition;
    return matchSearch && matchDisp;
  });

  return (
    <div className="animate-fade-in">
      {/* Header NPC */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Dramatis Personae · {npcs.length} Records</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Non-Player Characters</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, role, town..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          {/* Disposition Filter */}
          <select 
            value={filterDisposition}
            onChange={(e) => setFilterDisposition(e.target.value)}
            className="px-3 py-2 bg-white border border-parchment-dark rounded-md text-sm font-bold text-gray-600 focus:outline-none"
          >
            <option value="All">All Dispositions</option>
            <option value="Friendly">Friendly (Ramah)</option>
            <option value="Neutral">Neutral (Netral)</option>
            <option value="Hostile">Hostile (Bermusuhan)</option>
          </select>
          
          {/* Add Manual NPC Button */}
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-white border border-parchment-dark hover:border-grimoire-gold hover:text-grimoire-gold text-grimoire-dark px-3.5 py-2 rounded-md transition-colors flex items-center gap-1.5 text-sm font-bold whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> Add NPC
          </button>

          {/* Arcane Scribe Button */}
          <button 
            onClick={onOpenScribe}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-bold shadow-md whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-grimoire-gold" /> Conjure (AI)
          </button>
        </div>
      </div>

      {/* Grid NPC */}
      {loading ? (
        <div className="flex justify-center py-20"><p className="text-gray-400 animate-pulse">Consulting the Grimoire...</p></div>
      ) : filteredNpcs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNpcs.map(npc => (
            <div key={npc.id} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full">
              
              {/* Action buttons (Edit & Delete) */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(npc);
                  }}
                  title="Edit NPC"
                  className="text-gray-400 hover:text-grimoire-dark transition-colors bg-white/80 rounded-full p-1 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Hapus ${npc.name} dari catatan grimoire?`)) {
                      deleteNpc(npc.id, activeCampaignId);
                    }
                  }}
                  title="Hapus NPC"
                  className="text-gray-400 hover:text-red-500 transition-colors bg-white/80 rounded-full p-1 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar & Name */}
              <div className="flex items-start gap-4 mb-3">
                <GrimoireAvatar entity={npc} size="md" />
                <div className="pr-12">
                  <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight">{npc.name}</h3>
                  <p className="text-xs text-grimoire-gold font-bold uppercase tracking-wider">{npc.role || 'Commoner'}</p>
                </div>
              </div>

              {/* Disposition Badge & Location */}
              <div className="flex items-center justify-between gap-2 mb-3 pt-1 border-t border-parchment-dark">
                {getDispositionBadge(npc.disposition, npc)}
                {npc.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{npc.location}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              {npc.description && (
                <div 
                  className="mb-3 flex-1 cursor-pointer group/desc relative"
                  onClick={() => setExpandedId(expandedId === npc.id ? null : npc.id)}
                >
                  <p className={`text-sm text-gray-600 transition-all duration-300 italic ${expandedId === npc.id ? '' : 'line-clamp-3'}`}>
                    "{npc.description}"
                  </p>
                  <p className="text-[10px] font-semibold text-grimoire-gold mt-1 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                    {expandedId === npc.id ? 'Tutup deskripsi' : 'Baca selengkapnya...'}
                  </p>
                </div>
              )}

              {/* Traits */}
              {npc.traits && (
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-bold text-grimoire-dark">Traits:</span> {npc.traits}
                </div>
              )}

              {/* Secret (if any) */}
              {npc.secret && (
                <div className="mt-auto pt-2.5 border-t border-parchment-dark bg-amber-50/50 -mx-5 -mb-5 p-3 rounded-b-xl flex items-start gap-2 text-xs text-amber-900 border-t">
                  <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="line-clamp-2"><span className="font-bold">Secret:</span> {npc.secret}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">No NPCs Found</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            The world is currently quiet. Add NPCs manually or use the Arcane Scribe AI to conjure inhabitants for your campaign.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAddOpen(true)}
              className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold text-sm uppercase tracking-widest px-4 py-2.5 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-grimoire-gold" /> Add NPC Manually
            </button>
            <button 
              onClick={onOpenScribe}
              className="border border-parchment-dark hover:border-grimoire-gold text-grimoire-dark font-bold text-sm uppercase tracking-widest px-4 py-2.5 rounded-md flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-grimoire-gold" /> Conjure with AI
            </button>
          </div>
        </div>
      )}
      {/* Modals */}
      <AddNpcModal 
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        activeCampaignId={activeCampaignId}
      />

      <EditNpcModal 
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedNpc(null);
        }}
        npcData={selectedNpc}
        activeCampaignId={activeCampaignId}
      />
    </div>
  );
}