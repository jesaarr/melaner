'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Trash2, ChevronLeft, ChevronRight, Feather } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(0);

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
      setCurrentPage(0);
    } catch (e) {
      alert("Hata oluştu!");
    }
  };

  const nextPage = () => { if (currentPage < entries.length - 1) setCurrentPage(prev => prev + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto p-2 md:p-4 pb-40">
      
      {/* KİTAP ANA GÖVDE */}
      <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[15px] md:rounded-[20px] border-[#2c1e14] border-[6px] md:border-[12px] bg-[#f4e4bc] min-h-[450px] md:min-h-[550px] flex flex-col md:flex-row overflow-hidden">
        
        {/* Sayfa Ortası (Sadece Masaüstü) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/10 via-black/20 to-black/10 z-20 hidden md:block" />

        {/* SOL SAYFA: YAZMA ALANI */}
        <div className={`flex-1 p-6 md:p-10 border-b md:border-b-0 md:border-r border-black/10 z-10 ${currentPage !== 0 ? 'hidden md:block opacity-30 pointer-events-none' : 'block'}`}>
           <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-2">
              <span className="font-serif italic text-stone-700 text-sm flex items-center gap-2"><Feather size={16}/> Yeni Not</span>
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{user}</span>
           </div>
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="w-full h-[200px] md:h-[350px] bg-transparent border-none outline-none font-serif text-lg md:text-xl leading-relaxed resize-none text-stone-900 placeholder-stone-400"
             placeholder="Tarihe bir not düş..."
           />
           {currentPage === 0 && (
             <button 
               onClick={handleSave}
               disabled={!content.trim()}
               className="mt-4 w-full bg-[#3a2a1d] text-[#f4e4bc] py-3 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-lg"
             >
               DEFTERİ MÜHÜRLE
             </button>
           )}
        </div>

        {/* SAĞ SAYFA: OKUMA ALANI */}
        <div className={`flex-1 p-6 md:p-10 relative z-10 bg-[#f9edd0] ${currentPage === 0 && content.length > 0 ? 'hidden md:block' : 'block'}`}>
           <AnimatePresence mode="wait">
             {entries.length > 0 && currentPage < entries.length ? (
               <motion.div 
                 key={entries[currentPage].id}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="h-full flex flex-col"
               >
                 <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-2">
                    <span className={`text-[9px] font-black uppercase ${entries[currentPage].author === 'mert' ? 'text-blue-600' : 'text-pink-600'}`}>
                      {entries[currentPage].author} Yazdı
                    </span>
                    <span className="text-[9px] font-mono opacity-50">
                      {entries[currentPage].timestamp?.seconds ? new Date(entries[currentPage].timestamp.seconds * 1000).toLocaleDateString('tr-TR') : 'Şimdi'}
                    </span>
                 </div>
                 <p className="font-serif text-stone-800 text-base md:text-xl leading-relaxed flex-1 whitespace-pre-wrap italic overflow-y-auto max-h-[250px] md:max-h-none">
                   "{entries[currentPage].text}"
                 </p>
                 {user === entries[currentPage].author && (
                   <button onClick={() => deleteDoc(doc(db, "gercek_gunluk", entries[currentPage].id))} className="text-red-800/30 hover:text-red-800 p-2 self-end transition-colors">
                     <Trash2 size={16} />
                   </button>
                 )}
               </motion.div>
             ) : (
               <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-stone-400 italic">
                 <Book size={40} className="mb-2 opacity-20" />
                 <p className="text-sm">Henüz bir kayıt yok...</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* NAVİGASYON */}
      <div className="flex justify-center items-center gap-6 md:gap-10 mt-8">
        <button 
          onClick={nextPage}
          disabled={currentPage >= entries.length - 1}
          className="p-3 bg-black/10 hover:bg-black/20 rounded-full transition-all disabled:opacity-5 active:scale-90"
        >
          <ChevronLeft size={28} />
        </button>
        
        <div className="text-center">
          <span className="text-[9px] font-black tracking-widest opacity-40 uppercase block font-mono">Sayfa</span>
          <span className="text-xl md:text-2xl font-serif italic text-stone-600">{currentPage + 1} / {entries.length || 1}</span>
        </div>

        <button 
          onClick={prevPage}
          disabled={currentPage === 0}
          className="p-3 bg-black/10 hover:bg-black/20 rounded-full transition-all disabled:opacity-5 active:scale-90"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <p className="text-center mt-4 text-[9px] opacity-20 font-bold uppercase tracking-[0.2em]">
        Sayfalar arasında gezmek için okları kullan güzeliim
      </p>

    </motion.div>
  );
};

export default Gunluk;