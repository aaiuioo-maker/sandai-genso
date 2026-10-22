// =============================================================
// Claude Code のキャラクターが マイクラのクリーパー・ゾンビに変身する動き（10 + 10 とおり）
//   creeper.html・zombie.html の見本と、index.html の案内役（cc-mascot.js の CC_EXTRA）の両方がここを使う
//   window.CC_HENSHIN       … 見本ページ用：形・描画の道具・変身のパターン
//   window.CC_HENSHIN_MOVES … 案内役用：cc-mascot.js と同じ形（.seq が [コマの絵, 長さ(ミリ秒)] の並び）の 20 個
// =============================================================
(function ccHenshin() {
const G = 48, GROUND = 42, CS = 2; // 見本の画面の大きさ・地面の高さ・1マスの大きさ

// ---------- 2人の形（マス目） ----------
// Claude Code のキャラクター（index.html の案内役と同じ形）
const MASCOT = (() => {
  const c = '#d97757', cells = [];
  for (let y = 0; y < 6; y++) for (let x = 2; x < 10; x++) cells.push({ x, y, c });
  [[0, 2], [1, 2], [0, 3], [1, 3], [10, 2], [11, 2], [10, 3], [11, 3]].forEach(([x, y]) => cells.push({ x, y, c }));
  [2, 4, 7, 9].forEach(x => { cells.push({ x, y: 6, c }); cells.push({ x, y: 7, c }); });
  cells.forEach(e => { if ((e.x === 3 || e.x === 8) && e.y === 1) e.c = '#1a1612'; });
  return { w: 12, h: 8, cells };
})();
// マインクラフトのクリーパー（顔・体・足）
const CREEPER = (() => {
  const greens = ['#4fa83c', '#5fbf4a', '#3d8a2e', '#7ad35e', '#56b043', '#2f6f24'];
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const face = ['........', '.XX..XX.', '.XX..XX.', '...XX...', '..XXXX..', '..XXXX..', '..X..X..', '........'];
  const cells = [];
  const g = () => greens[(r() * greens.length) | 0];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) cells.push({ x, y, c: face[y][x] === 'X' ? '#141414' : g() });
  for (let y = 8; y < 14; y++) for (let x = 2; x < 6; x++) cells.push({ x, y, c: g() });
  for (let y = 14; y < 16; y++) for (const x of [0, 1, 2, 5, 6, 7]) cells.push({ x, y, c: g() });
  return { w: 8, h: 16, cells };
})();
const ZOMBIE = (() => {
  const rows = [
    '..HHHHHHHH..', '..HGGGGGGH..', '..GGGGGGGG..', '..GKKGGKKG..', '..GGGNNGGG..', '..GGGGGGGG..', '..GGMMMMGG..', '..GGGGGGGG..',
    '.CCCCCCCCCC.', '.CCCCCCCCCC.', '.GGCCCCCCGG.', '.GGCCCCCCGG.', '.GGCCCCCCGG.', '.GGPPPPPPGG.',
    '...PPPPPP...', '...PPdPPP...', '...PPdPPP...', '...PPdPPP...', '...SSSSSS...',
  ];
  const pal = {
    H: ['#2f5a24', '#38692b'], G: ['#5f9a45', '#4f8a3a', '#6aa84f', '#578f40'], K: ['#101010'], N: ['#3f7030'], M: ['#2b4a20'],
    C: ['#2aa8a8', '#239090', '#33b8b8'], P: ['#3a3fa0', '#2e3388', '#4248b0'], d: ['#22266a'], S: ['#6b6b6b', '#5a5a5a'],
  };
  let s = 21; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { const p = pal[ch]; cells.push({ x, y, c: p[(r() * p.length) | 0], k: ch }); } }));
  return { w: 12, h: rows.length, cells };
})();
const isArm = e => e.y >= 8 && (e.x <= 2 || e.x >= 9);
const isLeftLeg = e => e.y >= 14 && e.x <= 5;

