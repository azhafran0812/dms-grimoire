import { useState, useEffect } from 'react';
import { X, Map } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase'; 
import { updateCampaignInfo } from '../../controllers/campaignController'; 

export default function EditCampaignModal({ isOpen, onClose, activeCampaignId }) {
  const [formData, setFormData] = useState({
    title: '',
    system: '',
    status: '',
    chapterTitle: '',
    campaignDescription: '',
    chapterDescription: '',
    progress: 0,
    currentLocation: '',
    locationDesc: ''
  });
  
  const [availableChapters, setAvailableChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeCampaignId) {
      const campaignRef = ref(db, `campaigns/${activeCampaignId}/info`);
      const chaptersRef = ref(db, `campaigns/${activeCampaignId}/chapters`);

      const unsubInfo = onValue(campaignRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFormData({
            title: data.title || '',
            system: data.system || '',
            status: data.status || 'Active',
            chapterTitle: data.chapterTitle || '',
            // Mengambil description lama sebagai fallback untuk campaignDescription
            campaignDescription: data.campaignDescription || data.description || '',
            chapterDescription: data.chapterDescription || '',
            progress: data.progress || 0,
            currentLocation: data.currentLocation || '',
            locationDesc: data.locationDesc || ''
          });
        }
      });

      const unsubChapters = onValue(chaptersRef, (snapshot) => {
        if (snapshot.exists()) {
          setAvailableChapters(Object.values(snapshot.val()).map(c => c.title));
        } else {
          setAvailableChapters([]);
        }
      });

      return () => { unsubInfo(); unsubChapters(); };
    }
  }, [isOpen, activeCampaignId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeCampaignId) return;

    setLoading(true);
    try {
      await updateCampaignInfo(activeCampaignId, {
        ...formData,
        progress: parseInt(formData.progress) || 0
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-parchment-light w-full max-w-2xl rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-grimoire-dark p-2 rounded">
              <Map className="text-grimoire-gold w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif uppercase">Update Campaign Status</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-grimoire-dark">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Name</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">System</label>
                <input type="text" name="system" value={formData.system} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm">
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Overall Campaign Lore / Description</label>
            <textarea name="campaignDescription" rows="2" required value={formData.campaignDescription} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-parchment-dark pt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Chapter / Session</label>
              <select name="chapterTitle" required value={formData.chapterTitle} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif">
                <option value="" disabled>-- Select Chapter --</option>
                {availableChapters.map((chap, idx) => (
                  <option key={idx} value={chap}>{chap}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Overall Progress (%)</label>
              <input type="number" name="progress" min="0" max="100" required value={formData.progress} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Description / Current Objective</label>
            <textarea name="chapterDescription" rows="2" required value={formData.chapterDescription} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-parchment-dark">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Location (Name)</label>
              <input type="text" name="currentLocation" required value={formData.currentLocation} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Region / Location Note</label>
              <input type="text" name="locationDesc" required value={formData.locationDesc} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm" />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded shadow-md transition-colors">
              {loading ? 'Updating...' : 'Update Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}