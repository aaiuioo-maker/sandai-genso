#!/usr/bin/env python3
"""「まいにち話し方道場」の男性の声（hanashi/otoko/*.mp3）を作るスクリプト。

読む文は index.html の LINES（まねする文）と MIHON（見本スピーチ）から取る。
声は VOICEVOX の 玄野武宏（ノーマル）。VOICEVOX を起動してから動かす。

  python hanashi/koe_tsukuru.py              # 全部作る（もうあるファイルは作らない）
  python hanashi/koe_tsukuru.py --yarinaoshi # 全部作り直す
  python hanashi/koe_tsukuru.py --yomi       # 読みをカタカナで出すだけ（作らない）

できるファイル：
  otoko/<動画のフォルダ>-NN.mp3  まねする文
  otoko/mTT-P.mp3               見本スピーチ（TT＝お題の番号、P＝4つの段の番号）
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'otoko')
URL = 'http://127.0.0.1:50021'
SPEAKER = 11       # 玄野武宏 ノーマル
TARGET = -20.0     # そろえる平均音量（dB）
SPEED = 0.85       # お手本なので、ふつうより少しゆっくり
PAUSE = 1.5        # 「、」「。」の間を長めに

# エンジンが読みまちがえる言葉だけ、読みを書く（画面の字は変えない）
YOMI = {}


def post(path, body=None):
    req = urllib.request.Request(URL + path, data=body if body is not None else b'', method='POST',
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def query(text):
    for a, b in YOMI.items():
        text = text.replace(a, b)
    return post('/audio_query?' + urllib.parse.urlencode({'text': text, 'speaker': SPEAKER}))


def mean_volume(path):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE).stderr.decode('utf-8', 'ignore')
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', e).group(1))


def make(text, out):
    q = json.loads(query(text).decode('utf-8'))
    q['speedScale'] = SPEED
    q['pauseLengthScale'] = PAUSE
    wav = post('/synthesis?speaker=%d' % SPEAKER, json.dumps(q).encode('utf-8'))
    fd, tmp = tempfile.mkstemp(suffix='.wav')
    os.write(fd, wav); os.close(fd)
    try:
        gain = TARGET - mean_volume(tmp)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', 'volume=%.1fdB' % gain,
                        '-ac', '1', '-b:a', '64k', out + '.tmp.mp3'], check=True)
        os.replace(out + '.tmp.mp3', out)
    finally:
        os.remove(tmp)


def jobs():
    h = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    lines = json.loads(re.search(r'const LINES = (.*?); // LINES_END', h, re.S).group(1))
    mihon = json.loads(re.search(r'const MIHON = (.*?); // MIHON_END', h, re.S).group(1))
    out = []
    for d, _, ls in lines:
        for n, text in ls:
            out.append(('%s-%02d.mp3' % (d, n), text))
    for t, parts in enumerate(mihon):
        for p, text in enumerate(parts):
            out.append(('m%02d-%d.mp3' % (t, p), text))
    return out


def main():
    sys.stdout = open(sys.stdout.fileno(), 'w', encoding='utf-8', buffering=1, closefd=False)
    js = jobs()
    if '--yomi' in sys.argv:
        for name, text in js:
            if name.startswith('m'):
                q = json.loads(query(text).decode('utf-8'))
                print(name, q['kana'])
        return
    os.makedirs(OUT, exist_ok=True)
    redo = '--yarinaoshi' in sys.argv
    made = 0
    for i, (name, text) in enumerate(js):
        p = os.path.join(OUT, name)
        if redo or not os.path.exists(p):
            make(text, p); made += 1
        if (i + 1) % 25 == 0:
            print(i + 1, '/', len(js))
    print('おわり', len(js), '個（新しく作った', made, '個）')


main()
