# İSG QR Bildirim Uygulaması

Bu repo, iş sağlığı ve güvenliği (İSG) kapsamında saha personelinin QR kod üzerinden hızlıca olay/ramak kala/tehlike bildirimi yapabildiği, yönetimin ise admin paneli üzerinden aksiyon ve raporlama yapabildiği uygulamanın planlama ve geliştirme dokümantasyonunu içerir.

## Dokümanlar
- Ürün kapsamı, teknik mimari, ERD, API, wireframe listesi ve Jira planı:
  - `docs/project-plan.md`

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

## Not
Bu repoda başlangıç olarak analiz ve planlama dokümanları yer alır. Kod geliştirme fazı için backlog `docs/project-plan.md` içindeki Jira planına göre yürütülmelidir.
