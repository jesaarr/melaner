'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, PenTool, Trash2, ChevronLeft, ChevronRight, Feather } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, deleteDoc, doc 
} from "firebase/firestore";

interface GunlukProps {
  user: string;
  isDarkMode: boolean;
}

const Gunluk = ({ user, isDarkMode }: GunlukProps) => {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0); // Sayfa takibi

  useEffect(() => {
    const q = query(collection(db, "gercek_gunluk"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (user === 'guest' || !content.trim()) return;
    try {
      await addDoc(collection(db, "gercek_gunluk"), {
        text: content,
        author: user,
        timestamp: serverTimestamp(),
      });
      setContent('');
      setCurrentPage(0); // Yeni yazı yazınca en güncel sayfaya (0) dön
    } catch (e) {
      alert("Hata oluştu!");
    }
  };

  // Navigasyon Fonksiyonları
  const nextPage = () => { if (currentPage < entries.length) setCurrentPage(prev => prev + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto p-4 pb-40">
      
      {/* KİTAP ANA GÖVDE */}
      <div className="relative shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[20px] border-[#2c1e14] border-[12px] bg-[#f4e4bc] min-h-[550px] flex flex-col md:flex-row overflow-hidden">
        
        {/* Sayfa Ortası (Cilt İzi) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/10 via-black/20 to-black/10 z-20 hidden md:block" />

        {/* SOL SAYFA: YAZMA ALANI (Yeni Kayıt) */}
        <div className={`flex-1 p-10 border-r border-black/5 z-10 ${currentPage !== 0 ? 'opacity-30 pointer-events-none' : ''}`}>
           <div className="flex justify-between items-center mb-6 border-b border-black/10 pb-2">
              <span className="font-serif italic text-stone-700 flex items-center gap-2"><Feather size={16}/> Yeni Sayfa</span>
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{user}</span>
           </div>
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="w-full h-[350px] bg-transparent border-none outline-none font-serif text-xl leading-relaxed resize-none text-stone-900 placeholder-stone-400"
             placeholder="Tarihe bir not düş..."
           />
           {currentPage === 0 && (
             <button 
               onClick={handleSave}
               disabled={!content.trim()}
               className="mt-4 w-full bg-[#3a2a1d] text-[#f4e4bc] py-3 rounded-xl font-bold text-xs hover:bg-[#4e3929] transition-all"
             >
               DEFTERİ MÜHÜRLE
             </button>
           )}
        </div>

        {/* SAĞ SAYFA: OKUMA ALANI (Arşiv) */}
        <div className="flex-1 p-10 relative z-10 bg-[#f9edd0]">
           <AnimatePresence mode="wait">
             {entries.length > 0 && currentPage < entries.length ? (
               <motion.div 
                 key={entries[currentPage].id}
                 initial={{ x: 20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: -20, opacity: 0 }}
                 className="h-full flex flex-col"
               >
                 <div className="flex justify-between items-center mb-6 border-b border-black/10 pb-2">
                    <span className={`text-[10px] font-black uppercase ${entries[currentPage].author === 'mert' ? 'text-blue-600' : 'text-pink-600'}`}>
                      {entries[currentPage].author} Yazdı
                    </span>
                    <span className="text-[10px] font-mono opacity-50">
                      {entries[currentPage].timestamp?.seconds ? new Date(entries[currentPage].timestamp.seconds * 1000).toLocaleDateString('tr-TR') : 'Yeni'}
                    </span>
                 </div>
                 <p className="font-serif text-stone-800 text-xl leading-relaxed flex-1 whitespace-pre-wrap italic">
                   "{entries[currentPage].text}"
                 </p>
                 {user === entries[currentPage].author && (
                   <button onClick={() => deleteDoc(doc(db, "gercek_gunluk", entries[currentPage].id))} className="text-red-800/30 hover:text-red-800 self-end transition-colors">
                     <Trash2 size={16} />
                   </button>
                 )}
               </motion.div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-stone-400 italic">
                 <Book size={48} className="mb-4 opacity-20" />
                 <p>Defterin bu sayfası henüz boş...</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* SAYFA ÇEVİRME KONTROLLERİ */}
      <div className="flex justify-center items-center gap-8 mt-10">
        <button 
          onClick={nextPage}
          disabled={currentPage >= entries.length - 1}
          className="p-4 bg-black/20 hover:bg-black/40 rounded-full transition-all disabled:opacity-10"
        >
          <ChevronLeft size={30} />
        </button>
        
        <div className="text-center">
          <span className="text-xs font-black tracking-widest opacity-40 uppercase block mb-1 font-mono">Sayfa</span>
          <span className="text-2xl font-serif italic text-stone-500">{currentPage + 1} / {entries.length || 1}</span>
        </div>

        <button 
          onClick={prevPage}
          disabled={currentPage === 0}
          className="p-4 bg-black/20 hover:bg-black/40 rounded-full transition-all disabled:opacity-10"
        >
          <ChevronRight size={30} />
        </button>
      </div>

      <p className="text-center mt-6 text-[10px] opacity-30 font-bold uppercase tracking-[0.3em]">
        Sayfayı çevirmek için okları kullan
      </p>

    </motion.div>
  );
};

export default Gunluk;