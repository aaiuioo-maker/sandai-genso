"""serifu.txt の台詞を COEIROINK（v2）で声にする。

使い方：COEIROINK を起動しておいてから
    python tsukuru.py
で、out/00.wav, 01.wav … と、全部つなげた out/zenbu.wav ができる。
"""
import json
import sys
import urllib.request
import wave
from pathlib import Path

ENGINE = 'http://127.0.0.1:50032'
HERE = Path(__file__).parent
OUT = HERE / 'out'
MA = 0.4  # 台詞と台詞のあいだの間（秒）


def api(path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(ENGINE + path, data=data,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return r.read()


def find_speaker(speakers, name):
    for s in speakers:
        if name in s['speakerName']:
            return s
    print(f'「{name}」が見つからないので {speakers[0]["speakerName"]} で読みます')
    return speakers[0]


def main():
    try:
        speakers = json.loads(api('/v1/speakers'))
    except OSError:
        sys.exit('COEIROINK につながりません。COEIROINK を起動してから、もう一度ためしてください。')
    print('入っているキャラクター：', '・'.join(s['speakerName'] for s in speakers))

    lines = [l.split('|', 1) for l in (HERE / 'serifu.txt').read_text(encoding='utf-8').splitlines()
             if l.strip() and not l.startswith('#')]
    OUT.mkdir(exist_ok=True)
    files = []
    for i, (who, text) in enumerate(lines):
        s = find_speaker(speakers, who)
        prosody = json.loads(api('/v1/estimate_prosody', {'text': text}))['detail']
        wav = api('/v1/synthesis', {
            'speakerUuid': s['speakerUuid'],
            'styleId': s['styles'][0]['styleId'],
            'text': text,
            'prosodyDetail': prosody,
            'speedScale': 1.0, 'volumeScale': 1.0, 'pitchScale': 0.0, 'intonationScale': 1.0,
            'prePhonemeLength': 0.1, 'postPhonemeLength': 0.1,
            'outputSamplingRate': 24000,
        })
        f = OUT / f'{i:02d}.wav'
        f.write_bytes(wav)
        files.append(f)
        print(f'{f.name}  {s["speakerName"]}：{text}')

    # 全部つなげる
    with wave.open(str(files[0])) as w:
        params = w.getparams()
    silence = b'\0' * int(params.framerate * MA) * params.sampwidth * params.nchannels
    with wave.open(str(OUT / 'zenbu.wav'), 'wb') as out:
        out.setparams(params)
        for f in files:
            with wave.open(str(f)) as w:
                out.writeframes(w.readframes(w.getnframes()))
            out.writeframes(silence)
    print('できました：', OUT / 'zenbu.wav')


if __name__ == '__main__':
    main()
