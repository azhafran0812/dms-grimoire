import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { addChronicle } from '../../controllers/chronicleController';


export default function AddChronicleModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    sessionNumber: '',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addChronicle(formData.sessionNumber, formData.title, formData.description);
      setFormData({ sessionNumber: '', title: '', description: '' });
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
              <BookOpen className="text-grimoire-gold w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif uppercase">Add Story Entry</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-grimoire-dark transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session #</label>
              <input 
                type="number" 
                required 
                min="1"
                value={formData.sessionNumber}
                onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Title</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. The Drowned Bell"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold font-serif"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Story Summary</label>
            <textarea 
              required 
              rows="4"
              placeholder="What happened in this session?"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-parchment-dark rounded focus:outline-none focus:border-grimoire-gold resize-none text-sm"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-parchment-dark">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-2 px-6 rounded disabled:opacity-50">
              {loading ? 'Writing...' : 'Save Chronicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}