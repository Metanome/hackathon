<p align="center">
  <img src="frontend/src/assets/logo-icon.svg" width="72" height="72" alt="Esnaf Tezgahı" />
</p>
<h1 align="center">Esnaf Tezgahı</h1>
<p align="center"><em>Akıllı Esnaf Asistanı</em></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Lisans-AGPL%20v3-blue.svg" alt="Lisans: AGPL v3" /></a>
</p>

**Esnaf Tezgahı**, Türk KOBİ'leri için — yerel kooperatifler, butik dükkanlar ve mahalle marketleri için — geliştirilmiş çok modlu, ajanlı bir yapay zeka platformudur.

**YZTA 5.0 Hackathon** kapsamında geliştirilen bu proje, manuel veri girişini ortadan kaldırarak geleneksel perakende işlemlerini modernize eder. Esnaflar; sesli komutlar, el yazısı sipariş fişlerinin ve depo raflarının fotoğrafları aracılığıyla stok yönetimi, sipariş işleme ve tedarikçi iletişimini — Türkçe veya İngilizce — tamamen otomatik olarak gerçekleştirebilir.

## Sorun

Türkiye'nin küçük esnafı — bakkallar, yerel kooperatifler, pazar tezgahları — işlerini kağıt üzerinde yürütüyor. Siparişler elle yazılıyor, stok defterlerde takip ediliyor, tedarikçi iletişimi telefonla kuruluyor. Bu durum; kurumsal yazılımların çözemediği bir hata, stok tükenmesi ve gelir kaybı döngüsü yaratıyor — çünkü o yazılımlar çok pahalı, çok karmaşık ve farklı bir kullanıcı için tasarlanmış.

Engel isteksizlik değil. Engel arayüz. Bilgisayara ürün adı ve miktar yazmak, kağıda yazmaktan daha yavaş. Esnaf dijital araçları benimsemiyor çünkü dijital araçlar onların çalışma biçimine uyum sağlamıyor.

## Çözüm

Esnaf Tezgahı, esnaflara bulundukları yerde kavuşuyor. Yeni bir iş akışı dayatmak yerine, zaten kullandıkları girdileri kabul ediyor — el yazısı sipariş fişinin fotoğrafı, Türkçe sesli not, depo rafının hızlı taraması — ve geri kalanını otomatik olarak hallediyor.

- Esnaf el yazısı sipariş fişini fotoğraflıyor → platform okuyor, siparişi oluşturuyor ve stoğu düşüyor.
- Esnaf mal geldi diye sesli not kaydediyor → envanter anında güncelleniyor.
- Esnaf rafı fotoğraflıyor → stok seviyeleri tahmin ediliyor ve sisteme işleniyor.
- Stok azaldığında otomatik yeniden sipariş e-postası tedarikçiye gönderiliyor.

Form yok. Yazma yok. Eğitim gerekmez. Sadece zaten ellerinde olan araçlar — bir telefon ve kendi dilleri.

## Günlük Hayattan Bir Senaryo

**Mehmet Bey**, Ankara'da küçük bir bakkal kooperatifi işletiyor. Salı sabahı şöyle geçiyor:

1. Mal teslimatı geliyor. Mehmet Bey telefonu ile depo rafının fotoğrafını çekip yüklüyor. Esnaf Tezgahı görüntüyü tarayarak her ürünü tanımlıyor, miktarları tahmin ediyor ve envanteri saniyeler içinde güncelliyor.

2. Tanıdık bir müşteri sipariş veriyor. Mehmet Bey Türkçe kısa bir sesli not kaydediyor: *"Ahmet Bey'e 3 kilo domates, 2 kilo soğan."* Platform sesi yazıya döküyor, kalemleri ürün kataloğuyla eşleştiriyor, siparişi oluşturuyor ve stoğu otomatik olarak düşüyor.

3. Günün sonunda Mehmet Bey'in paneli zeytinyağında düşük stok uyarısı gösteriyor. Esnaf Tezgahı tedarikçisine yeniden sipariş e-postasını çoktan göndermiş bile.

Mehmet Bey hiç elektronik tablo açmadı. Hiçbir ürün adı yazmadı. Sadece dükkanını işletti.

## Temel Özellikler

