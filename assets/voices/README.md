# Anlatıcı sesleri

Animasyonların anlatım sesleri. `npm run voice -- <slug> --voice <id>` ile seçilir; seçim animasyonun `narration/lines.json` dosyasında (`"voice"`) kalır.

| id | kod | ses | motor |
|---|---|---|---|
| `omni-erkek-derin` | O9 | Erkek, orta yaş, derin | OmniVoice |
| `omni-erkek-yasli` | O10 | Erkek, yaşlı | OmniVoice |
| `omni-kadin-genc` | O1 | Kadın, genç | OmniVoice |
| `omni-kadin-yasli` | O5 | Kadın, yaşlı | OmniVoice |
| `ema-kadin` | E1 | Kadın, Türkçeye özel | EMA-TTS |
| `ema-kadin-2` | E3 | Kadın, Türkçeye özel (iyileştirilmiş sürüm) | EMA-TTS |
| `piper-dfki` | P1 | Erkek (eski, robotik) | Piper |

OmniVoice sesleri gerçek bir kişiden kopyalanmadı; model içinde tarifle tasarlandı (cinsiyet, yaş, ses tonu). `omnivoice/*.wav` her sesin kimlik kaydıdır: model her cümleyi bu kayda bakarak aynı sesle söyler, bu yüzden bu dosyalar değiştirilmemeli. Yeni ses eklemek için bir kayıt ve metni `catalog.json`'a eklenir.

OmniVoice (Apache 2.0) yerelde, ekran kartıyla çalışır; kurulum `C:\ProgramData\tts_lab\omni` (Python ortamı) ve `C:\ProgramData\tts_lab\hf` (model) altındadır. Her cümle Whisper ile dinlenip denetlenir, bozuk çıkan yeniden üretilir.
