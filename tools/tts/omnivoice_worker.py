# OmniVoice worker for tools/voice.mjs: speaks each line in a fixed voice (the voice's reference
# clip keeps it identical in every video), checks every clip with Whisper and retries bad takes.
#   python omnivoice_worker.py job.json
# job.json: { "ref_audio", "ref_text", "language", "speed", "lines": [{ "id", "text", "out" }], "tries", "max_cer" }
# Prints one JSON line per finished clip: { "id", "cer", "tries", "dur", "heard" }.
import json, os, re, sys, time, zlib

import numpy as np
import soundfile as sf
import torch
from faster_whisper import WhisperModel
from omnivoice import OmniVoice

SR = 24000
job = json.load(open(sys.argv[1], encoding="utf-8"))
tries = int(job.get("tries", 4))
max_cer = float(job.get("max_cer", 0.06))


ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]


def num_tr(n):
    """Turkish words for a whole number (so '600' and 'altı yüz' compare equal)."""
    if n == 0:
        return "sıfır"
    out = []
    for value, name in ((10**9, "milyar"), (10**6, "milyon"), (1000, "bin")):
        if n >= value:
            q, n = divmod(n, value)
            out.append(name if (q == 1 and value == 1000) else f"{num_tr(q)} {name}")
    if n >= 100:
        q, n = divmod(n, 100)
        out.append("yüz" if q == 1 else f"{ONES[q]} yüz")
    if n >= 10:
        out.append(TENS[n // 10]); n %= 10
    if n:
        out.append(ONES[n])
    return " ".join(out)


def norm(s):
    s = re.sub(r"\d+", lambda m: " " + num_tr(int(m.group())) + " ", s)
    s = s.replace("İ", "i").replace("I", "ı").lower()
    s = s.replace("â", "a").replace("î", "i").replace("û", "u")
    return "".join(re.sub(r"[^a-zçğıöşü ]", " ", s).split())


def cer(ref, hyp):
    a, b = norm(ref), norm(hyp)
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (ca != cb))
    return d[len(b)] / max(1, len(a))


def trim(x, thr=0.01, pad=0.08):
    """Cut leading/trailing silence, keep a short natural pad."""
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


t0 = time.time()
model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cuda:0" if torch.cuda.is_available() else "cpu",
                                  dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
asr = WhisperModel("small", device="cpu", compute_type="int8",
                   download_root=os.path.join(os.environ.get("TTS_LAB", r"C:\ProgramData\tts_lab"), "whisper"))
print(json.dumps({"ready": round(time.time() - t0, 1)}), flush=True)

for line in job["lines"]:
    best = None
    for k in range(tries):
        torch.manual_seed(zlib.crc32(line["id"].encode()) % 100000 + 7919 * k)
        audio = model.generate(text=line["text"], language=job.get("language", "tr"),
                               ref_audio=job["ref_audio"], ref_text=job["ref_text"], speed=job.get("speed"))
        x = trim(np.asarray(audio[0], dtype=np.float32))
        tmp = line["out"] + ".check.wav"
        sf.write(tmp, x, SR)
        segs, _ = asr.transcribe(tmp, language="tr", beam_size=5)
        heard = " ".join(s.text.strip() for s in segs)
        os.remove(tmp)
        c = cer(line.get("check", line["text"]), heard)
        if best is None or c < best[0]:
            best = (c, x, heard, k + 1)
        if c <= max_cer:
            break
    sf.write(line["out"], best[1], SR)
    print(json.dumps({"id": line["id"], "cer": round(best[0], 3), "tries": best[3],
                      "dur": round(len(best[1]) / SR, 3), "heard": best[2]}, ensure_ascii=False), flush=True)
