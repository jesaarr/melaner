'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Palette, Trash2, MessageCircle, Send, Plus, Lock, Check, Clock, BarChart3, Trophy, Star, Image as ImageIcon, Upload, Loader2, Heart } from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, query, orderBy, limit, deleteDoc, setDoc } from "firebase/firestore";
import SanatOdasi from '@/components/SanatOdasi';
import SinemaSalonu from '@/components/SinemaSalonu';
import ZamanKapsulu from '@/components/ZamanKapsulu';

const Dashboard = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get('user');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(user === 'mert' ? 'blue' : 'pink');
  const [activeTab, setActiveTab] = useState('tarihler');
  
  const [isYogiActive, setIsYogiActive] = useState(false);
  const [yogiMessages, setYogiMessages] = useState<{role: string, text: string}[]>([]);
  const [yogiInput, setYogiInput] = useState('');
  const [yogiRequest, setYogiRequest] = useState('');
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [isYogiTyping, setIsYogiTyping] = useState(false);

  const [stats, setStats] = useState({ mert: 0, melek: 0, love: 0, mertXP: 0, melekXP: 0, mertMsg: 0, melekMsg: 0 });
  const [messages, setMessages] = useState<any[]>([]);
  const [generalItems, setGeneralItems] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newGeneralText, setNewGeneralText] = useState('');
  const [generalType, setGeneralType] = useState<'like' | 'dislike'>('like');
  const [boxColor, setBoxColor] = useState('#a78bfa');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [password, setPassword] = useState('');

  // GALERİ STATE'LERİ
  const [galeriResimleri, setGaleriResimleri] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const dates = {
    tanisma: new Date('2025-10-10'),
    melekDogum: new Date('2011-02-15'),
    mertDogum: new Date('2009-04-21'),
    acilma: new Date('2025-12-14'),
    cikma: new Date('2026-01-05')
  };

  const [now, setNow] = useState(new Date());

  const themes: any = {
    pink: 'from-slate-950 via-pink-950/20 to-slate-950', 
    blue: 'from-slate-950 via-blue-950/20 to-slate-950',
    purple: 'from-slate-950 via-purple-950/20 to-slate-950', 
    orange: 'from-slate-950 via-orange-950/20 to-slate-950', 
    green: 'from-slate-950 via-green-950/20 to-slate-950'
  };

  useEffect(() => {
    const unsubStats = onSnapshot(doc(db, "stats", "ozlem"), (docSnap) => {
      if (docSnap.exists()) setStats(docSnap.data() as any);
    });
    onSnapshot(query(collection(db, "mektuplar"), orderBy("timestamp", "desc")), (s) => {
      setMessages(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(query(collection(db, "genel"), orderBy("timestamp", "desc")), (s) => {
      setGeneralItems(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(query(collection(db, "galeri"), orderBy("timestamp", "desc")), (s) => {
      setGaleriResimleri(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (user === 'mert') {
      onSnapshot(query(collection(db, "talepler"), orderBy("timestamp", "desc"), limit(5)), (s) => {
        setReceivedRequests(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => { unsubStats(); clearInterval(interval); };
  }, [user]);

  // XP SİSTEMİ
  const addXP = async (amount: number) => {
    const field = user === 'mert' ? 'mertXP' : 'melekXP';
    await updateDoc(doc(db, "stats", "ozlem"), { [field]: increment(amount) });
  };

  const getLevelInfo = (xp: number) => {
    if (xp < 100) return { level: 1, rank: 'Yeni Tanışanlar', color: 'text-amber-500', icon: '🤎', next: 100 };
    if (xp < 500) return { level: 2, rank: 'Sırılsıklam Aşıklar', color: 'text-slate-400', icon: '🥈', next: 500 };
    if (xp < 1000) return { level: 3, rank: 'Ruh Öküzleri', color: 'text-yellow-400', icon: '💛', next: 1000 };
    return { level: 4, rank: 'Ebedi Bağ', color: 'text-purple-400', icon: '💜', next: 5000 };
  };

  // HANDLERS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, "galeri"), { url: previewUrl, sender: user, timestamp: Date.now() });
      setPreviewUrl(null);
      addXP(50);
    } catch (e) { alert("Hata oluştu!"); }
    finally { setIsUploading(false); }
  };

  const handleYogiChat = async () => {
    if (!yogiInput.trim() || isYogiTyping) return;
    const currentInput = yogiInput;
    setYogiMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setYogiInput('');
    setIsYogiTyping(true);
    try {
      const API_KEY = process.env.NEXT_PUBLIC_YOGI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Sen Mert ve Melek'in kedisi Yogi'sin. Şirin, bazen miyavlayan bir dille cevap ver. Kullanıcı: ${currentInput}` }] }] })
      });
      const data = await response.json();
      setYogiMessages(prev => [...prev, { role: 'bot', text: data.candidates[0].content.parts[0].text }]);
    } catch (error) {
      setYogiMessages(prev => [...prev, { role: 'bot', text: "Miyav! Devrelerim ısındı... 🐾" }]);
    } finally { setIsYogiTyping(false); }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await addDoc(collection(db, "mektuplar"), { from: user, to: user === 'mert' ? 'melek' : 'mert', message: newMessage, timestamp: new Date().toISOString() });
      await updateDoc(doc(db, "stats", "ozlem"), { [user === 'mert' ? 'mertMsg' : 'melekMsg']: increment(1) });
      setNewMessage('');
      addXP(20);
    }
  };

  const calculateTimeElapsed = (targetDate: Date) => {
    const diff = now.getTime() - targetDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}g ${hours}s ${mins}d ${secs}s`;
  };

  return (
    <div className={`min-h-screen p-8 bg-gradient-to-br ${themes[themeColor]} transition-colors duration-1000 text-gray-100`}>
      
      {/* FIXED BUTTONS */}
      <button onClick={() => setIsSettingsOpen(true)} className="fixed top-6 left-6 p-3 bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg z-[60] border border-white/10 hover:bg-slate-700 transition-all"><Settings size={22} /></button>
      <button onClick={() => setIsYogiActive(true)} className="fixed bottom-6 right-6 p-4 bg-pink-600 text-white rounded-full shadow-2xl z-[60] hover:scale-110 transition-all"><MessageCircle size={24} /></button>

      {/* AYARLAR SIDEBAR */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 h-full w-80 bg-slate-900 shadow-2xl z-[80] p-6 text-white border-r border-white/10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic tracking-tighter">AYARLAR</h2><button onClick={() => setIsSettingsOpen(false)}><X /></button></div>
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Tema</p>
                    <div className="flex gap-2">
                      {['pink', 'blue', 'purple', 'orange', 'green'].map(c => (
                        <button key={c} onClick={() => setThemeColor(c)} className={`w-8 h-8 rounded-full ${themeColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`} style={{ background: c === 'pink' ? '#f472b6' : c === 'blue' ? '#60a5fa' : c === 'purple' ? '#a78bfa' : c === 'orange' ? '#fb923c' : '#4ade80' }} />
                      ))}
                    </div>
                  </div>
                  {user === 'melek' ? (
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Star size={14}/> Mert'ten İste</p>
                      <textarea value={yogiRequest} onChange={(e) => setYogiRequest(e.target.value)} placeholder="İsteğin..." className="w-full text-sm border-none rounded-xl p-3 bg-slate-800 text-white outline-none mb-2" rows={3} />
                      <button onClick={async () => { if(yogiRequest.trim()){ await addDoc(collection(db, "talepler"), { from: user, text: yogiRequest, timestamp: new Date().toISOString() }); setYogiRequest(''); alert('İletildi!'); } }} className="w-full py-2 bg-white text-black rounded-xl text-sm font-bold">Gönder</button>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Trophy size={14}/> Melek'in İstekleri</p>
                      <div className="space-y-2">
                        {receivedRequests.map(r => (
                          <div key={r.id} className="p-3 bg-blue-900/30 rounded-xl border border-blue-500/30 relative group">
                            <p className="text-xs text-blue-200">{r.text}</p>
                            <button onClick={async () => await deleteDoc(doc(db, "talepler", r.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400"><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* YOGI CHAT */}
      <AnimatePresence>
        {isYogiActive && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-24 right-6 w-80 h-[450px] bg-slate-900 rounded-[32px] shadow-2xl z-[100] flex flex-col border border-white/10 overflow-hidden">
            <div className="bg-pink-600 p-5 text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-2"><MessageCircle size={20}/> Yogi AI</span>
              <button onClick={() => setIsYogiActive(false)}><X size={18}/></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-950/50">
              {yogiMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-pink-600 text-white ml-auto rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none'}`}>{m.text}</div>
              ))}
              {isYogiTyping && <div className="text-[10px] text-pink-400 italic animate-pulse">Yogi yazıyor... 🐾</div>}
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/10 flex gap-2">
              <input value={yogiInput} onChange={(e) => setYogiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleYogiChat()} className="flex-1 text-sm bg-slate-800 text-white rounded-full px-4 py-2 outline-none" placeholder="Miyav?" />
              <button onClick={handleYogiChat} className="p-2 bg-pink-600 text-white rounded-full"><Send size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="max-w-6xl mx-auto mb-12 mt-16 flex flex-wrap justify-center gap-3">
        {['tarihler', 'mektuplar', 'ozlem', 'istatistik', 'genel', 'dosyalar', 'sanat', 'sinema', 'kapsul'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === tab ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105' : 'bg-slate-800/60 text-gray-300 hover:bg-slate-700 border border-white/5'}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* TARIHLER */}
        {activeTab === 'tarihler' && (
          <motion.div key="tarihler" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'İlk Tanışma', date: '10/10/2025', color: 'pink', val: dates.tanisma },
              { title: 'Açılma Tarihi', date: '14/12/2025', color: 'orange', val: dates.acilma },
              { title: 'Sevgili Olma', date: '05/01/2026', color: 'red', val: dates.cikma, span: true, highlight: true },
              { title: 'Melek Doğum', date: '15/02/2011', color: 'blue', val: dates.melekDogum },
              { title: 'Mert Doğum', date: '21/04/2009', color: 'green', val: dates.mertDogum }
            ].map((d, i) => (
              <div key={i} className={`bg-slate-900/80 p-6 rounded-3xl border-t-4 border-${d.color}-500 ${d.span ? 'md:col-span-2' : ''} border border-white/5 shadow-xl`}>
                <div className="flex justify-between">
                  <div><h3 className={`text-${d.color}-400 font-black text-[10px] tracking-widest uppercase mb-1`}>{d.title}</h3><p className="text-2xl font-black">{d.date}</p></div>
                  {d.highlight && <Heart className="text-red-500 fill-red-500 animate-bounce" />}
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl mt-4 font-mono text-xs text-gray-300">⌛ {calculateTimeElapsed(d.val)}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ISTATISTIK */}
        {activeTab === 'istatistik' && (
          <motion.div key="istatistik" className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: 'Mert', xp: stats.mertXP || 0, color: 'blue' },
              { name: 'Melek', xp: stats.melekXP || 0, color: 'pink' }
            ].map((p, i) => {
              const info = getLevelInfo(p.xp);
              return (
                <div key={i} className="bg-slate-900/80 p-8 rounded-[40px] border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{info.icon}</div>
                      <div><h2 className={`text-2xl font-black ${p.color === 'blue' ? 'text-blue-400' : 'text-pink-400'}`}>{p.name}</h2><p className={`text-[10px] font-bold ${info.color}`}>{info.rank}</p></div>
                    </div>
                    <div className="text-right"><p className="text-[10px] text-gray-500 uppercase">Lvl</p><p className="text-3xl font-black">{info.level}</p></div>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.xp % info.next) / (info.next / 100)}%` }} className={`h-full bg-gradient-to-r ${p.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-pink-400 to-pink-600'}`} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">{p.xp} / {info.next} XP</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* DOSYALAR (GÜNCEL) */}
        {activeTab === 'dosyalar' && (
          <motion.div key="dosyalar" className="max-w-4xl mx-auto space-y-6">
            {!passwordCorrect ? (
              <div className="max-w-md mx-auto bg-slate-900/80 p-8 rounded-[32px] text-center border border-white/10 shadow-2xl">
                <Lock className="mx-auto mb-4 text-pink-400" size={40} /><h3 className="font-black mb-4">ŞİFRE GEREKLİ</h3>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-slate-800 rounded-2xl mb-4 text-center outline-none" placeholder="****" />
                <button onClick={() => password === '1025' ? setPasswordCorrect(true) : alert('Hatalı!')} className="w-full py-4 bg-pink-600 rounded-2xl font-black">Giriş</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900/80 p-8 rounded-[40px] border border-white/10 text-center shadow-xl">
                  <div className="flex flex-col items-center gap-6">
                    <label className="cursor-pointer w-full max-w-xs">
                      <div className="border-2 border-dashed border-slate-700 rounded-[32px] p-8 hover:border-pink-500/50 transition-colors bg-slate-800/30">
                        {previewUrl ? <img src={previewUrl} className="w-full h-48 object-cover rounded-2xl shadow-lg" alt="Önizleme" /> : 
                        <div className="flex flex-col items-center gap-2 text-gray-500 py-4"><ImageIcon size={40}/><p className="text-[10px] font-black uppercase">Galeriye Dokun</p></div>}
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {previewUrl && (
                      <button onClick={handleFileUpload} disabled={isUploading} className="px-10 py-4 bg-pink-600 rounded-2xl font-black shadow-xl flex items-center gap-2">
                        {isUploading ? <Loader2 className="animate-spin" /> : <Check />} {isUploading ? "YÜKLENİYOR..." : "ANIYI EKLE (+50 XP)"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {galeriResimleri.map((img) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-[32px] overflow-hidden group shadow-2xl border border-white/5">
                      <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Anı" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black text-pink-400 uppercase">{img.sender}</p>
                        <button onClick={async () => { if(confirm("Silelim mi?")) await deleteDoc(doc(db, "galeri", img.id)); }} className="text-red-400 mt-2 text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> SİL</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* OZLEM */}
        {activeTab === 'ozlem' && (
          <motion.div key="ozlem" className="max-w-4xl mx-auto text-center space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-900/80 p-8 rounded-[40px] border border-white/5 shadow-xl">
                <h3 className="text-blue-400 font-black text-[10px] tracking-widest mb-4 uppercase">Mert</h3>
                <button onClick={async () => { await updateDoc(doc(db, "stats", "ozlem"), { mert: increment(1) }); addXP(5); }} className="text-6xl hover:scale-110 active:scale-95 transition-transform">💙</button>
                <p className="text-3xl font-black mt-4">{stats.mert}</p>
              </div>
              <div className="bg-slate-900/80 p-8 rounded-[40px] border border-white/5 shadow-xl">
                <h3 className="text-pink-400 font-black text-[10px] tracking-widest mb-4 uppercase">Melek</h3>
                <button onClick={async () => { await updateDoc(doc(db, "stats", "ozlem"), { melek: increment(1) }); addXP(5); }} className="text-6xl hover:scale-110 active:scale-95 transition-transform">💖</button>
                <p className="text-3xl font-black mt-4">{stats.melek}</p>
              </div>
            </div>
            <div className="bg-slate-900/80 p-12 rounded-[50px] border border-white/5 shadow-2xl flex flex-col items-center">
              <button onClick={async () => { await updateDoc(doc(db, "stats", "ozlem"), { love: increment(1) }); addXP(10); }} className="text-8xl animate-pulse active:scale-90 transition-transform">❤️</button>
              <p className="mt-8 text-2xl font-black text-red-500 uppercase tracking-tighter">{stats.love} KEZ "SENİ SEVİYORUM" DENİLDİ</p>
            </div>
          </motion.div>
        )}

        {/* MEKTUPLAR */}
        {activeTab === 'mektuplar' && (
          <motion.div key="mektuplar" className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/5 shadow-xl">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full p-4 bg-slate-800 text-white rounded-xl outline-none" rows={4} placeholder="Sana bir notum var..." />
              <button onClick={handleSendMessage} className="mt-4 px-8 py-3 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full font-bold shadow-lg">Gönder (+20 XP)</button>
            </div>
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`p-6 rounded-3xl shadow-xl border-l-8 ${m.from === user ? 'bg-slate-800/80 border-blue-500' : 'bg-slate-800/80 border-pink-500'}`}>
                  <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">{m.from} • {new Date(m.timestamp).toLocaleDateString()}</p>
                  <p className="text-gray-200 font-medium">{m.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* GENEL (Sevilenler/Sevilmeyenler) */}
        {activeTab === 'genel' && (
          <motion.div key="genel" className="max-w-4xl mx-auto">
            <div className="text-center mb-8"><button onClick={() => setShowAddForm(!showAddForm)} className="bg-purple-600 px-8 py-3 rounded-full font-black shadow-lg flex items-center gap-2 mx-auto">{showAddForm ? <X size={18}/> : <Plus size={18}/>} YENİ EKLE</button></div>
            {showAddForm && (
              <div className="bg-slate-900/80 p-6 rounded-[32px] border border-white/5 mb-8 flex flex-wrap gap-4 items-end shadow-2xl">
                <div className="flex-1 min-w-[200px]">
                  <input value={newGeneralText} onChange={(e) => setNewGeneralText(e.target.value)} placeholder="Madde..." className="w-full p-3 bg-slate-800 rounded-xl mb-2 outline-none" />
                  <select value={generalType} onChange={(e:any) => setGeneralType(e.target.value)} className="w-full p-3 bg-slate-800 rounded-xl outline-none text-sm">
                    <option value="like">Sevilen ✅</option><option value="dislike">Sevilmeyen ❌</option>
                  </select>
                </div>
                <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="w-16 h-12 p-1 bg-slate-800 rounded-xl" />
                <button onClick={async () => { if(newGeneralText.trim()){ await addDoc(collection(db, "genel"), { sender: user, text: newGeneralText, type: generalType, color: boxColor, timestamp: new Date().toISOString() }); setNewGeneralText(''); setShowAddForm(false); addXP(15); } }} className="bg-green-600 px-8 py-3 rounded-xl font-black">KAYDET</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['like', 'dislike'].map(type => (
                <div key={type} className="space-y-4">
                  <h4 className={`text-center font-black uppercase tracking-tighter text-sm ${type === 'like' ? 'text-green-400' : 'text-red-400'}`}>{type === 'like' ? 'SEVİLENLER' : 'SEVİLMEYENLER'}</h4>
                  {generalItems.filter(i => i.type === type).map(item => (
                    <div key={item.id} style={{ borderLeftColor: item.color }} className="p-4 rounded-2xl bg-slate-900 border-l-8 border border-white/5 relative group shadow-md">
                      <button onClick={async () => await deleteDoc(doc(db, "genel", item.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={14}/></button>
                      <p className="text-[10px] font-black text-gray-500 uppercase">{item.sender}</p><p className="text-gray-200">{item.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* HARİCİ BİLEŞENLER */}
        {activeTab === 'sanat' && <motion.div key="sanat"><SanatOdasi user={user || 'melek'} /></motion.div>}
        {activeTab === 'sinema' && <motion.div key="sinema"><SinemaSalonu user={user || 'melek'} /></motion.div>}
        {activeTab === 'kapsul' && <motion.div key="kapsul"><ZamanKapsulu user={user || 'melek'} /></motion.div>}
      </AnimatePresence>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black">YOGI YÜKLENİYOR... 🐾</div>}>
      <Dashboard />
    </Suspense>
  );
}