import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Trash2, Map as MapIcon, Shield, ScrollText, Gem, Scroll, Sparkles } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { deleteLore } from '../../../controllers/loreController';
import { deleteChronicle } from '../../../controllers/chronicleController';

export default function LoreView({ onOpenAddLore, onOpenChronicleModal, activeCampaignId }) {
  const [activeTab, setActiveTab] = useState('lore'); // 'lore' | 'chronicles'
  const [lores, setLores] = useState([]);
  const [chronicles, setChronicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lore Listener
    const lorePath = activeCampaignId ? `campaigns/${activeCampaignId}/lore` : 'campaign/active/lore';
    const loreRef = ref(db, lorePath);
    const unsubLore = onValue(loreRef, (snapshot) => {
      if (snapshot.exists()) {
        const loreArray = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setLores(loreArray);
      } else {
        setLores([]);
      }
      setLoading(false);
    });

    // 2. Chronicles Listener (Synced with Campaign, Player & Overview)
    const chronPath = activeCampaignId ? `campaigns/${activeCampaignId}/chronicles` : 'chronicles';
    const chronRef = ref(db, chronPath);
    const unsubChron = onValue(chronRef, (snapshot) => {
      if (snapshot.exists()) {
        const chronArray = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setChronicles(chronArray);
      } else {
        setChronicles([]);
      }
    });

    return () => {
      unsubLore();
      unsubChron();
    };
  }, [activeCampaignId]);

  const getCategoryIcon = (category) => {
    if (category === 'Location') return <MapIcon className="w-4 h-4 text-blue-600" />;
    if (category === 'Faction') return <Shield className="w-4 h-4 text-red-600" />;
    if (category === 'History') return <ScrollText className="w-4 h-4 text-amber-700" />;
    if (category === 'Item') return <Gem className="w-4 h-4 text-purple-600" />;
    return <BookOpen className="w-4 h-4 text-gray-600" />;
  };

  const filteredLores = lores.filter(lore => 
    (filterCategory === 'All' || lore.category === filterCategory) &&
    ((lore.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
     (lore.content || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredChronicles = chronicles.filter(c =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-parchment-dark pb-6">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">World Archive & Chronicles</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Story & Lore</h2>
          <p className="text-xs text-gray-500 mt-1">
            Synchronized across all adventurers in real-time. Unlocked lore and session tales appear on player sheets.
          </p>
        </div>
        
        {/* Actions & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'lore' ? 'Search archive...' : 'Search chronicles...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          {activeTab === 'lore' && (
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-parchment-dark rounded-md text-sm font-bold text-gray-600 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Location">Locations</option>
              <option value="Faction">Factions</option>
              <option value="History">History</option>
              <option value="Item">Items</option>
            </select>
          )}

          {activeTab === 'lore' ? (
            <button 
              onClick={onOpenAddLore}
              className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4 text-grimoire-gold" /> Add Lore
            </button>
          ) : (
            <button 
              onClick={onOpenChronicleModal}
              className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4 text-grimoire-gold" /> New Chronicle
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Sub-Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-parchment-dark pb-3">
        <button
          onClick={() => setActiveTab('lore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'lore'
              ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-grimoire-dark'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>World Lore Archive</span>
          <span className="bg-white/10 px-1.5 py-0.2 rounded-full text-[10px]">{lores.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('chronicles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'chronicles'
              ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-grimoire-dark'
          }`}
        >
          <Scroll className="w-4 h-4" />
          <span>Campaign Session Chronicles</span>
          <span className="bg-white/10 px-1.5 py-0.2 rounded-full text-[10px]">{chronicles.length}</span>
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="flex justify-center py-20"><p className="text-gray-400 animate-pulse">Dusting off the tomes...</p></div>
      ) : activeTab === 'lore' ? (
        filteredLores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLores.map(lore => (
              <div key={lore.id} className="bg-white border border-parchment-dark rounded-xl p-6 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full">
                <button 
                  onClick={() => { if(window.confirm('Hapus halaman lore ini dari Grimoire?')) deleteLore(lore.id); }}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Lore"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  {getCategoryIcon(lore.category)}
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lore.category || 'General'}</span>
                </div>
                <h3 className="font-serif font-bold text-xl uppercase text-grimoire-dark mb-3 leading-tight pr-6">{lore.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 leading-relaxed">{lore.content}</p>
                <div className="mt-4 pt-3 border-t border-parchment-dark flex items-center justify-between text-[11px] text-gray-400">
                  <span>Synced to Player Codex</span>
                  <span>{lore.createdAt ? new Date(lore.createdAt).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">The Archive is Empty</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">Chronicle the world's history, document factions, and note down important locations to keep your campaign rich and immersive.</p>
            <button
              onClick={onOpenAddLore}
              className="bg-grimoire-dark text-grimoire-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition hover:bg-grimoire-light"
            >
              + Add First Lore Entry
            </button>
          </div>
        )
      ) : (
        /* Chronicles Tab */
        filteredChronicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChronicles.map(c => (
              <div key={c.id} className="bg-white border border-parchment-dark rounded-xl p-6 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full">
                <button 
                  onClick={() => { if(window.confirm(`Hapus catatan session ${c.sessionNumber}?`)) deleteChronicle(c.id); }}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Chronicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-bold text-grimoire-gold uppercase font-serif">Session {c.sessionNumber}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}</span>
                </div>

                <h3 className="font-serif font-bold text-xl uppercase text-grimoire-dark mb-3 leading-tight pr-6">{c.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 leading-relaxed">{c.description}</p>
                <div className="mt-4 pt-3 border-t border-parchment-dark flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Visible on Player Sheet
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center">
            <Scroll className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">No Session Chronicles Yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">Record your adventure chapters so players can review session recaps anytime.</p>
            <button
              onClick={onOpenChronicleModal}
              className="bg-grimoire-dark text-grimoire-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition hover:bg-grimoire-light"
            >
              + Record First Session Story
            </button>
          </div>
        )
      )}
    </div>
  );
}