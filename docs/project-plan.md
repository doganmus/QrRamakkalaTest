# İSG QR Bildirim Uygulaması – Ürün ve Teknik Plan

## 1) Net Ürün Kapsamı

### 1.1 Bildirim ve Erişim
- Bildirim modu: **Anonim** veya **isimli**, admin panelden aç/kapat.
- Form erişimi:
  - Girişsiz hızlı form
  - Telefon + OTP doğrulama
  - Mod seçimi admin panelden yönetilebilir.
- Bildirim türleri: Çoklu seçilebilir, **en az 1 tür zorunlu**.

### 1.2 Form ve Medya
- Zorunlu alanlar:
  - Olay türü
  - Açıklama (minimum karakter sınırı)
  - Lokasyon (QR + GPS)
  - Tarih/saat (otomatik)
  - Yaralanma var/yok
  - Acil müdahale gerekli mi
- Medya kuralları olay tipine göre admin panelden yönetilir.
- Medya yükleme/perf yaklaşımı:
  - On-prem object storage (MinIO/Ceph)
  - Thumbnail/preview üretimi
  - Video transcode, süre/boyut/çözünürlük limitleri
  - Lazy loading ve kademeli açma

### 1.3 Risk ve Süreç Yönetimi
- Risk metodu: **5x5 (Olasılık x Şiddet)**.
- Otomatik aksiyon kuralları (örn. skor >= eşik için acil bildirim).
- Süreç akışı:
  1. Yeni
  2. İncelemede
  3. Aksiyon Atandı
  4. Doğrulandı
  5. Kapatıldı
  6. Tekrar Açıldı

### 1.4 Bildirim, Raporlama, Uyumluluk
- Bildirim kanalları: Uygulama içi, e-posta, SMS, WhatsApp (kural bazlı).
- Raporlar:
  - Tarih, lokasyon, departman, olay türü, risk skoru
  - Durum, kök neden, sorumlu ekip
  - SLA, tekrar eden olay analizi
- Dashboard KPI seti:
  - Toplam bildirim
  - Açık/kapalı oran
  - Ortalama kapanma süresi
  - Yüksek riskli açık kayıtlar
  - 30 gün trend
  - Isı haritası
  - Top 10 tekrar eden risk
  - Geciken aksiyonlar
- KVKK:
  - Minimum kişisel veri
  - Audit trail
  - Saklama süresi admin panelden yönetimi (1/2/5 yıl vb.)

### 1.5 Dil ve Entegrasyon
- Çok dilli altyapı (ilk faz Türkçe).
- Entegrasyon hedefleri:
  - Excel/PDF dışa aktarma
  - REST API
  - LDAP/AD
  - Kurumsal SMTP

---

## 2) MVP / Faz Planı

## 2.1 MVP (8-10 Hafta)
- QR oluşturma ve lokasyon atama
- Mobil uyumlu bildirim formu (girişsiz/OTP)
- Anonim-isimli toggle
- Olay türü ve validasyon kuralları
- 5x5 risk hesaplama
- Workflow v1
- DÖF atama ve takip
- Dashboard v1 ve temel raporlar
- Excel/PDF export
- KVKK ve saklama süresi ayarları

## 2.2 Faz 2
- Gelişmiş yetki matrisi (ekran/işlem bazlı)
- WhatsApp Business entegrasyonu genişletme
- API genişletme ve BI entegrasyonları
- Çok dil aktivasyonu (EN/AR)
- Gelişmiş analitik ve kök neden sınıflama
- Opsiyonel offline senaryolar

---

## 3) Bulutsuz (On-Prem) Teknik Mimari

- Frontend: React/Vue (mobil öncelikli)
- Backend: Node.js/.NET/Java (kurumsal standarda göre)
- Veritabanı: PostgreSQL
- Medya depolama: MinIO (S3 uyumlu, on-prem)
- Kuyruk/arka plan işler: Redis + Worker
- Kimlik yönetimi: LDAP/AD + OTP katmanı
- Bildirim: SMTP + SMS gateway + WhatsApp provider
- Dağıtım: Docker Compose veya Kubernetes (kurum ölçeğine göre)

---

## 4) Veritabanı Tablo Şeması (ERD Mantığı)

## 4.1 Çekirdek Tablolar

### users
- id (PK)
- full_name
- phone
- email
- is_active
- created_at

### roles
- id (PK)
- code (SUPER_ADMIN, EHS_EXPERT, LOCATION_MANAGER, VIEWER, DEPT_MANAGER)
- name

### user_roles
- id (PK)
- user_id (FK -> users)
- role_id (FK -> roles)

### locations
- id (PK)
- name
- code
- department_id (FK -> departments)
- latitude
- longitude
- is_active