// ---------- 描画の道具 ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
function mix(c1, c2, k) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const ch = s => Math.round(lerp((a >> s) & 255, (b >> s) & 255, clamp(k)));
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
}
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// 描く先（キャンバス・記録）に合わせて R / T / clip / shake を渡すと、円とキャラクターを描く道具がそろう
function makeG(base) {
  const g = {
    ...base,
    disc(cx, cy, r, c, a = 1) { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + .3); g.R(cx - w, cy + y, w * 2 + 1, 1, c, a); } },
    // 足もとの中心 (cx, by) を基準に、横 sx・縦 sy 倍で描く。col で色を差し替え、show でマスを選び、off でマスをずらす
    sprite(sp, cx, by, o = {}) {
      const sx = o.sx ?? 1, sy = o.sy ?? 1, a = o.a ?? 1;
      for (const e of sp.cells) {
        if (o.show && !o.show(e)) continue;
        const c = o.col ? o.col(e) : e.c, [dx, dy] = o.off ? o.off(e) : [0, 0];
        g.R(cx + (e.x - sp.w / 2) * CS * sx + dx, by - (sp.h - e.y) * CS * sy + dy, CS * sx + .01, CS * sy + .01, c, a);
      }
    },
  };
  return g;
}

// 待っている間の動き
const bob = t => (Math.floor(t * 4) % 2 ? -1 : 0);
function mascotIdle(g, t, o = {}) { g.sprite(MASCOT, 24, GROUND + bob(t), o); }
function creeperIdle(g, t, o = {}) {
  const sway = Math.floor(t * 2) % 2; // クリーパーは足をちょこちょこ
  g.sprite(CREEPER, 24, GROUND, { ...o, show: e => (o.show ? o.show(e) : true) && !(e.y >= 14 && sway && (e.x === 0 || e.x === 7)) });
}
function sparkle(g, x, y, k, c = '#fff') { if (k <= 0 || k >= 1) return; const r = Math.round(1 + k * 3); g.R(x - r, y, r * 2 + 1, 1, c, 1 - k); g.R(x, y - r, 1, r * 2 + 1, c, 1 - k); }
// ゾンビは うでを ゆらゆら、足を かわりばんこに
function zombieStep(t) {
  const f = Math.floor(t * 3) % 2;
  return e => isArm(e) && e.y >= 10 ? [0, f ? -1 : 0] : e.y >= 14 ? [0, (isLeftLeg(e) ? f : 1 - f) ? -1 : 0] : [0, 0];
}
function zombieAt(g, t, cx, o = {}) { g.sprite(ZOMBIE, cx, GROUND, { off: zombieStep(t), ...o }); }
function zombieIdle(g, t, o = {}) { zombieAt(g, t, 24, o); }
function walkFrame(t) { return Math.floor(t * 6) % 2 ? -1 : 0; }

