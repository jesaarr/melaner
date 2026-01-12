'use client';

import React, { useRef, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { Trash2, Music } from 'lucide-react';

export default function SanatOdasi({ user }: { user: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);

  // --- PİYANO NOTALARI ---
  const notes = [
    { n: 'C4', k: 'A', f: 261.63 }, { n: 'D4', k: 'S', f: 293.66 },
    { n: 'E4', k: 'D', f: 329.63 }, { n: 'F4', k: 'F', f: 349.23 },
    { n: 'G4', k: 'G', f: 392.00 }, { n: 'A4', k: 'H', f: 440.00 },
    { n: 'B4', k: 'J', f: 493.88 }, { n: 'C5', k: 'K', f: 523.25 }
  ];

  const playSound = (freq: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  };

  // Piyano Senkronizasyonu
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sanat", "piyano"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastNote && data.sender !== user) {
          const noteObj = notes.find(n => n.n === data.lastNote);
          if (noteObj) playSound(noteObj.f);
          setActiveNotes([data.lastNote]);
          setTimeout(() => setActiveNotes([]), 300);
        }
      }
    });
    return () => unsub();
  }, [user]);

  const handleNoteClick = async (note: any) => {
    playSound(note.f);
    await setDoc(doc(db, "sanat", "piyano"), { lastNote: note.n, sender: user, time: Date.now() });
  };

  // --- ÇİZİM TAHTASI ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Firebase'den çizimleri dinle
    const unsub = onSnapshot(doc(db, "sanat", "cizim"), (docSnap) => {
      if (docSnap.exists()) {
        const lines = docSnap.data().lines || [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lines.forEach((line: any) => {
          ctx.beginPath();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 2;
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
          ctx.stroke();
        });
      }
    });
    return () => unsub();
  }, []);

  const draw = async (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Bu kısmı basitleştirmek için sadece noktaları gönderiyoruz
    await updateDoc(doc(db, "sanat", "cizim"), {
      lines: arrayUnion({ x1: x, y1: y, x2: x + 2, y2: y + 2, color: user === 'mert' ? '#60a5fa' : '#f472b6' })
    });
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-4xl mx-auto">
      {/* PİYANO */}
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full">
        <h3 className="text-center font-bold mb-4 flex items-center justify-center gap-2">
          <Music size={20}/> Senkronize Piyano
        </h3>
        <div className="flex justify-center gap-2">
          {notes.map((note) => (
            <button
              key={note.n}
              onClick={() => handleNoteClick(note)}
              className={`h-32 w-12 rounded-b-lg border-2 transition-all ${
                activeNotes.includes(note.n) ? 'bg-yellow-300 scale-95' : 'bg-white hover:bg-gray-100'
              } flex items-end justify-center pb-4 font-bold text-gray-400`}
            >
              {note.k}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center mt-4 text-gray-400">Bir tuşa basınca diğerinde de çalar 🎵</p>
      </div>

      {/* ÇİZİM TAHTASI */}
      <div className="bg-white p-4 rounded-3xl shadow-xl w-full relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseMove={draw}
          className="w-full h-[300px] border-2 border-dashed border-gray-200 rounded-2xl cursor-crosshair"
        />
        <button 
          onClick={() => setDoc(doc(db, "sanat", "cizim"), { lines: [] })}
          className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={20}/>
        </button>
      </div>
    </div>
  );
}