### departments
- id (PK)
- name
- code

### qr_codes
- id (PK)
- location_id (FK -> locations)
- label
- token (unique)
- is_active
- created_by (FK -> users)
- created_at

### incident_types
- id (PK)
- code (NEAR_MISS, HAZARD, ACCIDENT, NON_COMPLIANCE, ENVIRONMENT, OTHER)
- name
- is_active

### reports
- id (PK)
- qr_code_id (FK -> qr_codes)
- location_id (FK -> locations)
- reporter_mode (ANONYMOUS | IDENTIFIED)
- reporter_user_id (nullable FK -> users)
- reporter_phone_masked (nullable)
- description
- has_injury (bool)
- needs_emergency (bool)
- gps_lat
- gps_lng
- reported_at
- status_id (FK -> workflow_statuses)
- risk_score
- risk_probability
- risk_severity
- created_at

### report_incident_types
- id (PK)
- report_id (FK -> reports)
- incident_type_id (FK -> incident_types)

### report_media
- id (PK)
- report_id (FK -> reports)
- media_type (PHOTO | VIDEO)
- object_key
- thumbnail_key
- duration_seconds (nullable)
- file_size_bytes
- mime_type
- created_at

### workflow_statuses
- id (PK)
- code (NEW, IN_REVIEW, ACTION_ASSIGNED, VERIFIED, CLOSED, REOPENED)
- name
- sort_order

### report_status_history
- id (PK)
- report_id (FK -> reports)
- from_status_id (FK -> workflow_statuses)
- to_status_id (FK -> workflow_statuses)
- changed_by (FK -> users)
- note
- changed_at

### actions
- id (PK)
- report_id (FK -> reports)
- title
- description
- assigned_to (FK -> users)
- due_date
- completed_at (nullable)
- status (OPEN | DONE | OVERDUE)

### risk_rules
- id (PK)
- min_score
- max_score
- channel_config_id (FK -> notification_channel_configs)
- priority
- is_active

### notification_channel_configs
- id (PK)
- in_app_enabled
- email_enabled
- sms_enabled
- whatsapp_enabled
- template_code

### notifications
- id (PK)
- report_id (FK -> reports)
- channel (IN_APP | EMAIL | SMS | WHATSAPP)
- recipient
- payload_json
- status (QUEUED | SENT | FAILED)
- sent_at (nullable)

### media_rules
- id (PK)
- incident_type_id (FK -> incident_types)
- photo_required (bool)
- video_allowed (bool)
- max_video_seconds
- max_file_size_mb
- updated_by (FK -> users)

### retention_policies
- id (PK)
- data_type (REPORT | MEDIA | AUDIT_LOG)
- retention_days
- is_active
- updated_by (FK -> users)

### audit_logs
- id (PK)
- actor_user_id (nullable FK -> users)
- action
- entity_type
- entity_id
- old_value_json
- new_value_json
- created_at
- ip_address

## 4.2 Önemli İlişkiler
- users n:n roles (user_roles)
- locations 1:n qr_codes
- reports n:n incident_types
- reports 1:n report_media
- reports 1:n actions
- reports 1:n report_status_history
- reports n:1 workflow_statuses (current status)

---

## 5) API Endpoint Listesi (MVP Odaklı)

## 5.1 Auth / Session
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/login` (admin)
- `POST /api/v1/auth/logout`

## 5.2 Public QR & Report
- `GET /api/v1/public/qr/{token}` (QR doğrula + form meta)
- `POST /api/v1/public/reports` (bildirim oluştur)
- `POST /api/v1/public/reports/{id}/media/presign` (upload URL)
- `POST /api/v1/public/reports/{id}/media/complete`

## 5.3 Reports (Admin)
- `GET /api/v1/reports`
- `GET /api/v1/reports/{id}`
- `PATCH /api/v1/reports/{id}/status`
- `POST /api/v1/reports/{id}/actions`
- `PATCH /api/v1/actions/{actionId}`
- `POST /api/v1/reports/{id}/reopen`

## 5.4 QR & Lokasyon
- `GET /api/v1/locations`
- `POST /api/v1/locations`
- `PATCH /api/v1/locations/{id}`
- `GET /api/v1/qr-codes`
- `POST /api/v1/qr-codes`
- `PATCH /api/v1/qr-codes/{id}/active`
- `GET /api/v1/qr-codes/{id}/image`

## 5.5 Rules / Config
- `GET /api/v1/config/reporting`
- `PATCH /api/v1/config/reporting` (anonim/OTP/girişsiz)
- `GET /api/v1/media-rules`
- `PUT /api/v1/media-rules/{incidentTypeId}`
- `GET /api/v1/risk-rules`
- `PUT /api/v1/risk-rules/{id}`
- `GET /api/v1/notification-channels`
- `PUT /api/v1/notification-channels/{id}`
- `GET /api/v1/retention-policies`
- `PUT /api/v1/retention-policies/{id}`

## 5.6 Dashboard & Reporting
- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/trends`
- `GET /api/v1/dashboard/heatmap`
- `GET /api/v1/reports/export?format=excel|pdf`

