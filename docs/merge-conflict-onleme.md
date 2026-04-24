# PR Çakışmalarını (Merge Conflict) Azaltma/Önleme Rehberi

Bu doküman, ekranda görülen `<<<<<<<`, `=======`, `>>>>>>>` çakışma durumlarını azaltmak için proje standardını tanımlar.

## 1) Neden Oluyor?
Aynı dosyanın (özellikle `.env.example`, `README.md`, `docs/project-plan.md`) aynı satırlarına farklı branch'lerde değişiklik yapıldığında Git otomatik birleştiremeyebilir.

## 2) Uygulanan Teknik Önlem
Bu repoda `.env.example` için `merge=union` etkinleştirildi.

- Dosya: `.gitattributes`
- Kural: `.env.example merge=union`

Bu sayede farklı branch'lerde `.env.example` dosyasına eklenen farklı satırlar mümkün olduğunca otomatik birleştirilir.

## 3) CI Koruması
GitHub Actions'a `no-conflict-markers` adımı eklendi.

Bu adım tüm dosyalarda şu marker'ları tarar ve bulunursa build'i fail eder:
- `<<<<<<<`
- `=======`
- `>>>>>>>`

Böylece conflict marker'ları yanlışlıkla PR'a girmez.

## 4) Günlük Çalışma Akışı (Önerilen)
1. PR açmadan önce:
   - `git fetch origin`
   - `git rebase origin/main` (veya hedef branch)
2. Çakışma varsa lokal çöz, conflict marker bırakma.
3. Push etmeden önce lokal kontrol:
   - `git grep -nE '^(<<<<<<<|=======|>>>>>>>)' -- .`
4. Sonra PR aç / güncelle.

## 5) `.env.example` İçin Kural
- Yeni değişken eklerken mevcut sırayı bozma.
- Aynı değişken adını farklı değerlerle tekrar ekleme.
- Mümkünse değişkenleri dosyanın sonuna ekle.

## 6) EPIC Durumu
- EPIC-6 **beklemede** tutulmuştur; bu adımda yalnızca PR conflict önleme iyileştirmeleri yapılmıştır.
