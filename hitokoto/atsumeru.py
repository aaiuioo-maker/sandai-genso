# きょうの一言：今までの動画から 字幕と声の場所を集めて、hitokoto/index.html の中の
# 「// ---- ここから自動 ----」〜「// ---- ここまで自動 ----」を書きかえる。
# 新しい動画の声ができたら、もう一度これを動かすと その動画の字幕も入る。
#   "/c/Program Files/DVDFab/StreamFab/PYthon37/python.exe" -I hitokoto/atsumeru.py
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# 18人（声の一覧と同じ順）。声のフォルダの名前 → 番号
DIRS = ['koe-metan', 'koe-tsumugi', 'koe-hau', 'koe-sayo', 'koe-tsukuyomi', 'koe-mana', 'koe-kana', 'koe-lilin',
        'koe-ameno-kuma', 'koe-mao', 'koe-mai', 'koe-kohaku', 'koe-runa', 'koe-sakurane', 'koe-chuni', 'koe-kanon',
        'koe-himari', 'koe-nurserobo']
ALIAS = {'koe': 'koe-metan'}

S = r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")"""
CAP = re.compile(r'^\s*\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*' + S + r'\s*,\s*' + S + r'\s*,\s*' + S)
VOI = re.compile(r"\[\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'(\w+)'\s*\]")


def text(m, k):
    return (m.group(k) if m.group(k) is not None else m.group(k + 1)).replace("\\'", "'").replace('\\"', '"')


def block(src, name):
    i = src.index('const ' + name + ' = [')
    j = src.index('\n];', i) if name == 'CAPS' else src.index(']];', i) + 3
    return src[i:j]


def main():
    tana = open(os.path.join(ROOT, 'tana', 'index.html'), encoding='utf-8').read()
    apps = re.findall(r"^\s*\['\.\./([^']*)',\s*'([^']+)',\s*'([^']+)'", tana[tana.index('const APPS = ['):tana.index('\n];', tana.index('const APPS = ['))], re.M)
    srcs, lines = [], []
    for path, name, short in apps:
        if '/' in path.strip('/'):  # 三尊の弥陀の ①②③ はとばす（まとめて1つ）
            continue
        folder = os.path.join(ROOT, path)
        page = os.path.join(folder, 'douga.js') if os.path.exists(os.path.join(folder, 'douga.js')) else os.path.join(folder, 'index.html')
        src = open(page, encoding='utf-8').read()
        caps = [m for m in (CAP.match(l) for l in block(src, 'CAPS').split('\n')) if m]
        kv = re.search(r'const KOE_V = (\d+)', src)
        koe = [0] * 18
        for d, ext in VOI.findall(block(src, 'VOICES')):
            real = os.path.basename(d)
            b = ALIAS.get(real, real)
            if b in DIRS and os.path.isdir(os.path.join(folder, real)):
                koe[DIRS.index(b)] = real + '/.' + ext
        si = len(srcs)
        n = 0
        for i, m in enumerate(caps):
            l1, l2, yomi = text(m, 1), text(m, 3), text(m, 5)
            if 'ご視聴' in l1 or (i == 0 and path):  # 題名とおわりのあいさつはとばす
                continue
            mask = 0
            for v, k in enumerate(koe):
                if k:
                    d, ext = k.split('/.')
                    f = os.path.join(folder, d, '%02d.%s' % (i, ext))
                    if os.path.exists(f) and os.path.getsize(f) > 1000:
                        mask |= 1 << v
            if mask:
                lines.append([si, i, l1, l2, yomi, mask])
                n += 1
        if n:
            srcs.append([path, name, short, int(kv.group(1)) if kv else 1, koe])
        print('%-12s %-20s %2d' % (path or '(top)', name, n))
    out = ('const SRC = [\n' + ',\n'.join('  ' + json.dumps(s, ensure_ascii=False) for s in srcs) + '\n];\n'
           'const LINES = [\n' + ',\n'.join('  ' + json.dumps(l, ensure_ascii=False) for l in lines) + '\n];\n')
    html_path = os.path.join(HERE, 'index.html')
    html = open(html_path, encoding='utf-8').read()
    a, b = '// ---- ここから自動 ----\n', '// ---- ここまで自動 ----'
    html = html[:html.index(a) + len(a)] + out + html[html.index(b):]
    open(html_path, 'w', encoding='utf-8', newline='\n').write(html)
    print('動画 %d本・一言 %d個' % (len(srcs), len(lines)))


if __name__ == '__main__':
    main()
