import { useState, useEffect } from 'react';
import { Bell, Plus, ChevronDown, ChevronRight, ArrowRight, CheckSquare, Square, MapPin, Trash2 } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase'; // Sesuaikan path import db jika perlu
import PartyCard from '../PartyCard';
import { addPrepItem, togglePrepItem, deletePrepItem } from '../../../controllers/prepController';
import { deleteChronicle } from '../../../controllers/chronicleController';

export default function Overview({ onOpenAddCharacter, onOpenChronicleModal, onOpenCampaignModal }) {
  // State untuk Data Firebase
  const [partyMembers, setPartyMembers] = useState({});
  const [loadingParty, setLoadingParty] = useState(true);
  const [prepItems, setPrepItems] = useState([]);
  const [newPrep, setNewPrep] = useState('');
  const [chronicles, setChronicles] = useState([]);
  const [campaignData, setCampaignData] = useState({
    campaignName: 'The Ashen Crown',
    chapterTitle: 'The Drowned Bell',
    description: 'The party has reached the old abbey at last...',
    progress: 68,
    locationName: 'Blackwater Abbey',
    locationDesc: 'Ruined sanctuary · The Greyfen'
  });

  // State untuk Dropdown Menu Top Bar
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  
  // Data dummy untuk dropdown (Nantinya ditarik dari Firebase)
  const availableCampaigns = ['The Ashen Crown', 'Curse of Strahd', 'Shadows of Waterdeep'];
  const availableChapters = ['Session 18', 'Session 19', 'Session 20'];

  // Mengambil data secara Real-time dari Firebase
  useEffect(() => {
    // Listener Party
    const partyRef = ref(db, 'party');
    const unsubParty = onValue(partyRef, (snapshot) => {
      setPartyMembers(snapshot.exists() ? snapshot.val() : {});
      setLoadingParty(false);
    });

    // Listener Quick Prep
    const prepRef = ref(db, 'quickPrep');
    const unsubPrep = onValue(prepRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemsArray = Object.values(snapshot.val()).sort((a, b) => a.createdAt - b.createdAt);
        setPrepItems(itemsArray);
      } else {
        setPrepItems([]);
      }
    });

    // Listener Chronicle
    const chronicleRef = ref(db, 'chronicles');
    const unsubChronicle = onValue(chronicleRef, (snapshot) => {
      if (snapshot.exists()) {
        const chronArray = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setChronicles(chronArray);
      } else {
        setChronicles([]);
      }
    });

    // Listener Active Campaign Status
    const campaignRef = ref(db, 'campaign/active');
    const unsubCampaign = onValue(campaignRef, (snapshot) => {
      if (snapshot.exists()) {
        setCampaignData(snapshot.val());
      }
    });

    return () => {
      unsubParty();
      unsubPrep();
      unsubChronicle();
      unsubCampaign();
    };
  }, []);

  return (
    <div className="animate-fade-in">
      {/* --- TOP BAR NAVIGATION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-6 border-b border-parchment-dark gap-4">
        
        {/* Campaign & Session Selectors */}
        <div className="flex flex-wrap items-center gap-8">
          
          {/* Campaign Dropdown */}
          <div className="relative">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Campaign</p>
            <div 
              onClick={() => {
                setShowCampaignMenu(!showCampaignMenu);
                setShowChapterMenu(false);
              }}
              className="flex items-center gap-2 text-grimoire-dark hover:text-grimoire-gold transition-colors cursor-pointer"
            >
              <span className="font-serif text-lg uppercase tracking-wide">
                {campaignData.campaignName || 'The Ashen Crown'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCampaignMenu ? 'rotate-180' : ''}`} />
            </div>

            {showCampaignMenu && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-parchment-dark rounded-md shadow-xl z-50 animate-fade-in overflow-hidden">
                {availableCampaigns.map((camp, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setCampaignData(prev => ({ ...prev, campaignName: camp }));
                      setShowCampaignMenu(false);
                    }}
                    className="px-4 py-2 text-sm font-serif hover:bg-parchment cursor-pointer border-b border-parchment-dark last:border-0"
                  >
                    {camp}
                  </div>
                ))}
                <div className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-grimoire-dark hover:bg-gray-50 cursor-pointer uppercase flex items-center gap-2">
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
              onClick={() => {
                setShowChapterMenu(!showChapterMenu);
                setShowCampaignMenu(false);
              }}
              className="flex items-center gap-2 text-grimoire-dark hover:text-grimoire-gold transition-colors cursor-pointer"
            >
              <span className="font-serif text-lg uppercase tracking-wide truncate max-w-xs">
                {campaignData.chapterTitle || 'Session 1'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showChapterMenu ? 'rotate-180' : ''}`} />
            </div>

            {showChapterMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-parchment-dark rounded-md shadow-xl z-50 animate-fade-in overflow-hidden">
                {availableChapters.map((chap, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setCampaignData(prev => ({ ...prev, chapterTitle: chap }));
                      setShowChapterMenu(false);
                    }}
                    className="px-4 py-2 text-sm font-serif hover:bg-parchment cursor-pointer border-b border-parchment-dark last:border-0"
                  >
                    {chap}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-parchment-dark rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live session</span>
          </div>

          <button className="relative text-gray-400 hover:text-grimoire-dark transition-colors">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-parchment rounded-full"></div>
          </button>

          <button 
            onClick={onOpenChronicleModal}
            className="bg-grimoire-dark hover:bg-grimoire-light text-white text-sm font-bold uppercase tracking-wider py-2.5 px-5 rounded flex items-center gap-2 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> New entry
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
            className="text-sm font-bold text-gray-500 hover:text-grimoire-dark border border-gray-300 rounded px-4 py-2 transition-colors"
          >
            Edit Status
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-lg group">
        <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop" alt="Campaign Hero" className="w-full h-80 object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent"></div>
        
        <div className="absolute inset-0 p-10 flex flex-col justify-center max-w-2xl">
          <p className="text-grimoire-gold text-xs font-bold tracking-widest uppercase mb-3">CURRENT CHAPTER</p>
          <h1 className="text-4xl md:text-5xl font-serif text-white uppercase leading-tight mb-4">
            {campaignData.chapterTitle}
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            {campaignData.description}
          </p>
          
          <div className="flex gap-4">
            <button className="bg-parchment-light hover:bg-white text-grimoire-dark font-bold py-3 px-6 rounded transition-colors flex items-center gap-2">
              Continue session <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-xl p-5 w-64">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">Campaign Progress</span>
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
                    onClick={() => { if(window.confirm('Hapus cerita ini?')) deleteChronicle(entry.id) }}
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
                      onChange={() => togglePrepItem(item.id, item.isCompleted)} 
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
                    onClick={() => deletePrepItem(item.id)}
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
                if(newPrep.trim()) {
                  addPrepItem(newPrep);
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

            <button className="w-full py-2.5 border border-parchment-dark rounded hover:bg-parchment text-sm font-medium transition-colors">
              Open session notes
            </button>
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
                <p className="font-serif font-bold text-sm uppercase">{campaignData.locationName}</p>
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