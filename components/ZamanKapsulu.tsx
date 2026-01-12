'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Lock, Unlock, Send, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ZamanKapsulu({ user }: { user: string }) {
  const [text, setText] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [capsules, setCapsules] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const q = query(collection(db, "kapsuller"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (s) => {
      setCapsules(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { unsub(); clearInterval(interval); };
  }, []);

  const handleCreate = async () => {
    if (!text || !unlockDate) return;
    const unlockTimestamp = new Date(unlockDate).getTime();
    if (unlockTimestamp <= Date.now()) {
      alert("Geleceğe bir tarih seçmelisin kral!");
      return;
    }

    await addDoc(collection(db, "kapsuller"), {
      text,
      sender: user,
      unlockDate: unlockTimestamp,
      timestamp: Date.now(),
      isOpened: false
    });
    setText('');
    setUnlockDate('');
    alert("Zaman kapsülü mühürlendi! 🔒");
  };

  const getTimeLeft = (target: number) => {
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}g ${hours}s ${mins}d ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* KAPSÜL OLUŞTURMA */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-xl border-2 border-purple-100">
        <h2 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
          <Clock size={24} /> Geleceğe Not Bırak
        </h2>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Gelecekteki halinize veya Melek'e ne söylemek istersin?"
          className="w-full p-4 rounded-2xl border-none bg-purple-50 outline-none text-gray-800 mb-4 resize-none h-32 shadow-inner"
        />
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-gray-400 mb-1 ml-2 uppercase">Ne Zaman Açılsın?</p>
            <input 
              type="datetime-local" 
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-purple-50 border-none outline-none text-gray-700"
            />
          </div>
          <button 
            onClick={handleCreate}
            className="px-8 py-4 bg-purple-500 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-600 transition-all flex items-center gap-2 self-end"
          >
            <Lock size={20} /> Mühürle
          </button>
        </div>
      </div>

      {/* KAPSÜL LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capsules.map((cap) => {
          const timeLeft = getTimeLeft(cap.unlockDate);
          const isReady = !timeLeft;

          return (
            <motion.div 
              key={cap.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative p-6 rounded-[32px] shadow-lg overflow-hidden border-2 ${isReady ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white border-gray-100'}`}
            >
              {isReady && <div className="absolute top-0 right-0 p-3 text-yellow-500 animate-pulse"><Sparkles size={24}/></div>}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${isReady ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {isReady ? <Unlock size={20} /> : <Lock size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Gönderen: {cap.sender}</p>
                  <p className="text-sm font-bold text-gray-700">
                    {isReady ? "KAPSÜL AÇILDI!" : "Zamanın Dolması Bekleniyor"}
                  </p>
                </div>
              </div>

              {isReady ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/50 rounded-2xl border border-yellow-100">
                  <p className="text-gray-800 italic leading-relaxed">"{cap.text}"</p>
                  <p className="text-[10px] mt-4 text-right text-gray-400">{new Date(cap.timestamp).toLocaleDateString()}</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full animate-pulse" style={{ width: '40%' }} />
                  </div>
                  <p className="text-center font-mono text-purple-600 font-bold tracking-widest">{timeLeft}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}