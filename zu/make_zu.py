# Git・Claude Code・GitHub の関係図を JW_CAD で開ける DXF（R12・Shift_JIS）と、確認用の SVG に書き出す
# 単位は mm、用紙は A3 横（420 × 297）
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = "git-claude-github"

# 画層: 名前, DXF の色番号, SVG の色
LAYERS = {
    "0_waku":   (7, "#222222"),   # 図枠・表題欄
    "1_zukei":  (5, "#1f5fbf"),   # 箱
    "2_yajirushi": (1, "#c8361f"),   # 矢印
    "3_moji":   (7, "#222222"),   # 文字
    "4_hojo":   (8, "#888888"),   # 点線の囲み
}

ents = []  # ("line", layer, x1, y1, x2, y2, dashed) / ("text", layer, x, y, h, s) / ("circle", layer, x, y, r)

def line(x1, y1, x2, y2, layer="1_zukei", dashed=False):
    ents.append(("line", layer, x1, y1, x2, y2, dashed))

def rect(x1, y1, x2, y2, layer="1_zukei", dashed=False):
    line(x1, y1, x2, y1, layer, dashed); line(x2, y1, x2, y2, layer, dashed)
    line(x2, y2, x1, y2, layer, dashed); line(x1, y2, x1, y1, layer, dashed)

def circle(x, y, r, layer="1_zukei"):
    ents.append(("circle", layer, x, y, r))

def text_w(s, h):
    return sum(h * (0.5 if ord(c) < 0x80 else 1.0) for c in s)

def text(x, y, s, h=3.5, layer="3_moji", align="left"):
    if align == "center":
        x -= text_w(s, h) / 2
    ents.append(("text", layer, x, y, h, s))

def head(x, y, ang, layer="2_yajirushi", size=3.0):
    for d in (math.radians(155), math.radians(-155)):
        line(x, y, x + size * math.cos(ang + d), y + size * math.sin(ang + d), layer)

def arrow(pts, layer="2_yajirushi", both=False):
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        line(ax, ay, bx, by, layer)
    (ax, ay), (bx, by) = pts[-2], pts[-1]
    head(bx, by, math.atan2(by - ay, bx - ax), layer)
    if both:
        (ax, ay), (bx, by) = pts[1], pts[0]
        head(bx, by, math.atan2(by - ay, bx - ax), layer)

# ---- 図枠と表題欄 ----
rect(5, 5, 415, 292, "0_waku")
rect(10, 10, 410, 287, "0_waku")
tb = (290, 10, 410, 46)
rect(*tb, layer="0_waku")
for y in (22, 34):
    line(290, y, 410, y, "0_waku")
line(312, 10, 312, 46, "0_waku")
text(293, 38, "図名", 3)
text(315, 38, "Git・Claude Code・GitHub の関係図", 3)
text(293, 26, "日付", 3)
text(315, 26, "2026-10-27", 3)
text(293, 14, "作成", 3)
text(315, 14, "Claude Code（sandai-genso）", 3)

# ---- 題 ----
text(210, 270, "Git ・ Claude Code ・ GitHub のつながり", 7, align="center")

# ---- クラウドのコンテナ（点線の囲み）----
rect(18, 108, 276, 252, "4_hojo", dashed=True)
text(22, 246, "クラウドのコンテナ（Claude Code の作業場所）", 3, "4_hojo")

# ---- Claude Code ----
rect(28, 118, 132, 238)
rect(28, 226, 132, 238)
text(80, 230, "Claude Code", 5, align="center")
for i, s in enumerate(["① 指示を読む", "② ファイルを読む・編集", "③ git コマンドを動かす",
                       "④ 確かめる（動かす・見る）", "⑤ GitHub MCP で", "　 PR 作成・コメント"]):
    text(34, 214 - i * 15, s, 3.5)

# ---- Git（手元のリポジトリ）----
rect(160, 118, 270, 238)
rect(160, 226, 270, 238)
text(215, 230, "Git（手元のリポジトリ）", 4.5, align="center")
rect(168, 198, 262, 218); text(215, 206, "作業ツリー（ファイル）", 3.5, align="center")
rect(168, 166, 262, 186); text(215, 174, "ステージ（次に記録する分）", 3.5, align="center")
rect(168, 124, 262, 154); text(172, 147, "コミットの履歴", 3.5)
for i in range(4):
    cx = 180 + i * 22
    circle(cx, 134, 3)
    if i: line(cx - 19, 134, cx - 3, 134)
text(180 + 3 * 22 - 4, 139, "新", 2.5)
arrow([(215, 198), (215, 186)]); text(218, 190, "git add", 3, "2_yajirushi")
arrow([(215, 166), (215, 154)]); text(218, 158, "git commit", 3, "2_yajirushi")

# Claude Code → Git
arrow([(132, 208), (168, 208)]); text(136, 211, "編集", 3, "2_yajirushi")
arrow([(132, 176), (168, 176)]); text(136, 179, "add/commit", 3, "2_yajirushi")

# ---- GitHub（リモート）----
rect(300, 118, 402, 238)
rect(300, 226, 402, 238)
text(351, 230, "GitHub（リモート）", 4.5, align="center")
rect(308, 196, 394, 218)
text(351, 209, "作業ブランチ", 3.5, align="center")
text(351, 201, "claude/…", 3, align="center")
rect(308, 160, 394, 182)
text(351, 173, "プルリクエスト", 3.5, align="center")
text(351, 165, "レビュー・CI", 3, align="center")
rect(308, 124, 394, 146)
text(351, 133, "main", 4, align="center")
arrow([(351, 196), (351, 182)])
arrow([(351, 160), (351, 146)]); text(354, 151, "マージ", 3, "2_yajirushi")

