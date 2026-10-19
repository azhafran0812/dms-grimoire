import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Overview from '../components/dm_views/Overview';
import NpcView from '../components/dm_views/NPCView';
import PartyView from '../components/dm_views/PartyView';
import LoreView from '../components/dm_views/LoreView';
import InventoryView from '../components/dm_views/InventoryView';
import ScheduleView from '../components/dm_views/ScheduleView';
import NotesView from '../components/dm_views/NotesView';
import PlayerView from '../components/player_views/PlayerView';

// Import Modals
import ArcaneScribeModal from '../components/ArcaneScribeModal';
import AddCharacterModal from '../components/AddCharacterModal';
import AddChronicleModal from '../components/AddChronicleModal';
import EditCampaignModal from '../components/EditCampaignModal';
import AddLoreModal from '../components/AddLoreModal';

import { auth } from '../../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { AlertTriangle, Mail } from 'lucide-react';

export default function DashboardDM() {
  // --- STATE NAVIGASI UTAMA ---
  const [activeView, setActiveView] = useState('overview'); 
  // STATE INI SANGAT PENTING: Untuk melacak ID kampanye yang sedang dibuka
  const [activeCampaignId, setActiveCampaignId] = useState(null); 

  // --- STATE MODALS ---
  const [isScribeOpen, setIsScribeOpen] = useState(false);
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [isChronicleModalOpen, setIsChronicleModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAddLoreOpen, setIsAddLoreOpen] = useState(false);

  // --- AUTH & EMAIL VERIFICATION STATE (Task 8 Gatekeeper) ---
  const [currentUser, setCurrentUser] = useState(null);
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleResendVerification = async () => {
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
      setResendStatus('Email verifikasi baru telah dikirim! Periksa folder inbox / spam Anda.');
    } catch (err) {
      setResendStatus(`Gagal mengirim verifikasi: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-parchment text-grimoire-dark overflow-hidden font-sans relative">
      
      {/* SIDEBAR */}
      <Sidebar 
        role="dm" 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenScribe={() => setIsScribeOpen(true)} 
      />

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Email Verification Banner (Task 8 Gatekeeper) */}
        {currentUser && !currentUser.emailVerified && (
          <div className="bg-amber-800 text-parchment px-6 py-2.5 flex items-center justify-between text-xs font-medium shadow-inner shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-grimoire-gold shrink-0" />
              <span>
                <strong>Perhatian:</strong> Email akun Anda (<span className="text-grimoire-gold">{currentUser.email}</span>) belum diverifikasi. Harap verifikasi untuk keamanan penuh kampanye.
              </span>
            </div>
            <div className="flex items-center gap-3">
              {resendStatus ? (
                <span className="text-emerald-300 font-bold">{resendStatus}</span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  className="bg-black/30 hover:bg-black/50 text-grimoire-gold border border-grimoire-gold/40 px-3 py-1 rounded transition flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Kirim Ulang Email
                </button>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
          
          {/* --- CONDITIONAL RENDERING --- */}
          
          {activeView === 'overview' && (
            <Overview 
              activeCampaignId={activeCampaignId}
              setActiveCampaignId={setActiveCampaignId}
              setActiveView={setActiveView}
              onOpenAddCharacter={() => setIsAddCharacterOpen(true)}
              onOpenChronicleModal={() => setIsChronicleModalOpen(true)}
              onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
            />
          )}

          {activeView === 'player_view' && (
            <PlayerView isDmPreview={true} />
          )}

          {activeView === 'party' && (
            <PartyView activeCampaignId={activeCampaignId} />
          )}

          {activeView === 'lore' && (
            <LoreView 
              activeCampaignId={activeCampaignId} 
              onOpenAddLore={() => setIsAddLoreOpen(true)}
              onOpenChronicleModal={() => setIsChronicleModalOpen(true)}
            />
          )}

          {activeView === 'npcs' && (
            <NpcView activeCampaignId={activeCampaignId} onOpenScribe={() => setIsScribeOpen(true)} />
          )}

          {activeView === 'inventory' && (
            <InventoryView activeCampaignId={activeCampaignId} />
          )}

          {activeView === 'notes' && (
            <NotesView activeCampaignId={activeCampaignId} />
          )}

          {activeView === 'schedule' && (
            <ScheduleView activeCampaignId={activeCampaignId} />
          )}

        </main>
      </div>

      {/* --- SEMUA MODALS --- */}
      
      <ArcaneScribeModal 
        isOpen={isScribeOpen} 
        onClose={() => setIsScribeOpen(false)} 
        campaignName="DM's Grimoire" 
      />
      
      <AddCharacterModal 
        isOpen={isAddCharacterOpen} 
        onClose={() => setIsAddCharacterOpen(false)} 
        activeCampaignId={activeCampaignId}
      />
      
      <AddChronicleModal 
        isOpen={isChronicleModalOpen} 
        onClose={() => setIsChronicleModalOpen(false)} 
        activeCampaignId={activeCampaignId}
      />
      
      <EditCampaignModal 
        isOpen={isCampaignModalOpen} 
        onClose={() => setIsCampaignModalOpen(false)} 
        activeCampaignId={activeCampaignId}
      />

      <AddLoreModal 
        isOpen={isAddLoreOpen} 
        onClose={() => setIsAddLoreOpen(false)} 
        activeCampaignId={activeCampaignId}
      />

    </div>
  );
}