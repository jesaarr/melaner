'use client';

import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { Play, Pause, Link, Tv, Send, MessageSquare, Globe } from 'lucide-react';

export default function SinemaSalonu({ user }: { user: string }) {
  const [videoSource, setVideoSource] = useState({ type: 'youtube', id: 'dQw4w9WgXcQ' });
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const playerRef = useRef<any>(null);
  const videoTagRef = useRef<HTMLVideoElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sinema", "durum"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.source.id !== videoSource.id) {
          setVideoSource(data.source);
        }

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

  useEffect(() => {
    const q = query(collection(db, "sinema_chat"), orderBy("timestamp", "desc"), limit(20));
    const unsubChat = onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    });
    return () => unsubChat();
  }, []);

  const handleUrlSubmit = async () => {
    if (!inputUrl.trim()) return;
    let source = { type: 'youtube', id: '' };

    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      source.id = inputUrl.split('v=')[1]?.split('&')[0] || inputUrl.split('/').pop() || '';
      source.type = 'youtube';
    } else if (inputUrl.includes('<iframe') || inputUrl.includes('src=')) {
      // Eğer kullanıcı direkt embed kodu yapıştırırsa içindeki linki ayıkla
      const match = inputUrl.match(/src="([^"]+)"/);
      source.id = match ? match[1] : inputUrl;
      source.type = 'embed';
    } else if (inputUrl.match(/\.(mp4|webm|ogg)$/)) {
      source = { type: 'direct', id: inputUrl };
    } else {
      // Geri kalan her şeyi 'embed' olarak dene (Film siteleri vb.)
      source = { type: 'embed', id: inputUrl };
    }

    await setDoc(doc(db, "sinema", "durum"), {
      source, time: 0, isPlaying: false, sender: user, timestamp: Date.now()
    });
    setInputUrl('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "sinema_chat"), {
      text: newMessage, user, timestamp: Date.now()
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-2 sm:p-4">
      
      {/* SOL TARAF: VİDEO ALANI */}
      <div className="flex-1 space-y-4">
        <div className="bg-black rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl aspect-video border-2 sm:border-4 border-white/20 relative">
          {videoSource.type === 'youtube' && (
            <YouTube 
              videoId={videoSource.id} 
              opts={{ 
                width: '100%', 
                height: '100%', 
                playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1 } 
              }} 
              onReady={(e) => playerRef.current = e.target}
              onStateChange={async (e) => {
                if (isUpdatingRef.current) return;
                await updateDoc(doc(db, "sinema", "durum"), {
                  isPlaying: e.data === 1, time: e.target.getCurrentTime(), sender: user
                });
              }}
              className="absolute inset-0 w-full h-full"
            />
          )}
          {videoSource.type === 'direct' && (
            <video 
              ref={videoTagRef}
              src={videoSource.id}
              controls
              className="w-full h-full object-contain"
              onPlay={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: true, time: videoTagRef.current?.currentTime, sender: user })}
              onPause={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: false, time: videoTagRef.current?.currentTime, sender: user })}
            />
          )}
          {videoSource.type === 'embed' && (
            <iframe 
              src={videoSource.id}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          )}
        </div>

        {/* URL GİRİŞİ */}
        <div className="flex flex-col sm:flex-row gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md shadow-sm">
          <div className="flex flex-1 items-center px-3 bg-white/50 rounded-xl">
            <Globe size={16} className="text-gray-400 mr-2" />
            <input 
              value={inputUrl} 
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="YouTube, Film Linki veya MP4..." 
              className="w-full bg-transparent border-none outline-none py-3 text-sm"
            />
          </div>
          <button onClick={handleUrlSubmit} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md">
            Yükle
          </button>
        </div>
      </div>

      {/* SAĞ TARAF: SİNEMA CHAT */}
      <div className="w-full lg:w-96 h-[400px] lg:h-auto bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl flex flex-col border border-white/40 overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3 font-black text-gray-800 uppercase tracking-tight">
          <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-200">
            <MessageSquare size={18} />
          </div>
          Sinema Chat
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.user === user ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{m.user}</span>
              <div className={`px-4 py-2 rounded-2xl text-[13px] max-w-[85%] shadow-sm leading-relaxed ${m.user === user ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50/80 flex gap-2 border-t">
          <input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Kız kulesine bir mesaj bırak..." 
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
          />
          <button onClick={handleSendMessage} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 active:scale-90 transition-all">
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}