// ---------- クリーパーへの 10 とおりの変身 ----------
const CREEPER_PATTERNS = [
  { name: '光につつまれて', how: 'ピカピカ光って まぶしい光の中から登場',
    draw(g, t) {
      if (t < 2.0) {
        const k = seg(t, 1.0, 2.0), on = k > 0 && Math.sin(t * (10 + k * 40)) > 0;
        mascotIdle(g, t, { col: e => on ? mix(e.c, '#ffffff', .4 + k * .6) : e.c });
      } else creeperIdle(g, t, { col: e => mix(e.c, '#ffffff', 1 - seg(t, 2.0, 2.8)) });
      const f = seg(t, 1.8, 2.6);
      if (f > 0 && f < 1) { g.disc(24, 30, Math.round(4 + f * 22), '#ffffff', (1 - f) * .9); }
      [[12, 18, 2.1], [36, 14, 2.3], [34, 32, 2.5], [10, 34, 2.7]].forEach(([x, y, s]) => sparkle(g, x, y, seg(t, s, s + .5)));
    } },
  { name: 'ドットが入れかわる', how: '1マスずつ ランダムに クリーパーのドットへ',
    draw(g, t) {
      const k = seg(t, 1.0, 2.8);
      const id = e => hash(e.x * 31 + e.y * 7);
      if (k < 1) mascotIdle(g, t, { show: e => id(e) >= k });
      if (k > 0) creeperIdle(g, t, { show: e => hash(e.x * 13 + e.y * 17 + 3) < k });
    } },
  { name: '下からスキャン', how: '緑の光の線が 足もとから頭へ',
    draw(g, t) {
      const k = ease(seg(t, 1.0, 2.8)), top = 10 - 2, line = lerp(GROUND, top, k);
      g.clip(0, 0, G, line, () => mascotIdle(g, t));
      g.clip(0, line, G, G, () => creeperIdle(g, t));
      if (k > 0 && k < 1) { g.R(6, line - 1, 36, 3, '#6fd35a', .35); g.R(4, line, 40, 1, '#b8ff9a'); }
    } },
  { name: 'ジャンプで くるっ', how: '高く跳んで くるくる回り 着地したら変身',
    draw(g, t) {
      const j = seg(t, 1.3, 2.5), crouch = t > 1.0 && t < 1.3 ? .8 : 1;
      const land = seg(t, 2.5, 2.8), squash = land > 0 && land < 1 ? 1 - .25 * Math.sin(land * Math.PI) : 1;
      const y = -Math.sin(j * Math.PI) * 18, spin = Math.cos(j * Math.PI * 4);
      const sx = j > 0 && j < 1 ? Math.max(.08, Math.abs(spin)) : 1;
      if (j < .5) g.sprite(MASCOT, 24, GROUND + y + (t < 1 ? bob(t) : 0), { sx: sx * (2 - crouch), sy: crouch });
      else if (land < 1) g.sprite(CREEPER, 24, GROUND + y, { sx: sx * (2 - squash), sy: squash, col: e => spin < 0 ? mix(e.c, '#000000', .3) : e.c });
      else creeperIdle(g, t);
      if (land > 0 && land < 1) { const d = land * 8; g.R(24 - 8 - d, GROUND - 2, 2, 2, '#c8b8a0', 1 - land); g.R(24 + 6 + d, GROUND - 2, 2, 2, '#c8b8a0', 1 - land); }
    } },
  { name: 'ブロックを つみあげ', how: '地面にもぐって 空からブロックが降ってくる',
    draw(g, t) {
      const sink = ease(seg(t, 0.9, 1.4));
      g.clip(0, 0, G, GROUND, () => g.sprite(MASCOT, 24, GROUND + sink * 18 + (t < .9 ? bob(t) : 0)));
      for (const e of CREEPER.cells) {
        const row = CREEPER.h - 1 - e.y, st = 1.5 + row * .1 + hash(e.x + e.y * 9) * .05, k = seg(t, st, st + .25);
        if (k <= 0) continue;
        const yy = lerp(-20, 0, k * k);
        g.R(24 + (e.x - CREEPER.w / 2) * CS, GROUND - (CREEPER.h - e.y) * CS + yy, CS, CS, e.c);
      }
    } },
  { name: 'のびて みどりに', how: '色がだんだん緑になって 体がにゅーっと伸びる',
    draw(g, t) {
      const c = seg(t, 1.0, 1.8), st = ease(seg(t, 1.8, 2.6)), x = seg(t, 2.4, 2.9);
      const col = e => e.y === 1 && (e.x === 3 || e.x === 8) ? e.c : mix(e.c, '#5fbf4a', c);
      if (x < 1) g.sprite(MASCOT, 24, GROUND + (t < 1 ? bob(t) : 0), { col, sx: lerp(1, 8 / 12, st), sy: lerp(1, 2, st), a: 1 - x });
      if (x > 0) creeperIdle(g, t, { a: x });
    } },
  { name: 'けむりで ボン！', how: 'もくもく煙に かくれているうちに',
    draw(g, t) {
      if (t < 1.5) mascotIdle(g, t); else creeperIdle(g, t);
      const k = seg(t, 1.2, 2.6);
      if (k > 0 && k < 1) {
        [[24, 32, 0], [17, 36, 1], [31, 36, 2], [20, 26, 3], [29, 25, 4], [24, 20, 5], [14, 30, 6], [34, 30, 7]].forEach(([x, y, i]) => {
          const r = Math.round(3 + Math.sin(k * Math.PI) * (5 + hash(i) * 3));
          g.disc(x + (x - 24) * k * .4, y - k * 4, r, i % 2 ? '#cfcfd8' : '#9a98a8', 1 - k * k);
        });
        g.T('ボン!', 24, 10, 7, '#ffd84a', 1 - seg(t, 1.9, 2.3));
      }
    } },
  { name: 'かぶりもので へんしん', how: 'クリーパーの頭が降ってきて すっぽり',
    draw(g, t) {
      const fall = seg(t, 1.0, 1.6), wob = seg(t, 1.6, 2.1), grow = ease(seg(t, 2.1, 2.9));
      const head = { w: 8, h: 8, cells: CREEPER.cells.filter(e => e.y < 8) };
      const body = { w: 8, h: 8, cells: CREEPER.cells.filter(e => e.y >= 8).map(e => ({ ...e, y: e.y - 8 })) };
      if (grow < 1) g.sprite(MASCOT, 24, GROUND + (t < 1 ? bob(t) : 0), { a: 1 - grow, col: e => mix(e.c, '#5fbf4a', grow) });
      if (grow > 0) g.sprite(body, 24, GROUND, { a: grow, sy: grow });
      const restY = GROUND - 12, finalY = GROUND - 16;
      const hy = fall < 1 ? lerp(-4, restY, fall * fall) : lerp(restY, finalY, grow);
      const tilt = wob > 0 && wob < 1 ? Math.round(Math.sin(wob * Math.PI * 4) * (1 - wob) * 2) : 0;
      if (t > 1.0) g.sprite(head, 24 + tilt, hy, {});
      if (fall >= 1 && wob < .3) g.T('すぽっ', 38, 18, 5, '#ffffff', 1 - wob * 3);
    } },
  { name: 'シューッ…ドカーン', how: 'クリーパーみたいに ふくらんで 爆発！',
    draw(g, t) {
      const h = seg(t, 0.9, 2.0), boom = seg(t, 2.0, 2.9);
      const sh = h > 0 && h < 1 ? (hash(Math.floor(t * 30)) - .5) * 2 * h : 0;
      g.shake(sh, 0, () => {
        if (h < 1) {
          const white = Math.sin(t * (8 + h * 30)) > 0 ? h : 0, sw = 1 + h * .25;
          mascotIdle(g, t, { sx: sw, sy: sw, col: e => mix(e.c, '#ffffff', white) });
        } else if (boom > .35) creeperIdle(g, t);
      });
      if (h > .1 && h < 1) g.T('シュー…', 24, 12, 6, '#b8ff9a');
      if (boom > 0 && boom < 1) {
        g.R(0, 0, G, G, '#ffffff', (1 - boom * 3));
        for (let i = 0; i < 16; i++) {
          const an = i / 16 * Math.PI * 2, d = boom * (14 + hash(i) * 10);
          g.R(24 + Math.cos(an) * d, 34 + Math.sin(an) * d * .8, 2, 2, i % 3 ? '#9a98a8' : '#ffb02e', 1 - boom);
        }
      }
    } },
  { name: 'バラバラ 合体', how: 'ドットが飛びちって 緑になって集まる',
    draw(g, t) {
      const out = ease(seg(t, 1.0, 1.7)), back = ease(seg(t, 1.9, 2.8));
      if (out < 1) {
        for (const e of MASCOT.cells) {
          const i = e.x * 9 + e.y, an = hash(i) * Math.PI * 2, d = out * (10 + hash(i + 3) * 12);
          const bx = 24 + (e.x - MASCOT.w / 2) * CS, by = GROUND - (MASCOT.h - e.y) * CS + (t < 1 ? bob(t) : 0);
          g.R(bx + Math.cos(an) * d, by + Math.sin(an) * d - out * 6, CS, CS, e.c);
        }
      } else if (back < 1) {
        for (const e of CREEPER.cells) {
          const i = e.x * 9 + e.y + 100, an = hash(i) * Math.PI * 2, d = (1 - back) * (12 + hash(i + 3) * 12);
          const bx = 24 + (e.x - CREEPER.w / 2) * CS, by = GROUND - (CREEPER.h - e.y) * CS;
          g.R(bx + Math.cos(an) * d, by + Math.sin(an) * d * .8, CS, CS, mix('#d97757', e.c, back), back > 0 ? 1 : 0);
        }
      } else creeperIdle(g, t);
    } },
];

