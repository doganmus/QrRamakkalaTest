# CI `npm ci` Hatası ve Çözümü

## Problem
GitHub Actions `backend-checks` job'ında aşağıdaki hata alınıyordu:

- `npm ERR! code EUSAGE`
- `The npm ci command can only install with an existing package-lock.json`

Bu hata, `backend/` altında `package-lock.json` olmadan `npm ci` çalıştırıldığı için oluşur.

## Uygulanan Çözüm
Hızlı merge engelini kaldırmak için workflow'da:

- `npm ci` -> `npm install`

olarak güncellendi.

Dosya:
- `.github/workflows/ci.yml`

## Neden Bu Çözüm?
- `npm install` lockfile olmadan da çalışır.
- EPIC-1 iskeletinin PR merge sürecini bloklayan ana hatayı kaldırır.

## Önerilen Kalıcı İyileştirme (Sonraki adım)
Deterministik CI için ileride şu adım önerilir:
1. `backend/package-lock.json` commit et
2. CI adımını tekrar `npm ci`'a çevir

Bu şekilde hem hızlı çözüm hem de uzun vadeli stabilite sağlanır.
