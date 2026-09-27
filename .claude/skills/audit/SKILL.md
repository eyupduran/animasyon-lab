---
name: audit
description: Bitmiş bir filmi bağımsız denetler (görsel güç, hikâye ve metin, doğruluk, ses, özgünlük) ve puanlı bir rapor yazar. Kullanıcı "/audit <slug>" dediğinde ya da bir filmin incelenmesini istediğinde kullanılır.
argument-hint: <slug>
disable-model-invocation: true
---

Denetlenecek film: **$ARGUMENTS**

Denetçi işi yapan değildir. Varsayılan karar "düzeltme gerek"; geçer yalnızca kanıtla (kare, ölçüm, satır). Beğenmek için değil kusur bulmak için izle. **Kod düzeltme; rapor yaz.**

## Nasıl bakılır

1. Filmi videoya çevir ya da kareleri çıkar (`npm run video -- <slug>`, ya da `?video=1` ile `window.__film.renderAt(t)`); her 3 saniyede bir kareden temas sayfası ve en az dört kareyi tam boyutta incele. Açılışın ilk 10 saniyesine ayrıca bak.
2. Anlatım metnini oku (`narration/lines.json`), sayıları `RESEARCH.md` ile karşılaştır, bir iki iddiayı bağımsız kaynaktan doğrula.
3. Sesi ölç (düzey, anlatım–müzik dengesi); `npm run verify -- <slug>`.

## Ölçütler (her biri 1–5, tek cümle gerekçe)

- **Görsel güç:** açılış karesi, açık-koyu karşıtlığı ve ışık, derinlik ve ön plan, renk, karakterin ya da öznenin canlılığı, doruk anı. "Cılız" görünen yer var mı, neresi, neden?
- **Hikâye:** merak uyandıran açılış, izlenecek bir kahraman ya da soru, gerilim, karşılığı verilen son.
- **Metin:** türünün diliyle mi (belgesel, tarih, yazılım…), doğal Türkçe mi, insan yazmış gibi mi? Yapay zekâ kalıplarını say (`narration/SKILL.md` → 2b).
- **Doğruluk:** kaynaksız ya da yanlış sayı, tarih, ad.
- **Ses:** aynı anlatıcı, anlaşılır, müzik ve efektlerle denge.
- **Özgünlük:** depodaki önceki filmlere benziyor mu (posterleri yan yana koy)?

## Rapor

Filmin klasörüne `AUDIT.md`: puan tablosu, en güçlü üç an, **önce düzeltilecek beş şey** (bölüm + zaman + ne + nasıl), doğruluk listesi. Kullanıcıya kısa özet ver; düzeltmeler için ayrı oturuma verilecek hazır bir istek metni yaz.
