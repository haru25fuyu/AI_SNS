import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { chatForOnboarding, extractPersonality } from '../../services/aiService';
import { Message, Personality } from '../../types';

interface Props {
  onComplete: (p: Personality) => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { role: 'ai', text: 'はじめまして！Kiaiへようこそ。まずはあなたについて少し教えてください。最近、一番テンションが上がった出来事は何ですか？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newHistory = [...chatHistory, { role: 'user' as const, text: input }];
    setChatHistory(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      const userMessages = newHistory.filter(m => m.role === 'user').length;
      if (userMessages >= 3) {
        const p = await extractPersonality(newHistory);
        onComplete(p);
      } else {
        const reply = await chatForOnboarding(newHistory);
        setChatHistory([...newHistory, { role: 'ai', text: reply || 'なるほど！' }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col max-w-2xl mx-auto border-x border-zinc-800">
      <header className="p-4 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="text-emerald-400" />
        <h1 className="font-bold text-xl tracking-tight">Kiai - オンボーディング</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 rounded-br-sm' : 'bg-zinc-800 rounded-bl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-zinc-500 animate-pulse">AIが思考中...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-zinc-800 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-zinc-900 rounded-full px-4 py-2 outline-none" placeholder="メッセージを入力..." />
        <button onClick={handleSend} className="bg-emerald-600 p-2 rounded-full"><Send size={20} /></button>
      </div>
    </div>
  );
}