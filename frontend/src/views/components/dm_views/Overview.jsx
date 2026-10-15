import { useState, useEffect } from 'react';
import { Bell, Plus, ChevronDown, ChevronRight, ArrowRight, CheckSquare, Square, MapPin, Trash2 } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase'; 
import PartyCard from '../PartyCard';
// SEMUA IMPORT CONTROLLER DIGABUNG JADI SATU DI SINI
import { createNewCampaign, updateCampaignInfo, addChapterToCampaign } from '../../../controllers/campaignController';
import { addPrepItem, togglePrepItem, deletePrepItem } from '../../../controllers/prepController';
import { deleteChronicle } from '../../../controllers/chronicleController';

export default function Overview({ activeCampaignId, setActiveCampaignId, setActiveView, onOpenAddCharacter, onOpenChronicleModal, onOpenCampaignModal }) {
  // State untuk Dropdown List
  const [campaignList, setCampaignList] = useState([]);
  const [chapterList, setChapterList] = useState([]);
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);

  // State untuk Data Firebase dari Campaign yang Aktif
  const [partyMembers, setPartyMembers] = useState({});
  const [prepItems, setPrepItems] = useState([]);
  const [chronicles, setChronicles] = useState([]);
  const [newPrep, setNewPrep] = useState('');
  const [loadingParty, setLoadingParty] = useState(true);

  // Nilai Default
  const [campaignData, setCampaignData] = useState({
    title: 'Untitled Campaign',
    chapterTitle: 'Untitled Chapter',
    system: '-',
    status: 'Active',
    description: 'Klik Create New Campaign untuk memulai.',
    progress: 0,
    currentLocation: 'Unknown',
    locationDesc: ''
  });

  // 1. Ambil daftar semua kampanye untuk Dropdown Topbar
  useEffect(() => {
    const campaignsRef = ref(db, 'campaigns');
    const unsub = onValue(campaignsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
          id: key,
          title: data[key].info?.title || 'Untitled Campaign',
          chapterTitle: data[key].info?.chapterTitle || 'Untitled Chapter'
        }));
        setCampaignList(list);

        // Auto-select kampanye pertama
        if (!activeCampaignId && list.length > 0) {
          setActiveCampaignId(list[0].id);
        }
      } else {
        setCampaignList([]);
        setActiveCampaignId(null);
      }
    });
    return () => unsub();
  }, [activeCampaignId, setActiveCampaignId]);

  // 2. Ambil isi data dari Kampanye yang dipilih
  useEffect(() => {
    if (!activeCampaignId) {
      setLoadingParty(false);
      return; 
    }

    const infoRef = ref(db, `campaigns/${activeCampaignId}/info`);
    const partyRef = ref(db, `campaigns/${activeCampaignId}/party`);
    const prepRef = ref(db, `campaigns/${activeCampaignId}/quickPrep`);
    const chronRef = ref(db, `campaigns/${activeCampaignId}/chronicles`);
    const chapRef = ref(db, `campaigns/${activeCampaignId}/chapters`);

    const unsubInfo = onValue(infoRef, (snap) => {
      if (snap.exists()) setCampaignData(snap.val());
    });

    const unsubParty = onValue(partyRef, (snap) => {
      setPartyMembers(snap.exists() ? snap.val() : {});
      setLoadingParty(false);
    });

    const unsubPrep = onValue(prepRef, (snap) => {
      if (snap.exists()) setPrepItems(Object.values(snap.val()).sort((a, b) => a.createdAt - b.createdAt));
      else setPrepItems([]);
    });

    const unsubChron = onValue(chronRef, (snap) => {
      if (snap.exists()) setChronicles(Object.values(snap.val()).sort((a, b) => a.createdAt - b.createdAt));
      else setChronicles([]);
    });

    const unsubChap = onValue(chapRef, (snap) => {
      if (snap.exists()) {
        setChapterList(Object.values(snap.val()).sort((a, b) => a.createdAt - b.createdAt));
      } else {
        setChapterList([]);
      }
    });

    return () => { unsubInfo(); unsubParty(); unsubPrep(); unsubChron(); unsubChap(); };
  }, [activeCampaignId]);

  const handleCreateCampaign = async () => {
    const title = prompt("Masukkan nama Campaign Baru:");
    if (title) {
      const newId = await createNewCampaign(title);
      setActiveCampaignId(newId); 
      setShowCampaignMenu(false);
    }
  };

  const handleAddChapter = async () => {
    if (!activeCampaignId) return;
    const title = prompt("Masukkan nama Chapter / Sesi Baru (misal: Sesi 12 - Sarang Naga):");
    if (title) {
      await addChapterToCampaign(activeCampaignId, title);
      await updateCampaignInfo(activeCampaignId, { chapterTitle: title });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* --- TOP BAR NAVIGATION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-6 border-b border-parchment-dark gap-4">
        <div className="flex flex-wrap items-center gap-8">
          
          {/* Campaign Dropdown */}
          <div className="relative">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Campaign</p>
            <div 
              onClick={() => { setShowCampaignMenu(!showCampaignMenu); setShowChapterMenu(false); }}
              className="flex items-center gap-2 text-grimoire-dark hover:text-grimoire-gold transition-colors cursor-pointer"
            >
              <span className="font-serif text-lg uppercase tracking-wide">
                {activeCampaignId ? campaignData.title : 'Untitled Campaign'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCampaignMenu ? 'rotate-180' : ''}`} />
            </div>

            {showCampaignMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-parchment-dark rounded-md shadow-xl z-50 animate-fade-in overflow-hidden">
                {campaignList.map((camp) => (
                  <div 
                    key={camp.id}
                    onClick={() => { setActiveCampaignId(camp.id); setShowCampaignMenu(false); }}
                    className={`px-4 py-3 text-sm font-serif cursor-pointer border-b border-parchment-dark transition-colors ${activeCampaignId === camp.id ? 'bg-parchment font-bold text-grimoire-dark' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    {camp.title}
                  </div>
                ))}
                <div 
                  onClick={handleCreateCampaign}
                  className="px-4 py-3 text-xs font-bold text-grimoire-gold hover:text-white hover:bg-grimoire-dark cursor-pointer uppercase flex items-center gap-2 transition-colors bg-gray-50"
                >
                  <Plus className="w-3 h-3" /> Create New Campaign
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden md:block w-px h-8 bg-parchment-dark"></div>
          
          {/* Chapter Dropdown */}
          <div className="relative">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Current Chapter</p>
            <div 
              onClick={() => { setShowChapterMenu(!showChapterMenu); setShowCampaignMenu(false); }}
              className="flex items-center gap-2 text-grimoire-dark hover:text-grimoire-gold transition-colors cursor-pointer"
            >
              <span className="font-serif text-lg uppercase tracking-wide truncate max-w-xs">
                {activeCampaignId ? campaignData.chapterTitle : 'Untitled Chapter'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showChapterMenu ? 'rotate-180' : ''}`} />
            </div>

            {showChapterMenu && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-parchment-dark rounded-md shadow-xl z-50 animate-fade-in overflow-hidden max-h-60 overflow-y-auto">
                {chapterList.map((chap, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      updateCampaignInfo(activeCampaignId, { chapterTitle: chap.title });
                      setShowChapterMenu(false);
                    }}
                    className="px-4 py-2 text-sm font-serif hover:bg-parchment cursor-pointer border-b border-parchment-dark last:border-0"
                  >
                    {chap.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-6">
          {activeCampaignId && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-parchment-dark rounded-full shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${campaignData.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{campaignData.status}</span>
            </div>
          )}
          
          {/* Tombol Add Chapter */}
          <button 
            onClick={handleAddChapter}
            disabled={!activeCampaignId}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white text-sm font-bold uppercase tracking-wider py-2.5 px-5 rounded flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Chapter
          </button>
        </div>
      </div>
                
      {/* Welcome Text & Date */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">FRIDAY, 16 FROSTWANE</p>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-serif text-4xl text-grimoire-dark uppercase mb-1">Good Evening, Dungeon Master</h2>
            <p className="text-gray-600">The table is set. Here's what awaits your party tonight.</p>
          </div>
          <button 
            onClick={onOpenCampaignModal}
            disabled={!activeCampaignId}
            className="text-sm font-bold text-gray-500 hover:text-grimoire-dark border border-gray-300 rounded px-4 py-2 disabled:opacity-50"
          >
            Edit Campaign
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      {/* Container utama kini menggunakan flex dan p-10 agar otomatis melebar menyesuaikan isi */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-lg group bg-gray-900 min-h-[22rem] flex flex-col justify-center p-8 md:p-10">
        
        <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop" alt="Hero" className="absolute inset-0 w-full h-full object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/80 to-transparent"></div>
        
        {/* Konten menggunakan relative z-10 agar mendorong tinggi container */}
        <div className="relative z-10 flex flex-col justify-center max-w-3xl w-full">
          {/* Campaign Section */}
          <div className="mb-6">
            <p className="text-grimoire-gold text-[10px] font-bold tracking-widest uppercase mb-3">CURRENT CAMPAIGN ({campaignData.system})</p>
            <h1 className="text-4xl md:text-5xl font-serif text-white uppercase leading-tight mb-2">{campaignData.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              {campaignData.campaignDescription || campaignData.description || 'Deskripsi kampanye belum diatur.'}
            </p>
          </div>

          {/* Current Chapter Section */}
          <div className="bg-black/40 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm mb-6 inline-block w-fit min-w-[20rem] max-w-xl shadow-inner">
            <p className="text-grimoire-gold text-[10px] font-bold tracking-widest uppercase mb-1">CURRENT CHAPTER</p>
            <h3 className="font-serif text-xl md:text-2xl text-white uppercase mb-2">{campaignData.chapterTitle}</h3>
            <p className="text-gray-300 text-sm italic">
              {campaignData.chapterDescription || 'Objektif bab ini belum ditentukan. Klik Edit Campaign untuk menambahkannya.'}
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* Tombol Continue memanggil setActiveView('notes') */}
            <button 
              onClick={() => setActiveView('notes')}
              className="bg-parchment hover:bg-white text-grimoire-dark font-bold py-2.5 px-6 rounded transition-colors flex items-center gap-2 text-sm shadow-md"
            >
              Continue session <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:block absolute bottom-6 right-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-xl p-5 w-64 shadow-xl z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Campaign Progress</span>
            <span className="text-xl font-serif text-white">{campaignData.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-grimoire-gold" style={{ width: `${campaignData.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* --- PARTY STATUS SECTION --- */}
      <div className="flex justify-between items-end mb-4 border-b border-parchment-dark pb-2">
        <h3 className="font-serif text-xl tracking-wide uppercase">Party Status</h3>
        <button 
          onClick={onOpenAddCharacter}
          className="text-sm text-gray-500 hover:text-grimoire-dark flex items-center gap-1 transition-colors"
        >
          Manage party <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loadingParty ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm h-32 animate-pulse"></div>
          ))
        ) : Object.keys(partyMembers).length > 0 ? (
          Object.entries(partyMembers).map(([id, character]) => (
            <PartyCard 
              key={id} 
              id={id} 
              character={character} 
              activeCampaignId={activeCampaignId} 
            />
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
            <button 
              onClick={onOpenChronicleModal}
              className="px-4 h-10 rounded border border-parchment-dark flex items-center justify-center hover:border-grimoire-gold hover:text-grimoire-gold transition-colors text-sm font-bold uppercase tracking-wider"
            >
              + New Entry
            </button>
          </div>

          <div className="relative border-l border-parchment-dark ml-3 space-y-8 pb-4">
            {chronicles.length > 0 ? chronicles.map((entry, index) => (
              <div key={entry.id} className="relative pl-8 group">
                <div className={`absolute w-3 h-3 bg-white border-2 rounded-full -left-[6.5px] top-1.5 ring-4 ring-parchment ${index === 0 ? 'border-grimoire-gold' : 'border-gray-400'}`}></div>
                
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Session {entry.sessionNumber} · {new Date(entry.createdAt).toLocaleDateString()}</span>
                    {index === 0 && <span className="text-[10px] bg-grimoire-dark text-white px-2 py-0.5 rounded font-medium">LATEST</span>}
                  </div>
                  <button 
                    onClick={() => { if(window.confirm('Hapus cerita ini?')) deleteChronicle(activeCampaignId, entry.id) }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h4 className="font-serif text-lg font-bold uppercase mb-2 text-grimoire-dark">{entry.title}</h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{entry.description}</p>
              </div>
            )) : (
              <div className="pl-8 text-sm text-gray-400 italic">Tuliskan sejarah awal party Anda...</div>
            )}
          </div>
        </div>

        {/* Quick Prep & Location */}
        <div className="space-y-4">
          <div className="bg-white border border-parchment-dark rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-serif font-bold uppercase tracking-widest text-sm">Tonight's Session</h4>
              <span className="text-xs font-bold text-gray-400">
                {prepItems.filter(item => item.isCompleted).length} / {prepItems.length}
              </span>
            </div>
            
            <h3 className="font-serif text-2xl uppercase mb-6">Quick Prep</h3>
            
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
              {prepItems.length > 0 ? prepItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={item.isCompleted} 
                      onChange={() => togglePrepItem(activeCampaignId, item.id, item.isCompleted)}
                    />
                    {item.isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-grimoire-gold mt-0.5 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 group-hover:text-grimoire-gold mt-0.5 transition-colors shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-grimoire-dark'}`}>
                      {item.text}
                    </span>
                  </label>
                  <button 
                    onClick={() => deletePrepItem(activeCampaignId, item.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-sm text-gray-400 italic">Belum ada persiapan untuk sesi ini.</p>
              )}
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if(newPrep.trim() && activeCampaignId) {
                  addPrepItem(activeCampaignId, newPrep);
                  setNewPrep('');
                }
              }}
              className="flex gap-2 mb-4"
            >
              <input 
                type="text" 
                value={newPrep}
                onChange={(e) => setNewPrep(e.target.value)}
                placeholder="Tambah catatan prep..." 
                className="flex-1 px-3 py-2 text-sm border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold bg-parchment-light"
              />
              <button type="submit" className="bg-grimoire-dark hover:bg-grimoire-light text-white p-2 rounded transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div 
            onClick={onOpenCampaignModal}
            className="bg-white border border-parchment-dark rounded-xl p-5 flex items-center justify-between hover:border-grimoire-gold cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-parchment rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-grimoire-dark" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-grimoire-gold uppercase tracking-wider mb-0.5">Current Location</p>
                <p className="font-serif font-bold text-sm uppercase">{campaignData.currentLocation}</p>
                <p className="text-xs text-gray-500">{campaignData.locationDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}