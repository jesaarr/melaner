# Mert & Melek - Özel İlişki Web Sitesi

Bu proje, uzak mesafe ilişkisi yaşayan Mert ve Melek çifti için tasarlanmış kişiselleştirilmiş, interaktif bir web sitesidir.

## Özellikler

- **Giriş Ekranı**: Minimalist animasyonlarla Mert ve Melek için ayrı giriş butonları.
- **Dashboard**: Tanışma ve kavuşma sayaçları, hava durumu widget'i.
- **İnteraktif Özellikler**: "Seni Özledim" butonu, ruh hali seçici.
- **Kişiselleştirilmiş Alanlar**: Sürpriz notlar, özel kutular.
- **Ortak Arşiv**: Zaman tüneli, bucket list, Spotify playlist.

## Teknoloji

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (Animasyonlar)
- Firebase (Backend ve veritabanı)

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Firebase konfigürasyonunu ayarlayın:
   - `.env.local` dosyasında Firebase anahtarlarını güncelleyin.

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Yapılandırma

- **Tarihler**: `app/dashboard/page.tsx` dosyasında başlangıç tarihini ve kavuşma tarihini güncelleyin.
- **Şifre**: `app/page.tsx` dosyasında şifreyi değiştirin.
- **Hava Durumu API**: Gerçek API entegrasyonu için OpenWeatherMap kullanın.
- **Firebase**: Firestore koleksiyonlarını oluşturun (counters, notes, etc.).

## Dağıtım

Vercel veya başka bir platformda dağıtabilirsiniz. Firebase konfigürasyonunu environment variables olarak ayarlayın.
