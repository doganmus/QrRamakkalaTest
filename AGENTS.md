# AGENTS.md

## Proje Özeti
Bu proje (İSG QR Bildirim Uygulaması), iş sağlığı ve güvenliği kapsamında saha personelinin QR kod okutarak hızlıca olay, ramak kala veya tehlike bildirimi yapabilmesini sağlar. Yönetim ise admin paneli üzerinden bu bildirimlere yönelik aksiyon alır ve raporlama yapar.

## Temel Teknolojiler
- Frontend: React / Vue (Nginx ile sunuluyor)
- Backend: Node.js (Express tabanlı)
- DB: PostgreSQL
- Geliştirme/Dağıtım: Docker / Kubernetes (docker-compose.yml mevcut)

## Ajanlar İçin Talimatlar
1. Proje geliştirme fazlarına (EPIC'ler) riayet edilmelidir. Detaylar ve Jira planı için `docs/project-plan.md` dosyası incelenmelidir.
2. Geliştirme süreci boyunca backend için `backend/` dizini, frontend için `frontend/` dizini kullanılmalıdır.
3. Veritabanı ile ilgili migration ve diğer süreçler için `db/` dizinine bakınız.
4. Yeni bir kod eklerken ilgili `package.json` dosyalarındaki script'leri çalıştırarak (örneğin lint, build vb.) test ve kontrolleri gerçekleştirmelisiniz.
5. README.md üzerindeki `Aşama Takibi` kısmındaki EPIC durumlarını referans alın. EPIC-1, 2, 3 ve 4 temel düzeyde tamamlanmış görünmektedir. Sonraki geliştirmeler için bu durumu göz önünde bulundurun.
