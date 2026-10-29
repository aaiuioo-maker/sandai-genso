import cv2, numpy as np, ezdxf, sys
src, out = sys.argv[1], sys.argv[2]
img = cv2.imread(src)
H, W = img.shape[:2]
S = 4  # upscale for smoother contours
big = cv2.resize(img, (W*S, H*S), interpolation=cv2.INTER_CUBIC)
mask = (big.min(axis=2) < 170).astype(np.uint8)*255
mask = cv2.GaussianBlur(mask, (9, 9), 0); _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
doc = ezdxf.new("R2010", setup=True); doc.units = ezdxf.units.MM
msp = doc.modelspace()
layers = {"CLAUDE_ICON": 1, "CLAUDE_TEXT": 3, "GITHUB_LOGO": 5, "GITHUB_TEXT": 6}
for n, c in layers.items(): doc.layers.add(n, color=c)
k = 0.1 / S  # 1 source px = 0.1 mm
n = 0
for c in cnts:
    if cv2.contourArea(c) < 20*S*S: continue
    x, y, w, h = cv2.boundingRect(c)
    cx, cy = (x + w/2)/S, (y + h/2)/S
    if cx < 840: layer = "CLAUDE_ICON" if cy < 760 else "CLAUDE_TEXT"
    else:        layer = "GITHUB_LOGO" if cy < 740 else "GITHUB_TEXT"
    eps = 2.0 if layer == "CLAUDE_ICON" else 1.2
    a = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
    pts = [(px*k, (H*S - py)*k) for px, py in a]
    msp.add_lwpolyline(pts, close=True, dxfattribs={"layer": layer}); n += 1
dark = (big.max(axis=2) < 80).astype(np.uint8)*255
ec, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for c in ec:
    x, y, w, h = cv2.boundingRect(c)
    if x/S < 840 and y/S < 640 and w*h > 400*S*S:  # eyes inside the mascot body
        pts = [(px*k, (H*S - py)*k) for px, py in [(x, y), (x+w, y), (x+w, y+h), (x, y+h)]]
        msp.add_lwpolyline(pts, close=True, dxfattribs={"layer": "CLAUDE_ICON"}); n += 1
doc.saveas(out); print(n, "closed polylines;", W*0.1, "x", H*0.1, "mm")
