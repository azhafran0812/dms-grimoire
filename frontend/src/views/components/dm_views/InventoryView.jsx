import { useState, useEffect } from 'react';
import { 
  Backpack, Search, Plus, Trash2, Shield, Sword, Sparkles, 
  Gem, Package, Minus, Scroll, Edit3, ArrowRightLeft, Coins, 
  UserCheck, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from '../../../firebase';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function InventoryView({ activeChar = null, partyMembers = [], isDmPreview = false, activeCampaignId = null }) {
  // Navigation: 'personal' | 'shared'
  const [activeTab, setActiveTab] = useState('personal');

  // Party state for hero selection if not passed directly
  const [allHeroes, setAllHeroes] = useState(partyMembers);
  const [selectedHeroId, setSelectedHeroId] = useState(activeChar?.id || null);

  // Shared inventory state (/inventory)
  const [sharedItems, setSharedItems] = useState([]);
  
  // Personal inventory state (/party/<id>/inventory)
  const [personalItems, setPersonalItems] = useState([]);
  const [wealth, setWealth] = useState({ cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 });

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetContainer, setTargetContainer] = useState('personal'); // 'personal' | 'shared'

  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('misc');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDesc, setItemDesc] = useState('');

  // 1. Sync party members if not provided
  useEffect(() => {
    if (partyMembers && partyMembers.length > 0) {
      setAllHeroes(partyMembers);
      if (!selectedHeroId) setSelectedHeroId(activeChar?.id || partyMembers[0].id);
    } else {
      const partyPath = activeCampaignId ? `campaigns/${activeCampaignId}/party` : 'party';
      const partyRef = ref(db, partyPath);
      const unsubParty = onValue(partyRef, (snap) => {
        if (snap.exists()) {
          const list = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
          setAllHeroes(list);
          setSelectedHeroId((prev) => prev || list[0]?.id || null);
        } else {
          setAllHeroes([]);
        }
      });
      return () => unsubParty();
    }
  }, [partyMembers, activeChar, activeCampaignId]);

  // Update selectedHeroId when activeChar prop changes
  useEffect(() => {
    if (activeChar?.id) {
      setSelectedHeroId(activeChar.id);
    }
  }, [activeChar]);

  const selectedHero = allHeroes.find((h) => h.id === selectedHeroId) || allHeroes[0] || activeChar;

  // 2. Sync Shared Inventory (/inventory)
  useEffect(() => {
    const invRef = ref(db, 'inventory');
    const unsub = onValue(invRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSharedItems(list);
      } else {
        setSharedItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Sync Personal Inventory for Selected Hero (/party/<id>/inventory)
  useEffect(() => {
    if (!selectedHero?.id) return;

    const heroInvRef = ref(db, `party/${selectedHero.id}/inventory`);
    const unsub = onValue(heroInvRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setWealth(data.wealth || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 });

        const itemsObj = data.items || {};
        const list = Object.entries(itemsObj).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPersonalItems(list);
      } else {
        setPersonalItems([]);
        setWealth({ cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 });
      }
    });

    return () => unsub();
  }, [selectedHero?.id]);

  // Handle Wealth Updates
  const handleWealthChange = async (currency, delta) => {
    if (!selectedHero?.id) return;
    const currentVal = wealth[currency] || 0;
    const newVal = Math.max(0, currentVal + delta);
    await update(ref(db, `party/${selectedHero.id}/inventory/wealth`), {
      [currency]: newVal,
    });
  };

  // Add Item to Personal Backpack or Shared Stash
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      if (targetContainer === 'personal') {
        if (!selectedHero?.id) {
          alert('Pilih karakter terlebih dahulu untuk menambah ke backpack.');
          return;
        }
        const personalItemsRef = ref(db, `party/${selectedHero.id}/inventory/items`);
        const newRef = push(personalItemsRef);
        await set(newRef, {
          id: newRef.key,
          name: itemName.trim(),
          type: itemType,
          quantity: parseInt(itemQuantity) || 1,
          description: itemDesc.trim(),
          ownerId: selectedHero.id,
          ownerName: selectedHero.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        const sharedRef = ref(db, 'inventory');
        const newRef = push(sharedRef);
        await set(newRef, {
          id: newRef.key,
          name: itemName.trim(),
          type: itemType,
          quantity: parseInt(itemQuantity) || 1,
          description: itemDesc.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      setItemName('');
      setItemType('misc');
      setItemQuantity(1);
      setItemDesc('');
      setIsAddOpen(false);
    } catch (err) {
      alert(`Gagal menambah item: ${err.message}`);
    }
  };

  // Quantity adjustments
  const handlePersonalQty = async (item, delta) => {
    if (!selectedHero?.id) return;
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      if (window.confirm(`Item "${item.name}" habis. Hapus dari backpack ${selectedHero.name}?`)) {
        await remove(ref(db, `party/${selectedHero.id}/inventory/items/${item.id}`));
      }
    } else {
      await update(ref(db, `party/${selectedHero.id}/inventory/items/${item.id}`), {
        quantity: newQty,
        updatedAt: Date.now(),
      });
    }
  };

  const handleSharedQty = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      if (window.confirm(`Item "${item.name}" habis. Hapus dari Shared Stash?`)) {
        await remove(ref(db, `inventory/${item.id}`));
      }
    } else {
      await update(ref(db, `inventory/${item.id}`), {
        quantity: newQty,
        updatedAt: Date.now(),
      });
    }
  };

  // Transfer item from Backpack to Shared Stash
  const handleDepositToShared = async (item) => {
    if (!selectedHero?.id) return;
    try {
      // 1. Add to shared inventory
      const sharedRef = ref(db, 'inventory');
      const newRef = push(sharedRef);
      await set(newRef, {
        id: newRef.key,
        name: item.name,
        type: item.type || 'misc',
        quantity: 1,
        description: item.description ? `${item.description} (Deposited by ${selectedHero.name})` : `Deposited by ${selectedHero.name}`,
        depositedBy: selectedHero.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 2. Reduce or remove from personal backpack
      if ((item.quantity || 1) <= 1) {
        await remove(ref(db, `party/${selectedHero.id}/inventory/items/${item.id}`));
      } else {
        await update(ref(db, `party/${selectedHero.id}/inventory/items/${item.id}`), {
          quantity: item.quantity - 1,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      alert(`Gagal memindahkan item: ${err.message}`);
    }
  };

  // Transfer item from Shared Stash to Hero's Backpack
  const handleClaimToPersonal = async (item) => {
    if (!selectedHero?.id) {
      alert('Pilih karakter terlebih dahulu untuk mengklaim item.');
      return;
    }

    try {
      // 1. Add to personal backpack
      const personalItemsRef = ref(db, `party/${selectedHero.id}/inventory/items`);
      const newRef = push(personalItemsRef);
      await set(newRef, {
        id: newRef.key,
        name: item.name,
        type: item.type || 'misc',
        quantity: 1,
        description: item.description || '',
        ownerId: selectedHero.id,
        ownerName: selectedHero.name,
        claimedFromStash: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 2. Reduce or remove from shared inventory
      if ((item.quantity || 1) <= 1) {
        await remove(ref(db, `inventory/${item.id}`));
      } else {
        await update(ref(db, `inventory/${item.id}`), {
          quantity: item.quantity - 1,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      alert(`Gagal mengklaim item: ${err.message}`);
    }
  };

  const getItemIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'weapon': return <Sword className="w-4 h-4 text-red-600" />;
      case 'armor': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'potion': return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'scroll': return <Scroll className="w-4 h-4 text-amber-600" />;
      case 'treasure': return <Gem className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const categories = ['All', 'weapon', 'armor', 'potion', 'scroll', 'treasure', 'misc'];

  const displayedList = activeTab === 'personal' ? personalItems : sharedItems;

  const filteredItems = displayedList.filter((item) => {
    const matchSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || (item.type || '').toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  // Equipped relics from Stylist if available
  const equippedRelics = selectedHero?.aiMeta?.avatar?.items || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-parchment-dark pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Inventory Codex
            </span>
            <span className="bg-grimoire-gold/20 text-grimoire-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-grimoire-gold/30 uppercase">
              {activeTab === 'personal' ? 'Individual Backpack' : 'Shared Party Stash'}
            </span>
          </div>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">
            {activeTab === 'personal'
              ? `${selectedHero?.name || 'Hero'}'s Backpack`
              : 'Shared Party Stash & Loot'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'personal'
              ? `Personal equipment, pouch wealth, and carry capacity for ${selectedHero?.name || 'this adventurer'}.`
              : 'Collective party spoils found in dungeons. Any adventurer can claim items to their backpack.'}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'personal' ? 'Search backpack...' : 'Search party stash...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-dark rounded-md focus:outline-none focus:border-grimoire-gold text-sm"
            />
          </div>

          <button
            onClick={() => {
              setTargetContainer(activeTab);
              setIsAddOpen(true);
            }}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 text-grimoire-gold" />
            {activeTab === 'personal' ? 'Add Item' : 'Add Loot'}
          </button>
        </div>
      </div>

      {/* Hero Switcher (Visible in DM mode or when multiple characters exist) */}
      {allHeroes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Inspect Hero:
          </span>
          {allHeroes.map((hero) => (
            <button
              key={hero.id}
              onClick={() => setSelectedHeroId(hero.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedHero?.id === hero.id
                  ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
                  : 'bg-white border border-parchment-dark text-gray-600 hover:border-grimoire-gold'
              }`}
            >
              <GrimoireAvatar entity={hero} size="xs" border={false} className="w-4 h-4" />
              <span>{hero.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Mode Toggle Pills */}
      <div className="flex items-center gap-2 border-b border-parchment-dark pb-3">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'personal'
              ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-grimoire-dark'
          }`}
        >
          <Backpack className="w-4 h-4" />
          <span>{selectedHero?.name ? `${selectedHero.name}'s Backpack` : 'Personal Backpack'}</span>
          <span className="bg-white/10 px-1.5 py-0.2 rounded-full text-[10px]">{personalItems.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('shared')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'shared'
              ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-grimoire-dark'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Shared Party Stash</span>
          <span className="bg-white/10 px-1.5 py-0.2 rounded-full text-[10px]">{sharedItems.length}</span>
        </button>
      </div>

      {/* Personal Wealth Pouch (Shown in Personal Backpack Mode) */}
      {activeTab === 'personal' && selectedHero && (
        <div className="bg-white border border-parchment-dark rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-parchment-dark pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-grimoire-dark">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Adventurer Coin Pouch</span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">D&D 5e Standard Coinage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'cp', label: 'Copper (CP)', color: 'text-amber-700', bg: 'bg-amber-50' },
              { key: 'sp', label: 'Silver (SP)', color: 'text-slate-600', bg: 'bg-slate-50' },
              { key: 'ep', label: 'Electrum (EP)', color: 'text-cyan-700', bg: 'bg-cyan-50' },
              { key: 'gp', label: 'Gold (GP)', color: 'text-amber-500 font-bold', bg: 'bg-amber-100/50' },
              { key: 'pp', label: 'Platinum (PP)', color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map(({ key, label, color, bg }) => (
              <div key={key} className={`${bg} border border-parchment-dark rounded-xl p-3 text-center`}>
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{label}</span>
                <p className={`font-serif text-2xl ${color}`}>{wealth[key] || 0}</p>
                <div className="flex justify-center gap-1.5 mt-2">
                  <button
                    onClick={() => handleWealthChange(key, -1)}
                    className="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleWealthChange(key, 1)}
                    className="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              filterType.toLowerCase() === cat.toLowerCase()
                ? 'bg-grimoire-dark text-white'
                : 'bg-white border border-parchment-dark text-gray-600 hover:border-grimoire-gold'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><p className="text-gray-400 animate-pulse">Checking inventory pouches...</p></div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm relative group hover:border-grimoire-gold transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-parchment rounded-lg border border-parchment-dark shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-lg uppercase text-grimoire-dark leading-tight">{item.name}</h4>
                      <span className="text-[10px] font-bold text-grimoire-gold uppercase tracking-widest">{item.type || 'Item'}</span>
                    </div>
                  </div>

                  <span className="bg-parchment-light border border-parchment-dark px-2 py-0.5 rounded text-xs font-serif font-bold text-grimoire-dark">
                    x{item.quantity || 1}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-2 mb-4 whitespace-pre-wrap leading-relaxed">
                  {item.description || 'No special lore inscribed.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-parchment-dark flex items-center justify-between gap-2">
                {/* Quantity adjustments */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => activeTab === 'personal' ? handlePersonalQty(item, -1) : handleSharedQty(item, -1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 transition"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity || 1}</span>
                  <button
                    onClick={() => activeTab === 'personal' ? handlePersonalQty(item, 1) : handleSharedQty(item, 1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-emerald-50 hover:text-emerald-600 transition"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Transfer button */}
                {activeTab === 'personal' ? (
                  <button
                    onClick={() => handleDepositToShared(item)}
                    className="px-2.5 py-1 bg-parchment hover:bg-parchment-dark text-grimoire-dark border border-parchment-dark rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition shadow-2xs"
                    title="Deposit to Shared Party Stash"
                  >
                    <ArrowUpFromLine className="w-3 h-3 text-amber-700" />
                    <span>Deposit 🏺</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaimToPersonal(item)}
                    className="px-2.5 py-1 bg-grimoire-dark hover:bg-grimoire-light text-grimoire-gold border border-grimoire-gold/40 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition shadow-2xs"
                    title={`Claim to ${selectedHero?.name || 'Backpack'}`}
                  >
                    <ArrowDownToLine className="w-3 h-3 text-grimoire-gold" />
                    <span>Claim 🎒</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center">
          <Backpack className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="font-serif text-xl text-gray-400 uppercase mb-1">
            {activeTab === 'personal' ? 'Backpack is Empty' : 'Shared Stash is Empty'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mb-4">
            {activeTab === 'personal'
              ? `There are no personal items in ${selectedHero?.name || 'this adventurer'}'s backpack.`
              : 'The party has not stored any collective spoils in the shared chest yet.'}
          </p>
          <button
            onClick={() => {
              setTargetContainer(activeTab);
              setIsAddOpen(true);
            }}
            className="bg-grimoire-dark text-grimoire-gold text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition hover:bg-grimoire-light shadow-sm"
          >
            + Add First Item
          </button>
        </div>
      )}

      {/* Equipped Relics Section (shown in Personal Backpack mode) */}
      {activeTab === 'personal' && equippedRelics.length > 0 && (
        <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm mt-8">
          <div className="flex items-center gap-2 mb-4 border-b border-parchment-dark pb-3">
            <Sparkles className="w-5 h-5 text-grimoire-gold" />
            <div>
              <h3 className="font-serif font-bold text-lg uppercase text-grimoire-dark">Equipped Relics & Formula</h3>
              <p className="text-xs text-gray-500">Currently adorned by {selectedHero?.name} via the Character Stylist.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {equippedRelics.map((rel, rIdx) => (
              <div key={rIdx} className="bg-parchment-light/60 border border-parchment-dark rounded-xl p-3 flex items-center gap-2.5">
                <span className="text-xl shrink-0">{rel.icon || '⚔️'}</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{rel.category || rel.slot}</p>
                  <p className="text-xs font-serif font-bold text-grimoire-dark truncate">{rel.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-parchment-light w-full max-w-md rounded-2xl border border-parchment-dark shadow-2xl p-6">
            <h3 className="font-serif text-2xl uppercase mb-1 text-grimoire-dark">
              {targetContainer === 'personal' ? `Add to ${selectedHero?.name || 'Hero'}'s Backpack` : 'Add Loot to Party Stash'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {targetContainer === 'personal'
                ? `Item will be bound directly to ${selectedHero?.name}'s personal inventory.`
                : 'Item will be placed in the collective shared party stash.'}
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moonlit Dagger, Healing Potion"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-parchment-dark rounded-lg text-sm focus:outline-none focus:border-grimoire-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Category / Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded-lg text-sm font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="potion">Potion / Consumable</option>
                    <option value="scroll">Scroll / Tome</option>
                    <option value="treasure">Treasure / Gem</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded-lg text-sm focus:outline-none focus:border-grimoire-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Description / Properties</label>
                <textarea
                  rows="3"
                  placeholder="e.g. +1 slashing damage, emits faint moonlight glow."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-parchment-dark rounded-lg text-sm focus:outline-none focus:border-grimoire-gold"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-parchment-dark">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-grimoire-dark text-grimoire-gold rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-grimoire-light transition shadow-sm"
                >
                  Store Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
