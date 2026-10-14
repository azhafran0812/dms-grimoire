import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Overview from '../components/dm_views/Overview';
import NpcView from '../components/dm_views/NPCView';
import PartyView from '../components/dm_views/PartyView';
import LoreView from '../components/dm_views/LoreView';

// Import Modals
import ArcaneScribeModal from '../components/ArcaneScribeModal';
import AddCharacterModal from '../components/AddCharacterModal';
import AddChronicleModal from '../components/AddChronicleModal';
import EditCampaignModal from '../components/EditCampaignModal';
import AddLoreModal from '../components/AddLoreModal';

export default function DashboardDM() {
  // --- STATE NAVIGASI ---
  // Default saat pertama dibuka adalah menu 'overview'
  const [activeView, setActiveView] = useState('overview'); 

  // --- STATE MODALS ---
  const [isScribeOpen, setIsScribeOpen] = useState(false);
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [isChronicleModalOpen, setIsChronicleModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAddLoreOpen, setIsAddLoreOpen] = useState(false);

  return (
    <div className="flex h-screen bg-parchment text-grimoire-dark overflow-hidden font-sans relative">
      
      {/* SIDEBAR */}
      {/* Mengirimkan state activeView agar Sidebar tahu menu mana yang sedang aktif */}
      <Sidebar 
        role="dm" 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenScribe={() => setIsScribeOpen(true)} 
      />

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* --- CONDITIONAL RENDERING BERDASARKAN MENU SIDEBAR --- */}
          
          {activeView === 'overview' && (
            <Overview 
              onOpenAddCharacter={() => setIsAddCharacterOpen(true)}
              onOpenChronicleModal={() => setIsChronicleModalOpen(true)}
              onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
            />
          )}

          {activeView === 'party' && 
          <PartyView/>
          }

          {activeView === 'lore' && (
            <LoreView onOpenAddLore={() => setIsAddLoreOpen(true)} />
          )}

          {activeView === 'npcs' && (
            <NpcView onOpenScribe={() => setIsScribeOpen(true)} />
          )}

          {/* Placeholder untuk menu lain yang belum dibuat */}
          {['inventory', 'notes', 'schedule'].includes(activeView) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
              <h2 className="font-serif text-3xl uppercase mb-2">Under Construction</h2>
              <p className="text-sm">The magic for <span className="font-bold text-grimoire-gold uppercase">{activeView}</span> is still being scribed.</p>
            </div>
          )}

        </main>
      </div>

      {/* --- SEMUA MODALS DILETAKKAN DI SINI --- */}
      {/* Diletakkan di luar struktur <main> agar z-index (tumpukan layer) tidak tertutup elemen lain */}
      
      <ArcaneScribeModal 
        isOpen={isScribeOpen} 
        onClose={() => setIsScribeOpen(false)} 
        campaignName="The Ashen Crown" 
      />
      
      <AddCharacterModal 
        isOpen={isAddCharacterOpen} 
        onClose={() => setIsAddCharacterOpen(false)} 
      />
      
      <AddChronicleModal 
        isOpen={isChronicleModalOpen} 
        onClose={() => setIsChronicleModalOpen(false)} 
      />
      
      <EditCampaignModal 
        isOpen={isCampaignModalOpen} 
        onClose={() => setIsCampaignModalOpen(false)} 
        // Catatan: Jika ingin form ini terisi otomatis dengan data lama, 
        // idealnya EditCampaignModal ini diletakkan di dalam Overview.jsx 
        // agar bisa membaca state campaignData secara langsung.
        currentData={{}} 
      />

      <AddLoreModal 
        isOpen={isAddLoreOpen} 
        onClose={() => setIsAddLoreOpen(false)} 
      />

    </div>
  );
}