// ---------- ゾンビへの 10 とおりの変身 ----------
const ZOMBIE_PATTERNS = [
  { name: 'お墓から よみがえる', how: '地面にもぐると 墓の前から ゾンビがはい出てくる',
    draw(g, t) {
      // 石のお墓
      g.R(35, 30, 8, 12, '#7d7d86'); g.R(36, 29, 6, 1, '#7d7d86'); g.R(36, 31, 6, 1, '#9a9aa4'); g.R(38, 33, 2, 6, '#5a5a62'); g.R(36, 35, 6, 2, '#5a5a62');
      const sink = ease(seg(t, 0.9, 1.5));
      g.clip(0, 0, G, GROUND, () => g.sprite(MASCOT, 20, GROUND + sink * 18 + (t < .9 ? bob(t) : 0)));
      const hand = seg(t, 1.6, 2.0), rise = ease(seg(t, 2.0, 3.0));
      if (hand > 0 && rise <= 0) { const hh = Math.round(hand * 6); g.R(17, GROUND - hh, 3, hh, '#5f9a45'); g.R(16, GROUND - hh, 1, 2, '#5f9a45'); g.R(20, GROUND - hh, 1, 2, '#5f9a45'); }
      if (rise > 0) g.clip(0, 0, G, GROUND, () => g.sprite(ZOMBIE, 20, GROUND + (1 - rise) * 40, { off: zombieStep(t) }));
      const d = seg(t, 2.0, 2.8);
      if (d > 0 && d < 1) for (let i = 0; i < 8; i++) { const an = Math.PI * (1.1 + .8 * i / 7); g.R(20 + Math.cos(an) * d * 14, GROUND - 1 + Math.sin(an) * d * 10 + d * d * 8, 2, 2, '#7a5230', 1 - d); }
    } },
  { name: '満月の夜', how: '大きな月が のぼって 月の光をあびると',
    draw(g, t) {
      const up = ease(seg(t, 0.6, 1.6)), glow = seg(t, 1.6, 2.4), sw = seg(t, 2.2, 2.9);
      g.R(0, 0, G, GROUND, '#060418', up * .6);
      const my = lerp(48, 9, up);
      g.disc(10, my, 8, '#fff6c0', .25 + .15 * Math.sin(t * 6));
      g.disc(10, my, 6, '#efe9c9'); g.R(7, my - 2, 2, 2, '#d8d0aa'); g.R(12, my + 1, 2, 2, '#d8d0aa');
      if (glow > 0) g.R(14, 10, 20, GROUND - 10, '#fff6c0', Math.sin(glow * Math.PI) * .25);
      if (sw < 1) mascotIdle(g, t, { a: 1 - sw, col: e => e.c === '#1a1612' ? e.c : mix(e.c, '#5f9a45', glow) });
      if (sw > 0) zombieIdle(g, t, { a: sw });
    } },
  { name: '緑のくすりを ばしゃっ', how: 'びんが落ちてきて 上から緑に そまっていく',
    draw(g, t) {
      const fall = seg(t, 1.0, 1.5), paint = seg(t, 1.5, 2.1), sw = ease(seg(t, 2.1, 2.8));
      if (fall > 0 && fall < 1) { const y = lerp(-6, 25, fall * fall); g.R(22, y, 4, 5, '#3fbf4a'); g.R(23, y - 2, 2, 2, '#b0e8ff'); g.R(23, y - 3, 2, 1, '#8a5a30'); g.R(22, y + 1, 1, 2, '#9ff0a0'); }
      if (paint > 0 && paint < 1) for (let i = 0; i < 12; i++) {
        const an = Math.PI * (1 + i / 11), d = paint * (8 + hash(i) * 8);
        g.R(24 + Math.cos(an) * d, 28 + Math.sin(an) * d + paint * paint * 14, 1, 2, '#6fe07a', 1 - paint);
      }
      const line = lerp(26, GROUND, paint);
      if (sw < 1) {
        const o = { a: 1 - sw };
        g.clip(0, line, G, G, () => mascotIdle(g, t, o));
        g.clip(0, 0, G, line, () => mascotIdle(g, t, { ...o, col: e => e.c === '#1a1612' ? e.c : '#4f8a3a' }));
      }
      if (sw > 0) zombieIdle(g, t, { a: sw, sy: lerp(.5, 1, sw) });
    } },
  { name: 'かみなり ドーン', how: '空がピカッと光って 雷が落ちる',
    draw(g, t) {
      const fl = t > 1.0 && t < 1.4 && Math.sin(t * 60) > .3;
      if (fl) g.R(0, 0, G, GROUND, '#3a3a70', .6);
      const hit = seg(t, 1.4, 1.75), sm = seg(t, 1.75, 3.0);
      const sh = hit > 0 && hit < 1 ? (hash(Math.floor(t * 40)) - .5) * 3 : 0;
      g.shake(sh, 0, () => { if (t < 1.55) mascotIdle(g, t); else zombieIdle(g, t); });
      if (hit > 0 && hit < 1) {
        let x = 26;
        for (let y = 0; y < 30; y += 3) { const nx = x + (Math.floor(y / 3) % 2 ? -3 : 3); g.R(Math.min(x, nx), y, Math.abs(nx - x) + 1, 1, '#fff9b0'); g.R(nx, y, 1, 3, '#fff9b0'); x = nx; }
        g.R(0, 0, G, G, '#ffffff', 1 - hit * 1.4);
      }
      if (sm > 0 && sm < 1) for (let i = 0; i < 5; i++) g.disc(20 + i * 2, 16 - sm * 10 - i, 2, '#8a8898', (1 - sm) * .7);
    } },
  { name: 'ふらふら 入れかわり', how: '右へ歩いていって 左から ゾンビが歩いてくる',
    draw(g, t) {
      const out = seg(t, 0.6, 1.8), inn = ease(seg(t, 2.0, 3.2));
      if (out < 1) g.sprite(MASCOT, lerp(24, 62, out), GROUND + (out > 0 ? walkFrame(t) : bob(t)));
      if (inn > 0) zombieAt(g, t, lerp(-14, 24, inn), { off: e => { const [dx, dy] = zombieStep(t)(e); return [dx + (inn < 1 && Math.floor(t * 3) % 2 ? 1 : 0), dy]; } });
      if (inn > .6) g.T('ウ〜', 40, 6, 5, '#9fe08a', seg(t, 2.6, 3.0) - seg(t, 3.8, 4.2));
    } },
  { name: 'ドアの向こうで', how: 'ドアに入って ガタガタ… 出てきたのは',
    draw(g, t) {
      const open1 = seg(t, 0.4, 0.7) - seg(t, 1.4, 1.6), open2 = seg(t, 2.3, 2.5);
      const open = Math.max(open1, open2);
      const rattle = t > 1.7 && t < 2.3 ? (Math.floor(t * 20) % 2 ? 1 : -1) : 0;
      g.R(14, 2, 20, GROUND - 2, '#1a1410'); // 入り口の暗がり
      if (t < 1.5) {
        const w = seg(t, 0.6, 1.3), fade = seg(t, 1.2, 1.5);
        g.sprite(MASCOT, lerp(4, 24, w), GROUND + (w > 0 && w < 1 ? walkFrame(t) : bob(t)), { a: 1 - fade * .9, col: e => mix(e.c, '#1a1410', fade) });
      }
      const zin = seg(t, 2.4, 2.8);
      if (zin > 0) zombieIdle(g, t, { col: e => mix('#1a1410', e.c, zin) });
      // ドア（開くと細くなる）
      const dw = Math.round(lerp(20, 3, open));
      g.shake(rattle, 0, () => {
        g.R(14, 2, dw, GROUND - 2, '#9a6a3c');
        if (dw > 8) { g.R(16, 5, dw - 4, 8, '#5e3e22'); g.R(17, 6, dw - 6, 6, '#3a5a7a'); g.R(14 + dw - 4, 24, 2, 2, '#3a2a18'); }
        g.R(14, 2, dw, 1, '#b8844c');
      });
      g.R(13, 1, 22, 1, '#5e3e22'); g.R(13, 1, 1, GROUND - 1, '#5e3e22'); g.R(34, 1, 1, GROUND - 1, '#5e3e22');
      if (rattle) g.T('ガタガタ', 24, 8, 5, '#ffd84a');
    } },
  { name: 'ねむって 目がさめたら', how: 'Zzz… 夜がふけて 起きたら ゾンビに',
    draw(g, t) {
      const z = seg(t, 0.8, 2.0), dark = seg(t, 1.6, 2.1) - seg(t, 2.3, 2.9);
      if (t < 2.2) g.sprite(MASCOT, 24, GROUND, { sy: lerp(1, .85, seg(t, .8, 1.2)), sx: lerp(1, 1.08, seg(t, .8, 1.2)), col: e => e.c === '#1a1612' && t > 1.0 ? '#d97757' : e.c });
      else zombieIdle(g, t);
      if (t < 2.2) for (let i = 0; i < 3; i++) { const k = (z * 3 - i); if (k > 0 && k < 1.6) g.T('Z', 32 + i * 4 + k * 2, 26 - i * 5 - k * 3, 4 + i, '#c8c0ff', 1 - k / 1.6); }
      g.R(0, 0, G, G, '#000000', dark * .9);
      if (t > 2.6) g.T('ウ〜…', 40, 6, 5, '#9fe08a', seg(t, 2.6, 3.0));
    } },
  { name: 'ポンポン 組み立て', how: '消えたあと 足・体・頭の じゅんに ポン！',
    draw(g, t) {
      const gone = seg(t, 1.0, 1.3);
      if (gone < 1) g.sprite(MASCOT, 24, GROUND + (t < 1 ? bob(t) : 0), { sx: 1 - gone, sy: 1 + gone * .3 });
      if (gone > 0 && gone < 1) for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; g.R(24 + Math.cos(an) * gone * 10, 34 + Math.sin(an) * gone * 8, 2, 2, '#ffffff', 1 - gone); }
      const parts = [[e => e.y >= 14, 1.4, 38], [e => e.y >= 8 && e.y < 14, 1.8, 26], [e => e.y < 8, 2.2, 12]];
      parts.forEach(([sel, st, ty]) => {
        const k = seg(t, st, st + .3); if (k <= 0) return;
        const sc = k < 1 ? Math.sin(k * Math.PI * .5) * (1 + .3 * Math.sin(k * Math.PI)) : 1;
        const cy = { 38: GROUND - 5, 26: GROUND - 16, 12: GROUND - 30 }[ty];
        for (const e of ZOMBIE.cells) {
          if (!sel(e)) continue;
          const x = 24 + (e.x - ZOMBIE.w / 2) * CS, y = GROUND - (ZOMBIE.h - e.y) * CS;
          g.R(24 + (x - 24) * sc, cy + (y - cy) * sc, CS * sc + .01, CS * sc + .01, e.c);
        }
        if (k < 1) g.T('ポン', 40, ty, 5, '#ffffff', 1 - k);
      });
    } },
  { name: 'パネルが くるっ', how: '看板が くるりと回って うらがえると',
    draw(g, t) {
      const k = ease(seg(t, 1.1, 2.6)), cs = Math.cos(k * Math.PI * 3), w = Math.abs(cs);
      const showZ = cs < 0; // 3回半まわって うら面（ゾンビ）で止まる
      g.R(24 - 15 * w - .5, 0, 30 * w + 1, GROUND, showZ ? '#5e3e22' : '#7a5230');
      g.R(24 - 14 * w, 1, 28 * w, GROUND - 2, showZ ? '#2a2420' : '#1c1930');
      g.R(23, GROUND - 1, 2, 1, '#3a2a18');
      if (showZ) zombieIdle(g, t, { sx: w }); else g.sprite(MASCOT, 24, GROUND - 6 + (t < 1.1 ? bob(t) : 0), { sx: w });
    } },
  { name: 'のびる かげ', how: 'かげが のびて 立ち上がり 色がついていく',
    draw(g, t) {
      const grow = ease(seg(t, 0.8, 1.6)), stand = ease(seg(t, 1.6, 2.3)), fade = seg(t, 2.0, 2.4), move = ease(seg(t, 2.3, 2.8)), color = seg(t, 2.6, 3.2);
      if (stand <= 0) g.R(24 - 6, GROUND, 12 + grow * 20, 2, '#05040d', .8);
      if (fade < 1) mascotIdle(g, t, { a: 1 - fade });
      if (stand > 0) {
        const cx = lerp(34, 24, move);
        zombieAt(g, t, cx, { sy: Math.max(.08, stand), col: e => mix('#2a2440', e.c, color) });
      }
    } },
];

