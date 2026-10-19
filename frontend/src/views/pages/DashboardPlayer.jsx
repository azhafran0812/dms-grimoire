import { useState, useEffect } from 'react';
import { Swords, LogOut, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { signOut, sendEmailVerification } from 'firebase/auth';
import PlayerView from '../components/player_views/PlayerView';
import GrimoireAvatar from '../components/shared/GrimoireAvatar';

export default function DashboardPlayer() {
  const navigate = useNavigate();

  // Auth & verification state
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [resendStatus, setResendStatus] = useState('');
  const [campaignData, setCampaignData] = useState({});
  const [partyList, setPartyList] = useState([]);

  useEffect(() => {
    // 1. Auth Listener
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const { get } = await import('firebase/database');
          const userSnap = await get(ref(db, `users/${user.uid}/role`));
          if (userSnap.exists()) {
            setUserRole(userSnap.val());
          }
        } catch (e) {
          console.warn('Could not fetch user role:', e);
        }
      } else {
        setUserRole(null);
      }
    });

    // 2. Campaign status
    const campaignRef = ref(db, 'campaign/active');
    const unsubCampaign = onValue(campaignRef, (snapshot) => {
      if (snapshot.exists()) {
        setCampaignData(snapshot.val());
      }
    });

    // 3. Party listener for active hero avatar
    const partyRef = ref(db, 'party');
    const unsubParty = onValue(partyRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.values(snapshot.val());
        setPartyList(list);
      } else {
        setPartyList([]);
      }
    });

    return () => {
      unsubAuth();
      unsubCampaign();
      unsubParty();
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

  const handleResendVerification = async () => {
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
      setResendStatus('Email verifikasi terkirim! Cek kotak masuk Anda.');
    } catch (err) {
      setResendStatus(`Gagal kirim: ${err.message}`);
    }
  };

  const isDM = userRole === 'dm' || userRole === 'dungeon_master';
  
  // Find own character for player, or first hero for DM
  const myHero = isDM 
    ? (partyList[0] || null) 
    : (partyList.find(c => c.ownerEmail === currentUser?.email) || null);

  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || (isDM ? 'Dungeon Master' : 'Adventurer');

  return (
    <div className="min-h-screen bg-parchment text-grimoire-dark font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-grimoire-dark text-parchment border-b border-gray-800 sticky top-0 z-30 shadow-md">
        {/* DM Mode Quick Switch Bar */}
        {isDM && (
          <div className="bg-gradient-to-r from-gray-950 via-grimoire-dark to-gray-950 border-b border-grimoire-gold/30 px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-parchment gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">👑</span>
              <span>
                <strong>Dungeon Master Codex Mode:</strong> You are viewing the live player companion with full campaign permissions.
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard/dm')}
              className="bg-grimoire-gold/20 hover:bg-grimoire-gold/30 text-grimoire-gold border border-grimoire-gold/40 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              Open DM Dashboard &rarr;
            </button>
          </div>
        )}

        {currentUser && !currentUser.emailVerified && (
          <div className="bg-amber-800 text-parchment px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-grimoire-gold shrink-0" />
              <span>Email Akun ({currentUser.email}) belum diverifikasi.</span>
            </div>
            {resendStatus ? (
              <span className="text-emerald-300 font-bold">{resendStatus}</span>
            ) : (
              <button
                onClick={handleResendVerification}
                className="bg-black/40 hover:bg-black/60 text-grimoire-gold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition"
              >
                <Mail className="w-3 h-3" /> Verifikasi Sekarang
              </button>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-grimoire-gold/60 rounded-xl flex items-center justify-center bg-gray-900 shadow-sm">
              <Swords className="text-grimoire-gold w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg text-white tracking-wide">Player's Grimoire</h1>
                <span className="bg-grimoire-gold/20 text-grimoire-gold text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-grimoire-gold/30">
                  {isDM ? 'DM Preview' : 'Player Companion'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Campaign: <span className="text-grimoire-gold font-medium">{campaignData.campaignName || 'The Ashen Crown'}</span> · Chapter: {campaignData.chapterTitle || 'Session 1'}
              </p>
            </div>
          </div>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <GrimoireAvatar
                entity={myHero}
                name={myHero?.name || userDisplayName}
                size="sm"
                border={false}
                className="border border-grimoire-gold"
              />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white leading-tight">
                  {isDM ? `${userDisplayName} (DM)` : (myHero?.name || userDisplayName)}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  {isDM ? 'Dungeon Master' : (myHero ? `${myHero.characterClass || 'Adventurer'} · Hero` : 'Active Player')}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <PlayerView isDmPreview={isDM} />
      </main>
    </div>
  );
}
