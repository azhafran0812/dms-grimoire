import { Calendar, Clock, MapPin, Users, CheckCircle, HelpCircle, XCircle, Sparkles } from 'lucide-react';
import { updatePlayerRsvp } from '../../../controllers/scheduleController';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function PlayerScheduleView({ 
  schedule = {}, 
  activeChar, 
  partyMembers = [] 
}) {
  const currentRsvp = activeChar?.name ? schedule.rsvp?.[activeChar.name] : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pt-2 sm:pt-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Session Invitation</p>
        <h2 className="font-serif text-3xl uppercase text-grimoire-dark">Next Campaign Gathering</h2>
      </div>

      {/* Main Schedule Card with Thematic Banner Artwork */}
      <div className="bg-white border border-parchment-dark rounded-2xl shadow-md overflow-hidden">
        <div className="relative min-h-[220px] bg-grimoire-dark text-parchment p-8 flex flex-col justify-end overflow-hidden group">
          {/* Background Session Artwork */}
          <img
            src={schedule.imageUrl || '/images/session_catacombs.jpg'}
            alt="Session Artwork"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Atmospheric Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-gray-950/50" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-grimoire-gold text-grimoire-dark text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest font-sans shadow-sm">
                Session {schedule.sessionNumber || 1}
              </span>
              <span className="text-xs font-bold text-grimoire-gold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Upcoming Game Night
              </span>
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold uppercase text-white mb-2 drop-shadow-md">
              {schedule.title || 'Session 19: The Catacombs'}
            </h3>
            <p className="text-sm text-gray-200 max-w-2xl leading-relaxed drop-shadow-sm font-serif italic">
              "{schedule.description || 'Check your inventory, prepare your spells, and join the fellowship for the next game.'}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-parchment-dark bg-parchment-light/40 border-b border-parchment-dark">
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-parchment-dark flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-5 h-5 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Date</p>
              <p className="font-serif font-bold text-sm text-grimoire-dark">
                {schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString() : 'TBA'}
              </p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-parchment-dark flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Time</p>
              <p className="font-serif font-bold text-sm text-grimoire-dark">
                {schedule.scheduledTime || '19:00'} ({schedule.durationHours || 3} Hours)
              </p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-parchment-dark flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-5 h-5 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Realm / Link</p>
              <p className="font-serif font-bold text-sm text-grimoire-dark truncate max-w-xs">
                {schedule.location || 'Discord Voice'}
              </p>
            </div>
          </div>
        </div>

        {/* Player RSVP Action with Hero Avatar */}
        {activeChar ? (
          <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <GrimoireAvatar
                entity={activeChar}
                name={activeChar.name}
                size="md"
                shape="circle"
                className="w-12 h-12 shadow-sm shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Your RSVP Status as <strong className="text-grimoire-dark text-sm">{activeChar.name}</strong>:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    currentRsvp === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : currentRsvp === 'tentative'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : currentRsvp === 'absent'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}>
                    {currentRsvp === 'confirmed' && <CheckCircle className="w-3.5 h-3.5" />}
                    {currentRsvp === 'tentative' && <HelpCircle className="w-3.5 h-3.5" />}
                    {currentRsvp === 'absent' && <XCircle className="w-3.5 h-3.5" />}
                    {currentRsvp ? currentRsvp : 'Pending Response'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updatePlayerRsvp(activeChar.name, 'confirmed')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                  currentRsvp === 'confirmed'
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-400 font-bold'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                ⚔️ Ready (Attending)
              </button>
              <button
                onClick={() => updatePlayerRsvp(activeChar.name, 'tentative')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                  currentRsvp === 'tentative'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                ⏳ Tentative
              </button>
              <button
                onClick={() => updatePlayerRsvp(activeChar.name, 'absent')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                  currentRsvp === 'absent'
                    ? 'bg-red-700 text-white ring-2 ring-red-400 font-bold'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                🛡️ Cannot Attend
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-parchment-light/30 text-center text-xs text-gray-500">
            Select a hero to submit your RSVP attendance.
          </div>
        )}
      </div>

      {/* Fellowship Attendance List with Pixel Portraits */}
      <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-parchment-dark pb-2">
          <Users className="w-4 h-4 text-grimoire-gold" />
          <h4 className="font-serif font-bold text-base uppercase text-grimoire-dark">
            Fellowship Attendance Roster
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {partyMembers.map((member) => {
            const status = schedule.rsvp?.[member.name];
            return (
              <div
                key={member.id}
                className="bg-parchment-light/40 border border-parchment-dark rounded-xl p-3 flex items-center justify-between gap-3 hover:border-grimoire-gold transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GrimoireAvatar
                    entity={member}
                    name={member.name}
                    size="md"
                    shape="circle"
                    className="w-10 h-10 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="font-serif font-bold text-xs sm:text-sm text-grimoire-dark truncate">{member.name}</h5>
                    <p className="text-[10px] text-gray-500 font-medium">{member.race ? `${member.race} · ` : ''}{member.characterClass || 'Fighter'}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                  status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : status === 'tentative'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : status === 'absent'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                }`}>
                  {status === 'confirmed' ? 'Ready' : status === 'tentative' ? 'Maybe' : status === 'absent' ? 'Absent' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
