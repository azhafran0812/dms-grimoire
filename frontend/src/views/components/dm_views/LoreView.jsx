import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Trash2, Map as MapIcon, Shield, ScrollText, Gem } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { deleteLore } from '../../../controllers/loreController';

export default function LoreView({ onOpenAddLore }) {
  const [lores, setLores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loreRef = ref(db, 'campaign/active/lore');
    const unsubLore = onValue(loreRef, (snapshot) => {
      if (snapshot.exists()) {
        const loreArray = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setLores(loreArray);
      } else {
        setLores([]);
      }
      setLoading(false);
    });
    return () => unsubLore();
  }, []);

  // Ikon dinamis menggunakan Object Map (Aman dari error switch)
const getCategoryIcon = (category) => {
    if (category === 'Location') {
      return <MapIcon className="w-4 h-4 text-blue-600" />;
    } else if (category === 'Faction') {
      return <Shield className="w-4 h-4 text-red-600" />;
    } else if (category === 'History') {
      return <ScrollText className="w-4 h-4 text-amber-700" />;
    } else if (category === 'Item') {
      return <Gem className="w-4 h-4 text-purple-600" />;
    } else {
      return <BookOpen className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredLores = lores.filter(lore => 
    (filterCategory === 'All' || lore.category === filterCategory) &&
    (lore.title.toLowerCase().includes(searchTerm.toLowerCase()) || lore.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">World Archive</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Story & Lore</h2>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search archive..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>
          <select 
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-parchment-dark rounded-md text-sm font-bold text-gray-600 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Location">Locations</option>
            <option value="Faction">Factions</option>
            <option value="History">History</option>
            <option value="Item">Items</option>
          </select>
          <button 
            onClick={onOpenAddLore}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> Add Lore
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><p className="text-gray-400 animate-pulse">Dusting off the tomes...</p></div>
      ) : filteredLores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLores.map(lore => (
            <div key={lore.id} className="bg-white border border-parchment-dark rounded-xl p-6 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full">
              <button 
                onClick={() => { if(window.confirm('Burn this page from the grimoire?')) deleteLore(lore.id) }}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                {getCategoryIcon(lore.category)}
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lore.category}</span>
              </div>
              <h3 className="font-serif font-bold text-xl uppercase text-grimoire-dark mb-3 leading-tight pr-6">{lore.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 leading-relaxed">{lore.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">The Archive is Empty</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md">Chronicle the world's history, document factions, and note down important locations to keep your campaign rich and immersive.</p>
        </div>
      )}
    </div>
  );
}