#!/usr/bin/env python3
"""動画「観音心と観音行」の声（kannonshin/koe*/NN.mp3）を作るスクリプト。

字幕の読み上げ文は index.html の CAPS（5番目＝読み上げる文）から取る。
VOICEVOX・AivisSpeech・COEIROINK のエンジンを手元で起動しておいてから動かす。
起動していないエンジンの声は とばす（その声はページで 端末の声で読む）。

  python3 kannonshin/koe_tsukuru.py              # 全部作る（もうあるファイルは作らない）
  python3 kannonshin/koe_tsukuru.py --yarinaoshi # 全部作り直す
  python3 kannonshin/koe_tsukuru.py koe-mana     # その人の声だけ

エンジンの場所：
  VOICEVOX     http://127.0.0.1:50021
  AivisSpeech  http://127.0.0.1:10101
  COEIROINK    http://127.0.0.1:50032 （v2）

音量は、ほかの動画（omakase/）の同じ人の声の平均音量にそろえる。
環境変数 OUT にフォルダを指定すると、そこで作ってから 1人分そろうたびに kannonshin/ へ移す（作りかけのファイルを置かないため）。
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REF = os.path.join(ROOT, 'omakase')  # 音量をそろえる見本の動画
URL = {'VOICEVOX': 'http://127.0.0.1:50021', 'AivisSpeech': 'http://127.0.0.1:10101', 'COEIROINK': 'http://127.0.0.1:50032'}

# [フォルダ, エンジン, エンジンでの名前, 声の種類]（index.html の VOICES と同じフォルダ名）
VOICES = [
    ['koe', 'VOICEVOX', '四国めたん', 'ノーマル'],
    ['koe-tsumugi', 'VOICEVOX', '春日部つむぎ', 'ノーマル'],
    ['koe-hau', 'VOICEVOX', '雨晴はう', 'ノーマル'],
    ['koe-sayo', 'VOICEVOX', '小夜/SAYO', 'ノーマル'],
    ['koe-himari', 'VOICEVOX', '冥鳴ひまり', 'ノーマル'],
    ['koe-nurserobo', 'VOICEVOX', 'ナースロボ＿タイプＴ', 'ノーマル'],
    ['koe-tsukuyomi', 'COEIROINK', 'つくよみちゃん', 'れいせい'],
    ['koe-mana', 'COEIROINK', 'MANA', 'のーまる'],
    ['koe-kana', 'COEIROINK', 'KANA', 'のーまる'],
    ['koe-ameno-kuma', 'COEIROINK', 'アメノちゃん', '熊本弁'],
    ['koe-lilin', 'COEIROINK', 'リリンちゃん', 'のーまる'],
    ['koe-mao', 'AivisSpeech', 'まお', 'ノーマル'],
    ['koe-mai', 'AivisSpeech', 'まい', 'ノーマル'],
    ['koe-kohaku', 'AivisSpeech', 'コハク', 'ノーマル'],
    ['koe-chuni', 'AivisSpeech', '中2', 'ノーマル'],
    ['koe-runa', 'AivisSpeech', 'るな', 'ノーマル'],
    ['koe-kanon', 'AivisSpeech', '花音', 'ノーマル'],
    ['koe-sakurane', 'AivisSpeech', '桜音', 'ノーマル'],
]


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()


def post(url, body=None, ctype='application/json'):
    req = urllib.request.Request(url, data=body if body is not None else b'', method='POST', headers={'Content-Type': ctype})
    with urllib.request.urlopen(req, timeout=600) as r:
        return r.read()


def find_style(speakers, name, style, name_key, styles_key, id_key):
    cands = [s for s in speakers if s[name_key] == name] or [s for s in speakers if s[name_key].startswith(name) or name in s[name_key]]
    if not cands:
        return None
    for s in cands:
        for st in s[styles_key]:
            if st.get('styleName', st.get('name')) == style:
                return s, st[id_key]
    return cands[0], cands[0][styles_key][0][id_key]


def synth_vv(base, sid, text):
    """VOICEVOX と AivisSpeech（同じしくみ）"""
    q = post(base + '/audio_query?' + urllib.parse.urlencode({'text': text, 'speaker': sid}))
    return post(base + '/synthesis?' + urllib.parse.urlencode({'speaker': sid}), q)


def synth_coe(base, spk, sid, text):
    """COEIROINK v2"""
    body = {'speakerUuid': spk['speakerUuid'], 'styleId': sid, 'text': text, 'speedScale': 1.0, 'volumeScale': 1.0,
            'pitchScale': 0.0, 'intonationScale': 1.0, 'prePhonemeLength': 0.1, 'postPhonemeLength': 0.5, 'outputSamplingRate': 24000}
    return post(base + '/v1/synthesis', json.dumps(body).encode())


def mean_db(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'mean_volume: (-?[\d.]+) dB', out)
    return float(m.group(1)) if m else None


def ref_db(folder):
    """見本の動画の同じ人の声の 平均音量"""
    d = os.path.join(REF, folder)
    if not os.path.isdir(d):
        return None
    vals = [v for v in (mean_db(os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith('.mp3')) if v is not None]
    return sum(vals) / len(vals) if vals else None


def captions():
    html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    block = html[html.index('const CAPS = ['):]
    block = block[:block.index('\n];')]
    texts = []
    for line in block.splitlines()[1:]:
        strs = re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", line)
        strs = [a or b for a, b in strs]
        if len(strs) >= 3:
            texts.append(strs[2])
    return texts


def main():
    args = sys.argv[1:]
    redo = '--yarinaoshi' in args
    only = [a for a in args if not a.startswith('--')]
    texts = captions()
    print(f'字幕：{len(texts)}個')

    engines = {}
    for eng, base in URL.items():
        try:
            engines[eng] = json.loads(get(base + ('/v1/speakers' if eng == 'COEIROINK' else '/speakers')))
            print(f'{eng}: つながった（{len(engines[eng])}人）')
        except Exception:
            print(f'{eng}: つながらないので とばす（{base}）')

    made = 0
    for folder, eng, name, style in VOICES:
        if (only and folder not in only) or eng not in engines:
            continue
        if eng == 'COEIROINK':
            hit = find_style(engines[eng], name, style, 'speakerName', 'styles', 'styleId')
        else:
            hit = find_style(engines[eng], name, style, 'name', 'styles', 'id')
        if not hit:
            print(f'  {folder}: {eng} に「{name}」が入っていないので とばす')
            continue
        spk, sid = hit
        target = ref_db(folder)
        work = os.path.join(os.environ.get('OUT') or HERE, folder)
        os.makedirs(work, exist_ok=True)
        for n, text in enumerate(texts):
            out = os.path.join(work, f'{n:02d}.mp3')
            if os.path.exists(os.path.join(HERE, folder, f'{n:02d}.mp3')) and not redo:
                continue
            if os.path.exists(out) and not redo:
                continue
            wav = synth_coe(URL[eng], spk, sid, text) if eng == 'COEIROINK' else synth_vv(URL[eng], sid, text)
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                f.write(wav)
                tmp = f.name
            gain = 0.0
            if target is not None:
                now = mean_db(tmp)
                if now is not None:
                    gain = target - now
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', f'volume={gain:.1f}dB',
                            '-ac', '1', '-b:a', '64k', out], check=True)
            os.unlink(tmp)
            made += 1
        if work != os.path.join(HERE, folder):
            os.makedirs(os.path.join(HERE, folder), exist_ok=True)
            for f in sorted(os.listdir(work)):
                os.replace(os.path.join(work, f), os.path.join(HERE, folder, f))
        print(f'  {folder}: できた（{name}・{style}・見本の音量 {target if target is None else round(target, 1)} dB）', flush=True)
    print(f'作ったファイル：{made}個')


if __name__ == '__main__':
    main()
