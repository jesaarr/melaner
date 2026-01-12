'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Lock, ArrowRight, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const [animating, setAnimating] = useState(false);
  
  // Şifreleri Firebase'den tutacak state (Varsayılan şifrelerini içine yazdım)
  const [dbPasswords, setDbPasswords] = useState<Record<string, string>>({
    melek: '1502',
    mert: '2104'
  });

  // Şifreleri anlık olarak Firebase'den dinle
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "sifreler"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Eğer veritabanında şifre varsa güncelle, yoksa eskiler kalsın
        setDbPasswords({
          melek: data.melek || '1502',
          mert: data.mert || '2104'
        });
      }
    });
    return () => unsub();
  }, []);

  const handleVerify = () => {
    // Seçilen kullanıcıya göre doğru şifreyi belirle
    const correctPassword = selectedUser === 'melek' ? dbPasswords.melek : dbPasswords.mert;

    if (selectedUser && password === correctPassword) {
      setAnimating(true);
      setTimeout(() => {
        router.push(`/dashboard?user=${selectedUser}`);
      }, 800);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden relative font-sans">
      
      {/* ARKA PLAN EFEKTLERİ */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedUser && !animating && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row gap-8 z-10 p-4 w-full max-w-4xl"
          >
            {/* MELEK KARTI */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedUser('melek')}
              className="group relative flex-1 h-[450px] rounded-[40px] bg-gradient-to-b from-pink-500/20 to-pink-900/40 border border-pink-500/30 overflow-hidden cursor-pointer backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(236,72,153,0.3)]">🦋</div>
                <h2 className="text-5xl font-black text-white tracking-tighter">MELEK</h2>
                <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10 text-pink-200 text-sm font-medium backdrop-blur-sm">Giriş Yapmak İçin Tıkla</div>
              </div>
            </motion.div>

            {/* MERT KARTI */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedUser('mert')}
              className="group relative flex-1 h-[450px] rounded-[40px] bg-gradient-to-b from-blue-500/20 to-blue-900/40 border border-blue-500/30 overflow-hidden cursor-pointer backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(59,130,246,0.3)]">⭐</div>
                <h2 className="text-5xl font-black text-white tracking-tighter">MERT</h2>
                <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10 text-blue-200 text-sm font-medium backdrop-blur-sm">Giriş Yapmak İçin Tıkla</div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ŞİFRE MODALI */}
        {selectedUser && !animating && (
          <motion.div
            key="password-screen"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-50 w-full max-w-md p-8 relative"
          >
            <button 
              onClick={() => { setSelectedUser(null); setPassword(''); }}
              className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className={`bg-white/10 backdrop-blur-2xl p-10 rounded-[40px] border border-white/20 shadow-2xl ${isError ? 'animate-shake' : ''}`}>
              <div className="text-center mb-8">
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 ${selectedUser === 'melek' ? 'bg-pink-500' : 'bg-blue-500'} shadow-lg`}>
                  <Lock className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-widest">{selectedUser} Paneli</h3>
                <p className="text-gray-400 text-sm mt-2">Devam etmek için şifreni gir</p>
              </div>

              <div className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="••••"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all placeholder:tracking-normal placeholder:text-sm"
                  autoFocus
                />
                
                <button
                  onClick={handleVerify}
                  className={`w-full py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    selectedUser === 'melek' ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                  } shadow-xl`}
                >
                  Sisteme Gir <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* YÜKLENİYOR EKRANI */}
        {animating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.5, 50],
                rotate: [0, 90, 180]
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className={`w-12 h-12 rounded-full ${selectedUser === 'melek' ? 'bg-pink-500' : 'bg-blue-500'}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}