import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, XCircle, Edit, Sparkles } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../firebase';
import { updateSchedule, updatePlayerRsvp, defaultSchedule } from '../../../controllers/scheduleController';
import GrimoireAvatar from '../shared/GrimoireAvatar';

export default function ScheduleView() {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [partyMembers, setPartyMembers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(defaultSchedule);
  const [countdown, setCountdown] = useState('');

  // Fetch Schedule & Party from Firebase
  useEffect(() => {
    const schedRef = ref(db, 'campaign/active/schedule');
    const unsubSched = onValue(schedRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setSchedule(val);
        setEditForm(val);
      } else {
        // Initialize if not present
        setSchedule(defaultSchedule);
        setEditForm(defaultSchedule);
      }
    });

    const partyRef = ref(db, 'party');
    const unsubParty = onValue(partyRef, (snapshot) => {
      if (snapshot.exists()) {
        setPartyMembers(Object.values(snapshot.val()));
      } else {
        setPartyMembers([]);
      }
    });

    return () => {
      unsubSched();
      unsubParty();
    };
  }, []);

  // Live countdown calculation
  useEffect(() => {
    if (!schedule.scheduledDate || !schedule.scheduledTime) return;

    const calculateCountdown = () => {
      const target = new Date(`${schedule.scheduledDate}T${schedule.scheduledTime}:00`);
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('SESSION TIME IS NOW! Ready your dice!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m until the gathering`);
      } else {
        setCountdown(`${hours}h ${minutes}m until the gathering`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);
    return () => clearInterval(interval);
  }, [schedule.scheduledDate, schedule.scheduledTime]);

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      await updateSchedule(editForm);
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRsvpChange = async (charName, status) => {
    try {
      await updatePlayerRsvp(charName, status);
    } catch (err) {
      console.error(err);
    }
  };

  // Get RSVP status icon & label
  const renderRsvpBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Ready (Attending)
          </span>
        );
      case 'tentative':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Tentative
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
            Pending RSVP
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Campaign Chronometer</p>
          <h2 className="font-serif text-3xl text-grimoire-dark uppercase">Session Schedule</h2>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="bg-grimoire-dark hover:bg-grimoire-light text-white px-4 py-2.5 rounded-md transition-colors flex items-center gap-2 text-sm font-bold shadow-md"
        >
          <Edit className="w-4 h-4 text-grimoire-gold" /> Reschedule Session
        </button>
      </div>

      {/* Hero Session Card */}
      <div className="bg-white border border-parchment-dark rounded-2xl shadow-md overflow-hidden relative">
        <div className="relative min-h-[220px] bg-grimoire-dark text-parchment p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden group">
          {/* Background Session Artwork */}
          <img
            src={schedule.imageUrl || '/images/session_catacombs.jpg'}
            alt="Session Artwork"
            className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-gray-950/60" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-grimoire-gold text-xs font-bold tracking-widest uppercase mb-2">
              <Sparkles className="w-4 h-4" /> Upcoming Game Night · Session {schedule.sessionNumber || 1}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-wide text-white leading-tight drop-shadow-md">
              {schedule.title || 'Untitled Gathering'}
            </h1>
            <p className="text-gray-200 text-sm mt-2 max-w-xl font-serif italic drop-shadow-sm">
              "{schedule.description || 'Prepare your spell slots and weapons for the next phase of the campaign.'}"
            </p>
          </div>

          <div className="relative z-10 bg-gray-900/90 border border-gray-700 backdrop-blur-xs rounded-xl p-5 shrink-0 text-center md:text-right shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-grimoire-gold block mb-1">Count of Days</span>
            <span className="font-serif text-lg font-bold text-white block">
              {countdown || 'Scheduling in progress...'}
            </span>
          </div>
        </div>

        {/* Date, Time & Venue Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-parchment-dark bg-parchment-light/40 border-b border-parchment-dark">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-parchment border border-parchment-dark rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</p>
              <p className="font-serif font-bold text-lg text-grimoire-dark">
                {schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'To Be Announced'}
              </p>
            </div>
          </div>

          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-parchment border border-parchment-dark rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time & Duration</p>
              <p className="font-serif font-bold text-lg text-grimoire-dark">
                {schedule.scheduledTime || '19:00'} ({schedule.durationHours || 3} Hours)
              </p>
            </div>
          </div>

          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-parchment border border-parchment-dark rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-grimoire-dark" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Meeting Realm</p>
              <p className="font-serif font-bold text-base text-grimoire-dark truncate max-w-xs">
                {schedule.location || 'Discord / Local Table'}
              </p>
            </div>
          </div>
        </div>

        {/* DM Secret Notes section */}
        {schedule.dmNotes && (
          <div className="p-6 bg-amber-50/40 border-b border-parchment-dark">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Dungeon Master Scribe Note</p>
            <p className="text-sm text-gray-700 italic">"{schedule.dmNotes}"</p>
          </div>
        )}
      </div>

      {/* Party RSVP & Roll Call */}
      <div className="bg-white border border-parchment-dark rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-parchment border border-parchment-dark rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-grimoire-dark" />
            </div>
            <div>
              <h3 className="font-serif text-xl uppercase font-bold text-grimoire-dark">Party Roll Call & RSVP</h3>
              <p className="text-xs text-gray-500">Confirm hero attendance before commencing the session.</p>
            </div>
          </div>
        </div>

        {partyMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partyMembers.map((member) => {
              const rsvpStatus = schedule.rsvp?.[member.name] || 'pending';
              return (
                <div
                  key={member.id}
                  className="bg-parchment-light/30 border border-parchment-dark rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <GrimoireAvatar
                        entity={member}
                        name={member.name}
                        size="md"
                        shape="circle"
                        className="w-10 h-10 shadow-xs shrink-0"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-base uppercase text-grimoire-dark">{member.name}</h4>
                        <p className="text-xs text-gray-500">{member.race} · {member.characterClass} (Lvl {member.level || 1})</p>
                      </div>
                    </div>
                    {renderRsvpBadge(rsvpStatus)}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-parchment-dark">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set:</span>
                    <button
                      onClick={() => handleRsvpChange(member.name, 'confirmed')}
                      className={`text-xs px-2 py-1 rounded transition ${rsvpStatus === 'confirmed' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-parchment text-gray-600'}`}
                    >
                      ⚔️ Ready
                    </button>
                    <button
                      onClick={() => handleRsvpChange(member.name, 'tentative')}
                      className={`text-xs px-2 py-1 rounded transition ${rsvpStatus === 'tentative' ? 'bg-amber-500 text-white font-bold' : 'hover:bg-parchment text-gray-600'}`}
                    >
                      ⏳ Maybe
                    </button>
                    <button
                      onClick={() => handleRsvpChange(member.name, 'absent')}
                      className={`text-xs px-2 py-1 rounded transition ${rsvpStatus === 'absent' ? 'bg-red-500 text-white font-bold' : 'hover:bg-parchment text-gray-600'}`}
                    >
                      🛡️ Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No party members registered yet.</p>
        )}
      </div>

      {/* Edit Schedule Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark my-8 overflow-hidden">
            <div className="p-6 border-b border-parchment-dark bg-white/50 flex justify-between items-center">
              <h3 className="font-serif text-2xl uppercase">Reschedule Session</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-grimoire-dark">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session #</label>
                  <input
                    type="number"
                    required
                    value={editForm.sessionNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, sessionNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.scheduledDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editForm.scheduledTime || ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editForm.durationHours || 3}
                    onChange={(e) => setEditForm({ ...editForm, durationHours: parseFloat(e.target.value) || 3 })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meeting Realm / Place</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session Synopsis & Goals</label>
                <textarea
                  rows="3"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase mb-1">DM Prep Reminders (Secret)</label>
                <input
                  type="text"
                  value={editForm.dmNotes || ''}
                  onChange={(e) => setEditForm({ ...editForm, dmNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded focus:outline-none focus:border-grimoire-gold text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded"
                >
                  Confirm Gathering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