### 1. Çok Modlu Yapay Zeka Girişi
- **Sesli Zeka** — Türkçe veya İngilizce sesli not kaydedin ya da yükleyin. Platform sesi metne çevirir, yapısal niyeti (sipariş oluştur, stok güncelle, stok sorgula) çıkarır ve anında harekete geçer.
- **Sipariş Fişi OCR** — El yazısı sipariş fişinin fotoğrafını çekin. Vision Ajanı fişi okur, ürünleri eşleştirir, siparişi oluşturur ve stoğu günceller.
- **Raf Taraması** — Depo rafının fotoğrafını çekin. Vision Ajanı görünür her ürünün stok miktarını tahmin ederek envanterde günceller.
- **Otomatik Yönlendirme** — Özel bir Sınıflandırıcı Ajan her medya dosyasını inceler ve doğru alt ajana yönlendirir; manuel seçim gerekmez.

### 2. Stok Yönetimi
- Ürün adı, SKU (boş bırakılırsa otomatik oluşturulur), kategori, birim fiyat, stok miktarı, yeniden sipariş eşiği, tedarikçi adı ve tedarikçi e-postası ile tam **CRUD** desteği.
- **11 kanonik birim** (`pcs`, `kg`, `g`, `L`, `ml`, `pkg`, `box`, `btl`, `carton`, `sack`, `bunch`) dil-bağımsız anahtar olarak saklanır ve aktif arayüz diline göre görüntülenir.
- Stok tablosu satırında doğrudan **hızlı satır içi düzenleme**.
- Tedarikçi bilgileri dahil tüm alanlarla **tam modal düzenleme**.
- Ürün adı / SKU'ya göre ve stok durumuna (Normal / Düşük / Kritik) göre **arama ve filtreleme**.
- Sayfa başına 20 satır **sayfalandırılmış tablo**; mobil uyumlu sütun gizleme ile.
- **CSV içe aktarma** — yapılandırılmış CSV dosyası ile toplu ürün yükleme.
- **Pydantic doğrulaması** — `stock_quantity`, `reorder_threshold` ve `unit_price` alanları API katmanında `≥ 0` kısıtını zorunlu kılar.

### 3. Sipariş Yönetimi
- Siparişler yapay zeka ajanları tarafından otomatik veya manuel olarak oluşturulur.
- Her sipariş bir **durum iş akışı** taşır: `Bekliyor → Tamamlandı / İptal`.
- **Tamamlanma anında stok düşümü** — bir sipariş tamamlandı olarak işaretlendiğinde sistem, düşüm yapmadan önce tüm kalemlerin yeterli stoğa sahip olduğunu doğrular. Herhangi bir üründe eksiklik varsa tamamlama, kalem bazlı ayrıntılı hata mesajıyla reddedilir.
- Sipariş kalemleri ürün adı, miktar, birim ve birim fiyatı gösterir.

