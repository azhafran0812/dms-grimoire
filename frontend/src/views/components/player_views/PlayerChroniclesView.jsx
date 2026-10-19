import { BookOpen, Scroll, Sparkles } from 'lucide-react';

export default function PlayerChroniclesView({ chronicles = [], lores = [] }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tales of the Realm</p>
        <h2 className="font-serif text-3xl uppercase text-grimoire-dark">Campaign Chronicles & Lore</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Session Chronicles */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-parchment-dark pb-2">
            <Scroll className="w-5 h-5 text-grimoire-gold" />
            <h3 className="font-serif text-xl uppercase font-bold text-grimoire-dark">
              Session History
            </h3>
          </div>

          {chronicles.length > 0 ? (
            chronicles.map((c) => (
              <div key={c.id} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm hover:border-grimoire-gold transition-colors">
                <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
                  <span className="font-bold text-grimoire-gold uppercase font-serif">Session {c.sessionNumber}</span>
                  <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}</span>
                </div>
                <h4 className="font-serif font-bold text-lg uppercase text-grimoire-dark mb-2">{c.title}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{c.description}</p>
              </div>
            ))
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
              <Scroll className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs italic">No chronicles inscribed yet by the Dungeon Master.</p>
            </div>
          )}
        </div>

        {/* World Lore */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-parchment-dark pb-2">
            <BookOpen className="w-5 h-5 text-grimoire-gold" />
            <h3 className="font-serif text-xl uppercase font-bold text-grimoire-dark">
              Unlocked World Lore
            </h3>
          </div>

          {lores.length > 0 ? (
            lores.map((l) => (
              <div key={l.id} className="bg-white border border-parchment-dark rounded-xl p-5 shadow-sm hover:border-grimoire-gold transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-widest text-grimoire-gold bg-parchment px-2 py-0.5 rounded border border-parchment-dark mb-2 inline-block">
                  {l.category || 'Lore'}
                </span>
                <h4 className="font-serif font-bold text-lg uppercase text-grimoire-dark mb-2">{l.title}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{l.content}</p>
              </div>
            ))
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs italic">No lore uncovered yet in this campaign realm.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
