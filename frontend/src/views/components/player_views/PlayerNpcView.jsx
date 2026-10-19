import { useState } from 'react';
import { Users, Search, MapPin, HeartHandshake, ShieldAlert, Eye, MessageCircle } from 'lucide-react';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function PlayerNpcView({ npcs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisposition, setFilterDisposition] = useState('All');

  // Players only see non-secret NPCs — secrets are hidden entirely
  // Filter by search and disposition
  const filteredNpcs = npcs.filter(npc => {
    const matchSearch =
      (npc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (npc.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (npc.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDisp = filterDisposition === 'All' || (npc.disposition || 'Neutral') === filterDisposition;
    return matchSearch && matchDisp;
  });

  const getDispositionBadge = (disposition) => {
    const disp = disposition || 'Neutral';
    if (disp === 'Friendly') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          <HeartHandshake className="w-3 h-3 text-emerald-700" />
          <span>Friendly</span>
        </span>
      );
    } else if (disp === 'Hostile') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
          <ShieldAlert className="w-3 h-3 text-red-700" />
          <span>Hostile</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          <Eye className="w-3 h-3 text-amber-700" />
          <span>Neutral</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Known Figures · {npcs.length} Encountered</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Known Characters</h2>
          <p className="text-xs text-gray-500 mt-1">Characters you've encountered during your adventures.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, role, location..."
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
            <option value="All">All Relations</option>
            <option value="Friendly">Friendly</option>
            <option value="Neutral">Neutral</option>
            <option value="Hostile">Hostile</option>
          </select>
        </div>
      </div>

      {/* NPC Grid */}
      {filteredNpcs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNpcs.map(npc => (
            <div key={npc.id} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full">
              
              {/* Avatar & Name */}
              <div className="flex items-start gap-4 mb-3">
                <GrimoireAvatar entity={npc} size="md" />
                <div>
                  <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight">{npc.name}</h3>
                  <p className="text-xs text-grimoire-gold font-bold uppercase tracking-wider">{npc.role || 'Commoner'}</p>
                </div>
              </div>

              {/* Disposition Badge & Location */}
              <div className="flex items-center justify-between gap-2 mb-3 pt-1 border-t border-parchment-dark">
                {getDispositionBadge(npc.disposition)}
                {npc.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{npc.location}</span>
                  </span>
                )}
              </div>

              {/* Description (Player sees description, but NOT secret) */}
              {npc.description && (
                <p className="text-sm text-gray-600 line-clamp-3 flex-1 mb-3 italic">
                  "{npc.description}"
                </p>
              )}

              {/* Traits */}
              {npc.traits && (
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-bold text-grimoire-dark">Traits:</span> {npc.traits}
                </div>
              )}

              {/* Lore snippet (if DM wrote it) */}
              {npc.lore && (
                <div className="mt-auto pt-2.5 border-t border-parchment-dark bg-blue-50/50 -mx-5 -mb-5 p-3 rounded-b-xl flex items-start gap-2 text-xs text-blue-900">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="line-clamp-2"><span className="font-bold">Lore:</span> {npc.lore}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">No Known Characters</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            You haven't encountered any notable characters yet. Continue your adventure to discover the world's inhabitants.
          </p>
        </div>
      )}
    </div>
  );
}