### 4. Uyarılar ve Tedarikçi Otomasyonu
- Her stok değişikliğinin (manuel düzenleme, CSV içe aktarma, yapay zeka güncellemesi) ardından arka plan görevi çalışır ve her ürünü yeniden sipariş eşiğine göre kontrol eder.
- Uyarılar **Düşük** (stok < eşik) veya **Kritik** (stok ≤ eşiğin %20'si) olarak sınıflandırılır.
- Kayıtlı tedarikçi e-postası olan **Kritik** ürünler için platform, gönderime hazır profesyonel bir yeniden sipariş e-postasını otomatik olarak taslak oluşturur.
- Uyarılar Uyarılar sayfasından kapatılabilir; okunmamış sayısı başlık çan ikonunda gerçek zamanlı olarak gösterilir.

### 5. Ajanlı Mimari ve Şeffaflık
Dört özel Gemini tabanlı ajan:

| Ajan | Sorumluluk |
|---|---|
| **Sınıflandırıcı** | Gelen medyayı inceler, türünü belirler (sipariş fişi / raf taraması / bilinmeyen) ve yönlendirir |
| **Vision** | OCR ve bağlamsal akıl yürütme kullanarak görüntülerden yapısal sipariş veya stok verisi çıkarır |
| **Ses** | Sesi metne döker; niyet ve varlıkları (ürün, miktar, birim, müşteri) tanımlar |
| **Planlayıcı** | Alınan her eylem için insan tarafından okunabilir, şeffaf bir akıl yürütme günlüğü oluşturur |

Her yükleme, arayüzde tam düşünce zincirini ve zaman damgalı eylem günlüğünü gösteren bir **Akıl Yürütme Paneli** üretir. Tüm ajan çalışmaları denetim için **Aktivite** günlüğüne kaydedilir.

### 6. Gerçek Zamanlı Güncellemeler
- Bir **Sunucu Taraflı Olaylar (SSE)** kanalı, herhangi bir veri değişikliğinin ardından arka uçtan bağlı tüm istemcilere anında `"update"` olayı gönderir — yoklama gerekmez.
- Dashboard metrikleri, stok sayıları, uyarılar ve sipariş listeleri canlı olarak yenilenir.

### 7. İki Dilli Arayüz (Türkçe / İngilizce)
- Her etiket, yer tutucu, hata mesajı ve yapay zeka eylem dizesi için tam çeviri kapsamı.
- Dil, ilk açılışta tarayıcı yerel ayarından otomatik algılanır; kullanıcı profilinde veritabanına kaydedilir.
- Masaüstü başlığında veya mobil kullanıcı menüsünde bulunan geçiş butonu dili anında değiştirir.
- Yapay zeka istemleri, Gemini'ye aktif dilde yanıt vermesini söyler; arka uç eylem dizeleri de `i18n.py` aracılığıyla çevrilir.

### 8. Tema ve Erişilebilirlik
- **Koyu / Açık temalar** — CSS özel özellikleriyle desteklenen Gece Mora koyu modu ve temiz bir açık mod.
- **Animasyonlu tema geçişi** — Chrome/Edge'de pürüzsüz tam sayfa çapraz solma için View Transitions API kullanır; diğer tarayıcılarda CSS geçişlerine geri düşer.
- **3 yazı boyutu seviyesi** — Orta / Büyük / Çok Büyük, kullanıcı menüsünden döngüsel olarak değiştirilebilir.
- **Azaltılmış hareket desteği** — `prefers-reduced-motion` ayarlıysa tüm geçişler anlık hâle gelir.

### 9. Ayarlar ve Profil
- **İlk kurulum sihirbazı** — ilk kullanımdan önce görünüm adı ve işletme adı ister.
- **Profil düzenleyici** — kullanıcı menüsünden erişilir; görünüm adı, işletme adı ve dil tercihini günceller.
- **Kullanıcı menüsü kontrolleri** — tema geçişi, dil geçişi ve yazı boyutu döngüsü tüm sayfalarda avatar menüsünden erişilebilir (masaüstü başlığında da hızlı erişim butonları olarak sunulur).
- **Model seçici** — API'den dinamik olarak çekilen mevcut Gemini modellerinden seçim yapın.
- **API anahtarı güncelleme** — yeniden başlatmaya gerek kalmadan aktif Gemini API anahtarını çalışma zamanında değiştirin.
- **Veritabanı sıfırlama** — Ayarlar sayfasının Tehlike Bölgesi'nden veritabanını siler ve yeniden tohumlar.

## Uygulama Sayfaları

| Sayfa | Açıklama |
|---|---|
| **Dashboard** | KPI kartları (bugünkü siparişler, toplam gelir, aktif uyarılar, toplam ürün), envanter sağlık çubuğu (Normal / Düşük / Kritik dağılımı), aktif uyarılar listesi (en fazla 5, satır içi kapatılabilir) |
| **Yükle** | Sipariş fişi görüntüsü, raf taraması görüntüsü ve tarayıcı mikrofonu ses kaydedici için sürükle-bırak veya tıkla alanı |
| **Stok** | Arama, filtreleme, satır içi düzenleme, CSV içe aktarma ve Ürün Ekle modalı ile sayfalandırılmış ürün tablosu |
| **Siparişler** | Durum rozetleri, genişletilebilir kalem detayları ve tamamla/iptal eylemleriyle tam sipariş listesi |
| **Uyarılar** | Önem derecesi rozetleri ve kapatma kontrolleriyle aktif stok uyarıları |
| **Aktivite** | Giriş türü, akıl yürütme, alınan eylemler ve kullanılan model ile kronolojik ajan eylem günlüğü |
| **Ayarlar** | Gemini model seçimi, Gemini API anahtarı güncelleme, mevcut model/anahtar durumu ve veritabanı sıfırlama (Tehlike Bölgesi) |

## Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Arka Uç** | Python 3.11, FastAPI 0.115, SQLite, Pydantic v2, `google-genai` 1.14, `uvicorn` |
| **Ön Uç** | React 18, Vite, TailwindCSS v4, CSS Özel Özellikleri |
| **Yapay Zeka** | Google Gemini (`gemini-2.0-flash` varsayılan; model yapılandırılabilir) |
| **Gerçek Zamanlı** | Sunucu Taraflı Olaylar (SSE) |
| **Test** | Manuel |

## Proje Yapısı

```
hackathon/
├── backend/
│   ├── agents/              # sınıflandırıcı, vision, ses, planlayıcı ajanlar
│   ├── repositories/        # ProductRepository, OrderRepository, AlertRepository, AgentLogRepository
│   ├── routers/             # FastAPI rota işleyicileri (stok, siparişler, uyarılar, yükleme, ayarlar, olaylar)
│   ├── schemas/             # Ürünler, siparişler, uyarılar, ajanlar, ayarlar için Pydantic modelleri
│   ├── services/            # alert_service, event_service, gemini_service
│   ├── config.py            # .env'den Pydantic Settings
│   ├── database.py          # SQLite başlatma ve tablo oluşturma
│   ├── i18n.py              # Arka uç dize çevirileri (TR/EN)
│   ├── prompts.py           # Gemini istem şablonları
│   ├── seed.py              # Örnek veri ekleyici
│   └── main.py              # FastAPI uygulama giriş noktası
└── frontend/
    ├── src/
    │   ├── api/             # Axios istemcisi + kaynak başına API modülleri
    │   ├── components/      # Header, Navbar, UserMenu, Icons, StockBadge vb.
    │   ├── hooks/           # useInventory, useOrders, useAlerts, useToast
    │   ├── pages/           # Dashboard, Yükle, Stok, Siparişler, Uyarılar, Aktivite, Ayarlar
    │   ├── providers/       # ThemeProvider, ProfileProvider
    │   ├── constants.js     # Tüm TR/EN çevirileri, birim etiketleri, rota sabitleri
    │   └── index.css        # CSS değişkenleri, tema tanımları, global bileşen stilleri
    └── public/
```

## Kurulum

### Gereksinimler
- Python 3.11+
- Node.js 18+
- Bir Google Gemini API anahtarı ([buradan edinin](https://aistudio.google.com/app/apikey))

### 1. Arka Uç Kurulumu

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

Örnek env dosyasını kopyalayın ve API anahtarınızı ekleyin:
```bash
cp .env.example .env
```
```env
GEMINI_API_KEY=gemini_api_anahtariniz
DEFAULT_MODEL=gemini-2.0-flash
DATABASE_PATH=./esnaf.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Veritabanını örnek ürünlerle doldurun:
```bash
python seed.py
```

API sunucusunu başlatın:
```bash
python main.py
```

### 2. Ön Uç Kurulumu

```bash
cd frontend
npm install
```

Örnek env dosyasını kopyalayın:
```bash
cp .env.example .env
```
```env
VITE_CURRENCY_SYMBOL=₺
```

Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Platforma erişmek için tarayıcınızda [http://localhost:5173](http://localhost:5173) adresini açın.

> **Not:** Ön uç geliştirme sunucusu, `/api` isteklerini Vite yapılandırması aracılığıyla otomatik olarak `http://localhost:8000` adresine yönlendirir.

## CSV İçe Aktarma Formatı

Stok sayfasından toplu ürün içe aktarmak için UTF-8 kodlamalı bir CSV hazırlayın:

| Sütun | Zorunlu | Varsayılan | Notlar |
|---|---|---|---|
| `name` | ✓ | — | Ürün görünüm adı |
| `sku` | — | otomatik oluşturulur | Benzersiz tanımlayıcı; boş bırakılırsa `PRD-XXXXXXXX` olarak otomatik oluşturulur |
| `category` | — | `General` | |
| `stock_quantity` | — | `0` | ≥ 0 olmalı |
| `reorder_threshold` | — | `10` | ≥ 0 olmalı |
| `unit_price` | — | `0.00` | ≥ 0 olmalı |
| `unit` | — | `pcs` | Kanonik anahtar: `pcs`, `kg`, `g`, `L`, `ml`, `pkg`, `box`, `btl`, `carton`, `sack`, `bunch` |
| `supplier_name` | — | `""` | |
| `supplier_email` | — | `""` | Otomatik yeniden sipariş e-postaları için kullanılır |

## Hackathon Sunum Notları

Bu proje, **YZTA 5.0 Hackathon**'un temel kriterlerini karşılamaktadır: Python, FastAPI ve Google Gemini ile desteklenen sağlam çok ajanlı mimari kullanarak KOBİ operasyonlarını yapay zeka ile modernize etmek. Temel entegrasyonun ötesine geçerek özerk akıl yürütme, gerçek zamanlı olay akışı, iki dilli yerelleştirme ve üretime hazır bir ön uç uygulamaktadır.