# Git ⇄ GitHub
arrow([(262, 208), (308, 208)]); text(279, 211, "git push", 3, "2_yajirushi")
arrow([(308, 135), (262, 140)]); text(280, 127, "git pull", 3, "2_yajirushi")

# Claude Code → GitHub（MCP）
arrow([(110, 238), (110, 258), (380, 258), (380, 238)])
text(170, 260.5, "GitHub MCP（PR を作る・コメントする・CI を見る）", 3, "2_yajirushi")

# ---- あなた ----
rect(28, 56, 132, 92)
circle(44, 80, 4); line(44, 76, 44, 66); line(38, 72, 50, 72)
line(44, 66, 39, 59); line(44, 66, 49, 59)
text(56, 78, "あなた", 4.5)
text(56, 66, "アプリ・ブラウザ", 3)
arrow([(70, 92), (70, 118)]); text(73, 103, "指示（日本語）", 3, "2_yajirushi")
arrow([(95, 118), (95, 92)]); text(98, 109, "報告", 3, "2_yajirushi")

# ---- 流れの説明 ----
steps = [
    "流れ",
    "1. あなたが Claude Code に頼む",
    "2. Claude Code がファイルを直す",
    "3. git add → git commit で手元に記録",
    "4. git push で GitHub のブランチへ送る",
    "5. 頼まれたら プルリクエスト を作る",
    "6. レビューのあと main にマージ",
]
for i, s in enumerate(steps):
    text(150, 92 - i * 10, s, 4 if i == 0 else 3.5)

# ---- DXF（R12）----
def dxf():
    out = []
    def g(code, val): out.append(f"{code}\n{val}")
    g(0, "SECTION"); g(2, "HEADER")
    g(9, "$ACADVER"); g(1, "AC1009")
    g(9, "$DWGCODEPAGE"); g(3, "ANSI_932")
    g(9, "$EXTMIN"); g(10, 0); g(20, 0)
    g(9, "$EXTMAX"); g(10, 420); g(20, 297)
    g(0, "ENDSEC")
    g(0, "SECTION"); g(2, "TABLES")
    g(0, "TABLE"); g(2, "LTYPE"); g(70, 2)
    g(0, "LTYPE"); g(2, "CONTINUOUS"); g(70, 0); g(3, "Solid line"); g(72, 65); g(73, 0); g(40, 0.0)
    g(0, "LTYPE"); g(2, "DASHED"); g(70, 0); g(3, "__ __ __"); g(72, 65); g(73, 2); g(40, 6.0); g(49, 4.0); g(49, -2.0)
    g(0, "ENDTAB")
    g(0, "TABLE"); g(2, "LAYER"); g(70, len(LAYERS))
    for name, (aci, _) in LAYERS.items():
        g(0, "LAYER"); g(2, name); g(70, 0); g(62, aci); g(6, "CONTINUOUS")
    g(0, "ENDTAB")
    g(0, "TABLE"); g(2, "STYLE"); g(70, 1)
    g(0, "STYLE"); g(2, "STANDARD"); g(70, 0); g(40, 0.0); g(41, 1.0); g(50, 0.0); g(71, 0); g(42, 3.5); g(3, "txt"); g(4, "")
    g(0, "ENDTAB")
    g(0, "ENDSEC")
    g(0, "SECTION"); g(2, "ENTITIES")
    for e in ents:
        if e[0] == "line":
            _, la, x1, y1, x2, y2, dashed = e
            g(0, "LINE"); g(8, la)
            if dashed: g(6, "DASHED")
            g(10, f"{x1:.3f}"); g(20, f"{y1:.3f}"); g(30, 0); g(11, f"{x2:.3f}"); g(21, f"{y2:.3f}"); g(31, 0)
        elif e[0] == "circle":
            _, la, x, y, r = e
            g(0, "CIRCLE"); g(8, la); g(10, f"{x:.3f}"); g(20, f"{y:.3f}"); g(30, 0); g(40, r)
        else:
            _, la, x, y, h, s = e
            g(0, "TEXT"); g(8, la); g(10, f"{x:.3f}"); g(20, f"{y:.3f}"); g(30, 0); g(40, h); g(1, s); g(7, "STANDARD")
    g(0, "ENDSEC"); g(0, "EOF")
    return "\r\n".join(out).replace("\n", "\r\n").replace("\r\r\n", "\r\n") + "\r\n"

with open(os.path.join(HERE, NAME + ".dxf"), "wb") as f:
    f.write(dxf().encode("cp932"))

# ---- 確認用 SVG ----
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
H = 297
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="1680" height="1188">',
       '<rect width="420" height="297" fill="#fff"/>']
for e in ents:
    col = LAYERS[e[1]][1]
    if e[0] == "line":
        _, la, x1, y1, x2, y2, dashed = e
        da = ' stroke-dasharray="4 2"' if dashed else ""
        svg.append(f'<line x1="{x1:.2f}" y1="{H-y1:.2f}" x2="{x2:.2f}" y2="{H-y2:.2f}" stroke="{col}" stroke-width="0.35"{da}/>')
    elif e[0] == "circle":
        _, la, x, y, r = e
        svg.append(f'<circle cx="{x:.2f}" cy="{H-y:.2f}" r="{r}" fill="none" stroke="{col}" stroke-width="0.35"/>')
    else:
        _, la, x, y, h, s = e
        svg.append(f'<text x="{x:.2f}" y="{H-y:.2f}" font-size="{h}" fill="{col}" font-family="IPAGothic, Noto Sans CJK JP, MS Gothic, sans-serif">{esc(s)}</text>')
svg.append("</svg>")
with open(os.path.join(HERE, NAME + ".svg"), "w", encoding="utf-8") as f:
    f.write("\n".join(svg))
print(len(ents), "entities")
