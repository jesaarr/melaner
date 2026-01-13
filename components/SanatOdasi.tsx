'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Plus, Image as ImageIcon, StickyNote, Music, X, Maximize2 } from 'lucide-react';

interface BoardItem {
  id: string;
  type: 'sticker' | 'note' | 'photo' | 'music';
  content: string; 
  extra?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  sender: string;
}

export default function SanatOdasi({ user }: { user: string }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [activeForm, setActiveForm] = useState<'note' | 'music' | null>(null);
  const [tempNote, setTempNote] = useState(''); // Not yazarken buraya kaydedilecek
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'sanat_kolaj'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoardItem)));
    });
    return () => unsub();
  }, []);

  const addItem = async (type: BoardItem['type'], content: string, extra = '', color = '#fef08a') => {
    if (!content.trim()) return; // Boş içerik eklemesini engelle
    await addDoc(collection(db, 'sanat_kolaj'), {
      type, content, extra, color,
      x: 30 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      rotation: Math.random() * 20 - 10,
      scale: 1,
      sender: user,
      timestamp: Date.now()
    });
    setTempNote(''); // İşlem bitince temizle
    setActiveForm(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addItem('photo', reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItem = async (id: string, data: any) => {
    await updateDoc(doc(db, 'sanat_kolaj', id), data);
  };

  return (
    <div className="relative w-full h-[85vh] bg-[#d7ccc8] rounded-[3rem] overflow-hidden border-[12px] border-[#8d6e63] shadow-2xl group/board">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {items.map((item) => (
        <motion.div
          key={item.id}
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => {
            const parent = document.querySelector('.group\\/board');
            if (parent) {
              const rect = parent.getBoundingClientRect();
              const x = ((info.point.x - rect.left) / rect.width) * 100;
              const y = ((info.point.y - rect.top) / rect.height) * 100;
              updateItem(item.id, { x, y });
            }
          }}
          initial={{ scale: 0 }}
          animate={{ scale: item.scale, left: `${item.x}%`, top: `${item.y}%`, rotate: item.rotation }}
          className="absolute cursor-grab active:cursor-grabbing z-10 p-2 group"
        >
          {item.type === 'photo' && (
            <div className="bg-white p-2 pb-10 shadow-2xl border-b-8 border-black/5 ring-1 ring-black/5">
              <img src={item.content} className="w-32 h-32 object-cover pointer-events-none rounded-sm" />
              <div className="absolute bottom-3 left-0 right-0 text-center font-serif text-[10px] text-slate-500 italic px-2 truncate">{item.extra}</div>
            </div>
          )}

          {item.type === 'note' && (
            <div style={{ backgroundColor: item.color }} className="w-40 h-40 p-5 shadow-xl flex items-center justify-center text-center border-t-8 border-black/5">
              <p className="text-sm font-medium text-slate-800 italic leading-relaxed">{item.content}</p>
            </div>
          )}

          {item.type === 'sticker' && <div className="text-6xl drop-shadow-lg">{item.content}</div>}

          <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => updateItem(item.id, { scale: item.scale >= 2.5 ? 1 : item.scale + 0.5 })} className="bg-white p-1.5 rounded-full shadow-lg text-blue-500 hover:scale-110"><Maximize2 size={14}/></button>
            <button onClick={() => deleteDoc(doc(db, 'sanat_kolaj', item.id))} className="bg-white p-1.5 rounded-full shadow-lg text-red-500 hover:scale-110"><Trash2 size={14}/></button>
          </div>
        </motion.div>
      ))}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-[2.5rem] shadow-2xl border border-white/50 z-[100]">
        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
          <div className="bg-blue-100 p-3 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all"><ImageIcon size={24} /></div>
          <span className="text-[10px] font-black uppercase text-slate-500">Fotoğraf</span>
        </button>
        <button onClick={() => { setTempNote(''); setActiveForm('note'); }} className="flex flex-col items-center gap-1 group">
          <div className="bg-yellow-100 p-3 rounded-2xl group-hover:bg-yellow-500 group-hover:text-white transition-all"><StickyNote size={24} /></div>
          <span className="text-[10px] font-black uppercase text-slate-500">Not</span>
        </button>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex flex-col items-center gap-1 group">
          <div className="bg-pink-100 p-3 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-all"><Plus size={24} /></div>
          <span className="text-[10px] font-black uppercase text-slate-500">Emoji</span>
        </button>
      </div>

      <AnimatePresence>
        {activeForm === 'note' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="bg-white p-8 rounded-[3rem] w-80 shadow-2xl border border-white">
              <h3 className="text-center font-black text-slate-800 mb-4 uppercase tracking-tighter">Duvara Not Bırak</h3>
              <textarea 
                autoFocus
                value={tempNote}
                className="w-full h-40 p-5 bg-slate-50 rounded-[2rem] mb-4 text-sm outline-none border-2 border-transparent focus:border-yellow-400 transition-all text-slate-700" 
                placeholder="Ne söylemek istersin?.."
                onChange={(e) => setTempNote(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addItem('note', tempNote);
                  }
                }}
              />
              <button 
                onClick={() => addItem('note', tempNote)}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-slate-800 transition-colors"
              >
                Panoya As
              </button>
              <button onClick={() => setActiveForm(null)} className="w-full mt-4 text-xs font-black text-red-400 uppercase">Vazgeç</button>
            </div>
          </motion.div>
        )}

        {isMenuOpen && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl flex gap-4 z-[101] border border-white">
            {['❤️', '✨', '🐾', '🍿', '🌈', '🛸', '🧸', '🧿'].map(e => (
              <button key={e} onClick={() => { addItem('sticker', e); setIsMenuOpen(false); }} className="text-4xl hover:scale-150 hover:-rotate-12 transition-transform">{e}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}