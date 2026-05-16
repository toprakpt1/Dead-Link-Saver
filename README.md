# Dead Link Saver

Hafif, hızlı ve aşırı basit bağlantı kaydetme uygulaması. YouTube, Reddit, Instagram, Medium ve diğer platformlardan kopyaladığınız linkleri kaydedin, organize edin ve unutmayın.

## Özellikler

### MVP (v1.0)
- ✅ Tek tıkla link yapıştırma ve kaydetme
- ✅ Otomatik platform tanıma (YouTube, Reddit, Twitter, GitHub, vb.)
- ✅ Meta veri çekme (başlık, thumbnail, açıklama)
- ✅ Otomatik kategorizasyon (Eğitim, Eğlence, Kod, Haber, Rastgele)
- ✅ Link durumu yönetimi (Unread, Watched, Saved)
- ✅ Dead link kontrolü ve Archive.org entegrasyonu
- ✅ Unutulan linkler (30+ gün açılmayan)
- ✅ Offline önbellekleme
- ✅ Favorilere ekleme
- ✅ Paylaşım menüsü entegrasyonu (Android)

### Gelecek Özellikler
- 🔄 AI özetleyici
- 🔄 Kopya link tespiti
- 🔄 Panodan otomatik kaydetme
- 🔄 Etiket sistemi
- 🔄 Arama ve filtreleme

## Teknoloji Stack

- **Framework:** React Native (Expo)
- **State Yönetimi:** Zustand
- **Storage:** AsyncStorage
- **Liste Performansı:** FlashList
- **Meta Veri:** Cheerio (HTML parsing)
- **Routing:** Expo Router

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır
npm run ios
```

## Proje Yapısı

```
Dead-Link-Saver/
├── app/                    # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigasyon
│   │   ├── index.tsx      # Ana ekran
│   │   └── forgotten.tsx  # Unutulan linkler
│   └── _layout.tsx        # Root layout
├── components/            # UI bileşenleri
│   ├── LinkCard.tsx       # Link kartı
│   ├── LinkInput.tsx      # Link girişi
│   ├── CategoryBadge.tsx  # Kategori rozeti
│   └── StatusIndicator.tsx # Durum göstergesi
├── services/              # İş mantığı servisleri
│   ├── linkParser.ts      # URL analizi
│   ├── metadataFetcher.ts # Meta veri çekme
│   ├── linkChecker.ts     # Dead link kontrolü
│   └── categoryClassifier.ts # Kategorizasyon
├── store/                 # State yönetimi
│   ├── linkStore.ts       # Zustand store
│   └── types.ts           # TypeScript tipleri
└── utils/                 # Yardımcı fonksiyonlar
    ├── storage.ts         # AsyncStorage wrapper
    └── constants.ts       # Sabitler
```

## Mimari Kararlar

### State Yönetimi
- **Zustand** kullanıldı: Hafif, basit API, Redux karmaşıklığı yok
- Tüm link verileri tek bir store'da merkezi olarak yönetiliyor
- AsyncStorage ile otomatik senkronizasyon

### Performans
- **FlashList** kullanıldı: FlatList'ten 10x daha hızlı
- Lazy loading: Meta veriler arka planda çekiliyor
- Offline-first: Veriler önce local'de kaydediliyor

### UX Prensipleri
- Aşırı basit: Sadece yapıştır ve kaydet
- Sıfır konfigürasyon: Otomatik kategorizasyon
- Hızlı: Anında kaydetme, arka planda meta veri çekme

## Paylaşım Menüsü Kullanımı

### Android
1. Herhangi bir uygulamada (Chrome, YouTube, vb.) paylaş butonuna tıklayın
2. "Dead Link Saver" seçeneğini seçin
3. Link otomatik olarak kaydedilir

### iOS
iOS için Share Extension ayrı bir native modül gerektirir (gelecek sürümlerde eklenecek).

## Lisans

MIT
