import { useState, useEffect } from 'react';
import { Backpack, Search, Plus, Trash2, Shield, Sword, Sparkles, Gem, Package, Minus, Scroll } from 'lucide-react';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from '../../../firebase';

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('misc');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDesc, setItemDesc] = useState('');

  useEffect(() => {
    const invRef = ref(db, 'inventory');
    const unsub = onValue(invRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(list);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      const invRef = ref(db, 'inventory');
      const newRef = push(invRef);
      await set(newRef, {
        id: newRef.key,
        name: itemName.trim(),
        type: itemType,
        quantity: parseInt(itemQuantity) || 1,
        description: itemDesc.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setItemName('');
      setItemType('misc');
      setItemQuantity(1);
      setItemDesc('');
      setIsAddOpen(false);
    } catch (err) {
      alert(`Gagal menambah item: ${err.message}`);
    }
  };

  const handleQuantityChange = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      if (window.confirm(`Item "${item.name}" habis. Hapus dari inventaris?`)) {
        await remove(ref(db, `inventory/${item.id}`));
      }
    } else {
      await update(ref(db, `inventory/${item.id}`), {
        quantity: newQty,
        updatedAt: Date.now(),
      });
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Hapus "${item.name}" dari inventaris?`)) {
      await remove(ref(db, `inventory/${item.id}`));
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weapon':
        return <Sword className="w-4 h-4 text-red-600" />;
      case 'armor':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'potion':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'scroll':
        return <Scroll className="w-4 h-4 text-amber-600" />;
      case 'treasure':
        return <Gem className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const categories = ['All', 'weapon', 'armor', 'potion', 'scroll', 'treasure', 'misc'];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || item.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Party Stash & Spoils</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Shared Inventory</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-bold shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" /> Add Loot
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              filterType === cat
                ? 'bg-grimoire-dark text-grimoire-gold'
                : 'bg-white border border-parchment-dark text-gray-600 hover:border-grimoire-gold'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item List / Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <p className="text-gray-400 animate-pulse">Rummaging through the party bags...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col h-full"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-parchment border border-parchment-dark flex items-center justify-center rounded-lg shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="pr-6">
                  <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-grimoire-gold bg-parchment px-2 py-0.5 rounded border border-parchment-dark">
                    {item.type}
                  </span>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 italic mb-4 line-clamp-3 flex-1">
                  "{item.description}"
                </p>
              )}

              {/* Quantity Counter */}
              <div className="mt-auto pt-4 border-t border-parchment-dark flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-parchment hover:bg-parchment-dark border border-parchment-dark text-grimoire-dark transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-grimoire-dark">
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-parchment hover:bg-parchment-dark border border-parchment-dark text-grimoire-dark transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Backpack className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-2">No Loot in Bag</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            The party bag is currently empty. Record newly discovered weapons, scrolls, potions, or treasures.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-grimoire-gold hover:text-grimoire-dark font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-parchment-light w-full max-w-md rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark overflow-hidden p-6">
            <h3 className="font-serif text-2xl uppercase mb-4 text-grimoire-dark">Add Loot to Inventory</h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Moonlit Dagger"
                  className="w-full px-4 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="potion">Potion</option>
                    <option value="scroll">Scroll</option>
                    <option value="treasure">Treasure</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description / Properties</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. Deals +1d4 radiant damage in darkness"
                  className="w-full h-24 p-3 bg-white border border-parchment-dark rounded resize-none focus:outline-none focus:border-grimoire-gold text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-parchment-dark">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-parchment-dark rounded text-sm text-gray-600 hover:bg-parchment transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-grimoire-dark hover:bg-grimoire-light text-white font-bold rounded text-sm transition"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
