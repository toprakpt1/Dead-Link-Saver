<a id="readme-top"></a>

[![Katkıcılar][contributors-shield]][contributors-url]
[![Çatal][forks-shield]][forks-url]
[![Yıldızlar][stars-shield]][stars-url]
[![Sorunlar][issues-shield]][issues-url]
[![Lisans: GPL v3][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toprakpt1/Dead-Link-Saver">
    <img src="assets/icon.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Dead Link Saver</h3>

  <p align="center">
    Hafif, hızlı ve aşırı basit bağlantı kaydetme uygulaması.
    <br />
    <a href="https://github.com/toprakpt1/Dead-Link-Saver/issues/new?labels=bug&template=bug-report---.md">Hata Bildir</a>
    &middot;
    <a href="https://github.com/toprakpt1/Dead-Link-Saver/issues/new?labels=enhancement&template=feature-request---.md">Öneride Bulun</a>
    &middot;
    <a href="README.md">English</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>İçindekiler</summary>
  <ol>
    <li>
      <a href="#hakkimda">Hakkında</a>
      <ul>
        <li><a href="#kullanilan-teknolojiler">Kullanılan Teknolojiler</a></li>
      </ul>
    </li>
    <li>
      <a href="#baslarken">Başlarken</a>
      <ul>
        <li><a href="#gereksinimler">Gereksinimler</a></li>
        <li><a href="#kurulum">Kurulum</a></li>
      </ul>
    </li>
    <li><a href="#ozellikler">Özellikler</a></li>
    <li><a href="#ekran-goruntuleri">Ekran Görüntüleri</a></li>
    <li><a href="#kullanim">Kullanım</a></li>
    <li><a href="#proje-yapisi">Proje Yapısı</a></li>
    <li><a href="#yol-haritasi">Yol Haritası</a></li>
    <li><a href="#katkida-bulunma">Katkıda Bulunma</a></li>
    <li><a href="#lisans">Lisans</a></li>
    <li><a href="#gizlilik">Gizlilik</a></li>
    <li><a href="#iletisim">İletişim</a></li>
    <li><a href="#tesekkurler">Teşekkürler</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## Hakkında

**Dead Link Saver** — YouTube, Reddit, Instagram, GitHub, Medium ve diğer platformlardan kopyaladığınız linkleri tek dokunuşla kaydeden, otomatik olarak kategorize eden ve ölü linkleri tespit eden açık kaynak bir Android uygulamasıdır.

Linki yapıştırın, uygulama otomatik olarak başlık ve thumbnail çeksin, platformunu tanısın, kategorisini belirlesin — sıfır manuel işlem. 30 gündür açmadığınız linkleri "Unutulanlar" sekmesinde görün ve ölü linkleri Archive.org yedekleriyle birlikte keşfedin.

Reklam yok, takipçi yok, abonelik duvarı yok. Sadece linkleriniz.

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



### Kullanılan Teknolojiler

* [![React Native][ReactNative-shield]][ReactNative-url]
* [![Expo][Expo-shield]][Expo-url]
* [![TypeScript][TypeScript-shield]][TypeScript-url]
* [![Zustand][Zustand-shield]][Zustand-url]
* [![FlashList][FlashList-shield]][FlashList-url]

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- GETTING STARTED -->
## Başlarken

### Gereksinimler

* [Node.js](https://nodejs.org/) (LTS önerilir)
* [npm](https://www.npmjs.com/) veya [yarn](https://yarnpkg.com/)
* [Android Studio](https://developer.android.com/studio) (yerel Android derlemeleri için)
* [Java 17](https://openjdk.org/) veya üzeri

### Kurulum

1. Depoyu klonlayın
   ```sh
   git clone https://github.com/toprakpt1/Dead-Link-Saver.git
   cd Dead-Link-Saver
   ```
2. Bağımlılıkları yükleyin
   ```sh
   npm install
   ```
3. Geliştirme sunucusunu başlatın
   ```sh
   npx expo start
   ```
4. Android APK oluşturun
   ```sh
   npx expo prebuild --platform android
   cd android
   ./gradlew assembleRelease
   ```
   İmzasız APK şurada olacak: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- FEATURES -->
## Özellikler

- **Tek Tıkla Kaydet** — Linki yapıştır, uygulama gerisini halletsin
- **Platform Tanıma** — YouTube, Reddit, Twitter/X, GitHub, Instagram, Medium ve daha fazlası
- **Otomatik Meta Veri** — Başlık, thumbnail ve açıklama otomatik çekilir
- **Akıllı Kategorizasyon** — Eğitim, Eğlence, Kod, Haber, Rastgele — otomatik sınıflandırma
- **Özel Kategoriler** — Kendi kategorilerini oluştur ve yönet
- **Dead Link Kontrolü** — 404/500 veren linkleri tespit et, Archive.org yedeklerini göster
- **Unutulan Linkler** — 30+ gündür açmadığın linkleri ayrı bir sekmede gör
- **Favoriler** — Önemli linkleri yıldızla, öne çıkar
- **Link Durumu** — Unread / Watched / Saved — nerede kaldığını takip et
- **Kart Boyutlandırma** — Small, Medium, Large — görünümü kendine göre ayarla
- **Paylaşım Menüsü** — Android Share Intent ile her yerden link gönder
- **Offline Önbellekleme** — Tüm veriler cihazında kalır
- **Karanlık Tema** — Göz yormayan koyu arayüz

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- SCREENSHOTS -->
## Ekran Görüntüleri

| Ana Sayfa & Link Listesi | Unutulan Linkler | Ayarlar |
|---|---|---|
| *(ekran görüntüsü eklenecek)* | *(ekran görüntüsü eklenecek)* | *(ekran görüntüsü eklenecek)* |

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- USAGE -->
## Kullanım

1. **Link Kaydetme** — Ana ekrandaki input'a linki yapıştırın veya herhangi bir uygulamadan "Dead Link Saver" ile paylaşın.
2. **Otomatik İşleme** — Uygulama platformu tanır, başlık ve thumbnail çeker, kategori atar.
3. **Link Yönetimi** — Linke tıklayarak durumunu değiştirin (Unread → Watched → Saved), favoriye ekleyin veya silin.
4. **Kategori Filtreleme** — Üstteki chip'lerle linkleri kategoriye göre filtreleyin.
5. **Dead Link Taraması** — "Check Dead Links" butonuna basarak tüm linklerin canlılığını test edin.
6. **Unutulanları Keşfet** — "Unutulanlar" sekmesinde 30+ gündür açmadığınız linkleri görün.

### Android Paylaşım Menüsü
1. Chrome, YouTube, Twitter vb. bir uygulamada paylaş butonuna tıklayın
2. "Dead Link Saver" seçeneğini seçin
3. Link otomatik olarak kaydedilir

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- PROJECT STRUCTURE -->
## Proje Yapısı

```
Dead-Link-Saver/
├── app/                       # Expo Router sayfaları
│   ├── (tabs)/
│   │   ├── index.tsx          # Ana sayfa (link listesi + giriş)
│   │   ├── forgotten.tsx      # Unutulan linkler
│   │   ├── settings.tsx       # Ayarlar & kategori yönetimi
│   │   └── _layout.tsx        # Tab navigasyon
│   ├── _layout.tsx            # Root layout
│   └── +not-found.tsx         # 404 sayfası
├── components/                # UI bileşenleri
│   ├── LinkCard.tsx           # Link kartı
│   ├── LinkInput.tsx          # Link giriş alanı
│   ├── CategoryBadge.tsx      # Kategori rozeti
│   ├── CategoryPicker.tsx     # Kategori seçici
│   ├── StatusIndicator.tsx    # Durum göstergesi
│   └── OnboardingTutorial.tsx # İlk kullanım eğitimi
├── services/                  # İş mantığı servisleri
│   ├── linkParser.ts          # URL analizi & platform tespiti
│   ├── metadataFetcher.ts     # Meta veri çekme (OG, Microlink, YouTube oEmbed)
│   ├── linkChecker.ts         # Dead link kontrolü & Archive.org entegrasyonu
│   └── categoryClassifier.ts  # Otomatik kategorizasyon
├── store/                     # State yönetimi (Zustand)
│   ├── linkStore.ts           # Link store
│   ├── categoryStore.ts       # Kategori store
│   ├── settingsStore.ts       # Ayarlar store
│   ├── tutorialStore.ts       # Tutorial store
│   └── types.ts               # TypeScript tipleri
└── utils/                     # Yardımcı fonksiyonlar
    ├── storage.ts             # AsyncStorage wrapper
    └── constants.ts           # Sabitler & renk paleti
```

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- ROADMAP -->
## Yol Haritası

- [x] Link ekleme & silme
- [x] Otomatik platform tanıma
- [x] Meta veri çekme (başlık, thumbnail, açıklama)
- [x] Akıllı kategorizasyon
- [x] Özel kategori desteği
- [x] Link durumu yönetimi (Unread/Watched/Saved)
- [x] Dead link kontrolü & Archive.org entegrasyonu
- [x] Unutulan linkler (30+ gün)
- [x] Favorilere ekleme
- [x] Kart boyutlandırma
- [x] Android Share Intent entegrasyonu
- [x] Offline önbellekleme
- [x] Onboarding eğitimi
- [ ] Metin arama & filtreleme
- [ ] Sıralama seçenekleri
- [ ] Bulk işlemler (toplu silme/kategori değiştirme)
- [ ] AI özetleyici
- [ ] Kopya link tespiti
- [ ] Panodan otomatik kaydetme
- [ ] Etiket sistemi
- [ ] iOS Share Extension

Önerilen özelliklerin tam listesi için [açık issue'lara](https://github.com/toprakpt1/Dead-Link-Saver/issues) göz atın.

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- CONTRIBUTING -->
## Katkıda Bulunma

Açık kaynak topluluğunu harika yapan şey katkılardır. Her türlü katkı **memnuniyetle karşılanır**.

Bir öneriniz varsa, depoyu fork'layın ve bir pull request açın. Ayrıca "enhancement" etiketiyle bir issue de açabilirsiniz.
Projeye bir yıldız bırakmayı unutmayın! Tekrar teşekkürler!

1. Projeyi fork'layın
2. Özellik dalınızı oluşturun (`git checkout -b feature/HarikaOzellik`)
3. Değişikliklerinizi commitleyin (`git commit -m 'Harika bir özellik ekle'`)
4. Dalınıza push'layın (`git push origin feature/HarikaOzellik`)
5. Pull Request açın

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- LICENSE -->
## Lisans

GNU General Public License v3.0 ile dağıtılmaktadır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- PRIVACY -->
## Gizlilik

Dead Link Saver, gizlilik gözetilerek tasarlanmıştır:

- **Analiz, çökme raporu veya reklam yok** — sıfır telemetri
- Tüm linkleriniz **yerel olarak** cihazınızda saklanır
- **İnternet yalnızca** meta veri çekme ve dead link kontrolü için gereklidir — kaydettiğiniz URL'ler dışında hiçbir sunucuya veri gönderilmez
- Verilerinizi toplamıyoruz, satmıyoruz, görmüyoruz

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- CONTACT -->
## İletişim

Toprak Talha Karcılar — [@toprakpt1](https://github.com/toprakpt1)

Proje Linki: [https://github.com/toprakpt1/Dead-Link-Saver](https://github.com/toprakpt1/Dead-Link-Saver)

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Teşekkürler

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Zustand](https://github.com/pmndrs/zustand)
- [FlashList](https://shopify.github.io/flash-list/)
- [Lucide Icons](https://lucide.dev)
- [Microlink](https://microlink.io)
- [Internet Archive](https://archive.org)

<p align="right">(<a href="#readme-top">başa dön</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[contributors-url]: https://github.com/toprakpt1/Dead-Link-Saver/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[forks-url]: https://github.com/toprakpt1/Dead-Link-Saver/network/members
[stars-shield]: https://img.shields.io/github/stars/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[stars-url]: https://github.com/toprakpt1/Dead-Link-Saver/stargazers
[issues-shield]: https://img.shields.io/badge/Sorunlar-issues?style=for-the-badge
[issues-url]: https://github.com/toprakpt1/Dead-Link-Saver/issues
[license-shield]: https://img.shields.io/github/license/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[license-url]: https://github.com/toprakpt1/Dead-Link-Saver/blob/main/LICENSE

[ReactNative-shield]: https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[ReactNative-url]: https://reactnative.dev/
[Expo-shield]: https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white
[Expo-url]: https://expo.dev
[TypeScript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Zustand-shield]: https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=zustand&logoColor=white
[Zustand-url]: https://github.com/pmndrs/zustand
[FlashList-shield]: https://img.shields.io/badge/FlashList-000000?style=for-the-badge&logo=shopify&logoColor=white
[FlashList-url]: https://shopify.github.io/flash-list/
