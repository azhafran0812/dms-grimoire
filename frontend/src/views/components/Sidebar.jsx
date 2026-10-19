import { useState, useEffect } from 'react';
import { LayoutGrid, Users, BookOpen, UserSquare2, Backpack, ScrollText, Calendar, Sparkles, LogOut, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { signOut } from 'firebase/auth';

export default function Sidebar({ role = 'dm', activeView, setActiveView, onOpenScribe }) {
  const navigate = useNavigate();
  const [npcCount, setNpcCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Live count for NPCs badge
  useEffect(() => {
    const npcRef = ref(db, 'campaign/active/npcs');
    const unsub = onValue(npcRef, (snap) => {
      if (snap.exists()) {
        setNpcCount(Object.keys(snap.val()).length);
      } else {
        setNpcCount(0);
      }
    });

    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'player_view', label: 'Player View', icon: Swords },
    { id: 'party', label: 'Party', icon: Users },
    { id: 'lore', label: 'Story & Lore', icon: BookOpen },
    { id: 'npcs', label: 'NPCs', icon: UserSquare2, badge: npcCount > 0 ? String(npcCount) : null },
    { id: 'inventory', label: 'Inventory', icon: Backpack },
    { id: 'notes', label: 'Session Notes', icon: ScrollText },
    { id: 'schedule', label: 'Schedule', icon: Calendar }
  ];

  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || (role === 'dm' ? 'Dungeon Master' : 'Player');
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-grimoire-dark text-parchment flex flex-col h-full border-r border-gray-800 shrink-0 select-none">
      {/* Header Sidebar */}
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className="w-9 h-9 border border-grimoire-gold/50 rounded-lg flex items-center justify-center bg-gray-900/60 shadow-sm">
          <BookOpen className="text-grimoire-gold w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg leading-tight tracking-wider text-white">DM's Grimoire</h1>
          <p className="text-[10px] text-grimoire-gold tracking-widest uppercase">Campaign Companion</p>
        </div>
      </div>

      <div className="px-6 mb-3">
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
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-white/10 text-grimoire-gold shadow-sm font-semibold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-parchment'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-grimoire-gold' : 'text-gray-400'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-grimoire-gold text-grimoire-dark' : 'bg-gray-800 text-gray-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Arcane Scribe AI Button */}
      {role === 'dm' && (
        <div className="p-4">
          <div className="bg-gray-900/60 border border-gray-800 hover:border-grimoire-gold/40 rounded-xl p-4 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-grimoire-gold" />
              <h4 className="font-serif text-xs font-bold text-white uppercase tracking-wider">Arcane Scribe</h4>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">Conjure an NPC, plot twist, or lore that fits your world.</p>
            <button 
              onClick={onOpenScribe}
              className="text-grimoire-gold hover:text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors"
            >
              Open AI Scribe &rarr;
            </button>
          </div>
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-grimoire-gold text-grimoire-dark flex items-center justify-center rounded-full font-serif font-bold text-xs shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate max-w-[110px]">{userDisplayName}</p>
            <p className="text-[10px] text-gray-500 capitalize">{role === 'dm' ? 'Dungeon Master' : 'Player'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out of Grimoire"
          className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}