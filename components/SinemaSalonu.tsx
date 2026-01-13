'use client';

import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { Play, Send, MessageSquare, Tv, Pause, AlertCircle } from 'lucide-react';

export default function SinemaSalonu({ user }: { user: string }) {
  const [videoSource, setVideoSource] = useState({ type: 'youtube', id: 'dQw4w9WgXcQ' });
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [lastAction, setLastAction] = useState<{user: string, status: string} | null>(null);
  
  const playerRef = useRef<any>(null);
  const videoTagRef = useRef<HTMLVideoElement>(null);
  const isUpdatingRef = useRef(false);

  // 1. VİDEO DURUM VE BİLDİRİM DİNLEME
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sinema", "durum"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Bildirim Ayarı
        if (data.sender !== user) {
          setLastAction({ user: data.sender, status: data.isPlaying ? 'başlattı' : 'durdurdu' });
          // 3 saniye sonra bildirimi kaldır
          setTimeout(() => setLastAction(null), 3000);
        }

        if (data.source.id !== videoSource.id) {
          setVideoSource(data.source);
        }

        // YouTube ve Direct Video Senkronizasyonu
        if (data.sender !== user) {
          isUpdatingRef.current = true;
          if (data.source.type === 'youtube' && playerRef.current) {
            if (Math.abs(playerRef.current.getCurrentTime() - data.time) > 2) playerRef.current.seekTo(data.time);
            data.isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
          } else if (data.source.type === 'direct' && videoTagRef.current) {
            if (Math.abs(videoTagRef.current.currentTime - data.time) > 2) videoTagRef.current.currentTime = data.time;
            data.isPlaying ? videoTagRef.current.play() : videoTagRef.current.pause();
          }
          setTimeout(() => { isUpdatingRef.current = false; }, 500);
        }
      }
    });
    return () => unsub();
  }, [videoSource.id, user]);

  // CHAT DİNLEME
  useEffect(() => {
    const q = query(collection(db, "sinema_chat"), orderBy("timestamp", "desc"), limit(20));
    const unsubChat = onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    });
    return () => unsubChat();
  }, []);

  // MANUEL SİNYAL GÖNDERME (Embed videolar için)
  const sendSignal = async (playing: boolean) => {
    await updateDoc(doc(db, "sinema", "durum"), {
      isPlaying: playing,
      sender: user,
      timestamp: Date.now()
    });
  };

  const handleUrlSubmit = async () => {
    if (!inputUrl.trim()) return;
    let source = { type: 'embed', id: inputUrl };
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      const ytId = inputUrl.split('v=')[1]?.split('&')[0] || inputUrl.split('/').pop() || '';
      source = { type: 'youtube', id: ytId };
    } else if (inputUrl.match(/\.(mp4|webm|ogg|m4v)$/)) {
      source = { type: 'direct', id: inputUrl };
    }
    await setDoc(doc(db, "sinema", "durum"), { source, time: 0, isPlaying: false, sender: user, timestamp: Date.now() });
    setInputUrl('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "sinema_chat"), { text: newMessage, user, timestamp: Date.now() });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-2 sm:p-4 relative">
      
      {/* CANLI BİLDİRİM BALONU */}
      {lastAction && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 border border-white/20 shadow-2xl animate-bounce">
          <AlertCircle size={20} className="text-yellow-400" />
          <span className="font-bold text-sm uppercase tracking-wide">
            {lastAction.user} videoyu {lastAction.status}!
          </span>
        </div>
      )}

      {/* SOL: VİDEO VE KONTROLLER */}
      <div className="flex-1 space-y-4">
        <div className="bg-black rounded-[32px] overflow-hidden shadow-2xl aspect-video border-4 border-white/20 relative">
          {videoSource.type === 'youtube' && (
            <YouTube 
              videoId={videoSource.id} 
              opts={{ width: '100%', height: '100%' }} 
              onReady={(e) => playerRef.current = e.target}
              onStateChange={async (e) => {
                if (isUpdatingRef.current) return;
                await updateDoc(doc(db, "sinema", "durum"), { isPlaying: e.data === 1, time: e.target.getCurrentTime(), sender: user });
              }}
              className="w-full h-full"
            />
          )}

          {videoSource.type === 'direct' && (
            <video ref={videoTagRef} src={videoSource.id} controls className="w-full h-full"
              onPlay={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: true, time: videoTagRef.current?.currentTime, sender: user })}
              onPause={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: false, time: videoTagRef.current?.currentTime, sender: user })}
            />
          )}

          {videoSource.type === 'embed' && (
            <iframe src={videoSource.id} className="w-full h-full border-none" allowFullScreen allow="autoplay" />
          )}
        </div>

        {/* EMBED VİDEOLAR İÇİN ÖZEL SİNYAL BUTONLARI */}
        {videoSource.type === 'embed' && (
          <div className="flex justify-center gap-4">
            <button onClick={() => sendSignal(true)} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-700 py-3 rounded-2xl border border-green-500/30 font-bold flex items-center justify-center gap-2 transition-all">
              <Play size={20} /> BAŞLATTIM
            </button>
            <button onClick={() => sendSignal(false)} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-700 py-3 rounded-2xl border border-red-500/30 font-bold flex items-center justify-center gap-2 transition-all">
              <Pause size={20} /> DURDURDUM
            </button>
          </div>
        )}

        <div className="flex gap-2 bg-white/60 p-2 rounded-2xl backdrop-blur-md border border-white/40">
          <input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="Link Yansıt..." className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm" />
          <button onClick={handleUrlSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
            <Tv size={16}/> Yansıt
          </button>
        </div>
      </div>

      {/* SAĞ: CHAT */}
      <div className="w-full lg:w-80 h-[450px] lg:h-[550px] bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl flex flex-col border border-white/40 overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3 font-black text-gray-800 uppercase">
          <MessageSquare size={18} className="text-indigo-500" /> Sinema Chat
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.user === user ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{m.user}</span>
              <div className={`px-4 py-2 rounded-2xl text-[13px] max-w-[85%] ${m.user === user ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 flex gap-2 border-t bg-white">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Mesaj..." className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-indigo-200" />
          <button onClick={handleSendMessage} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}