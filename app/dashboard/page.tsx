'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Palette, Trash2, MessageCircle, Send, Plus, Lock, Check, Clock, BarChart3, Trophy, Star, Image as ImageIcon, Upload, Loader2, Heart, Moon, Sun, Mail } from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, query, orderBy, limit, deleteDoc, setDoc } from "firebase/firestore";
import SanatOdasi from '@/components/SanatOdasi';
import SinemaSalonu from '@/components/SinemaSalonu';
import ZamanKapsulu from '@/components/ZamanKapsulu';

// --- SLOWLY PUL BİLEŞENİ (Sadece mektuplarda görünecek) ---
const LetterStamp = ({ sender }: { sender: string }) => (
  <div className="absolute top-4 right-4 w-12 h-16 bg-white border-2 border-dashed border-gray-300 p-1 shadow-sm rotate-3 group-hover:rotate-6 transition-transform z-10">
    <div className={`w-full h-full flex items-center justify-center text-xl ${sender === 'mert' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
      {sender === 'mert' ? '⚓' : '🌸'}
    </div>
    <div className="absolute -bottom-1 -right-1 bg-yellow-600 text-[6px] text-white px-1 font-bold rounded-sm uppercase">Post</div>
  </div>
);

const Dashboard = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get('user'); // 'mert', 'melek' veya 'guest'
  const isGuest = user === 'guest';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(user === 'mert' ? 'blue' : 'pink');
  const [isDarkMode, setIsDarkMode] = useState(true); // Karanlık tema opsiyonu
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
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [password, setPassword] = useState('');

  const [galeriResimleri, setGaleriResimleri] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- YENİ MEKTUP ÖZELLİKLERİ İÇİN STATE ---
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [letterPaperColor, setLetterPaperColor] = useState('#fdfbf7');

  const dates = {
    tanisma: new Date('2025-10-10'),
    melekDogum: new Date('2011-02-15'),
    mertDogum: new Date('2009-04-21'),
    acilma: new Date('2025-12-14'),
    cikma: new Date('2026-01-05')
  };

  const [now, setNow] = useState(new Date());

  // Dinamik Tema Arkaplanları
  const themes: any = {
    pink: isDarkMode ? 'from-slate-950 via-pink-950/20 to-slate-950' : 'from-pink-50 via-pink-100 to-white',
    blue: isDarkMode ? 'from-slate-950 via-blue-950/20 to-slate-950' : 'from-blue-50 via-blue-100 to-white',
    purple: isDarkMode ? 'from-slate-950 via-purple-950/20 to-slate-950' : 'from-purple-50 via-purple-100 to-white',
    orange: isDarkMode ? 'from-slate-950 via-orange-950/20 to-slate-950' : 'from-orange-50 via-orange-100 to-white',
    green: isDarkMode ? 'from-slate-950 via-green-950/20 to-slate-950' : 'from-green-50 via-green-100 to-white'
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

  const addXP = async (amount: number) => {
    if (isGuest) return; 
    const field = user === 'mert' ? 'mertXP' : 'melekXP';
    await updateDoc(doc(db, "stats", "ozlem"), { [field]: increment(amount) });
  };

  const getLevelInfo = (xp: number) => {
    if (xp < 100) return { level: 1, rank: 'Yeni Tanışanlar', color: 'text-amber-500', icon: '🤎', next: 100 };
    if (xp < 500) return { level: 2, rank: 'Acemi', color: 'text-slate-400', icon: '🥈', next: 500 };
    if (xp < 1000) return { level: 3, rank: 'Profesör', color: 'text-yellow-400', icon: '💛', next: 1000 };
    return { level: 4, rank: 'Ebedi Bağ', color: 'text-purple-400', icon: '💜', next: 5000 };
  };

  const handleGuestWarning = () => {
    if (isGuest) {
      alert("Misafir Modu: Sadece görüntüleme yapabilirsiniz. Değişiklik yapma yetkiniz yok! 🐾");
      return true;
    }
    return false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleGuestWarning()) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (handleGuestWarning() || !previewUrl) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, "galeri"), { url: previewUrl, sender: user, timestamp: Date.now() });
      setPreviewUrl(null);
      addXP(50);
    } catch (e) { alert("Hata oluştu!"); }
    finally { setIsUploading(false); }
  };

  const handleYogiChat = async () => {
    if (handleGuestWarning()) return;
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
        body: JSON.stringify({ contents: [{ parts: [{ text: `Sen Mert ve Melek'in kedisi Yogi'sin. Şirin bir dille cevap ver. Kullanıcı: ${currentInput}` }] }] })
      });
      const data = await response.json();
      setYogiMessages(prev => [...prev, { role: 'bot', text: data.candidates[0].content.parts[0].text }]);
    } catch (error) {
      setYogiMessages(prev => [...prev, { role: 'bot', text: "Miyav! Devrelerim ısındı... 🐾" }]);
    } finally { setIsYogiTyping(false); }
  };

  const handleSendMessage = async () => {
    if (handleGuestWarning()) return;
    if (newMessage.trim()) {
      await addDoc(collection(db, "mektuplar"), { 
        from: user, 
        to: user === 'mert' ? 'melek' : 'mert', 
        message: newMessage, 
        color: letterPaperColor, // Renk kaydediliyor
        timestamp: new Date().toISOString() 
      });
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
    <div className={`min-h-screen p-8 bg-gradient-to-br ${themes[themeColor]} transition-colors duration-1000 ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>
      
      {/* GUEST MODE BANNER */}
      {isGuest && (
        <div className="fixed top-0 left-0 w-full bg-amber-500 text-white text-[10px] font-black py-1 text-center z-[100] tracking-widest uppercase">
          Misafir Modu Aktif - Değişiklik Yapılamaz
        </div>
      )}

      {/* FIXED BUTTONS */}
      <button onClick={() => setIsSettingsOpen(true)} className={`fixed top-6 left-6 p-3 ${isDarkMode ? 'bg-slate-800/80 text-white' : 'bg-white/80 text-slate-800'} backdrop-blur-md rounded-full shadow-lg z-[60] border border-white/10 hover:scale-110 transition-all`}><Settings size={22} /></button>
      <button onClick={() => setIsYogiActive(true)} className="fixed bottom-6 right-6 p-4 bg-pink-600 text-white rounded-full shadow-2xl z-[60] hover:scale-110 transition-all"><MessageCircle size={24} /></button>

      {/* AYARLAR SIDEBAR */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className={`fixed top-0 left-0 h-full w-80 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} shadow-2xl z-[80] p-6 border-r border-white/10 overflow-y-auto`}>
                <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic tracking-tighter">AYARLAR</h2><button onClick={() => setIsSettingsOpen(false)}><X /></button></div>
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-bold opacity-50 mb-3 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Tema Rengi</p>
                    <div className="flex gap-2">
                      {['pink', 'blue', 'purple', 'orange', 'green'].map(c => (
                        <button key={c} onClick={() => setThemeColor(c)} className={`w-8 h-8 rounded-full ${themeColor === c ? 'ring-2 ring-offset-2' : ''}`} style={{ background: c === 'pink' ? '#f472b6' : c === 'blue' ? '#60a5fa' : c === 'purple' ? '#a78bfa' : c === 'orange' ? '#fb923c' : '#4ade80' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold opacity-50 mb-3 uppercase tracking-widest flex items-center gap-2"><Moon size={14}/> Görünüm</p>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-800'}`}>
                      {isDarkMode ? <><Sun size={18}/> Aydınlık Moda Geç</> : <><Moon size={18}/> Karanlık Moda Geç</>}
                    </button>
                  </div>
                  {!isGuest && (
                    user === 'melek' ? (
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-[10px] font-bold opacity-50 mb-3 uppercase tracking-widest flex items-center gap-2"><Star size={14}/> Mert'ten İste</p>
                        <textarea value={yogiRequest} onChange={(e) => setYogiRequest(e.target.value)} placeholder="İsteğin..." className={`w-full text-sm rounded-xl p-3 outline-none mb-2 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`} rows={3} />
                        <button onClick={async () => { if(yogiRequest.trim()){ await addDoc(collection(db, "talepler"), { from: user, text: yogiRequest, timestamp: new Date().toISOString() }); setYogiRequest(''); alert('İletildi!'); } }} className="w-full py-2 bg-pink-600 text-white rounded-xl text-sm font-bold">Gönder</button>
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-[10px] font-bold opacity-50 mb-3 uppercase tracking-widest flex items-center gap-2"><Trophy size={14}/> Melek'in İstekleri</p>
                        <div className="space-y-2">
                          {receivedRequests.map(r => (
                            <div key={r.id} className="p-3 bg-blue-900/30 rounded-xl border border-blue-500/30 relative group">
                              <p className="text-xs text-blue-200">{r.text}</p>
                              <button onClick={async () => await deleteDoc(doc(db, "talepler", r.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400"><X size={12}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* YOGI CHAT */}
      <AnimatePresence>
        {isYogiActive && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className={`fixed bottom-24 right-6 w-80 h-[450px] ${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-[32px] shadow-2xl z-[100] flex flex-col border border-white/10 overflow-hidden`}>
            <div className="bg-pink-600 p-5 text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-2"><MessageCircle size={20}/> Yogi AI</span>
              <button onClick={() => setIsYogiActive(false)}><X size={18}/></button>
            </div>
            <div className={`flex-1 p-5 overflow-y-auto space-y-3 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
              {yogiMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-pink-600 text-white ml-auto rounded-tr-none' : 'bg-slate-700 text-white rounded-tl-none'}`}>{m.text}</div>
              ))}
              {isYogiTyping && <div className="text-[10px] text-pink-400 italic animate-pulse">Yogi yazıyor... 🐾</div>}
            </div>
            <div className={`p-4 border-t border-white/10 flex gap-2 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <input disabled={isGuest} value={yogiInput} onChange={(e) => setYogiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleYogiChat()} className={`flex-1 text-sm rounded-full px-4 py-2 outline-none ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`} placeholder={isGuest ? "Misafirler yazamaz" : "Miyav?"} />
              <button onClick={handleYogiChat} className="p-2 bg-pink-600 text-white rounded-full"><Send size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="max-w-6xl mx-auto mb-12 mt-16 flex flex-wrap justify-center gap-3">
        {['tarihler', 'mektuplar', 'ozlem', 'istatistik', 'genel', 'dosyalar', 'sanat', 'sinema', 'kapsul'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === tab ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105' : (isDarkMode ? 'bg-slate-800/60 text-gray-300' : 'bg-white text-slate-600 shadow-sm')}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tarihler' && (
          <motion.div key="tarihler" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'İlk Tanışma', date: '10/10/2025', color: 'pink', val: dates.tanisma },
              { title: 'Açılma Tarihi', date: '14/12/2025', color: 'orange', val: dates.acilma },
              { title: 'ne zaman sevgilim oldun(resmiyen)', date: '05/01/2026', color: 'red', val: dates.cikma, span: true, highlight: true },
              { title: 'Melek Doğum', date: '15/02/2011', color: 'blue', val: dates.melekDogum },
              { title: 'Mert Doğum', date: '21/04/2009', color: 'green', val: dates.mertDogum }
            ].map((d, i) => (
              <div key={i} className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-lg'} p-6 rounded-3xl border-t-4 border-${d.color}-500 ${d.span ? 'md:col-span-2' : ''} border border-white/5`}>
                <div className="flex justify-between">
                  <div><h3 className={`text-${d.color}-500 font-black text-[10px] tracking-widest uppercase mb-1`}>{d.title}</h3><p className="text-2xl font-black">{d.date}</p></div>
                  {d.highlight && <Heart className="text-red-500 fill-red-500 animate-bounce" />}
                </div>
                <div className={`${isDarkMode ? 'bg-slate-950/50 text-gray-300' : 'bg-slate-100 text-slate-600'} p-3 rounded-xl mt-4 font-mono text-xs`}>⌛ {calculateTimeElapsed(d.val)}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* MEKTUPLAR (SLOWLY STYLE - YENİ ENTEGRASYON) */}
        {activeTab === 'mektuplar' && (
          <motion.div key="mektuplar" className="max-w-4xl mx-auto space-y-12 pb-20">
            {!isGuest && (
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                {/* RENK SEÇİCİ */}
                <div className="flex gap-2 mb-4 items-center">
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mr-2">Kağıt Rengi:</p>
                    {['#fdfbf7', '#fff1f2', '#f0f9ff', '#f0fdf4', '#faf5ff'].map(c => (
                        <button key={c} onClick={() => setLetterPaperColor(c)} className={`w-6 h-6 rounded-full border-2 ${letterPaperColor === c ? 'border-yellow-500 scale-125' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                <textarea 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  className="w-full p-6 rounded-2xl text-slate-800 font-serif text-lg leading-relaxed shadow-inner outline-none"
                  style={{ backgroundColor: letterPaperColor }}
                  rows={4} 
                  placeholder="Duygularını kağıda dök..." 
                />
                <div className="flex justify-end mt-4">
                  <button onClick={handleSendMessage} className="px-10 py-3 bg-yellow-700 text-white font-serif italic hover:bg-yellow-800 transition-all shadow-md flex items-center gap-2 rounded-xl">
                    <Send size={16} /> Mektubu Mühürle (+20 XP)
                  </button>
                </div>
              </div>
            )}

            {/* ZARFLAR (KAPALI MEKTUP GÖRÜNÜMÜ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {messages.map((m, index) => (
                <motion.div 
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedLetter(m)}
                  className={`cursor-pointer group relative p-8 h-48 ${isDarkMode ? 'bg-[#f4f1ea]' : 'bg-white'} border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
                  style={{ transform: `rotate(${index % 2 === 0 ? '1deg' : '-1deg'})` }}
                >
                  <LetterStamp sender={m.from} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Mail size={80} className="text-slate-900" />
                  </div>
                  <div className="z-10 mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">KAPALI MEKTUP</span>
                    </div>
                    <span className="text-[10px] font-serif italic text-slate-400">{new Date(m.timestamp).toLocaleDateString('tr-TR')}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* MEKTUP OKUMA MODALI */}
            <AnimatePresence>
                {selectedLetter && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLetter(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-12 shadow-2xl rounded-sm border-t-[12px] border-yellow-700"
                            style={{ backgroundColor: selectedLetter.color || '#fdfbf7' }}
                        >
                            <button onClick={() => setSelectedLetter(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
                            <LetterStamp sender={selectedLetter.from} />
                            
                            <div className="mb-8 border-b border-slate-200 pb-2">
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">GÖNDEREN: {selectedLetter.from}</span>
                                <span className="mx-2 text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400 italic font-serif">{new Date(selectedLetter.timestamp).toLocaleString('tr-TR')}</span>
                            </div>

                            <p className="text-slate-800 font-serif text-xl leading-[2] whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:text-yellow-700 first-letter:float-left first-letter:mr-3">
                                {selectedLetter.message}
                            </p>

                            <div className="mt-12 pt-6 border-t border-dashed border-slate-300 flex justify-between items-center">
                                <span className="font-serif italic text-slate-500">Sevgilerimle...</span>
                                {selectedLetter.from === user && !isGuest && (
                                    <button onClick={async (e) => { 
                                        e.stopPropagation();
                                        if(confirm("Bu mektubu kalıcı olarak silmek istiyor musun?")) {
                                            await deleteDoc(doc(db, "mektuplar", selectedLetter.id));
                                            setSelectedLetter(null);
                                        }
                                    }} className="text-red-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={20}/>
                                    </button>
                                )}
                            </div>
                            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'ozlem' && (
          <motion.div key="ozlem" className="max-w-4xl mx-auto text-center space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {['mert', 'melek'].map((p) => (
                <div key={p} className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xl'} p-8 rounded-[40px]`}>
                  <h3 className={`${p === 'mert' ? 'text-blue-500' : 'text-pink-500'} font-black text-[10px] mb-4 uppercase`}>{p}</h3>
                  <button onClick={async () => { if(!handleGuestWarning()){ await updateDoc(doc(db, "stats", "ozlem"), { [p]: increment(1) }); addXP(5); }}} className="text-6xl hover:scale-110 active:scale-95 transition-transform">{p === 'mert' ? '💙' : '💖'}</button>
                  <p className="text-3xl font-black mt-4">{(stats as any)[p]}</p>
                </div>
              ))}
            </div>
            <div className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-2xl'} p-12 rounded-[50px] flex flex-col items-center`}>
              <button onClick={async () => { if(!handleGuestWarning()){ await updateDoc(doc(db, "stats", "ozlem"), { love: increment(1) }); addXP(10); }}} className="text-8xl animate-pulse active:scale-90 transition-transform">❤️</button>
              <p className="mt-8 text-2xl font-black text-red-500 uppercase tracking-tighter">{stats.love} KEZ "SENİ SEVİYORUM" DENİLDİ</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'istatistik' && (
          <motion.div key="istatistik" className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[{ name: 'Mert', xp: stats.mertXP || 0, color: 'blue' }, { name: 'Melek', xp: stats.melekXP || 0, color: 'pink' }].map((p, i) => {
              const info = getLevelInfo(p.xp);
              return (
                <div key={i} className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xl'} p-8 rounded-[40px] border border-white/10`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{info.icon}</div>
                      <div><h2 className={`text-2xl font-black ${p.color === 'blue' ? 'text-blue-500' : 'text-pink-500'}`}>{p.name}</h2><p className={`text-[10px] font-bold ${info.color}`}>{info.rank}</p></div>
                    </div>
                    <div className="text-right"><p className="text-[10px] opacity-50 uppercase">Lvl</p><p className="text-3xl font-black">{info.level}</p></div>
                  </div>
                  <div className="w-full h-3 bg-slate-200/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.xp % info.next) / (info.next / 100)}%` }} className={`h-full bg-gradient-to-r ${p.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-pink-400 to-pink-600'}`} />
                  </div>
                  <p className="text-[10px] opacity-50 mt-2 font-bold uppercase">{p.xp} / {info.next} XP</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {activeTab === 'genel' && (
          <motion.div key="genel" className="max-w-md mx-auto py-20 text-center">
            <Lock className="mx-auto mb-6 text-purple-500" size={60} />
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Burası Kapalı</h2>
            <p className="text-sm opacity-60 font-medium">Bu sayfa geçici olarak erişime kapatılmıştır. Çok yakında yeni haliyle burada olacak! 🐾</p>
          </motion.div>
        )}

        {activeTab === 'dosyalar' && (
          <motion.div key="dosyalar" className="max-w-4xl mx-auto space-y-6">
            {!passwordCorrect && !isGuest ? (
              <div className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-2xl'} max-w-md mx-auto p-8 rounded-[32px] text-center border border-white/10`}>
                <Lock className="mx-auto mb-4 text-pink-500" size={40} /><h3 className="font-black mb-4">ŞİFRE GEREKLİ</h3>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-4 rounded-2xl mb-4 text-center outline-none ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} placeholder="****" />
                <button onClick={() => password === '1025' ? setPasswordCorrect(true) : alert('Hatalı!')} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black">Giriş</button>
              </div>
            ) : (
              <div className="space-y-6">
                {!isGuest && (
                  <div className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white'} p-8 rounded-[40px] border border-white/10 text-center shadow-xl`}>
                    <div className="flex flex-col items-center gap-6">
                      <label className="cursor-pointer w-full max-w-xs">
                        <div className={`border-2 border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'} rounded-[32px] p-8 hover:border-pink-500 transition-colors`}>
                          {previewUrl ? <img src={previewUrl} className="w-full h-48 object-cover rounded-2xl" alt="Ö" /> : <div className="flex flex-col items-center gap-2 opacity-40"><ImageIcon size={40}/><p className="text-[10px] font-black uppercase">Fotoğraf Seç</p></div>}
                        </div>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                      {previewUrl && <button onClick={handleFileUpload} disabled={isUploading} className="px-10 py-4 bg-pink-600 text-white rounded-2xl font-black flex items-center gap-2">{isUploading ? <Loader2 className="animate-spin" /> : <Check />} EKLE (+50 XP)</button>}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {galeriResimleri.map((img) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-[32px] overflow-hidden group shadow-lg">
                      <img src={img.url} className="w-full h-full object-cover" alt="Anı" />
                      {!isGuest && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                          <button onClick={async () => { if(confirm("Silmek istiyor musun?")) await deleteDoc(doc(db, "galeri", img.id)); }} className="text-red-400 text-xs font-black flex items-center gap-1"><Trash2 size={14}/> SİL</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

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