# İSG QR Bildirim Uygulaması

Bu repo, iş sağlığı ve güvenliği (İSG) kapsamında saha personelinin QR kod üzerinden hızlıca olay/ramak kala/tehlike bildirimi yapabildiği, yönetimin ise admin paneli üzerinden aksiyon ve raporlama yapabildiği uygulamanın planlama ve geliştirme dokümantasyonunu içerir.

## Dokümanlar
- Ürün kapsamı, teknik mimari, ERD, API, wireframe listesi ve Jira planı:
  - `docs/project-plan.md`
- CI `npm ci` merge hatası ve çözüm notu:
  - `docs/ci-npm-ci-fix.md`

## Proje Hedefi
- Saha personelinin güvenli, hızlı ve düşük sürtünmeli şekilde bildirim yapması
- Risklerin erken görünür hale getirilmesi
- DÖF (düzeltici/önleyici faaliyet) süreçlerinin izlenebilir olması
- Yönetim için gerçek zamanlı dashboard ve raporlar

## Kapsam Özeti
- QR bazlı form erişimi
- Anonim / isimli bildirim (admin kontrollü)
- Girişsiz veya OTP’li erişim (admin kontrollü)
- Çoklu olay türü, medya desteği, GPS + lokasyon eşleştirme
- 5x5 risk matrisi ve otomatik aksiyon kuralları
- Workflow, atama, SLA, kapanış ve tekrar açma
- KVKK uyumlu saklama politikaları ve audit log

## Teknik Yaklaşım (Bulutsuz / On-Prem)
- Frontend: React/Vue
- Backend: Node.js/.NET/Java
- DB: PostgreSQL
- Medya: MinIO (on-prem object storage)
- Queue/Worker: Redis + worker
- Bildirim: SMTP, SMS, WhatsApp
- Dağıtım: Docker/Kubernetes

## Geliştirmeye Başlama
Detaylı planlama tamamlandığı için geliştirmeye **hemen başlanabilir**.
Önerilen başlangıç sırası:
1. Altyapı kurulumu
2. QR/Lokasyon modülü
3. Public bildirim formu
4. Risk + workflow
5. Admin panel + raporlama

## EPIC-1 Tamamlandıktan Sonra Başlangıç
Evet, doğrudan başlanabilir. Özellikle teknik skeleton (backend + frontend + db migration + docker-compose) tamamlanınca ekip paralel geliştirmeye güvenle geçebilir.

EPIC-1 çıktı kontrol listesi:
- Backend skeleton ve temel health endpoint
- Frontend skeleton ve temel route yapısı
- Veritabanı migration altyapısı (ilk migration ile)
- Docker Compose ile tek komut local ayağa kaldırma
- Ortam değişkenleri (`.env.example`) ve temel geliştirici dokümantasyonu
- CI üzerinde en az lint/build kontrolü

Bu checklist sağlandığında geliştirme bloklanmaz; feature geliştirmeleri EPIC-2 ve sonrası için başlatılabilir.

## Geliştirme Öncesi Hâlâ Gerekli Mi?
Zorunlu olarak ek bir analiz dokümanı gerekmiyor. Ancak riski düşürmek için aşağıdakiler önerilir:
- SMS/WhatsApp sağlayıcılarının kesin seçimi
- LDAP/AD entegrasyon sınırlarının netleştirilmesi
- KVKK saklama sürelerinin kurum politikası ile doğrulanması
- Pilot lokasyon ve UAT sorumlularının belirlenmesi

## Not
Bu repoda başlangıç olarak analiz ve planlama dokümanları yer alır. Kod geliştirme fazı için backlog `docs/project-plan.md` içindeki Jira planına göre yürütülmelidir.

## EPIC-1 Teknik Skeleton (Bu Repoda Oluşturuldu)
- `backend/` : Express tabanlı API skeleton + `/api/v1/health`
- `frontend/` : Nginx ile servis edilen minimal arayüz
- `db/migrations/001_init.sql` : ilk migration (users/roles/user_roles)
- `docker-compose.yml` : postgres + backend + frontend
- `.env.example` : ortam değişkeni örneği
- `.github/workflows/ci.yml` : backend lint/build + compose doğrulama

## Aşama Takibi
- [x] EPIC-1 tamamlandı
- [x] EPIC-2 temel tamamlandı (Auth/OTP + RBAC)
- [x] EPIC-3 temel tamamlandı (Lokasyon CRUD + QR CRUD + Public QR doğrulama)
- [x] EPIC-4 temel tamamlandı (Public report endpoint + olay türü validasyonları + GPS/QR lokasyon kaydı)
- [x] EPIC-5 temel tamamlandı (Medya kural yönetimi + upload presign/complete akışı)
- [ ] EPIC-6 ve sonrası beklemede
