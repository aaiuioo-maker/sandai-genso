# Claude Code のキャラクターと GitHub のロゴを、JW_CAD で開ける DXF（R12・Shift_JIS）と確認用の SVG に書き出す
# 単位は mm、A3 横（420 × 297）の大きさに置く。外形は線、中の塗りはソリッド（SOLID）で入れる
# GitHub のロゴは src/github.jpg、Claude Code の文字は src/claude-code-moji.png を potrace でなぞる（pip install potracer pillow numpy）
import math, os
import numpy as np
from PIL import Image
import potrace

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = "logo-claude-github"

# 画層: 名前, DXF の色番号, SVG の色
LAYERS = {
    "1_claude": (30, "#d97757"),  # Claude Code の外形
    "2_claude_nuri": (30, "#d97757"),  # Claude Code の塗り
    "3_me":     (7, "#000000"),   # Claude Code の目
    "4_github": (7, "#111111"),   # GitHub の外形
    "5_github_nuri": (7, "#111111"),  # GitHub の塗り
    "6_moji":   (7, "#111111"),   # Claude Code の文字の外形
    "7_moji_nuri": (7, "#111111"),  # Claude Code の文字の塗り
}

ents = []  # ("line", layer, x1, y1, x2, y2) / ("solid", layer, [(x, y) × 4])

def line(x1, y1, x2, y2, layer):
    ents.append(("line", layer, x1, y1, x2, y2))

def poly(pts, layer):
    for a, b in zip(pts, pts[1:] + pts[:1]):
        line(*a, *b, layer)

def solid(p1, p2, p3, p4, layer):
    # p1-p2 が下の辺、p4-p3 が上の辺（DXF の SOLID は 1,2,4,3 の順でまわる）
    ents.append(("solid", layer, [p1, p2, p4, p3]))

def fill(polys, layer):
    # 偶奇規則で塗る。頂点の高さで横に切った帯ごとに台形を作り、同じ左右の辺でつづく台形は1つのソリッドにまとめる
    edges = []
    for pts in polys:
        for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
            if y1 != y2:
                edges.append((x1, y1, x2, y2) if y1 < y2 else (x2, y2, x1, y1))
    def xat(i, y):
        ax, ay, bx, by = edges[i]
        return ax + (bx - ax) * (y - ay) / (by - ay)
    ys = sorted({round(y, 6) for pts in polys for _, y in pts})
    open_ = {}  # (左の辺, 右の辺) -> 始まりの高さ
    def close(key, y_top):
        l, r = key; y_bot = open_.pop(key)
        solid((xat(l, y_bot), y_bot), (xat(r, y_bot), y_bot), (xat(r, y_top), y_top), (xat(l, y_top), y_top), layer)
    for y0, y1 in zip(ys, ys[1:]):
        if y1 - y0 < 1e-6:
            continue
        ym = (y0 + y1) / 2
        xs = sorted((xat(i, ym), i) for i, (_, ay, _, by) in enumerate(edges) if ay <= ym < by)
        keys = {(l, r) for (_, l), (_, r) in zip(xs[0::2], xs[1::2])}
        for k in [k for k in open_ if k not in keys]:
            close(k, y0)
        for k in keys:
            open_.setdefault(k, y0)
    for k in list(open_):
        close(k, ys[-1])

# ---- Claude Code（ドット絵：横 11 × 縦 8 マス、1 マスは横 12 × 縦 13 mm）----
UX, UY = 12.0, 13.0
CX, CY = 32.0, 111.0  # 左下の角（下の文字とのすき間は、GitHub の猫と文字のすき間にそろえる）
GX, GY = 200.0, 65.0  # GitHub の左下の角
def cell(c, r):  # c: 左から、r: 下から
    return (CX + c * UX, CY + r * UY)

# 外形（左下の足から反時計まわり）。マスの座標で書く
outline = [(1, 0), (2, 0), (2, 2), (3, 2), (3, 0), (4, 0), (4, 2), (7, 2), (7, 0), (8, 0), (8, 2),
           (9, 2), (9, 0), (10, 0), (10, 4), (11, 4), (11, 6), (10, 6), (10, 8), (1, 8), (1, 6),
           (0, 6), (0, 4), (1, 4)]
body = [cell(c, r) for c, r in outline]
eyes = [[cell(2, 5), cell(3, 5), cell(3, 6), cell(2, 6)], [cell(8, 5), cell(9, 5), cell(9, 6), cell(8, 6)]]
poly(body, "1_claude")
fill([body] + eyes, "2_claude_nuri")  # 目は穴として抜く
for e in eyes:
    poly(e, "3_me")
    solid(*e, "3_me")

