import React, { useState } from 'react';
import { MessageSquare, Zap, RefreshCw, Sparkles } from 'lucide-react';
import { draftBottleMessage } from '../../services/aiService';
import { Personality } from '../../types';

interface Props {
  personality: Personality | null;
}

export default function BottleCreator({ personality }: Props) {
  const [bottleTopic, setBottleTopic] = useState<'今の気分' | '趣味' | '相談' | '気合'>('今の気分');
  const [draftMode, setDraftMode] = useState<'normal' | 'adventure'>('normal');
  const [bottleInput, setBottleInput] = useState('');
  const [draftedBottle, setDraftedBottle] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraft = async () => {
    if (!bottleInput.trim() || !personality) return;
    setIsDrafting(true);
    try {
      const draft = await draftBottleMessage(personality, bottleTopic, bottleInput, draftMode);
      setDraftedBottle(draft || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="text-emerald-400" /> ボトル作成支援
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {(['今の気分', '趣味', '相談', '気合'] as const).map(t => (
          <button
            key={t}
            onClick={() => setBottleTopic(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              bottleTopic === t ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">代筆モード:</span>
        <div className="flex gap-2">
          <button onClick={() => setDraftMode('normal')} className={`px-3 py-1 rounded-lg text-xs font-bold ${draftMode === 'normal' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'}`}>通常</button>
          <button onClick={() => setDraftMode('adventure')} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${draftMode === 'adventure' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-zinc-500'}`}>
            <Zap size={12} /> 冒険
          </button>
        </div>
      </div>

      <textarea
        value={bottleInput}
        onChange={(e) => setBottleInput(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 min-h-[100px] mb-4"
        placeholder="例：最近疲れた、癒やしがほしい..."
      />
      
      <button onClick={handleDraft} disabled={isDrafting || !bottleInput.trim()} className="w-full bg-zinc-100 text-zinc-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {isDrafting ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} AIで代筆・提案する
      </button>

      {draftedBottle && (
        <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
          <p className="text-zinc-200 whitespace-pre-wrap text-sm">{draftedBottle}</p>
        </div>
      )}
    </div>
  );
}