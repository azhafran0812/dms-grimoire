import { 
  LayoutGrid, Users, BookOpen, Skull, Backpack, 
  FileText, Calendar, Sparkles, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar({ role = 'dm', onOpenScribe }) {
  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', active: true },
    { icon: Users, label: 'Party' },
    { icon: BookOpen, label: 'Story & Lore' },
    { icon: Skull, label: 'NPCs', badge: 12 },
    { icon: Backpack, label: 'Inventory' },
    { icon: FileText, label: 'Session Notes' },
    { icon: Calendar, label: 'Schedule' },
  ];

  return (
    <div className="w-64 h-screen bg-grimoire-dark border-r border-gray-800 flex flex-col text-gray-400">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 border border-grimoire-gold/50 rounded flex items-center justify-center">
          <BookOpen className="text-grimoire-gold w-4 h-4" />
        </div>
        <div>
          <h1 className="font-serif text-white text-lg leading-tight">DM'S GRIMOIRE</h1>
          <p className="text-[10px] tracking-widest text-grimoire-gold uppercase">Campaign Companion</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2 text-xs font-semibold tracking-wider uppercase mb-2">The Grimoire</div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button 
            key={index}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              item.active 
                ? 'bg-grimoire-light text-white font-medium' 
                : 'hover:bg-grimoire-light hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Arcane Scribe Button */}
        {role === 'dm' && (
        <div className="p-4 mx-3 mb-4 mt-4 border border-grimoire-gold/20 rounded-xl bg-gradient-to-b from-grimoire-light to-transparent">
          <Sparkles className="w-6 h-6 text-grimoire-gold mb-3" />
          <h3 className="text-white font-serif mb-1">ARCANE SCRIBE</h3>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">Conjure an NPC, plot twist, or lore that fits your world.</p>
          <button 
            onClick={onOpenScribe}
            className="text-grimoire-gold text-sm font-medium flex items-center gap-1 hover:text-white transition-colors"
          >
            Open AI scribe <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800 flex items-center justify-between hover:bg-grimoire-light cursor-pointer transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-grimoire-gold text-grimoire-dark flex items-center justify-center font-bold font-serif">
            TM
          </div>
          <div>
            <p className="text-white text-sm font-medium">Thorne Morrow</p>
            <p className="text-xs text-gray-500">Dungeon Master</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}