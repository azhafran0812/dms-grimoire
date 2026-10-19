import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { addChronicle } from '../../controllers/chronicleController';

export default function AddChronicleModal({ isOpen, onClose, activeCampaignId }) {
  const [formData, setFormData] = useState({
    title: '',
    sessionNumber: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeCampaignId) {
      alert("Pilih campaign terlebih dahulu di pojok kiri atas!");
      return;
    }

    setLoading(true);
    try {
      await addChronicle(activeCampaignId, formData);
      setFormData({ title: '', sessionNumber: '', description: '' }); // Reset form
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-parchment-light w-full max-w-lg rounded-xl shadow-2xl relative text-grimoire-dark border border-parchment-dark">
        <div className="flex justify-between items-center p-6 border-b border-parchment-dark bg-white/50">
          <div className="flex items-center gap-3">
            <div className="bg-grimoire-dark p-2 rounded">
              <BookOpen className="text-grimoire-gold w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif uppercase">New Chronicle Entry</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-grimoire-dark">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entry Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif" placeholder="Misal: Sarang Sang Naga" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session #</label>
              <input type="number" name="sessionNumber" required value={formData.sessionNumber} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold" placeholder="12" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Story / Event Details</label>
            <textarea name="description" rows="5" required value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold text-sm resize-none" placeholder="Tuliskan apa yang terjadi pada sesi ini..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded">
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}