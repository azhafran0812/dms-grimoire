import { LayoutGrid, Users, BookOpen, UserSquare2, Backpack, ScrollText, Calendar, Sparkles } from 'lucide-react';

export default function Sidebar({ role, activeView, setActiveView, onOpenScribe }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'party', label: 'Party', icon: Users },
    { id: 'lore', label: 'Story & Lore', icon: BookOpen },
    { id: 'npcs', label: 'NPCs', icon: UserSquare2, badge: '12' },
    { id: 'inventory', label: 'Inventory', icon: Backpack },
    { id: 'notes', label: 'Session Notes', icon: ScrollText },
    { id: 'schedule', label: 'Schedule', icon: Calendar }
  ];

  return (
    <aside className="w-64 bg-grimoire-dark text-parchment flex flex-col h-full border-r border-gray-800">
      {/* Header Sidebar */}
      <div className="p-6 flex items-center gap-3 mb-4">
        <div className="w-8 h-8 border border-grimoire-gold/50 rounded flex items-center justify-center">
          <BookOpen className="text-grimoire-gold w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg leading-tight">DM's Grimoire</h1>
          <p className="text-[10px] text-grimoire-gold tracking-widest uppercase">Campaign Companion</p>
        </div>
      </div>

      <div className="px-6 mb-4">
        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">The Grimoire</p>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-white/10 text-grimoire-gold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-parchment'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Arcane Scribe AI Button */}
      <div className="p-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <Sparkles className="w-6 h-6 text-grimoire-gold mb-3" />
          <h4 className="font-serif text-sm font-bold text-white uppercase mb-1">Arcane Scribe</h4>
          <p className="text-xs text-gray-400 mb-3">Conjure an NPC, plot twist, or lore that fits your world.</p>
          <button 
            onClick={onOpenScribe}
            className="text-grimoire-gold hover:text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
          >
            Open AI scribe &rarr;
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-grimoire-gold text-grimoire-dark flex items-center justify-center rounded-full font-serif font-bold text-sm">
            TM
          </div>
          <div>
            <p className="text-sm font-bold text-white">Thorne Morrow</p>
            <p className="text-xs text-gray-500 capitalize">{role === 'dm' ? 'Dungeon Master' : 'Player'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}