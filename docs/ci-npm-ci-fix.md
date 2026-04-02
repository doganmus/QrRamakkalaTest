# GitHub PR Hatası Çözümü: `npm ci` / `EUSAGE`

Bu hata şu anlama gelir:

- CI pipeline `npm ci` komutunu çalıştırıyor.
- `npm ci` komutu **mutlaka** aynı klasörde bir `package-lock.json` (veya `npm-shrinkwrap.json`) ister.
- Lock dosyası yoksa job fail olur ve PR merge edilemez.

## Neden olur?

Genelde şu durumlardan biri vardır:

1. `package.json` eklendi ama `package-lock.json` commit edilmedi.
2. Workflow yanlış klasörde `npm ci` çalıştırıyor.
3. Repo monorepo, ama lock dosyası kökte değil alt dizinde.

## Hızlı çözüm (en yaygın)

Backend klasöründe lock dosyasını üretip commit edin:

```bash
cd backend
npm install
git add package-lock.json
git commit -m "fix(ci): add backend package-lock.json for npm ci"
git push
```

> Not: `npm ci` lock dosyasını üretmez, sadece lock dosyasından kurulum yapar.

## Eğer backend alt klasördeyse

Workflow dosyasında `working-directory` doğru olmalı:

```yaml
- name: Install dependencies
  working-directory: backend
  run: npm ci
```

## `npm` sürüm uyumu kontrolü

Bazen lock dosyası çok eski/yeni olduğunda sorun çıkar. CI ile yerel sürüm uyumlu olsun:

- CI: Node 20 + npm 10
- Lokal: benzer sürümle lock dosyası üretin

Örnek workflow adımı:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```

## Sonraki doğrulama

1. Commit sonrası PR’da **Re-run jobs** çalıştırın.
2. `backend-checks` yeşile dönerse merge açılır.
3. Hâlâ kırmızıysa logda şu satırı kontrol edin:
   - `working-directory`
   - aranan lock dosya yolu

## Kısa kontrol listesi

- [ ] `backend/package.json` var
- [ ] `backend/package-lock.json` repo’ya commitli
- [ ] Workflow `working-directory: backend` kullanıyor
- [ ] `actions/setup-node` cache path lock dosyasına işaret ediyor