window.CC_HENSHIN = { G, GROUND, hash, seg, makeG, creeper: CREEPER_PATTERNS, zombie: ZOMBIE_PATTERNS };

// ---------- 案内役（index.html の左下）用に、コマの絵に書き出す ----------
// 見本の画面（48×48）の (24, 42) が、案内役の絵の足もとの中心 (12, 16) にくる。キャラクターの大きさは そのまま同じ
const RX = 12 - 24, RY = 16 - GROUND, STEP = 100, T0 = 0.8, T1 = 3.6;
const hex2 = a => Math.round(clamp(a) * 255).toString(16).padStart(2, '0');
function record(fn) {
  let rects = [], box = [-1e9, -1e9, 1e9, 1e9], dx = 0, dy = 0;
  const q = v => Math.round(v * 5) / 5;
  const g = makeG({
    R(x, y, w, h, c, a = 1) {
      if (a < .08 || w >= G) return; // 画面全体を光らせる・暗くするのは 案内役では使わない
      let x0 = Math.max(q(x) + dx, box[0]), y0 = Math.max(q(y) + dy, box[1]);
      const x1 = Math.min(q(x) + dx + q(w), box[2]), y1 = Math.min(q(y) + dy + q(h), box[3]);
      if (x1 - x0 < .1 || y1 - y0 < .1) return;
      rects.push([a < 1 ? c + hex2(a) : c, q(x0 + RX), q(y0 + RY), q(x1 - x0), q(y1 - y0)]);
    },
    T() {}, // 小さい案内役では 文字は出さない
    clip(x, y, w, h, f) { const b = box; box = [Math.max(b[0], x), Math.max(b[1], y), Math.min(b[2], x + w), Math.min(b[3], y + h)]; f(); box = b; },
    shake(sx, sy, f) { dx += Math.round(sx); dy += Math.round(sy); f(); dx -= Math.round(sx); dy -= Math.round(sy); },
  });
  fn(g);
  // 横にとなり合う同じ色のマスを 1 つにまとめて、絵を軽くする
  const out = [];
  for (const r of rects) {
    const p = out[out.length - 1];
    if (p && p[0] === r[0] && p[2] === r[2] && p[4] === r[4] && Math.abs(p[1] + p[3] - r[1]) < .05) p[3] = q(p[3] + r[3]);
    else out.push(r);
  }
  return out;
}
// 最後は 煙でポンと 元のキャラクターにもどる
function smoke(g, k) {
  [[24, 34, 0], [16, 38, 1], [32, 38, 2], [20, 28, 3], [28, 27, 4]].forEach(([x, y, i]) =>
    g.disc(x + (x - 24) * k * .3, y - k * 3, Math.round(3 + Math.sin(k * Math.PI) * 4), i % 2 ? '#cfcfd8' : '#9a98a8', 1 - k * .8));
}
function toMoves(list, kind, label) {
  return list.map(p => {
    const seq = [];
    for (let t = T0; t < T1 + 1e-6; t += STEP / 1000) {
      const fr = record(g => p.draw(g, t)), prev = seq[seq.length - 1];
      if (prev && JSON.stringify(prev[0]) === JSON.stringify(fr)) prev[1] += STEP; else seq.push([fr, STEP]);
    }
    seq[seq.length - 1][1] += 500; // 変身したすがたを少し見せる
    const last = seq[seq.length - 1][0];
    seq.push([[...last, ...record(g => smoke(g, .3))], 150], [record(g => smoke(g, .55)), 150],
      [[...record(g => mascotIdle(g, 0)), ...record(g => smoke(g, .8))], 150], [record(g => mascotIdle(g, 0)), 400]);
    return { grid: 'grid-henshin-' + kind, name: label + '：' + p.name, desc: p.how, seq, vb: '-12 -26 48 48' };
  });
}
window.CC_HENSHIN_MOVES = [...toMoves(CREEPER_PATTERNS, 'creeper', 'クリーパー'), ...toMoves(ZOMBIE_PATTERNS, 'zombie', 'ゾンビ')];
})();
