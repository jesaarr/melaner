'use client';
import { useState, useEffect } from 'react';
import { Heart, Lock, ChevronRight, ChevronLeft, PenTool, CheckCircle2, Cookie } from 'lucide-react';

interface Props { onClose: () => void; }

const YuzuncuGunSurprizi = ({ onClose }: Props) => {
  const [stage, setStage] = useState<'lock' | 'loading' | 'content' | 'final'>('lock');
  const [currentNote, setCurrentNote] = useState(0);
  const [hearts, setHearts] = useState<{ id: number, x: number }[]>([]);
  const [showPromise, setShowPromise] = useState(false);
  const [cookieNote, setCookieNote] = useState<string | null>(null);

  const fortuneCookies = [
    "varlığından çoook mutluyuuum",
    "nasıl ama afafuehsuekghs",
    "Bugün seni dünden daha çok özledim.",
    "Aramızdaki mesafeler kalplerimize engel değil.",
    "Sen benim hayatımdaki en güzel 'iyi ki'sin.",
    "Sesini duyduğumda dünyam güzelleşiyor."
  ];

  const messages = [
    { t: "Yanında değilim Melek, belki ellerini tutamıyorum ama bu ekranın her pikselinde sana olan sevgim var. Tam 100 gündür her sabah seninle uyandım, her gece seninle uyudum. Bu 100 gün, ömrümün geri kalanının sadece fragmanı sevgilim... Seni çok seviyorum.", p: "Söz veriyorum: Kavuştuğumuzda elini bir an bile bırakmayacağım." },
    { t: "Aramızdaki kilometreler sadece birer sayıdan ibaret. Kalbim her atışında senin adını sayıklıyor. Bu 100 gün boyunca mesafeleri sevgimizle kısalttık.", p: "Söz veriyorum: Her sabah senin sesinle uyanman için elimden geleni yapacağım." },
    { t: "Gözlerimi kapattığımda seni yanımda hissedebiliyorum. Kokun, sesin, gülüşün... Hepsi zihnimin en güzel köşesinde saklı.", p: "Söz veriyorum: Tüm hayallerini gerçekleştirmek için yanında olacağım." },
    { t: "Biliyor musun, sen benim hayatıma giren en güzel 'iyi ki'sin. Seninle geçen her saniye, ömrüme ömür katıyor.", p: "Söz veriyorum: En zor anında bile omzum senin huzurun olacak." },
    { t: "Dünyanın en güzel manzarası nedir biliyor musun? Senin o içten gülüşün. Ekranın ötesinden bile içimi ısıtan tek şeysin.", p: "Söz veriyorum: Gülüşünün solmasına asla izin vermeyeceğim." },
    { t: "100 gündür her sabah uyandığımda ilk işim telefonuma bakmak oldu. Senin bir mesajınla güne başlamak en büyük mutluluk.", p: "Söz veriyorum: Seni her gün dünyanın en şanslı kadını hissettireceğim." },
    { t: "Bazen gökyüzüne bakıyorum ve senin de aynı aya baktığını bilmek içimi huzurla dolduruyor. Tek bir kalpteyiz.", p: "Söz veriyorum: Mesafelerin bizi yormasına asla izin vermeyeceğim." },
    { t: "Sana olan özlemim bazen canımı yaksa da, bu özlemin sebebi sen olduğun için onu bile seviyorum.", p: "Söz veriyorum: Özlediğimiz her saniye için bin katı sarılacağım." },
    { t: "Sen benim sadece sevgilim değil, en yakın dostum, sırdaşım ve geleceğimsin. El ele daha nice 100 günlere!", p: "Söz veriyorum: Tüm sırlarımızı ve mutluluklarımızı beraber biriktireceğiz." },
    { t: "Ellerini tutacağım o anı düşlemek bile nefesimi kesiyor. O gün geldiğinde, bir daha asla bırakmayacağım.", p: "Söz veriyorum: Kavuştuğumuz gün zamanı durduracağım." },
    { t: "Bu dijital evrende sana küçük bir dünya kurdum. Belki dokunamıyorum ama ruhuna sarılıyorum.", p: "Söz veriyorum: Ruhuna her gün aynı aşkla dokunacağım." },
    { t: "Seninle konuşurken zamanın nasıl geçtiğini anlamıyorum. 100 günün her anı hafızamda bir pırlanta gibi saklı.", p: "Söz veriyorum: Gelecekteki 1000 günümüzü daha güzel kılacağım." },
    { t: "Seni sevmek, karanlık bir odada güneşin doğmasını izlemek gibi. Hayatımı aydınlattığın için teşekkürler.", p: "Söz veriyorum: Karanlığında her zaman güneşin olacağım." },
    { t: "Mesafeler sadece dokunmaya engeldir, sevmeye asla. Ben seni ruhumla seviyorum Melek.", p: "Söz veriyorum: Ruhumuz arasındaki bağ asla kopmayacak." },
    { t: "Bu yolun sonu kavuşmak... Sabrediyoruz çünkü sonunda sen varsın. Seni her şeyden çok seviyorum.", p: "Söz veriyorum: Bu hikayenin sonu hep 'mutluluk' olacak." }
  ];

  const bgColors = ["bg-pink-900", "bg-blue-900", "bg-purple-900", "bg-red-900", "bg-teal-900", "bg-orange-900", "bg-indigo-900", "bg-emerald-900", "bg-rose-900", "bg-cyan-900", "bg-violet-900", "bg-amber-900", "bg-fuchsia-900", "bg-slate-900", "bg-red-600"];

  const addHeart = () => {
    const id = Date.now();
    setHearts(prev => [...prev, { id, x: Math.random() * 90 }]);
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 2000);
  };

  const openCookie = () => {
    const randomNote = fortuneCookies[Math.floor(Math.random() * fortuneCookies.length)];
    setCookieNote(randomNote);
    setTimeout(() => setCookieNote(null), 3000);
  };

  useEffect(() => {
    if (stage === 'loading') {
      const timer = setTimeout(() => setStage('content'), 1500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-700 ${stage === 'final' ? 'bg-black' : bgColors[currentNote]} text-white overflow-hidden`}>
      
      {hearts.map(h => <div key={h.id} className="heart-fly" style={{ left: `${h.x}%` }}>❤️</div>)}

      {/* ŞANS KURABİYESİ NOTU (POPUP) */}
      {cookieNote && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] bg-amber-100 text-amber-900 px-6 py-3 rounded-2xl shadow-2xl animate-bounce font-bold italic text-sm border-2 border-amber-300">
          🍪 {cookieNote}
        </div>
      )}

      {/* 1. KİLİT EKRANI */}
      {stage === 'lock' && (
        <div className="text-center space-y-6 scale-90 md:scale-100">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 animate-pulse">
            <Lock size={32} className="text-pink-400" />
          </div>
          <h2 className="text-2xl font-black italic">MELEK'E ÖZEL</h2>
          <button onClick={() => setStage('loading')} className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs tracking-widest uppercase">Giriş</button>
        </div>
      )}

      {/* 2. YÜKLEME EKRANI */}
      {stage === 'loading' && (
        <div className="text-center">
          <div className="loader mx-auto mb-4"></div>
          <p className="italic">Hazırlanıyor...</p>
        </div>
      )}

      {/* 3. İÇERİK EKRANI */}
      {stage === 'content' && (
        <div className="w-full max-w-[90%] md:max-w-xl p-4 relative">
          
          {/* Sol Kurabiye */}
          <button onClick={openCookie} className="absolute left-[-10px] top-1/2 -translate-y-1/2 z-10 hover:scale-125 transition-transform bg-white/10 p-2 rounded-full backdrop-blur-sm">
            <Cookie size={28} className="text-amber-400" />
          </button>

          {/* Sağ Kurabiye */}
          <button onClick={openCookie} className="absolute right-[-10px] top-1/2 -translate-y-1/2 z-10 hover:scale-125 transition-transform bg-white/10 p-2 rounded-full backdrop-blur-sm">
            <Cookie size={28} className="text-amber-400" />
          </button>

          <div className="bg-black/40 backdrop-blur-xl rounded-[30px] p-6 md:p-10 border border-white/10 shadow-2xl">
            
            <div className="mb-6 flex justify-between text-[10px] font-bold opacity-40 tracking-widest">
              <span>GÜN 100</span>
              <span>{currentNote + 1} / 15</span>
            </div>

            <div className="min-h-[180px] md:min-h-[220px] flex flex-col items-center justify-center text-center">
              <p className="text-lg md:text-2xl font-serif italic leading-snug">
                "{messages[currentNote].t}"
              </p>
              
              {showPromise && (
                <div className="mt-4 p-4 bg-pink-500/20 border border-pink-500/30 rounded-2xl animate-in zoom-in duration-300">
                   <p className="text-pink-300 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1">
                     <CheckCircle2 size={12} /> Mert'in Sözü
                   </p>
                   <p className="text-sm italic italic leading-tight">"{messages[currentNote].p}"</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={addHeart} className="p-3 bg-white/5 rounded-full hover:bg-pink-600 active:scale-90">
                <Heart size={20} fill="white" />
              </button>
              <button onClick={() => setShowPromise(!showPromise)} className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20 flex items-center gap-2">
                <PenTool size={14} /> {showPromise ? "Gizle" : "Sözümü Gör"}
              </button>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button 
                disabled={currentNote === 0} 
                onClick={() => {setCurrentNote(prev => prev - 1); setShowPromise(false);}} 
                className={`p-2 ${currentNote === 0 ? 'opacity-0' : 'text-white'}`}
              >
                <ChevronLeft size={28} />
              </button>
              
              <button 
                onClick={() => {
                  if(currentNote === messages.length - 1) setStage('final');
                  else { setCurrentNote(prev => prev + 1); setShowPromise(false); }
                }} 
                className="px-6 py-3 bg-white text-black rounded-full font-black text-[10px] tracking-tighter"
              >
                {currentNote === messages.length - 1 ? "MÜHÜRLE ❤️" : "SIRADAKİ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SÜPRİZ FİNAL */}
      {stage === 'final' && (
        <div className="text-center p-6 space-y-6 scale-90 md:scale-100 max-w-lg">
           <div className="relative inline-block">
              <Heart size={80} className="text-pink-500 fill-pink-500 animate-pulse" />
           </div>
           <h1 className="text-4xl md:text-6xl font-black italic leading-tight">İYİ Kİ VARSIN MELEK!</h1>
           <p className="text-white/60 font-serif italic text-lg">Bu 100 gün sadece fragmandı, asıl film yeni başlıyor sevgilim...</p>
           <button onClick={onClose} className="px-10 py-4 bg-pink-600 rounded-full font-black text-xs tracking-widest">SONSUZLUĞA DÖN</button>
        </div>
      )}

      <style jsx>{`
        .loader { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #db2777; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .heart-fly { position: absolute; bottom: -50px; font-size: 24px; animation: fly 2s linear forwards; }
        @keyframes fly { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-110vh) scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default YuzuncuGunSurprizi;