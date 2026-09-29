---
name: next
description: Yayın çizelgesindeki sıradaki videoyu üretir. Konuyu channel/plan.json'dan alır, /animation akışıyla filmi yapıp sitede yayınlar ve çizelgeyi günceller.
argument-hint: [sıra numarası; boş bırakılırsa sıradaki]
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Kullanıcı tek komut verir ve yayınlanmış filmi bekler; arada soru sorma, onay bekleme. Bu komutu çalıştırmak commit ve push için onaydır.

## Adımlar

1. **Satırı bul.** Numara verilmediyse `npm run plan -- next`, verildiyse `npm run plan -- show <no>`.
   - Satırın durumu "Film hazır" ya da "Paket hazır" ise film zaten var. Kullanıcıya bunu ve sıradaki adımı söyle (`/youtube <slug>` ya da YouTube'a yükleme), sonra dur.
   - Üretilecek video kalmadıysa kullanıcıya yeni dönemi `/plan` ile kurmasını söyle ve dur.
2. **Filmi yaptır.** `.claude/skills/animation/SKILL.md` dosyasını oku ve oradaki yürütücü akışını uygula. İstek olarak çıktıdaki "İstek" metnini **kelimesi kelimesine** ver. Çizelgedeki başka hiçbir bilgiyi (dayanak, örnek kanallar, izlenme sayıları, başka videolar) ajanlara aktarma: film ajanı yalnızca isteği bilir.
3. **Çizelgeyi güncelle.** Film sitede yayınlandıktan sonra:
   - `npm run plan -- set <no> status=produced slug=<filmin gerçek slug'ı>`
   - `npm run plan -- build`
   - `channel/` altındaki değişiklikleri Türkçe bir mesajla commit'le ve push et.
4. **Çizelge sayfasını güncelle.** `channel/plan.json` içinde `channel.artifact` adresi doluysa Artifact aracıyla önce o adresi oku (`action: "read"`), sonra `channel/plan.html` dosyasını aynı adrese yayınla (`url` ile; `capabilities` ve `icon` verme, olduğu gibi kalsın). Artifact aracı yoksa bu adımı atla ve son mesajında söyle.

Film aşamalarından biri yarım kalırsa çizelgeyi güncelleme; ne olduğunu kullanıcıya söyle.

## Son mesaj

Animasyon akışının son mesajı, ardından: bu videonun yayın günü ve saati, `/youtube <slug>` hatırlatması, çizelgede sıradaki video ve onun üretimi için son gün.
