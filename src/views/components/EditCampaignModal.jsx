import { useState, useEffect } from 'react';
import { X, Map } from 'lucide-react';
import { updateCampaignStatus } from '../../controllers/campaignController';

export default function EditCampaignModal({ isOpen, onClose, currentData }) {
  const [formData, setFormData] = useState({
    campaignName: '',
    chapterTitle: '',
    description: '',
    progress: 0,
    locationName: '',
    locationDesc: ''
  });
  const [loading, setLoading] = useState(false);

  // Isi form dengan data saat ini jika ada
  useEffect(() => {
    if (currentData) {
      setFormData({
        campaignName: currentData.campaignName || '',
        chapterTitle: currentData.chapterTitle || '',
        description: currentData.description || '',
        progress: currentData.progress || 0,
        locationName: currentData.locationName || '',
        locationDesc: currentData.locationDesc || ''
      });
    }
  }, [currentData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCampaignStatus({
        ...formData,
        progress: parseInt(formData.progress)
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark">
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50">
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
            <div>
  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Name</label>
  <input 
    type="text" required value={formData.campaignName || ''}
    onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
    className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
  />
</div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Title</label>
            <input 
              type="text" required value={formData.chapterTitle}
              onChange={(e) => setFormData({...formData, chapterTitle: e.target.value})}
              className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Description</label>
            <textarea 
              rows="3" required value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Progress (%)</label>
            <input 
              type="number" min="0" max="100" required value={formData.progress}
              onChange={(e) => setFormData({...formData, progress: e.target.value})}
              className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-parchment-dark">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Location</label>
              <input 
                type="text" required value={formData.locationName}
                onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Region / Note</label>
              <input 
                type="text" required value={formData.locationDesc}
                onChange={(e) => setFormData({...formData, locationDesc: e.target.value})}
                className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded">
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}