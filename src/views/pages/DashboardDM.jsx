import { useState, useEffect } from 'react';
import { Bell, Plus, ChevronDown, ChevronRight, ArrowRight, CheckSquare, Square, MapPin } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import Sidebar from '../components/Sidebar';
import PartyCard from '../components/PartyCard';
import ArcaneScribeModal from '../components/ArcaneScribeModal';

export default function DashboardDM() {
  const [isScribeOpen, setIsScribeOpen] = useState(false);
  const [partyMembers, setPartyMembers] = useState({});
  const [loadingParty, setLoadingParty] = useState(true);
  

  // Mengambil data Party secara Real-time dari Firebase
  useEffect(() => {
    const partyRef = ref(db, 'party');
    
    // onValue akan terus mendengarkan perubahan data (WebSockets)
    const unsubscribe = onValue(partyRef, (snapshot) => {
      if (snapshot.exists()) {
        setPartyMembers(snapshot.val());
      } else {
        setPartyMembers({});
      }
      setLoadingParty(false);
    });

    return () => unsubscribe(); // Cleanup listener saat komponen unmount
  }, []);

    return (
    <div className="flex h-screen bg-parchment text-grimoire-dark overflow-hidden font-sans relative">
      {/* Lempar fungsi pembuka modal ke Sidebar */}
      <Sidebar role="dm" onOpenScribe={() => setIsScribeOpen(true)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* ... (TOPBAR DAN HERO BANNER SAMA SEPERTI KODE SEBELUMNYA) ... */}
        {/* Untuk mempersingkat, asumsikan bagian header dan Hero Artwork sama persis dengan sebelumnya */}
        
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* HEADER DAN BANNER HERO DI SINI (seperti kode sebelumnya) */}
          <div className="mb-10 text-xl font-serif">Bagian Atas Dasbor (Banner)</div>

          {/* --- PARTY STATUS SECTION --- */}
          <div className="flex justify-between items-end mb-4 border-b border-parchment-dark pb-2">
            <h3 className="font-serif text-xl tracking-wide uppercase">Party Status</h3>
            <button className="text-sm text-gray-500 hover:text-grimoire-dark flex items-center gap-1 transition-colors">
              Manage party <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {loadingParty ? (
              // Loading Skeleton
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm h-32 animate-pulse"></div>
              ))
            ) : Object.keys(partyMembers).length > 0 ? (
              // Render Data Karakter dari Firebase
              Object.entries(partyMembers).map(([id, character]) => (
                <PartyCard key={id} id={id} character={character} />
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-4">Belum ada karakter yang terdaftar di party.</p>
            )}
          </div>

          {/* --- CAMPAIGN CHRONICLE & QUICK PREP SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Story Timeline */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-grimoire-gold font-bold tracking-widest uppercase mb-1">Campaign Chronicle</p>
                  <h3 className="font-serif text-2xl uppercase">Recent Story</h3>
                </div>
                <button className="w-10 h-10 rounded border border-parchment-dark flex items-center justify-center hover:border-grimoire-gold transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="relative border-l border-parchment-dark ml-3 space-y-8 pb-4">
                {/* Timeline Item 1 */}
                <div className="relative pl-8">
                  <div className="absolute w-3 h-3 bg-white border-2 border-grimoire-gold rounded-full -left-[6.5px] top-1.5 ring-4 ring-parchment"></div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-gray-500">Session 18 · 3 days ago</span>
                    <span className="text-[10px] bg-grimoire-dark text-white px-2 py-0.5 rounded font-medium">LATEST</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold uppercase mb-2">The Bell Beneath Blackwater</h4>
                  <p className="text-gray-600 text-sm">The party followed the drowned bells beneath the abbey and found a passage sealed with the royal crest.</p>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative pl-8">
                  <div className="absolute w-3 h-3 bg-white border-2 border-gray-400 rounded-full -left-[6.5px] top-1.5 ring-4 ring-parchment"></div>
                  <div className="text-xs text-gray-500 mb-1">Session 17 · 2 weeks ago</div>
                  <h4 className="font-serif text-lg font-bold uppercase mb-2">A Bargain in Candlelight</h4>
                  <p className="text-gray-600 text-sm">Lady Veyra offered safe passage through the Ashenwood—for a favor yet unnamed.</p>
                </div>
              </div>
            </div>

            {/* Quick Prep & Location */}
            <div className="space-y-4">
              <div className="bg-white border border-parchment-dark rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif font-bold uppercase tracking-widest text-sm">Tonight's Session</h4>
                  <span className="text-xs font-bold text-gray-400">4 / 6</span>
                </div>
                
                <h3 className="font-serif text-2xl uppercase mb-6">Quick Prep</h3>
                
                <div className="space-y-4 mb-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <CheckSquare className="w-5 h-5 text-grimoire-gold mt-0.5" />
                    <span className="text-sm text-gray-500 line-through">Recap last session</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Square className="w-5 h-5 text-gray-300 group-hover:text-grimoire-gold mt-0.5 transition-colors" />
                    <span className="text-sm font-medium text-grimoire-dark">Review Sister Ilyra</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Square className="w-5 h-5 text-gray-300 group-hover:text-grimoire-gold mt-0.5 transition-colors" />
                    <span className="text-sm font-medium text-grimoire-dark">Choose encounter music</span>
                  </label>
                </div>

                <button className="w-full py-2.5 border border-parchment-dark rounded hover:bg-parchment text-sm font-medium transition-colors">
                  Open session notes
                </button>
              </div>

              {/* Current Location */}
              <div className="bg-white border border-parchment-dark rounded-xl p-5 flex items-center justify-between hover:border-grimoire-gold cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-parchment rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-grimoire-dark" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-grimoire-gold uppercase tracking-wider mb-0.5">Current Location</p>
                    <p className="font-serif font-bold text-sm uppercase">Blackwater Abbey</p>
                    <p className="text-xs text-gray-500">Ruined sanctuary · The Greyfen</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

          </div>
        </main>
      </div>
      {/* Render Modal Arcane Scribe (akan tampil di atas segalanya jika isScribeOpen = true) */}
      <ArcaneScribeModal 
        isOpen={isScribeOpen} 
        onClose={() => setIsScribeOpen(false)} 
        campaignName="The Ashen Crown" 
      />
    </div>
  );
}