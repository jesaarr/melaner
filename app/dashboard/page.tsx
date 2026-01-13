'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Palette, Trash2, MessageCircle, Send, Plus, Lock, Check, Clock, BarChart3, Trophy, Star } from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, query, orderBy, limit, deleteDoc, setDoc } from "firebase/firestore";
import SanatOdasi from '@/components/SanatOdasi';
import SinemaSalonu from '@/components/SinemaSalonu';
import ZamanKapsulu from '@/components/ZamanKapsulu';

const Dashboard = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get('user');

  // --- TEMEL STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(user === 'mert' ? 'blue' : 'pink');
  const [activeTab, setActiveTab] = useState('tarihler');
  
  // --- YOGI & TALEP STATE ---
  const [isYogiActive, setIsYogiActive] = useState(false);
  const [yogiMessages, setYogiMessages] = useState<{role: string, text: string}[]>([]);
  const [yogiInput, setYogiInput] = useState('');
  const [yogiRequest, setYogiRequest] = useState('');
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [isYogiTyping, setIsYogiTyping] = useState(false);

  // --- STATS & CONTENT STATE ---
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

  const dates = {
    tanisma: new Date('2025-10-10'),
    melekDogum: new Date('2011-02-15'),
    mertDogum: new Date('2009-04-21'),
    acilma: new Date('2025-12-14')
  };

  const [now, setNow] = useState(new Date());
  const themes: any = {
    pink: 'from-pink-50 to-pink-100', blue: 'from-blue-50 to-blue-100',
    purple: 'from-purple-50 to-purple-100', orange: 'from-orange-50 to-orange-100', green: 'from-green-50 to-green-100'
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
    if (user === 'mert') {
      onSnapshot(query(collection(db, "talepler"), orderBy("timestamp", "desc"), limit(5)), (s) => {
        setReceivedRequests(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => { unsubStats(); clearInterval(interval); };
  }, [user]);

  // --- ARIZA TESPİT MODLU YOGI FONKSİYONU ---
  const handleYogiChat = async () => {
    if (!yogiInput.trim() || isYogiTyping) return;

    const currentInput = yogiInput;
    setYogiMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setYogiInput('');
    setIsYogiTyping(true);

    try {
      const API_KEY = process.env.NEXT_PUBLIC_YOGI_API_KEY;
      
      // 1. ADIM: Anahtar kontrolü
      if (!API_KEY) {
        setYogiMessages(prev => [...prev, { role: 'bot', text: "❌ HATA: API Anahtarı bulunamadı. Vercel'deki isim 'NEXT_PUBLIC_YOGI_API_KEY' olmalı." }]);
        setIsYogiTyping(false);
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Sen Mert ve Melek'in kedisi Yogi'sin. Şirin bir dille cevap ver. Kullanıcı: ${currentInput}` }] }]
        })
      });

      const data = await response.json();

      // 2. ADIM: Google Hatası kontrolü
      if (data.error) {
        setYogiMessages(prev => [...prev, { role: 'bot', text: `❌ GOOGLE HATASI: ${data.error.message}` }]);
      } else {
        const botResponse = data.candidates[0].content.parts[0].text;
        setYogiMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      }

    } catch (error) {
      setYogiMessages(prev => [...prev, { role: 'bot', text: "💥 Bağlantı koptu. İnternetini veya API limitini kontrol et." }]);
    } finally {
      setIsYogiTyping(false);
    }
  };

  // --- DİĞER FONKSİYONLAR ---
  const addXP = async (amount: number) => {
    const field = user === 'mert' ? 'mertXP' : 'melekXP';
    await updateDoc(doc(db, "stats", "ozlem"), { [field]: increment(amount) });
  };

  const handleOzlemClick = async (who: 'mert' | 'melek') => {
    await updateDoc(doc(db, "stats", "ozlem"), { [who]: increment(1) });
    await addXP(5);
  };

  const handleLoveClick = async () => {
    await updateDoc(doc(db, "stats", "ozlem"), { love: increment(1) });
    await addXP(10);
  };

  const handleSendRequest = async () => {
    if (yogiRequest.trim()) {
      await addDoc(collection(db, "talepler"), { from: user, text: yogiRequest, timestamp: new Date().toISOString() });
      setYogiRequest('');
      alert('Talebin Mert\'e iletildi! 🚀');
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await addDoc(collection(db, "mektuplar"), { from: user, to: user === 'mert' ? 'melek' : 'mert', message: newMessage, timestamp: new Date().toISOString() });
      const msgField = user === 'mert' ? 'mertMsg' : 'melekMsg';
      await updateDoc(doc(db, "stats", "ozlem"), { [msgField]: increment(1) });
      setNewMessage('');
      await addXP(20);
    }
  };

  const getLevelInfo = (xp: number) => {
    if (xp < 100) return { level: 1, rank: 'Yeni Tanışanlar', color: 'text-amber-700', icon: '🤎', next: 100 };
    if (xp < 500) return { level: 2, rank: 'Sırılsıklam Aşıklar', color: 'text-slate-400', icon: '🥈', next: 500 };
    if (xp < 1000) return { level: 3, rank: 'Ruh Öküzleri', color: 'text-yellow-500', icon: '💛', next: 1000 };
    return { level: 4, rank: 'Ebedi Bağ', color: 'text-purple-600', icon: '💜', next: 5000 };
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
    <div className={`min-h-screen p-8 bg-gradient-to-br ${themes[themeColor]} transition-colors duration-500`}>
      
      {/* AYARLAR BUTONU */}
      <button onClick={() => setIsSettingsOpen(true)} className="fixed top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg z-[60] hover:bg-white transition-all">
        <Settings size={22} className="text-gray-600" />
      </button>

      {/* YOGI CHAT BUTONU */}
      <button onClick={() => setIsYogiActive(true)} className="fixed bottom-6 right-6 p-4 bg-pink-500 text-white rounded-full shadow-2xl z-[60] hover:scale-110 transition-all">
        <MessageCircle size={24} />
      </button>

      {/* AYARLAR SIDEBAR */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 h-full w-85 bg-white shadow-2xl z-[80] p-6 text-gray-800 overflow-y-auto">
                <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic">SİSTEM AYARLARI</h2><button onClick={() => setIsSettingsOpen(false)}><X /></button></div>
                
                <div className="mb-8">
                  <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Tema Rengi</p>
                  <div className="flex gap-2">
                    {['pink', 'blue', 'purple', 'orange', 'green'].map(c => (
                      <button key={c} onClick={() => setThemeColor(c)} className={`w-8 h-8 rounded-full ${themeColor === c ? 'ring-2 ring-black ring-offset-2' : ''}`} style={{ background: c === 'pink' ? '#f472b6' : c === 'blue' ? '#60a5fa' : c === 'purple' ? '#a78bfa' : c === 'orange' ? '#fb923c' : '#4ade80' }} />
                    ))}
                  </div>
                </div>

                {user === 'melek' && (
                  <div className="mb-8 border-t pt-6">
                    <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Star size={14}/> Mert'ten Bir Şey İste</p>
                    <div className="flex flex-col gap-2">
                      <textarea value={yogiRequest} onChange={(e) => setYogiRequest(e.target.value)} placeholder="Örn: Uygulamaya şu müziği ekle..." className="text-sm border rounded-xl p-3 bg-gray-50 outline-none" rows={3} />
                      <button onClick={handleSendRequest} className="w-full py-2 bg-black text-white rounded-xl text-sm font-bold">Talebi Gönder</button>
                    </div>
                  </div>
                )}

                {user === 'mert' && (
                  <div className="mb-8 border-t pt-6">
                    <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Trophy size={14}/> Melek'in İstekleri</p>
                    <div className="space-y-2">
                      {receivedRequests.length > 0 ? receivedRequests.map(r => (
                        <div key={r.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100 relative group">
                          <p className="text-xs text-blue-800">{r.text}</p>
                          <button onClick={async () => await deleteDoc(doc(db, "talepler", r.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400"><X size={12}/></button>
                        </div>
                      )) : <p className="text-xs italic text-gray-400 text-center">Henüz talep yok...</p>}
                    </div>
                  </div>
                )}

                <div className="mt-auto border-t pt-6">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">GÜVENLİK</p>
                  <div className="flex gap-2">
                     <input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Yeni Şifre" className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none" />
                     <button onClick={async () => { if(newPass.length >= 4) { await setDoc(doc(db, "ayarlar", "sifreler"), { [user as string]: newPass }, { merge: true }); setNewPass(''); alert('Şifre güncellendi!'); } }} className="p-2 bg-gray-800 text-white rounded-lg"><Check size={18}/></button>
                  </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* YOGI CHAT PANELİ */}
      <AnimatePresence>
        {isYogiActive && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 100 }} className="fixed bottom-24 right-6 w-85 h-[450px] bg-white rounded-[32px] shadow-2xl z-[100] flex flex-col border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-5 text-white font-bold flex justify-between items-center shadow-lg">
              <span className="flex items-center gap-2 text-lg"><MessageCircle size={20}/> Yogi AI</span>
              <button onClick={() => setIsYogiActive(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X size={18}/></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-gray-50/50">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-gray-100">Miyav! Ben Yogi. Bugün Melek ve Mert için ne yapabilirim? 🐾</div>
              {yogiMessages.map((m, i) => (
                <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-pink-500 text-white ml-auto rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>{m.text}</div>
              ))}
              {isYogiTyping && <div className="text-xs text-pink-400 italic animate-pulse ml-2">Yogi mırıldanıyor... 🐾</div>}
            </div>
            <div className="p-4 bg-white border-t flex gap-2 items-center">
              <input value={yogiInput} onChange={(e) => setYogiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleYogiChat()} className="flex-1 text-sm border-none bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 ring-pink-200" placeholder="Bir şeyler yaz..." disabled={isYogiTyping} />
              <button onClick={handleYogiChat} disabled={isYogiTyping} className="p-3 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300"><Send size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto mb-8 mt-16 flex flex-wrap justify-center gap-3">
        {['tarihler', 'mektuplar', 'ozlem', 'istatistik', 'genel', 'dosyalar', 'sanat', 'sinema', 'kapsul'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white shadow-sm'}`}>
            {tab === 'istatistik' && <BarChart3 size={16} />}
            {tab === 'kapsul' && <Clock size={16} />}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'istatistik' && (
          <motion.div key="istatistik" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'Mert', xp: stats.mertXP || 0, color: 'blue', ozlem: stats.mert, msg: stats.mertMsg },
                { name: 'Melek', xp: stats.melekXP || 0, color: 'pink', ozlem: stats.melek, msg: stats.melekMsg }
              ].map((p, i) => {
                const info = getLevelInfo(p.xp);
                return (
                  <div key={i} className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{info.icon}</div>
                        <div>
                          <h2 className={`text-2xl font-black ${p.color === 'blue' ? 'text-blue-500' : 'text-pink-500'}`}>{p.name.toUpperCase()}</h2>
                          <p className={`text-xs font-bold ${info.color}`}>{info.rank}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Seviye</p>
                        <p className="text-3xl font-black text-gray-800">{info.level}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-2 text-gray-400 uppercase">
                          <span>Tecrübe (XP)</span>
                          <span>{p.xp} / {info.next}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.xp % info.next) / (info.next / 100)}%` }} className={`h-full bg-gradient-to-r ${p.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-pink-400 to-pink-600'}`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 p-4 rounded-3xl text-center border border-white">
                          <p className="text-xl font-black text-gray-800">{p.ozlem || 0}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Özlem Tıkı</p>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-3xl text-center border border-white">
                          <p className="text-xl font-black text-gray-800">{p.msg || 0}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Mektuplar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-10 shadow-2xl text-center relative overflow-hidden border border-white">
               <Trophy className="mx-auto text-yellow-500 mb-4" size={40} />
               <h3 className="text-xl font-black text-gray-800">Uygulama Genel Özeti</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="p-4 bg-red-50/50 rounded-3xl border border-red-100">
                    <p className="text-3xl font-black text-red-500">{stats.love}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Seni Seviyorum</p>
                  </div>
                  <div className="p-4 bg-purple-50/50 rounded-3xl border border-purple-100">
                    <p className="text-3xl font-black text-purple-500">{calculateTimeElapsed(dates.tanisma).split('g')[0]}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Birlikte Geçen Gün</p>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <p className="text-3xl font-black text-blue-500">{messages.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Toplam Anı</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tarihler' && (
          <motion.div key="tarihler" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'İlk Tanışma', date: '10/10/2025', color: 'pink', val: dates.tanisma },
              { title: 'Açılma Tarihi', date: '14/12/2025', color: 'orange', val: dates.acilma, span: true },
              { title: 'Meleğin Doğum Günü', date: '15/02/2011', color: 'blue', val: dates.melekDogum },
              { title: 'Mertin Doğum Günü', date: '21/04/2009', color: 'green', val: dates.mertDogum }
            ].map((d, i) => (
              <div key={i} className={`bg-white p-6 rounded-2xl shadow-xl border-l-4 border-${d.color}-400 ${d.span ? 'md:col-span-2' : ''}`}>
                <h3 className={`text-${d.color}-600 font-bold uppercase text-xs tracking-widest`}>{d.title}</h3>
                <p className="text-xl font-semibold text-gray-800">{d.date}</p>
                <p className="text-xs font-mono text-gray-500 mt-2">⌛ {calculateTimeElapsed(d.val)}</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'ozlem' && (
          <motion.div key="ozlem" className="max-w-4xl mx-auto text-center">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-blue-600 font-bold mb-4 uppercase text-xs tracking-widest">Mert</h3>
                <button onClick={() => handleOzlemClick('mert')} className="text-6xl hover:scale-110 transition-transform active:scale-95">💙</button>
                <p className="text-2xl font-bold mt-4">{stats.mert}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-pink-600 font-bold mb-4 uppercase text-xs tracking-widest">Melek</h3>
                <button onClick={() => handleOzlemClick('melek')} className="text-6xl hover:scale-110 transition-transform active:scale-95">💖</button>
                <p className="text-2xl font-bold mt-4">{stats.melek}</p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
              <button onClick={handleLoveClick} className="text-8xl animate-pulse active:scale-90 transition-transform">❤️</button>
              <p className="mt-4 font-bold text-2xl text-red-500">{stats.love} kez "Seni Seviyorum" dendi</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'mektuplar' && (
          <motion.div key="mektuplar" className="max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full p-4 border rounded-lg outline-none text-gray-800" rows={4} placeholder="Mektubunu buraya bırak..." />
              <button onClick={handleSendMessage} className="mt-4 px-8 py-3 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-full font-bold shadow-lg">Gönder (+20 XP)</button>
            </div>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-6 rounded-2xl shadow-xl border-l-8 ${msg.from === user ? 'bg-blue-50 border-blue-400' : 'bg-pink-50 border-pink-400'}`}>
                  <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">{msg.from} - {new Date(msg.timestamp).toLocaleString()}</p>
                  <p className="text-gray-800 leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'genel' && (
          <motion.div key="genel" className="max-w-4xl mx-auto">
             <div className="text-center mb-8">
               <button onClick={() => setShowAddForm(!showAddForm)} className="bg-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto">
                 {showAddForm ? <X size={18}/> : <Plus size={18}/>} Yeni Ekle
               </button>
             </div>
             {showAddForm && (
               <div className="bg-white p-6 rounded-3xl shadow-xl mb-10 overflow-hidden flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-[200px]">
                   <input value={newGeneralText} onChange={(e) => setNewGeneralText(e.target.value)} placeholder="İçerik..." className="w-full p-3 border rounded-xl mb-2" />
                   <select value={generalType} onChange={(e:any) => setGeneralType(e.target.value)} className="w-full p-3 border rounded-xl text-sm">
                     <option value="like">Sevilen ✅</option><option value="dislike">Sevilmeyen ❌</option>
                   </select>
                 </div>
                 <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="w-16 h-12 p-1 border rounded-xl cursor-pointer" />
                 <button onClick={async () => { if(newGeneralText.trim()){ await addDoc(collection(db, "genel"), { sender: user, text: newGeneralText, type: generalType, color: boxColor, timestamp: new Date().toISOString() }); setNewGeneralText(''); setShowAddForm(false); addXP(15); } }} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold">Kaydet</button>
               </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {['like', 'dislike'].map(type => (
                 <div key={type} className="space-y-4 text-gray-800">
                   <h4 className={`text-center font-bold ${type === 'like' ? 'text-green-600' : 'text-red-600'}`}>{type === 'like' ? 'Sevilenler' : 'Sevilmeyenler'}</h4>
                   {generalItems.filter(i => i.type === type).map(item => (
                     <div key={item.id} style={{ borderLeftColor: item.color }} className="p-4 rounded-2xl shadow bg-white border-l-8 relative group">
                       <button onClick={async () => await deleteDoc(doc(db, "genel", item.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={14}/></button>
                       <p className="text-[10px] font-black opacity-30 uppercase">{item.sender}</p><p className="font-medium">{item.text}</p>
                     </div>
                   ))}
                 </div>
               ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'dosyalar' && (
          <motion.div key="dosyalar" className="max-w-4xl mx-auto">
             {!passwordCorrect ? (
               <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl text-center">
                 <Lock className="mx-auto mb-4 text-gray-400" size={40} />
                 <h3 className="text-xl font-bold mb-4">Gizli Galeri</h3>
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl mb-4 text-center" placeholder="Şifreyi Gir" />
                 <button onClick={() => password === '1025' ? setPasswordCorrect(true) : alert('Yanlış!')} className="w-full py-3 bg-black text-white rounded-xl font-bold">Giriş Yap</button>
               </div>
             ) : (
               <div className="bg-white p-8 rounded-3xl shadow-xl text-center border-2 border-dashed border-pink-200">
                 <p className="text-gray-500">Fotoğraflar yakında buraya yüklenecek...</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <Dashboard />
    </Suspense>
  );
}