#!/usr/bin/env python3
"""お返事のページの声（henji/koe-*/NN.mp3）を作るスクリプト。

VOICEVOX・AivisSpeech・COEIROINK のエンジンを手元で起動しておいてから動かす。
起動していないエンジンの声は とばす（その声はページで 端末の声で読む）。

  python3 henji/koe_tsukuru.py              # 全部作る（もうあるファイルは作らない）
  python3 henji/koe_tsukuru.py --yarinaoshi # 全部作り直す
  python3 henji/koe_tsukuru.py koe-metan    # その人の声だけ

エンジンの場所（ふつうはそのままでよい）：
  VOICEVOX     http://127.0.0.1:50021
  AivisSpeech  http://127.0.0.1:10101
  COEIROINK    http://127.0.0.1:50032 （v2）

音量は、サイトにすでにある同じ人の声（../koe-*/00.mp3）の平均音量にそろえる。
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
URL = {'VOICEVOX': 'http://127.0.0.1:50021', 'AivisSpeech': 'http://127.0.0.1:10101', 'COEIROINK': 'http://127.0.0.1:50032'}

# [フォルダ, エンジン, エンジンでの名前, 声の種類, 自己紹介の読み]
VOICES = [
    ['koe-metan', 'VOICEVOX', '四国めたん', 'ノーマル', 'しこくめたん'],
    ['koe-tsumugi', 'VOICEVOX', '春日部つむぎ', 'ノーマル', 'かすかべつむぎ'],
    ['koe-hau', 'VOICEVOX', '雨晴はう', 'ノーマル', 'あめはれはう'],
    ['koe-sayo', 'VOICEVOX', '小夜/SAYO', 'ノーマル', 'さよ'],
    ['koe-himari', 'VOICEVOX', '冥鳴ひまり', 'ノーマル', 'めいめいひまり'],
    ['koe-nurserobo', 'VOICEVOX', 'ナースロボ＿タイプＴ', 'ノーマル', 'なーすろぼ たいぷてぃー'],
    ['koe-tsukuyomi', 'COEIROINK', 'つくよみちゃん', 'れいせい', 'つくよみちゃん'],
    ['koe-mana', 'COEIROINK', 'MANA', 'のーまる', 'まな'],
    ['koe-kana', 'COEIROINK', 'KANA', 'のーまる', 'かな'],
    ['koe-ameno-kuma', 'COEIROINK', 'アメノちゃん', '熊本弁', 'あめのちゃん'],
    ['koe-lilin', 'COEIROINK', 'リリンちゃん', 'のーまる', 'りりんちゃん'],
    ['koe-mao', 'AivisSpeech', 'まお', 'ノーマル', 'まお'],
    ['koe-mai', 'AivisSpeech', 'まい', 'ノーマル', 'まい'],
    ['koe-kohaku', 'AivisSpeech', 'コハク', 'ノーマル', 'こはく'],
    ['koe-chuni', 'AivisSpeech', '中2', 'ノーマル', 'ちゅうに'],
    ['koe-runa', 'AivisSpeech', 'るな', 'ノーマル', 'るな'],
    ['koe-kanon', 'AivisSpeech', '花音', 'ノーマル', 'かのん'],
    ['koe-sakurane', 'AivisSpeech', '桜音', 'ノーマル', 'さくらね'],
]


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()


def post(url, body=None, ctype='application/json'):
    req = urllib.request.Request(url, data=body if body is not None else b'', method='POST', headers={'Content-Type': ctype})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def find_style(speakers, name, style, name_key='name', styles_key='styles', id_key='id'):
    """名前と声の種類で探す（名前は前方一致でもよい。声の種類が見つからなければ最初のもの）"""
    cands = [s for s in speakers if s[name_key] == name] or [s for s in speakers if s[name_key].startswith(name) or name in s[name_key]]
    if not cands:
        return None
    for s in cands:
        for st in s[styles_key]:
            if st['name'] == style:
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


def main():
    args = sys.argv[1:]
    redo = '--yarinaoshi' in args
    only = [a for a in args if not a.startswith('--')]
    replies = json.load(open(os.path.join(HERE, 'henji.json'), encoding='utf-8'))['replies']

    engines = {}
    for eng, base in URL.items():
        try:
            engines[eng] = json.loads(get(base + ('/v1/speakers' if eng == 'COEIROINK' else '/speakers')))
            print(f'{eng}: つながった（{len(engines[eng])}人）')
        except Exception as e:
            print(f'{eng}: つながらないので とばす（{base}）')

    made = 0
    for folder, eng, name, style, yomi in VOICES:
        if only and folder not in only:
            continue
        if eng not in engines:
            continue
        if eng == 'COEIROINK':
            hit = find_style(engines[eng], name, style, 'speakerName', 'styles', 'styleId')
        else:
            hit = find_style(engines[eng], name, style, 'name', 'styles', 'id')
        if not hit:
            print(f'  {folder}: {eng} に「{name}」が入っていないので とばす')
            continue
        spk, sid = hit
        ref = os.path.join(ROOT, folder, '00.mp3')
        target = mean_db(ref) if os.path.exists(ref) else None
        os.makedirs(os.path.join(HERE, folder), exist_ok=True)
        for n, r in enumerate(replies):
            out = os.path.join(HERE, folder, f'{n:02d}.mp3')
            if os.path.exists(out) and not redo:
                continue
            text = r['text'].replace('{name}', yomi)
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
        print(f'  {folder}: できた（{name}・{style}）')
    print(f'作ったファイル：{made}個')


if __name__ == '__main__':
    main()
