"""オリジナルの「気功波」バトルシーンを JWCAD で開ける DXF (R12) として書き出す。"""
import math
import random
import sys

import ezdxf

out = sys.argv[1]
random.seed(7)

doc = ezdxf.new("R12")
doc.encoding = "cp932"  # JWCAD 用に Shift_JIS (ANSI_932)
msp = doc.modelspace()

LAYERS = {
    "0_枠": 7,
    "1_集中線": 8,
    "2_人物": 7,
    "3_気功波": 6,
    "4_稲妻": 6,
    "5_的": 5,
    "6_斜線": 8,
}
for name, color in LAYERS.items():
    doc.layers.add(name, color=color)

W, H = 297.0, 420.0  # A3 縦


def poly(pts, layer, closed=False):
    msp.add_polyline2d(pts, close=closed, dxfattribs={"layer": layer})


def line(a, b, layer):
    msp.add_line(a, b, dxfattribs={"layer": layer})


def circle(c, r, layer):
    msp.add_circle(c, r, dxfattribs={"layer": layer})


# --- 枠 ---
poly([(0, 0), (W, 0), (W, H), (0, H)], "0_枠", closed=True)
poly([(8, 8), (W - 8, 8), (W - 8, H - 8), (8, H - 8)], "0_枠", closed=True)

# --- 集中線（着弾点から放射） ---
hit = (205.0, 300.0)
for i in range(110):
    ang = 2 * math.pi * i / 110 + random.uniform(-0.02, 0.02)
    r0 = random.uniform(32, 55)
    r1 = random.uniform(140, 260)
    a = (hit[0] + r0 * math.cos(ang), hit[1] + r0 * math.sin(ang))
    b = (hit[0] + r1 * math.cos(ang), hit[1] + r1 * math.sin(ang))
    # 枠内にクリップ
    # 枠(内側 9mm)内に収まる長さまで縮める
    for _ in range(40):
        if 9 < b[0] < W - 9 and 62 < b[1] < H - 9:
            break
        r1 *= 0.95
        b = (hit[0] + r1 * math.cos(ang), hit[1] + r1 * math.sin(ang))
    if r1 > r0 + 10:
        line(a, b, "1_集中線")

# --- 背景の斜線（左側のスピード感） ---
for i in range(40):
    x = 10 + i * 2.4
    line((x, 62), (x + 20, 160), "6_斜線")

# --- オリジナル人物：鉢巻きと道着の拳法家（左下で踏み込み） ---
# 頭
head = (82.0, 196.0)
circle(head, 11, "2_人物")
# 鉢巻きとたなびく端
poly([(71, 198), (93, 199)], "2_人物")
poly([(71, 198), (58, 203), (46, 200), (36, 206)], "2_人物")
poly([(71, 196), (60, 194), (48, 189), (40, 192)], "2_人物")
# 目（鋭い一本線）
line((86, 197), (91, 196), "2_人物")
# 胴（道着の前合わせ）
torso = [(70, 184), (96, 184), (100, 150), (66, 148)]
poly(torso, "2_人物", closed=True)
poly([(76, 184), (84, 166), (92, 184)], "2_人物")
# 帯
poly([(66, 152), (100, 154), (100, 148), (66, 146)], "2_人物", closed=True)
poly([(98, 150), (108, 140), (104, 138)], "2_人物")
# 後ろ腕（引いた拳）
poly([(70, 180), (55, 170), (60, 158)], "2_人物")
circle((61, 155), 4.5, "2_人物")
# 前腕（突き出して指先から発射）
poly([(96, 180), (120, 186), (146, 194)], "2_人物")
poly([(96, 172), (120, 179), (145, 187)], "2_人物")
circle((150, 191), 5, "2_人物")
poly([(154, 193), (164, 197)], "2_人物")  # 指
# 袴風のズボンと脚（大きく踏み込み）
poly([(66, 146), (40, 112), (22, 70)], "2_人物")
poly([(84, 146), (56, 108), (36, 70)], "2_人物")
poly([(84, 146), (118, 112), (140, 72)], "2_人物")
poly([(100, 148), (132, 116), (156, 74)], "2_人物")
# 足
poly([(18, 70), (40, 70), (42, 62), (14, 62)], "2_人物", closed=True)
poly([(136, 72), (160, 74), (166, 64), (134, 63)], "2_人物", closed=True)
# 地面
line((10, 60), (W - 10, 60), "0_枠")

# --- 気功波（指先→着弾点の太いビーム） ---
src = (166.0, 198.0)
dx, dy = hit[0] - src[0], hit[1] - src[1]
L = math.hypot(dx, dy)
nx, ny = -dy / L, dx / L
for w in (1.5, 4.0, 7.0):
    a1 = (src[0] + nx * w * 0.4, src[1] + ny * w * 0.4)
    a2 = (src[0] - nx * w * 0.4, src[1] - ny * w * 0.4)
    b1 = (hit[0] + nx * w, hit[1] + ny * w)
    b2 = (hit[0] - nx * w, hit[1] - ny * w)
    poly([a1, b1, b2, a2], "3_気功波", closed=True)
# 発射点のフラッシュ（星形）
def star(c, r_out, r_in, n, layer, rot=0.0):
    pts = []
    for k in range(2 * n):
        r = r_out if k % 2 == 0 else r_in
        t = rot + math.pi * k / n
        pts.append((c[0] + r * math.cos(t), c[1] + r * math.sin(t)))
    poly(pts, layer, closed=True)

star(src, 14, 5, 9, "3_気功波", 0.2)
star(hit, 30, 12, 12, "3_気功波", 0.1)
circle(hit, 8, "3_気功波")

# --- 稲妻（腕から立ち上るオーラ） ---
def bolt(p, q, layer, steps=9, amp=7):
    pts = [p]
    for k in range(1, steps):
        t = k / steps
        x = p[0] + (q[0] - p[0]) * t + random.uniform(-amp, amp)
        y = p[1] + (q[1] - p[1]) * t + random.uniform(-amp, amp)
        pts.append((x, y))
    pts.append(q)
    poly(pts, layer)

bolt((120, 188), (95, 290), "4_稲妻")
bolt((105, 184), (70, 255), "4_稲妻")
bolt((135, 192), (150, 330), "4_稲妻")

# --- 的：浮遊する結晶（オリジナルの標的） ---
cx, cy = 245.0, 352.0
crystal = [(cx, cy + 40), (cx + 18, cy + 10), (cx + 10, cy - 30), (cx - 10, cy - 30), (cx - 18, cy + 10)]
poly(crystal, "5_的", closed=True)
line((cx, cy + 40), (cx, cy - 30), "5_的")
line((cx - 18, cy + 10), (cx + 18, cy + 10), "5_的")
# ひび
poly([(cx - 4, cy - 12), (cx - 10, cy - 20), (cx - 6, cy - 26)], "5_的")
poly([(cx + 3, cy - 10), (cx + 9, cy - 4), (cx + 14, cy - 8)], "5_的")

# --- 擬音（DXF の TEXT。JWCAD で文字として編集可能） ---
msp.add_text("ドンッ!!", dxfattribs={"layer": "0_枠", "height": 22, "insert": (190, 210), "rotation": 15})

doc.saveas(out, encoding="cp932")
print("saved", out)
