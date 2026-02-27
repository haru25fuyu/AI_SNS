import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Heart, Compass, Shield, Zap, User, RefreshCw } from 'lucide-react';
import { chatForOnboarding, extractPersonality, draftBottleMessage } from './services/aiService';

type Message = { role: 'user' | 'ai'; text: string };

export default function App() {
  const [step, setStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { role: 'ai', text: 'はじめまして！Kiaiへようこそ。まずはあなたについて少し教えてください。最近、一番テンションが上がった出来事は何ですか？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [personality, setPersonality] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dashboard state
  const [bottleTopic, setBottleTopic] = useState<'今の気分' | '趣味' | '相談' | '気合'>('今の気分');
  const [draftMode, setDraftMode] = useState<'normal' | 'adventure'>('normal');
  const [bottleInput, setBottleInput] = useState('');
  const [draftedBottle, setDraftedBottle] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [matchedBottle, setMatchedBottle] = useState<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendOnboarding = async () => {
    if (!input.trim()) return;
    
    const newHistory = [...chatHistory, { role: 'user' as const, text: input }];
    setChatHistory(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      // Check if we have enough data (e.g., 3 user messages)
      const userMessages = newHistory.filter(m => m.role === 'user').length;
      
      if (userMessages >= 3) {
        // Extract personality
        const p = await extractPersonality(newHistory);
        setPersonality(p);
        setStep('dashboard');
      } else {
        // Continue chat
        const reply = await chatForOnboarding(newHistory);
        setChatHistory([...newHistory, { role: 'ai', text: reply || 'なるほど！もう少し詳しく聞かせてください。' }]);
      }
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'ai', text: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDraftBottle = async () => {
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

  const simulateMatch = (type: 'mud' | 'gold' | 'rainbow') => {
    // Simulate matching logic based on the prompt
    // 価値観 50% / 性格 50% の等分
    const mockUsers = [
      { name: 'Aさん', similarity: 0.95, text: '最近キャンプにハマってます！自然の中で飲むコーヒーが最高です。', type: 'mud', note: '価値観・性格共に一致' },
      { name: 'Bさん', similarity: 0.10, text: '週末はひたすらFPSゲーム。ランクマでダイヤ目指してます。', type: 'mud', note: '不一致' },
      { name: 'Cさん', similarity: 0.88, text: '読書とカフェ巡りが好きです。おすすめの小説があれば教えてください。', type: 'gold', note: '優良マッチ' },
      { name: 'Dさん', similarity: 0.50, text: 'スカイダイビング最高！次はバンジージャンプに挑戦したい！', type: 'rainbow', note: '価値観は近いが性格は真逆（凸凹コンビ）' },
    ];

    let match;
    if (type === 'mud') {
      match = Math.random() > 0.1 ? mockUsers[0] : mockUsers[1]; // 90% high, 10% low
    } else if (type === 'gold') {
      match = mockUsers[2]; // > 0.85
    } else {
      match = mockUsers[3]; // Furthest vector in personality, but similar values
    }
    
    setMatchedBottle(match);
  };

  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col max-w-2xl mx-auto border-x border-zinc-800">
        <header className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Sparkles className="text-emerald-400" />
          <h1 className="font-bold text-xl tracking-tight">Kiai (仮) - オンボーディング</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center text-sm text-zinc-500 mb-8">
            AIと3〜5往復会話して、あなたの「性格ベクトル」を生成します。
          </div>
          
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-sm' 
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-400 p-3 rounded-2xl rounded-bl-sm flex gap-1">
                <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOnboarding()}
              placeholder="メッセージを入力..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
              disabled={isTyping}
            />
            <button 
              onClick={handleSendOnboarding}
              disabled={isTyping || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-full transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Profile & Rank */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <User size={32} className="text-zinc-950" />
              </div>
              <div>
                <h2 className="text-xl font-bold">あなた</h2>
                <div className="flex items-center gap-1 text-amber-400 text-sm font-medium mt-1">
                  <Shield size={14} />
                  <span>気合ランク: 金 (Gold)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">性格ベクトル</h3>
              {personality && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500 mb-1">要約:</p>
                    <p>{personality.summary}</p>
                  </div>
                  
                  <div>
                    <p className="text-zinc-500 mb-1">中期記憶 (Context):</p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300">
                      {personality.midTermMemory?.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-zinc-500 mb-1">会話の質感:</p>
                    <p>{personality.conversationStyle}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {personality.values?.map((v: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Bottle Creation */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-emerald-400" />
              ボトル作成支援
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              断片的な言葉を入力するだけで、あなたの性格ベクトルに沿った魅力的な文章をAIが代筆します。
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {(['今の気分', '趣味', '相談', '気合'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setBottleTopic(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    bottleTopic === t 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">代筆モード:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDraftMode('normal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    draftMode === 'normal' 
                      ? 'bg-zinc-100 text-zinc-900 shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  通常
                </button>
                <button
                  onClick={() => setDraftMode('adventure')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    draftMode === 'adventure' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Zap size={12} />
                  冒険
                </button>
              </div>
            </div>

            <textarea
              value={bottleInput}
              onChange={(e) => setBottleInput(e.target.value)}
              placeholder="例：最近疲れた、癒やしがほしい..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-emerald-500 mb-4 min-h-[100px] resize-none"
            />
            
            <button
              onClick={handleDraftBottle}
              disabled={isDrafting || !bottleInput.trim()}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isDrafting ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              AIで代筆・提案する
            </button>

            {draftedBottle && (
              <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
                <h4 className="text-xs font-semibold text-emerald-500 mb-2 uppercase tracking-wider">AI Draft</h4>
                <p className="text-zinc-200 whitespace-pre-wrap">{draftedBottle}</p>
                <div className="mt-4 flex justify-end">
                  <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    このボトルを流す
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gacha Matching */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Compass className="text-cyan-400" />
              ガチャ・マッチング
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              あなたの性格ベクトルを基に、海を漂うボトル（他ユーザー）を拾い上げます。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <button 
                onClick={() => simulateMatch('mud')}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex flex-col items-center gap-2 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="text-amber-600" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-zinc-200">泥ボトル</div>
                  <div className="text-xs text-zinc-500 mt-1">類似度高90% / 低10%</div>
                </div>
              </button>

              <button 
                onClick={() => simulateMatch('gold')}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-amber-500/30 rounded-xl flex flex-col items-center gap-2 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="text-amber-400" />
                </div>
                <div className="text-center relative z-10">
                  <div className="font-bold text-amber-400">黄金ボトル</div>
                  <div className="text-xs text-amber-500/70 mt-1">類似度0.85以上確定</div>
                </div>
              </button>

              <button 
                onClick={() => simulateMatch('rainbow')}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-purple-500/30 rounded-xl flex flex-col items-center gap-2 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="text-purple-400" />
                </div>
                <div className="text-center relative z-10">
                  <div className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">虹ボトル</div>
                  <div className="text-xs text-zinc-500 mt-1">最も遠い「尖った人」</div>
                </div>
              </button>
            </div>

            {matchedBottle && (
              <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User size={20} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {matchedBottle.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          matchedBottle.type === 'mud' ? 'border-amber-900/50 text-amber-700' :
                          matchedBottle.type === 'gold' ? 'border-amber-500/50 text-amber-400' :
                          'border-purple-500/50 text-purple-400'
                        }`}>
                          {matchedBottle.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        類似度スコア: {(matchedBottle.similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <button className="text-zinc-500 hover:text-pink-500 transition-colors">
                    <Heart size={20} />
                  </button>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {matchedBottle.text}
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                  <button className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">
                    返信を書く →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
