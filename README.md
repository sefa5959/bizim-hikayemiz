# ❤️ Bizim Hikayemiz

Sadece ikinize ait, aşkınızın dijital hatıra defteri. Tamamen vanilla HTML, CSS
ve JavaScript ile yazılmış, kurulum gerektirmeyen bir Progressive Web App (PWA).

## Nasıl çalıştırılır

Tarayıcı güvenlik kuralları nedeniyle `fetch()` ile JSON dosyalarını okuyabilmesi
için proje bir web sunucusu üzerinden açılmalıdır (dosyayı çift tıklayarak
`file://` üzerinden açmak çalışmaz).

En kolay yol:

```bash
cd bizim-hikayemiz
python3 -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresini açın.

iPhone'da "Ana Ekrana Ekle" ile gerçek bir uygulama gibi kurabilirsiniz.

## Varsayılan PIN kodları

- Giriş ekranı PIN'i: `settings.json` içindeki `pin` alanı (varsayılan: `1907`)
- Gizli sayfa PIN'i: `settings.json` içindeki `secretPin` alanı (varsayılan: `0704`)

PIN kodunu Ayarlar sayfasından da değiştirebilirsiniz.

## Klasör yapısı

```
bizim-hikayemiz/
├── index.html        Uygulamanın tamamı (tüm ekranlar tek sayfada)
├── styles.css         Tüm görsel tasarım
├── script.js          Tüm uygulama mantığı
├── manifest.json      PWA manifesti
├── sw.js              Service worker (çevrimdışı destek)
├── settings.json      PIN, tema, müzik listesi, özel günler
├── memories.json      Fotoğraflar, videolar, zaman çizelgesi
├── letters.json       Aşk mektupları
├── photos/            Fotoğraf galerisi görselleri
├── videos/            Video dosyaları ve kapak görselleri
├── music/             Çalma listesi ses dosyaları
└── icons/             Uygulama simgeleri ve açılış ekranları
```

## İçeriği kendinize göre düzenleme

Hiçbir metin veya medya kodun içine gömülü değildir. Kendi anılarınızı eklemek için:

1. Fotoğraflarınızı `photos/` klasörüne kopyalayın ve `memories.json` içindeki
   `photos` dizisine yeni bir kayıt ekleyin.
2. Videolarınızı `videos/` klasörüne kopyalayın ve `memories.json` içindeki
   `videos` dizisine ekleyin (bir de kapak görseli / poster ekleyin).
3. Mektuplarınızı `letters.json` dosyasına ekleyin.
4. Müzik dosyalarınızı `music/` klasörüne koyup `settings.json` içindeki
   `music.playlist` dizisine ekleyin.
5. İlişki başlangıç tarihinizi, isimlerinizi ve özel günlerinizi
   `settings.json` üzerinden güncelleyin.

## Özellikler

- PIN korumalı giriş ekranı
- Gerçek zamanlı ilişki sayacı (gün / saat / dakika / saniye)
- Masonry düzeninde fotoğraf galerisi, tam ekran görüntüleyici, kaydırma ve
  yakınlaştırma desteği
- Video galerisi
- Yazma animasyonlu aşk mektupları, favori işaretleme
- Otomatik oluşturulan dikey zaman çizelgesi
- Alt menülü, yüzen oynatıcılı müzik çalar
- Ayarlar: tema, animasyonlar, ilişki tarihi, PIN değiştirme
- Özel günlerde otomatik kutlama animasyonları (Sevgililer Günü, yıl dönümü,
  doğum günleri, yılbaşı, Noel)
- Logoya 7 kez dokunarak açılan, PIN korumalı gizli sayfa
- Tamamen çevrimdışı çalışabilen PWA (service worker + manifest)
