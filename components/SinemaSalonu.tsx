'use client';

import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { Play, Pause, Link, Tv, Send, MessageSquare } from 'lucide-react';

export default function SinemaSalonu({ user }: { user: string }) {
  const [videoSource, setVideoSource] = useState({ type: 'youtube', id: 'dQw4w9WgXcQ' });
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const playerRef = useRef<any>(null);
  const videoTagRef = useRef<HTMLVideoElement>(null);
  const isUpdatingRef = useRef(false);

  // 1. VİDEO DURUMUNU DİNLE
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

  // 2. SİNEMA CHAT DİNLE
  useEffect(() => {
    const q = query(collection(db, "sinema_chat"), orderBy("timestamp", "desc"), limit(20));
    const unsubChat = onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    });
    return () => unsubChat();
  }, []);

  const handleUrlSubmit = async () => {
    let source = { type: 'youtube', id: '' };
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      source.id = inputUrl.split('v=')[1]?.split('&')[0] || inputUrl.split('/').pop() || '';
    } else {
      source = { type: 'direct', id: inputUrl }; // mp4 linki falan gelirse
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
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto p-4">
      
      {/* SOL TARAF: VİDEO ALANI */}
      <div className="flex-1 space-y-4">
        <div className="bg-black rounded-[32px] overflow-hidden shadow-2xl aspect-video border-4 border-white/20 relative">
          {videoSource.type === 'youtube' ? (
            <YouTube 
              videoId={videoSource.id} 
              opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0 } }} 
              onReady={(e) => playerRef.current = e.target}
              onStateChange={async (e) => {
                if (isUpdatingRef.current) return;
                await updateDoc(doc(db, "sinema", "durum"), {
                  isPlaying: e.data === 1, time: e.target.getCurrentTime(), sender: user
                });
              }}
              className="w-full h-full"
            />
          ) : (
            <video 
              ref={videoTagRef}
              src={videoSource.id}
              controls
              className="w-full h-full"
              onPlay={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: true, time: videoTagRef.current?.currentTime, sender: user })}
              onPause={() => !isUpdatingRef.current && updateDoc(doc(db, "sinema", "durum"), { isPlaying: false, time: videoTagRef.current?.currentTime, sender: user })}
            />
          )}
        </div>

        <div className="flex gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md">
          <input 
            value={inputUrl} 
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="YouTube veya MP4 Linki..." 
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm"
          />
          <button onClick={handleUrlSubmit} className="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg">Yükle</button>
        </div>
      </div>

      {/* SAĞ TARAF: SİNEMA CHAT */}
      <div className="w-full lg:w-80 h-[450px] bg-white/80 backdrop-blur-xl rounded-[32px] shadow-xl flex flex-col border border-white/40">
        <div className="p-4 border-b flex items-center gap-2 font-bold text-gray-700">
          <MessageSquare size={18} className="text-blue-500" /> Sinema Chat
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.user === user ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-bold text-gray-400 uppercase px-1">{m.user}</span>
              <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] shadow-sm ${m.user === user ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50/50 rounded-b-[32px] flex gap-2">
          <input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Mesaj gönder..." 
            className="flex-1 bg-white border-none rounded-xl px-3 py-2 text-xs outline-none shadow-inner"
          />
          <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded-xl shadow-md"><Send size={16}/></button>
        </div>
      </div>

    </div>
  );
}