## 5.7 Users / Roles
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{id}`
- `GET /api/v1/roles`
- `PUT /api/v1/users/{id}/roles`

---

## 6) Ekran Wireframe Listesi

## 6.1 Personel Tarafı (Mobil)
1. QR Açılış / Form Giriş Ekranı
2. Bildirim Formu (adım/adım)
3. Medya Ekleme Ekranı
4. Önizleme ve Gönderim Onayı
5. Başarılı Gönderim Ekranı

## 6.2 Admin Paneli
1. Giriş Ekranı
2. Dashboard
3. Bildirim Listesi (filtreli)
4. Bildirim Detay + Süreç Akışı
5. Aksiyon Atama ve Takip
6. Lokasyon Yönetimi
7. QR Yönetimi (üret, indir, pasif et)
8. Kullanıcı/Rol Yönetimi
9. Form Kuralları (anonim/OTP/media)
10. Risk Kuralları
11. Bildirim Kanal Ayarları
12. KVKK & Saklama Politikaları
13. Raporlar ve Export
14. Audit Log Görüntüleme

---

## 7) MVP Jira İş Planı (Örnek Backlog)

## 7.0 Aşama Takip Durumu
- [x] **EPIC-1** Altyapı ve Proje Kurulumu (**Tamamlandı**)
- [x] **EPIC-2** Kimlik ve Yetkilendirme temel iskelet (**Tamamlandı**)
- [x] **EPIC-3** QR ve Lokasyon temel iskelet (**Tamamlandı**)
- [ ] **EPIC-3** QR ve Lokasyon
- [ ] **EPIC-4** Bildirim Formu
- [ ] **EPIC-5** Medya Yönetimi
- [ ] **EPIC-6** Risk ve Workflow
- [ ] **EPIC-7** DÖF ve Bildirimler
- [ ] **EPIC-8** Dashboard ve Raporlama
- [ ] **EPIC-9** Uyumluluk ve Audit
- [ ] **EPIC-10** UAT ve Canlıya Hazırlık

## EPIC-1 Altyapı ve Proje Kurulumu
Durum: ✅ Tamamlandı (skeleton oluşturuldu)
- ISG-1 Repo ve monorepo yapısının oluşturulması
- ISG-2 CI/CD pipeline temel akış
- ISG-3 Docker Compose ile local ortam
- ISG-4 Temel loglama ve sağlık kontrolleri

## EPIC-2 Kimlik ve Yetkilendirme
Durum: ✅ Tamamlandı (Auth/OTP + RBAC temel endpointleri eklendi)
- ISG-10 Admin login ve session yönetimi
- ISG-11 OTP request/verify servisleri
- ISG-12 Role modeli ve temel RBAC

## EPIC-3 QR ve Lokasyon
Durum: ✅ Tamamlandı (Lokasyon CRUD + QR CRUD + Public QR doğrulama endpointleri eklendi)
- ISG-20 Lokasyon CRUD
- ISG-21 QR üretimi (token + PNG/SVG)
- ISG-22 QR-Lokasyon eşleştirme
- ISG-23 QR doğrulama public endpoint

## EPIC-4 Bildirim Formu
- ISG-30 Public form endpoint
- ISG-31 Olay türü çoklu seçim validasyonu
- ISG-32 Zorunlu alan validasyonları
- ISG-33 Anonim/isimli mod desteği
- ISG-34 GPS + QR lokasyon kaydı

## EPIC-5 Medya Yönetimi
- ISG-40 MinIO entegrasyonu
- ISG-41 Presigned upload akışı
- ISG-42 Thumbnail üretimi
- ISG-43 Video transcode ve limit kontrolü

## EPIC-6 Risk ve Workflow
- ISG-50 5x5 risk motoru
- ISG-51 Otomatik risk kuralı tetikleme
- ISG-52 Workflow durum geçişleri
- ISG-53 Tekrar açma süreci

## EPIC-7 DÖF ve Bildirimler
- ISG-60 Aksiyon atama ekran/API
- ISG-61 Due date ve gecikme yönetimi
- ISG-62 E-posta bildirimi
- ISG-63 SMS bildirimi
- ISG-64 WhatsApp entegrasyon altyapısı

## EPIC-8 Dashboard ve Raporlama
- ISG-70 KPI endpointleri
- ISG-71 Trend/ısı haritası endpointleri
- ISG-72 Filtreli rapor ekranı
- ISG-73 Excel export
- ISG-74 PDF export

## EPIC-9 Uyumluluk ve Audit
- ISG-80 Audit log altyapısı
- ISG-81 KVKK saklama politikası yönetimi
- ISG-82 Otomatik arşiv/silme job’ları

## EPIC-10 UAT ve Canlıya Hazırlık
- ISG-90 UAT test senaryoları
- ISG-91 Performans testleri
- ISG-92 Güvenlik testleri (OWASP top 10 temel)
- ISG-93 Canlıya geçiş checklist

---

## 8) Başlangıç Takvimi Önerisi

Onay verildiği gün itibarıyla:
- **Hafta 1:** Keşif + teknik kurulum + detaylı backlog
- **Hafta 2-3:** QR/Lokasyon + Form temel akış
- **Hafta 4-5:** Medya + Risk + Workflow
- **Hafta 6-7:** Admin panel + Dashboard + Raporlar
- **Hafta 8:** UAT, güvenlik/perf iyileştirme
- **Hafta 9-10 (opsiyonel):** Faz-2 hazırlık veya pilot yayına geçiş

---

## 9) EPIC-1 Teknik Skeleton Sonrası Başlangıç Kararı

Soru: “EPIC-1 (backend + frontend + db migration + docker-compose) tamamlandıktan sonra geliştirme başlayabilir miyiz?”  
Cevap: **Evet, başlanabilir.** EPIC-1 tamamlandığında ekip paralel feature geliştirmeye geçebilir.

### 9.1 Go/No-Go Checklist (EPIC-1 Çıkış Kriteri)
- Backend skeleton çalışıyor (en az bir health endpoint ile)
- Frontend skeleton çalışıyor (temel route ve layout)
- DB migration altyapısı hazır, ilk migration uygulanabilir
- Docker Compose ile tüm servisler local ortamda ayağa kalkıyor
- `.env.example` ve setup dokümantasyonu mevcut
- CI’de en az lint/build adımı başarılı

### 9.2 EPIC-1 Sonrası İlk Teknik Adımlar
1. EPIC-2 (Auth/OTP/RBAC) ve EPIC-3 (QR/Lokasyon) paralel başlatılır
2. Public form akışı için minimum uçtan uca senaryo çıkarılır
3. Loglama, hata izleme ve audit temel eventleri aktif edilir
4. Sprint sonunda demo + UAT geri bildirim döngüsü işletilir

### 9.3 Hâlâ Netleştirilmesi Faydalı Konular (Bloklayıcı Değil)
- SMS ve WhatsApp sağlayıcılarının nihai seçimi
- LDAP/AD erişim topolojisi ve güvenlik kuralları
- KVKK saklama sürelerinin kurum içi son onayı
- Pilot lokasyon, UAT kullanıcıları ve başarı metrikleri

---

## 10) EPIC-1 Teknik Skeleton Çıktıları (Repo Durumu)

Bu plandaki EPIC-1 başlangıç hedefleri için aşağıdaki iskelet yapılar oluşturulmuştur:

- `backend/src/index.js`
  - Express API skeleton
  - `GET /api/v1/health` endpointi
  - PostgreSQL bağlantı kontrolü
- `backend/Dockerfile` ve `backend/package.json`
  - Konteynerize backend koşumu
  - lint/build scriptleri
- `frontend/index.html` ve `frontend/nginx.conf`
  - Minimal frontend iskeleti
  - `/api/*` çağrıları için backend proxy
- `db/migrations/001_init.sql`
  - İlk migration (users, roles, user_roles)
- `db/migrations/002_auth_otp_rbac.sql`
  - OTP ve auth session tabloları (EPIC-2 hazırlığı)
- `db/migrations/003_locations_qr.sql`
  - Departman, lokasyon ve QR kod tabloları (EPIC-3)
- `docker-compose.yml`
  - postgres + backend + frontend birlikte ayağa kaldırma
- `.env.example`
  - Ortam değişkeni şablonu
- `.github/workflows/ci.yml`
  - Backend lint/build + docker compose config doğrulaması

## 10.1 EPIC-2 Eklenen API Uçları (İskelet)
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (auth required)
- `GET /api/v1/admin/rbac-check` (role required)

## 10.2 EPIC-3 Eklenen API Uçları (İskelet)
- `GET /api/v1/locations`
- `POST /api/v1/locations`
- `PATCH /api/v1/locations/:id`
- `GET /api/v1/qr-codes`
- `POST /api/v1/qr-codes`
- `PATCH /api/v1/qr-codes/:id/active`
- `GET /api/v1/public/qr/:token`
