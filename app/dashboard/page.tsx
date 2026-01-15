'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, X, Palette, Trash2, MessageCircle, Send, Plus, Lock, Check, 
  Clock, BarChart3, Trophy, Star, Image as ImageIcon, Upload, Loader2, 
  Heart, Moon, Sun, Mail, Book, LockKeyhole, Stars, Sparkles, Unlock
} from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { 
  doc, onSnapshot, updateDoc, increment, collection, addDoc, 
  query, orderBy, limit, deleteDoc, setDoc, serverTimestamp 
} from "firebase/firestore";

// --- BİLEŞEN İMPORTLARI ---
import Gunluk from '@/components/Gunluk';
import SanatOdasi from '@/components/SanatOdasi';
import SinemaSalonu from '@/components/SinemaSalonu';
import ZamanKapsulu from '@/components/ZamanKapsulu';
import YuzuncuGunSurprizi from '@/components/YuzuncuGunSurprizi'; // Burası artık dışarıdan geliyor

// --- DİĞER YARDIMCI BİLEŞENLER ---
const LetterStamp = ({ sender }: { sender: string }) => (
  <div className="absolute top-4 right-4 w-12 h-16 bg-white border-2 border-dashed border-gray-300 p-1 shadow-sm rotate-3 group-hover:rotate-6 transition-transform z-10">
    <div className={`w-full h-full flex items-center justify-center text-xl ${sender === 'mert' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
      {sender === 'mert' ? '⚓' : '🌸'}
    </div>
    <div className="absolute -bottom-1 -right-1 bg-yellow-600 text-[6px] text-white px-1 font-bold rounded-sm uppercase">Post</div>
  </div>
);

// --- ANA DASHBOARD BİLEŞENİ ---
const Dashboard = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get('user');
  const isGuest = user === 'guest';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKavusmaOpen, setIsKavusmaOpen] = useState(false);
  const [show100thDay, setShow100thDay] = useState(false);
  const [themeColor, setThemeColor] = useState(user === 'mert' ? 'blue' : 'pink');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('tarihler');
  
  const [stats, setStats] = useState({ mert: 0, melek: 0, love: 0, mertXP: 0, melekXP: 0, mertMsg: 0, melekMsg: 0 });
  const [messages, setMessages] = useState<any[]>([]);
  const [galeriResimleri, setGaleriResimleri] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [letterPaperColor, setLetterPaperColor] = useState('#fdfbf7');
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [password, setPassword] = useState('');

  const dates = {
    tanisma: new Date('2025-10-10'),
    melekDogum: new Date('2011-02-15'),
    mertDogum: new Date('2009-04-21'),
    acilma: new Date('2025-12-14'),
    cikma: new Date('2026-01-05'),
    kavusma: new Date('2027-08-01')
  };

  const [now, setNow] = useState(new Date());

  const gecenMilisaniye = now.getTime() - dates.tanisma.getTime();
  const gecenGun = Math.floor(gecenMilisaniye / (1000 * 60 * 60 * 24));
  const isAvailable = gecenGun > 0 && gecenGun % 50 === 0;
  const is100thDay = gecenGun >= 100; // 100 ve üstü günlerde aktif olsun
  const kalanKavusmaGun = Math.floor((dates.kavusma.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
    onSnapshot(query(collection(db, "galeri"), orderBy("timestamp", "desc")), (s) => {
      setGaleriResimleri(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
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
    if (isGuest) { alert("Misafir Modu: Sadece görüntüleme yapabilirsiniz. 🐾"); return true; }
    return false;
  };

  const handleSendMessage = async () => {
    if (handleGuestWarning() || !newMessage.trim()) return;
    await addDoc(collection(db, "mektuplar"), { 
      from: user, to: user === 'mert' ? 'melek' : 'mert', 
      message: newMessage, color: letterPaperColor, timestamp: new Date().toISOString() 
    });
    await updateDoc(doc(db, "stats", "ozlem"), { [user === 'mert' ? 'mertMsg' : 'melekMsg']: increment(1) });
    setNewMessage('');
    addXP(20);
  };

  const calculateTimeElapsed = (targetDate: Date) => {
    const diff = Math.abs(now.getTime() - targetDate.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}g ${hours}s ${mins}d ${secs}s`;
  };

  return (
    <div className={`min-h-screen p-8 bg-gradient-to-br ${themes[themeColor]} transition-colors duration-1000 ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>
      
      {isGuest && <div className="fixed top-0 left-0 w-full bg-amber-500 text-white text-[8px] font-black py-1 text-center z-[100] tracking-widest uppercase">Misafir Modu Aktif</div>}

      <button onClick={() => setIsSettingsOpen(true)} className="fixed top-6 left-6 p-3 bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg z-[60] border border-white/10 hover:scale-110 transition-all"><Settings size={22} /></button>
      
      {/* SAĞ ÜST KAVUŞMA KUTUSU */}
      <div className="fixed top-6 right-6 z-[60] flex flex-col items-end gap-2">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (is100thDay) setShow100thDay(true);
            else setIsKavusmaOpen(!isKavusmaOpen);
          }}
          className={`p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-3 transition-all ${
            is100thDay 
              ? 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-900 scale-110 ring-4 ring-amber-500/20' 
              : (isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-white/80 text-indigo-600')
          }`}
        >
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-tighter opacity-60">{is100thDay ? 'ÖZEL HEDİYE' : 'Kavuşma Kilidi'}</p>
            <p className="text-xs font-bold">{gecenGun}. Gün</p>
          </div>
          <div className={`p-2 rounded-xl ${is100thDay ? 'bg-white/30' : (isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20')}`}>
            {is100thDay ? <Stars size={20} className="animate-pulse" /> : (isAvailable ? <Heart size={20} className="fill-green-400" /> : <LockKeyhole size={20} />)}
          </div>
        </motion.button>
      </div>

      {/* TABS SEÇİCİ */}
      <div className="max-w-6xl mx-auto mb-12 mt-16 flex flex-wrap justify-center gap-3">
        {['tarihler', 'mektuplar', 'gunluk', 'ozlem', 'istatistik', 'dosyalar', 'sanat', 'sinema', 'kapsul'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === tab ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105' : (isDarkMode ? 'bg-slate-800/60 text-gray-300' : 'bg-white text-slate-600 shadow-sm')}`}>
            {tab === 'sanat' ? 'BİZİM DUVAR' : tab === 'gunluk' ? 'GÜNLÜK' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tarihler' && (
          <motion.div key="tarihler" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'İlk Tanışma', date: '10/10/2025', color: 'pink', val: dates.tanisma },
              { title: 'Açılma Tarihi', date: '14/12/2025', color: 'orange', val: dates.acilma },
              { title: 'Sevgili Olduk', date: '05/01/2026', color: 'red', val: dates.cikma, span: true, highlight: true },
              { title: 'Melek Doğum', date: '15/02/2011', color: 'blue', val: dates.melekDogum },
              { title: 'Mert Doğum', date: '21/04/2009', color: 'green', val: dates.mertDogum }
            ].map((d, i) => (
              <div key={i} className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-lg'} p-6 rounded-3xl border-t-4 border-${d.color}-500 ${d.span ? 'md:col-span-2' : ''} border border-white/5`}>
                <div className="flex justify-between">
                  <div><h3 className={`text-${d.color}-500 font-black text-[10px] tracking-widest uppercase mb-1`}>{d.title}</h3><p className="text-2xl font-black">{d.date}</p></div>
                  {d.highlight && <Heart className="text-red-500 fill-red-500 animate-bounce" />}
                </div>
                <div className="p-3 rounded-xl mt-4 font-mono text-xs bg-black/20 text-gray-300">⌛ {calculateTimeElapsed(d.val)}</div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'gunluk' && <Gunluk user={user || 'melek'} isDarkMode={isDarkMode} />}

        {activeTab === 'mektuplar' && (
          <motion.div key="mektuplar" className="max-w-4xl mx-auto space-y-12 pb-20">
            {!isGuest && (
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                <div className="flex gap-2 mb-4 items-center">
                    {['#fdfbf7', '#fff1f2', '#f0f9ff', '#f0fdf4', '#faf5ff'].map(c => (
                        <button key={c} onClick={() => setLetterPaperColor(c)} className={`w-6 h-6 rounded-full border-2 ${letterPaperColor === c ? 'border-yellow-500 scale-125' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ backgroundColor: letterPaperColor }} className="w-full p-6 rounded-2xl text-slate-800 font-serif text-lg outline-none shadow-inner" rows={4} placeholder="Duygularını dök..." />
                <div className="flex justify-end mt-4"><button onClick={handleSendMessage} className="px-10 py-3 bg-yellow-700 text-white font-serif italic rounded-xl hover:bg-yellow-800 transition-colors flex items-center gap-2"><Send size={16} /> Gönder</button></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {messages.map((m, index) => (
                <motion.div key={m.id} whileHover={{ scale: 1.02 }} onClick={() => setSelectedLetter(m)} className="cursor-pointer group relative p-8 h-48 bg-[#f4f1ea] border border-slate-200 flex flex-col justify-between shadow-sm" style={{ transform: `rotate(${index % 2 === 0 ? '1' : '-1'}deg)` }}>
                  <LetterStamp sender={m.from} />
                  <div className="z-10 mt-auto font-serif italic text-slate-400 text-xs">{new Date(m.timestamp).toLocaleDateString()}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ozlem' && (
          <motion.div key="ozlem" className="max-w-4xl mx-auto text-center space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {['mert', 'melek'].map((p) => (
                <div key={p} className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xl'} p-8 rounded-[40px] border border-white/5`}>
                  <h3 className={`${p === 'mert' ? 'text-blue-500' : 'text-pink-500'} font-black text-[10px] mb-4 uppercase`}>{p}</h3>
                  <button onClick={async () => { if(!handleGuestWarning()){ await updateDoc(doc(db, "stats", "ozlem"), { [p]: increment(1) }); addXP(5); }}} className="text-6xl hover:scale-110 active:scale-95 transition-transform">{p === 'mert' ? '💙' : '💖'}</button>
                  <p className="text-3xl font-black mt-4">{(stats as any)[p]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'istatistik' && (
          <motion.div key="istatistik" className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[{ name: 'Mert', xp: stats.mertXP || 0, color: 'blue' }, { name: 'Melek', xp: stats.melekXP || 0, color: 'pink' }].map((p, i) => {
              const info = getLevelInfo(p.xp);
              return (
                <div key={i} className="bg-slate-900/80 p-8 rounded-[40px] border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{info.icon}</div>
                      <div><h2 className={`text-2xl font-black ${p.color === 'blue' ? 'text-blue-500' : 'text-pink-500'}`}>{p.name}</h2><p className={`text-[10px] font-bold ${info.color}`}>{info.rank}</p></div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-200/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.xp % (info.next || 100)) / ((info.next || 100) / 100)}%` }} className={`h-full bg-gradient-to-r ${p.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-pink-400 to-pink-600'}`} />
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
        
        {activeTab === 'sanat' && <motion.div key="sanat"><SanatOdasi user={user || 'melek'} /></motion.div>}
        {activeTab === 'sinema' && <motion.div key="sinema"><SinemaSalonu user={user || 'melek'} /></motion.div>}
        {activeTab === 'kapsul' && <motion.div key="kapsul"><ZamanKapsulu user={user || 'melek'} /></motion.div>}
        {activeTab === 'dosyalar' && (
          <motion.div key="dosyalar" className="max-w-4xl mx-auto space-y-6">
              {!passwordCorrect && !isGuest ? (
                <div className="bg-slate-900/80 p-8 rounded-3xl text-center"><Lock className="mx-auto mb-4 text-pink-500" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl bg-slate-800 mb-4 text-white" placeholder="Şifre..." /><button onClick={() => password === '1025' ? setPasswordCorrect(true) : alert('Hata!')} className="w-full py-4 bg-pink-600 rounded-xl font-bold">Giriş</button></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {galeriResimleri.map((img) => (<div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 shadow-lg"><img src={img.url} className="w-full h-full object-cover" /></div>))}
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALLER VE SÜRPRİZLER */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 h-full w-80 bg-slate-900 z-[80] p-6 border-r border-white/10">
               <h2 className="text-xl font-black mb-8 italic">AYARLAR</h2>
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full py-3 bg-slate-800 rounded-xl font-bold mb-4">{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</button>
            </motion.div>
          </>
        )}

        {/* 100. GÜN SÜRPRİZİ BURADA ÇAĞRILIYOR */}
        {show100thDay && <YuzuncuGunSurprizi onClose={() => setShow100thDay(false)} />}
        
        {selectedLetter && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLetter(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-2xl p-12 rounded-sm shadow-2xl" style={{ backgroundColor: selectedLetter.color }}>
              <p className="text-slate-800 font-serif text-xl leading-relaxed whitespace-pre-wrap">{selectedLetter.message}</p>
            </motion.div>
          </div>
        )}
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