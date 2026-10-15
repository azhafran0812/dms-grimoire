import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Overview from '../components/dm_views/Overview';
import NpcView from '../components/dm_views/NPCView';
import PartyView from '../components/dm_views/PartyView';
import LoreView from '../components/dm_views/LoreView';
import InventoryView from '../components/dm_views/InventoryView';
import NotesView from '../components/dm_views/NotesView';

// Import Modals
import ArcaneScribeModal from '../components/ArcaneScribeModal';
import AddCharacterModal from '../components/AddCharacterModal';
import AddChronicleModal from '../components/AddChronicleModal';
import EditCampaignModal from '../components/EditCampaignModal';
import AddLoreModal from '../components/AddLoreModal';

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
        <main className="flex-1 overflow-y-auto p-8">
          
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

          {activeView === 'party' && (
            <PartyView activeCampaignId={activeCampaignId} />
          )}

          {activeView === 'lore' && (
            <LoreView activeCampaignId={activeCampaignId} onOpenAddLore={() => setIsAddLoreOpen(true)} />
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

          {['schedule'].includes(activeView) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
              <h2 className="font-serif text-3xl uppercase mb-2">Under Construction</h2>
              <p className="text-sm">The magic for <span className="font-bold text-grimoire-gold uppercase">{activeView}</span> is still being scribed.</p>
            </div>
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
        activeCampaignId={activeCampaignId} // DIKIRIM KE SINI
      />
      
      <AddChronicleModal 
        isOpen={isChronicleModalOpen} 
        onClose={() => setIsChronicleModalOpen(false)} 
        activeCampaignId={activeCampaignId} // DIKIRIM KE SINI
      />
      
      <EditCampaignModal 
        isOpen={isCampaignModalOpen} 
        onClose={() => setIsCampaignModalOpen(false)} 
        activeCampaignId={activeCampaignId} // DIKIRIM KE SINI
      />

      <AddLoreModal 
        isOpen={isAddLoreOpen} 
        onClose={() => setIsAddLoreOpen(false)} 
      />

    </div>
  );
}