import { useState } from 'react';
import { PenTool, X, Sparkles, AlertCircle } from 'lucide-react';
import { auth } from '../../firebase';

export default function ArcaneScribeModal({ isOpen, onClose, campaignName = "The Ashen Crown" }) {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const presets = [
    { id: 'npc', label: 'Mysterious NPC' },
    { id: 'twist', label: 'Story twist' },
    { id: 'lore', label: 'Location lore' },
    { id: 'item', label: 'Magic item' }
  ];

  const handleGenerate = async () => {
    if (!selectedPreset && !prompt) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const token = await auth.currentUser?.getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/npcs/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          preset: selectedPreset || undefined,
          prompt: prompt || undefined,
        }),
      });

      const envelope = await res.json();
      if (!res.ok || !envelope.ok) {
        throw new Error(envelope.error?.message || 'Gagal menghasilkan konten dari Arcane Scribe');
      }

      // Reset form dan tutup modal setelah sukses
      setPrompt('');
      setSelectedPreset('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memanggil AI');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-parchment-light w-full max-w-2xl rounded-lg shadow-2xl relative text-grimoire-dark overflow-hidden">
        
        {/* Tombol Close */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-grimoire-dark border border-transparent hover:border-gray-300 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 flex flex-col items-center">
          {/* Ikon Header */}
          <div className="w-14 h-14 bg-parchment-dark rounded-full flex items-center justify-center mb-6">
            <PenTool className="w-6 h-6 text-grimoire-dark" />
          </div>

          {/* Judul */}
          <div className="text-center mb-8">
            <p className="text-grimoire-gold text-xs font-bold tracking-widest uppercase mb-2">Arcane Scribe</p>
            <h2 className="text-3xl font-serif mb-3 uppercase tracking-wide">What Shall We Create?</h2>
            <p className="text-gray-600 text-sm">
              Generate something tied to {campaignName}, or add your own campaign entry.
            </p>
          </div>

          {/* Grid Preset */}
          <div className="grid grid-cols-2 gap-4 w-full mb-4">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                  selectedPreset === preset.id 
                    ? 'border-grimoire-gold bg-white shadow-sm' 
                    : 'border-parchment-dark bg-transparent hover:border-gray-400'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${selectedPreset === preset.id ? 'text-grimoire-gold' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Prompt Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an idea, secret, or encounter..."
            className="w-full h-32 p-4 bg-white border border-parchment-dark rounded-lg resize-none focus:outline-none focus:border-grimoire-gold focus:ring-1 focus:ring-grimoire-gold mb-6 text-sm"
          />

          {error && (
            <div className="w-full bg-red-100 border border-red-300 text-red-700 px-4 py-2.5 rounded-lg mb-4 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (!selectedPreset && !prompt)}
            className="w-full bg-grimoire-dark hover:bg-grimoire-light text-white font-bold py-3.5 px-4 rounded transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            {isGenerating ? 'Conjuring magic...' : 'Generate with Arcane Scribe'}
          </button>
        </div>
      </div>
    </div>
  );
}