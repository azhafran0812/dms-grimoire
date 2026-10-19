import { useState, useEffect } from 'react';
import { 
  Heart, Users, Backpack, BookOpen, Calendar, 
  Sparkles, Eye, UserSquare2
} from 'lucide-react';
import { db, auth } from '../../../firebase';
import { ref, onValue } from 'firebase/database';

import HeroSheetView from './HeroSheetView';
import PartyFellowshipView from './PartyFellowshipView';
import CharacterStylistView from './CharacterStylistView';
import PlayerChroniclesView from './PlayerChroniclesView';
import PlayerScheduleView from './PlayerScheduleView';
import PlayerNpcView from './PlayerNpcView';
import PlayerCreateCharacterView from './PlayerCreateCharacterView';
import InventoryView from '../dm_views/InventoryView';

export default function PlayerView({ isDmPreview = false }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('hero');

  // Campaign & Party data
  const [allPartyMembers, setAllPartyMembers] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [campaignData, setCampaignData] = useState({});
  const [chronicles, setChronicles] = useState([]);
  const [lores, setLores] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [npcs, setNpcs] = useState([]);

  // Current user for dynamic filtering
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Auth listener
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    // 1. Party Listener
    const partyRef = ref(db, 'party');
    const unsubParty = onValue(partyRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        }));
        setAllPartyMembers(list);
        setSelectedCharId((prev) => prev || list[0]?.id || null);
      } else {
        setAllPartyMembers([]);
      }
    });

    // 2. Campaign status
    const campaignRef = ref(db, 'campaign/active');
    const unsubCampaign = onValue(campaignRef, (snapshot) => {
      if (snapshot.exists()) {
        setCampaignData(snapshot.val());
      }
    });

    // 3. Chronicles
    const chronRef = ref(db, 'chronicles');
    const unsubChron = onValue(chronRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setChronicles(list);
      } else {
        setChronicles([]);
      }
    });

    // 4. Lore
    const loreRef = ref(db, 'campaign/active/lore');
    const unsubLore = onValue(loreRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setLores(list);
      } else {
        setLores([]);
      }
    });

    // 5. Schedule
    const schedRef = ref(db, 'campaign/active/schedule');
    const unsubSched = onValue(schedRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchedule(snapshot.val());
      }
    });

    // 6. NPCs — sync from same path DM uses
    const npcRef = ref(db, 'campaign/active/npcs');
    const unsubNpc = onValue(npcRef, (snapshot) => {
      if (snapshot.exists()) {
        const npcArray = Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...val,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNpcs(npcArray);
      } else {
        setNpcs([]);
      }
    });

    return () => {
      unsubAuth();
      unsubParty();
      unsubCampaign();
      unsubChron();
      unsubLore();
      unsubSched();
      unsubNpc();
    };
  }, []);

  // Dynamic filtering: if player is logged in & not DM preview, filter party members by ownerEmail
  // If no ownerEmail is set on any character, show all (backward compatible)
  const myCharacters = (() => {
    if (!currentUser) return [];
    return allPartyMembers.filter(c => c.ownerEmail === currentUser.email);
  })();

  const partyMembers = (() => {
    if (isDmPreview || !currentUser) return allPartyMembers;
    
    // Check if any character has ownerEmail assigned
    const hasOwnerBinding = allPartyMembers.some(c => c.ownerEmail);
    
    if (!hasOwnerBinding) {
      // No binding exists yet — show all characters (backward compatible)
      return allPartyMembers;
    }
    
    // Show the player's own characters for hero sheet
    return myCharacters.length > 0 ? myCharacters : allPartyMembers;
  })();

  // Detect if the current player needs to create a character
  const needsCharacter = !isDmPreview && currentUser && myCharacters.length === 0;

  const activeChar = partyMembers.find((c) => c.id === selectedCharId) || partyMembers[0];

  const tabs = [
    { id: 'hero', label: 'My Hero Sheet', icon: Heart },
    { id: 'stylist', label: 'Character Stylist', icon: Sparkles },
    { id: 'fellowship', label: 'Fellowship', icon: Users, badge: allPartyMembers.length },
    { id: 'npcs', label: 'Known NPCs', icon: UserSquare2, badge: npcs.length > 0 ? npcs.length : undefined },
    { id: 'inventory', label: 'Inventory & Backpack', icon: Backpack },
    { id: 'chronicles', label: 'Chronicles & Lore', icon: BookOpen },
    { id: 'schedule', label: 'Next Gathering', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* DM Preview Notice (if embedded in DashboardDM) */}
      {isDmPreview && (
        <div className="bg-gradient-to-r from-gray-900 to-grimoire-dark border border-grimoire-gold/40 text-parchment p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-grimoire-gold/20 border border-grimoire-gold/40 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-grimoire-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                  Player View Companion Mode
                </h3>
                <span className="bg-grimoire-gold text-grimoire-dark text-[10px] font-bold px-2 py-0.2 rounded font-sans uppercase">
                  DM Preview
                </span>
              </div>
              <p className="text-xs text-gray-400">
                You are experiencing the live interface exactly as the players see it. All changes will sync live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs text-gray-400">Campaign:</span>
            <span className="text-xs font-bold text-grimoire-gold bg-black/40 px-2.5 py-1 rounded-lg border border-gray-800">
              {campaignData.campaignName || 'The Ashen Crown'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Pills Bar - Sticky & Responsive Wrap with generous clearance */}
      <div className={`sticky ${isDmPreview ? 'top-0' : 'top-[73px]'} z-20 bg-parchment/95 backdrop-blur-md py-3 mb-4`}>
        <div className="bg-white/95 border border-parchment-dark rounded-2xl p-2 shadow-sm flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  isActive
                    ? 'bg-grimoire-dark text-grimoire-gold shadow-sm'
                    : 'text-gray-600 hover:bg-parchment hover:text-grimoire-dark'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-grimoire-gold' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-grimoire-gold text-grimoire-dark' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div className="min-h-[500px] pt-3 sm:pt-5">
        {activeTab === 'hero' && needsCharacter && (
          <PlayerCreateCharacterView
            currentUser={currentUser}
            onCharacterCreated={() => setActiveTab('hero')}
          />
        )}

        {activeTab === 'hero' && !needsCharacter && (
          <HeroSheetView
            partyMembers={partyMembers}
            selectedCharId={selectedCharId}
            onSelectCharId={setSelectedCharId}
            campaignData={campaignData}
            schedule={schedule}
            onNavigateTab={setActiveTab}
            isDmPreview={isDmPreview}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'stylist' && (
          <CharacterStylistView
            partyMembers={partyMembers}
            selectedCharId={selectedCharId}
            onSelectCharId={setSelectedCharId}
          />
        )}

        {activeTab === 'fellowship' && (
          <PartyFellowshipView
            partyMembers={allPartyMembers}
            onSelectHero={setSelectedCharId}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'npcs' && (
          <PlayerNpcView npcs={npcs} />
        )}

        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <InventoryView
              activeChar={activeChar}
              partyMembers={partyMembers}
              isDmPreview={isDmPreview}
            />
          </div>
        )}

        {activeTab === 'chronicles' && (
          <PlayerChroniclesView
            chronicles={chronicles}
            lores={lores}
          />
        )}

        {activeTab === 'schedule' && (
          <PlayerScheduleView
            schedule={schedule}
            activeChar={activeChar}
            partyMembers={partyMembers}
          />
        )}
      </div>
    </div>
  );
}