# ---- GitHub（src/github.jpg をなぞる）----
def bezier(a, b, c, d, n):
    return [tuple((1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c[i] + t ** 3 * d[i]
                  for i in range(2)) for t in (k / n for k in range(1, n + 1))]

def trace(name, place, up=1):
    # src/name の暗いところをなぞって mm の多角形にする。place(幅, 高さ) は (mm/画素, 左下 x, 左下 y) を返す
    # up 倍に拡大してからなぞると、小さい画像でも線がなめらかになる
    im = Image.open(os.path.join(HERE, "src", name)).convert("L")
    if up > 1:
        im = im.resize((im.width * up, im.height * up), Image.LANCZOS)
    dark = np.array(im) < 128
    ys, xs = np.nonzero(dark)
    crop = dark[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    H, W = crop.shape
    S, ox, oy = place(W, H)
    to_mm = lambda p: (ox + p.x * S, oy + (H - p.y) * S)
    polys = []
    for curve in potrace.Bitmap(~crop).trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.2):
        pts, cur = [], to_mm(curve.start_point)
        for seg in curve:
            if seg.is_corner:
                pts += [to_mm(seg.c), to_mm(seg.end_point)]
            else:
                a, b, c, d = cur, to_mm(seg.c1), to_mm(seg.c2), to_mm(seg.end_point)
                n = max(2, min(24, int(math.dist(a, d) / 0.8) + 2))  # 0.8 mm ごとくらいに区切る
                pts += bezier(a, b, c, d, n)
            cur = pts[-1]
        polys.append(pts)
    return polys

gpolys = trace("github.jpg", lambda W, H: (0.235, GX, GY))

# 「GitHub」の文字だけを小さくする（猫の丸より下にある形を、文字の上の辺の真ん中を中心に縮める）
WORD = 0.7
circle_bottom = min(y for x, y in max(gpolys, key=len))
word = [pts for pts in gpolys if max(y for _, y in pts) < circle_bottom]
wx = [x for pts in word for x, _ in pts]
wcx, wtop = (min(wx) + max(wx)) / 2, max(y for pts in word for _, y in pts)
for pts in word:
    pts[:] = [(wcx + (x - wcx) * WORD, wtop + (y - wtop) * WORD) for x, y in pts]
word_bottom = min(y for pts in word for _, y in pts)

# Claude Code の文字（src/claude-code-moji.png）は、キャラクターの下の真ん中に置き、「GitHub」の文字と下をそろえる
MOJI_W = 150.0
mpolys = trace("claude-code-moji.png", lambda W, H: (MOJI_W / W, CX + 5.5 * UX - MOJI_W / 2, word_bottom), up=4)
for pts in mpolys:
    poly(pts, "6_moji")
fill(mpolys, "7_moji_nuri")

for pts in gpolys:
    poly(pts, "4_github")
fill(gpolys, "5_github_nuri")

# ---- DXF（R12）----
def dxf():
    out = []
    def g(code, val): out.append(f"{code}\r\n{val}")
    def xy(i, x, y): g(10 + i, f"{x:.3f}"); g(20 + i, f"{y:.3f}"); g(30 + i, 0)
    g(0, "SECTION"); g(2, "HEADER")
    g(9, "$ACADVER"); g(1, "AC1009")
    g(9, "$DWGCODEPAGE"); g(3, "ANSI_932")
    g(9, "$EXTMIN"); g(10, 0); g(20, 0)
    g(9, "$EXTMAX"); g(10, 420); g(20, 297)
    g(0, "ENDSEC")
    g(0, "SECTION"); g(2, "TABLES")
    g(0, "TABLE"); g(2, "LTYPE"); g(70, 1)
    g(0, "LTYPE"); g(2, "CONTINUOUS"); g(70, 0); g(3, "Solid line"); g(72, 65); g(73, 0); g(40, 0.0)
    g(0, "ENDTAB")
    g(0, "TABLE"); g(2, "LAYER"); g(70, len(LAYERS))
    for name, (aci, _) in LAYERS.items():
        g(0, "LAYER"); g(2, name); g(70, 0); g(62, aci); g(6, "CONTINUOUS")
    g(0, "ENDTAB")
    g(0, "ENDSEC")
    g(0, "SECTION"); g(2, "ENTITIES")
    for e in ents:
        g(0, e[0].upper()); g(8, e[1])
        if e[0] == "line":
            xy(0, e[2], e[3]); xy(1, e[4], e[5])
        else:
            for i, (x, y) in enumerate(e[2]):
                xy(i, x, y)
    g(0, "ENDSEC"); g(0, "EOF")
    return "\r\n".join(out) + "\r\n"

with open(os.path.join(HERE, NAME + ".dxf"), "wb") as f:
    f.write(dxf().encode("cp932"))

# ---- 確認用 SVG ----
P = 297
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="1680" height="1188">',
       '<rect width="420" height="297" fill="#fff"/>']
for e in ents:
    col = LAYERS[e[1]][1]
    if e[0] == "line":
        svg.append(f'<line x1="{e[2]:.2f}" y1="{P-e[3]:.2f}" x2="{e[4]:.2f}" y2="{P-e[5]:.2f}" stroke="{col}" stroke-width="0.3"/>')
    else:
        a, b, c, d = e[2]  # 1,2,4,3 の順で入っているので、まわる順 1,2,3,4 に直す
        pts = " ".join(f"{x:.2f},{P-y:.2f}" for x, y in (a, b, d, c))
        svg.append(f'<polygon points="{pts}" fill="{col}" stroke="{col}" stroke-width="0.15"/>')
svg.append("</svg>")
with open(os.path.join(HERE, NAME + ".svg"), "w", encoding="utf-8") as f:
    f.write("\n".join(svg))
print(len(ents), "entities,", sum(e[0] == "solid" for e in ents), "solids,", len(gpolys), "github paths,", len(mpolys), "moji paths")
