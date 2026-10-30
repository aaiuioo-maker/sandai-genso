// 「三尊の弥陀」の4つの動画（全部・分類・お姿・三身）で使う、絵と字幕と声と音のしくみ
const W = 180, H = 260, S = 3, SH = 216, DUR = 20;
const cv = document.getElementById('cv');
cv.width = W * S; cv.height = H * S;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- 描画の道具 ----------
const rd = Math.round;
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(rd(x) * S, rd(y) * S, rd(w) * S, rd(h) * S); }
function P(x, y, c, s = 1) { R(x, y, s, s, c); }
function disc(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.3); R(cx - w, cy + y, w * 2 + 1, 1, c); }
}
function T(s, x, y, size, c, align = 'center', a = 1) {
  ctx.globalAlpha = a;
  ctx.font = `${size * S}px "DotGothic16", monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = S * 1.4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000';
  ctx.strokeText(s, x * S, y * S);
  ctx.fillStyle = c; ctx.fillText(s, x * S, y * S);
  ctx.globalAlpha = 1;
}
// 筆文字（額の書）：縁取りなしで細く読みやすく
function B(s, x, y, size, c) {
  ctx.font = `${size * S}px "Yuji Syuku", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = c; ctx.fillText(s, x * S, y * S);
}
function A(a, fn) { ctx.globalAlpha = Math.max(0, Math.min(1, a)); fn(); ctx.globalAlpha = 1; }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const fadeIn = (lt, st, d = 0.3) => clamp((lt - st) / d);
const ease = k => k * k * (3 - 2 * k);
function mix(c1, c2, k) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const ch = s => rd(lerp((a >> s) & 255, (b >> s) & 255, k));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
// 小さなタグ（ラベル）
function tag(s, x, y, c, a = 1, size = 8) { T(s, x, y, size, c, 'center', a); }

// ---------- 星 ----------
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = [...Array(70)].map(() => ({ x: rnd() * W | 0, y: rnd() * SH | 0, p: rnd() * 6.28, s: rnd() < .15 ? 2 : 1 }));
function drawStars(t, a = 1) {
  for (const s of stars) { const b = .5 + .5 * Math.sin(t * 3 + s.p); ctx.globalAlpha = a * (.25 + .75 * b); P(s.x, s.y, '#fff', s.s); }
  ctx.globalAlpha = 1;
}

// ---------- 太陽・月・地球 ----------
function sun(cx, cy, t, r = 13) {
  A(.25 + .1 * Math.sin(t * 6), () => disc(cx, cy, r + 5, '#ff7a2e'));
  disc(cx, cy, r, '#ffb02e'); disc(cx - 1, cy - 1, r - 4, '#ffd84a'); disc(cx - 3, cy - 3, 2, '#fff6c0');
  for (let i = 0; i < 8; i++) {
    const an = i * Math.PI / 4 + t * .6, L = r + 7 + (Math.sin(t * 8 + i) > 0 ? 2 : 0);
    P(cx + Math.cos(an) * L, cy + Math.sin(an) * L, '#ffd84a', 2);
  }
}
// ---------- 人（小さな人形）----------
// (x, y) は足もとのまんなか。k は大きさ（k=1 で高さ 26 マス）
// pose：down 腕を下ろす／reachR 右へ手をのばす／reachL 左へ手をのばす／up 両手を上げる／give 右手で差し出す
function personShape(x, y, c, pose, k) {
  const r = (dx, dy, w, h) => R(x + dx * k, y + dy * k, w * k, h * k, c);
  disc(x, y - 22 * k, 3 * k, c);
  r(-3, -18, 7, 10);
  r(-3, -8, 2, 8); r(2, -8, 2, 8);
  if (pose === 'reachR') { r(-5, -17, 2, 7); r(4, -16, 6, 2); }
  else if (pose === 'reachL') { r(-9, -16, 6, 2); r(4, -17, 2, 7); }
  else if (pose === 'up') { r(-5, -25, 2, 8); r(4, -25, 2, 8); }
  else if (pose === 'give') { r(-5, -17, 2, 7); r(4, -15, 7, 2); }
  else { r(-5, -17, 2, 8); r(4, -17, 2, 8); }
}
function person(x, y, fill = '#2c2f52', line = '#9a90d0', pose = 'down', k = 1, a = 1) {
  A(a, () => {
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => personShape(x + dx, y + dy, line, pose, k));
    personShape(x, y, fill, pose, k);
    P(x - 2 * k, y - 23 * k, '#f3ead6', Math.max(1, k | 0)); P(x + 1 * k, y - 23 * k, '#f3ead6', Math.max(1, k | 0));
  });
}
// 小さなハート
function smallHeart(x, y, c = '#ff6a7a') { P(x, y, c); P(x + 2, y, c); R(x - 1, y + 1, 5, 1, c); R(x, y + 2, 3, 1, c); P(x + 1, y + 3, c); }
function ground(c = '#5a3d24') { R(0, 202, W, 14, c); R(0, 202, W, 2, '#3f8f3a'); for (let x = 3; x < W; x += 11) P(x, 207 + (x % 3), '#6b4a2c', 2); }
function room(t, a = .5) { R(0, 0, W, SH, '#0f1028'); drawStars(t, a); ground(); }

// ---------- Claude Code のキャラクター（字幕の左にいる案内役） ----------
function mascot(ox, oy, t, mode = "walk", p = 1) {
  // ox, oy, p は画面の1マス（3画素）単位。p は小数でもよい（画素単位で描くので、にじまない）
  const R = (x, y, w, h, c) => { const q = (v) => Math.round(v * S); ctx.fillStyle = c; ctx.fillRect(q(x), q(y), q(x + w) - q(x), q(y + h) - q(y)); };
  const c = '#d97757', f = Math.floor(t * 6) % 4;
  const hop = (mode === "jump" ? -Math.abs(Math.sin(t * 7)) * 4 : (f % 2 ? -1 : 0)) * p;
  const up = [f === 1, f === 3, f === 3, f === 1];
  [2, 4, 7, 9].forEach((x, i) => R(ox + x * p, oy + 6 * p, p, (up[i] && mode === 'walk' ? 1 : 2) * p, c));
  const y0 = oy + hop;
  R(ox + 2 * p, y0, 8 * p, 6 * p, c);
  const wave = mode === "talk" && Math.sin(t * 10) > 0 ? -p : 0;
  R(ox, y0 + 2 * p + wave, 2 * p, 2 * p, c); R(ox + 10 * p, y0 + 2 * p - wave, 2 * p, 2 * p, c);
  const blink = (t % 3) > 2.85;
  R(ox + 3 * p, y0 + p + (blink ? .6 * p : 0), p, blink ? .4 * p : p, "#1a1612"); R(ox + 8 * p, y0 + p + (blink ? .6 * p : 0), p, blink ? .4 * p : p, "#1a1612");
}

// 案内役の動きに合わせた効果音（声のじゃまにならないよう小さく鳴らす）
// しゃべる：手をふるたびに「ぴょこ」／ジャンプ：とび上がるたびに「ぴょん」／歩く：一歩ごとに「とこ」／まばたき：「ぱち」
// 動きが変わったとき：しゃべる→ジャンプ「ポロロン↑」、ジャンプ→歩く「ポロン↓」
let mPrevT = -1, mPrevMode = '';
function mascotSfx(t, mode) {
  const pt = mPrevT, pm = mPrevMode; mPrevT = t; mPrevMode = mode;
  if (!ac || !playing || muted || seeking || pt < 0 || t <= pt || t - pt > .2) return;
  try {
    if (mode !== pm) {
      if (mode === 'jump') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .18, 'square', .03));
      else if (mode === 'walk') [784, 587, 392].forEach((f, i) => tone(f, i * .09, .25, 'triangle', .07));
      else [880, 1175].forEach((f, i) => tone(f, i * .08, .2, 'sine', .05));
      return;
    }
    const cross = k => Math.floor(t * k) !== Math.floor(pt * k); // t*k が次の整数に進んだ
    if (mode === 'talk' && Math.sin(t * 10) > 0 && Math.sin(pt * 10) <= 0) tone(620 + Math.random() * 120, 0, .08, 'sine', .035, 980);
    if (mode === 'jump' && cross(7 / Math.PI)) { tone(140, 0, .06, 'triangle', .12, 90); tone(330, .02, .2, 'square', .025, 900); }
    if (mode === 'walk' && cross(6) && Math.floor(t * 6) % 2 === 0) tone(Math.floor(t * 6) % 4 ? 440 : 520, 0, .05, 'triangle', .08, 260);
    if ((t % 3) > 2.85 && (pt % 3) <= 2.85) tone(2200, 0, .03, 'sine', .02, 1600);
  } catch (e) {}
}

// ---------- 声の4人（字幕の左で、いま読んでいる人がしゃべる） ----------
// 1文字＝1ドット（横14×縦16）。S＝はだ、E＝目（まばたき・口は下で動かす）
const SPK = [
  { name: 'めたん', pal: { H: '#e04b8f', D: '#c43a7a', d: '#f07ab0', S: '#ffe2cc', E: '#d9a020', K: '#2b2733', W: '#f4f0f0' }, map: [
    '....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.',
    'DHHSSHSSHSSHHD', 'dHSSSSSSSSSSHd', 'DHSEESSSSEESHD', 'dHSEESSSSEESHd',
    'DDSSSSSSSSSSDD', 'dd.SSSSSSSS.dd', 'DD..SSSSSS..DD', '.dd.KWWWWK.dd.',
    '.DD.KKWWKK.DD.', '..d.KKKKKK.d..', '...KKKKKKKK...', '...KKKKKKKK...'] },
  { name: 'つむぎ', pal: { H: '#f2c740', h: '#ffe08a', S: '#ffe2cc', E: '#7a4a2a', W: '#f4f4f4', R: '#e04848' }, map: [
    '.....HHHH.....', '..HHHHhHHHHH..', '.HHHHHHHHHHHH.', 'HHHHHHHHHHHHHH',
    'HHHSSHHSSHSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    'HHSSSSSSSSSSHH', 'HH.SSSSSSSS.HH', 'HH..SSSSSS..HH', 'HHH.WWRRWW.HHH',
    'HHH.WWRRWW.HHH', '.HH.WWWWWW.HH.', '...WWWWWWWW...', '...WWWWWWWW...'] },
  { name: 'はう', pal: { H: '#9ccbe8', C: '#ffffff', X: '#e04848', S: '#ffe2cc', E: '#4a7ab0', W: '#ffffff', P: '#f6b8c8' }, map: [
    '...CCCCCCCC...', '..CCCCXCCCCC..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.',
    'HHHSSHSSHSSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    '.HSSSSSSSSSSH.', '.H.SSSSSSSS.H.', '....SSSSSS....', '...PWWWWWWP...',
    '..PPWWWWWWPP..', '..PPWWWWWWPP..', '..PPPWWWWPPP..', '..PPPWWWWPPP..'] },
  { name: '小夜', pal: { H: '#8a5a3a', I: '#f2a0b0', S: '#ffe2cc', E: '#3a8a5a', G: '#e8d070', K: '#b04040' }, map: [
    '.HH........HH.', '.HIH......HIH.', '.HHHHHHHHHHHH.', 'HHHHHHHHHHHHHH',
    'HHHSSHSSHSSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    'HHSSSSSSSSSSHH', 'HH.SSSSSSSS.HH', '.H..SSSSSS..H.', '...GGGGGGGG...',
    '..KKKKKKKKKK..', '..KKKKKKKKKK..', '..KKKKKKKKKK..', '..KKKKKKKKKK..'] },
  // ここから AivisSpeech の3人（まお・まい・コハク）
  { name: 'まお', pal: { H: '#f2a6c0', h: '#ffd0e0', R: '#ffffff', S: '#ffe2cc', E: '#c0507a', W: '#f8f0f4', P: '#e07aa0' }, map: [
    '.HH..HHHH..HH.', '.HhHHHHHHHHhH.', '.HHHHHHHHHHHH.', 'HHHHHHHHHHHHHH',
    'HHHSSHSSHSSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    'HHSSSSSSSSSSHH', 'HH.SSSSSSSS.HH', 'HH..SSSSSS..HH', 'HH.WWWPPWWW.HH',
    '.H.WWWWWWWW.H.', '...WWWWWWWW...', '...PPPPPPPP...', '...WWWWWWWW...'] },
  { name: 'まい', pal: { H: '#2a2438', h: '#4a4260', R: '#e04848', S: '#ffe2cc', E: '#6a4a8a', W: '#f4f4f4', N: '#2a3a6a' }, map: [
    '....HHHHHH.RR.', '..HHHHHHHHHRR.', '.HHHHHhHHHHHH.', '.HHHHHHHHHHHH.',
    'HHHSSHSSHSSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    'HHSSSSSSSSSSHH', 'HH.SSSSSSSS.HH', 'HH..SSSSSS..HH', 'HH.NWWRRWWN.HH',
    'HH.NNWWWWNN.HH', 'HH.NNNNNNNN.HH', '...NNNNNNNN...', '...NNNNNNNN...'] },
  { name: 'コハク', pal: { H: '#e8a840', h: '#ffd070', S: '#ffe2cc', E: '#c07a20', W: '#f8f4ec', G: '#d08a30', B: '#7a5a3a' }, map: [
    '....HHHHHH....', '..HHHHhHHHHH..', '.HHHHHHHHHHHH.', 'HHHHHHHHHHHHHH',
    'HHHSSHSSHSSHHH', 'HHSSSSSSSSSSHH', 'HHSEESSSSEESHH', 'HHSEESSSSEESHH',
    'HHSSSSSSSSSSHH', 'HH.SSSSSSSS.HH', '.H..SSSSSS..H.', '...WWWGGWWW...',
    '..BWWWWWWWWB..', '..BWWWWWWWWB..', '..BBWWWWWWBB..', '..BBWWWWWWBB..'] },
];
// v：だれ（0〜3）、talk：いま声が出ている（口がパクパク・体がゆれる）
function speakerDot(v, ox, oy, t, talk) {
  const sp = SPK[v]; if (!sp) return;
  const bob = talk && Math.floor(t * 4) % 2 ? -1 : 0, y0 = oy + bob;
  const blink = (t % 3.2) > 3.05;
  sp.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    if (ch === 'E' && blink) { if (y === 7) P(ox + x, y0 + y, '#5a3a3a'); return; } // まばたき：下だけ線に
    P(ox + x, y0 + y, sp.pal[ch]);
  }));
  // 口：しゃべっているときはパクパク
  const open = talk && Math.floor(t * 9) % 3 !== 0;
  if (open) { R(ox + 6, y0 + 9, 2, 2, '#8a2a3a'); P(ox + 6, y0 + 10, '#e07080'); }
  else R(ox + 6, y0 + 9, 2, 1, '#c0505a');
  T(sp.name, ox + 7, oy + 20.5, 6, talk ? '#ffe8b0' : '#b0a8c8', 'center');
}


// ---------- 字幕 ----------
// [始まり, 終わり, 1行目, 2行目, 読み上げる文（読みにくい言葉はひらがな）, 1行目の色]
const HO = '#ffe8b0', BAD = '#ff8a8a', OK = '#9fe0a0';
const SUNC = '#ffb070', MOONC = '#a8c8ff', EARTHC = '#c8e090'; // 観音（日）・阿弥陀（月）・釈迦（地）の色
const CAPS = [
  [0.0, 1.0, '観音・阿弥陀・釈迦', '三尊は「三位一体」', 'かんのん、あみだ、しゃか。このさんぞんは、三位一体の、存在です。', HO],
  [1.0, 2.0, '三尊には それぞれ', 'ちがう 役割と 性質がある', 'さんぞんには、それぞれ、ちがう役割と、性質があります。', HO],
  [2.0, 3.0, '観音は 日本', '日（太陽）・火', 'かんのんは、日本。日、つまり太陽や、火に、当たります。', SUNC],
  [3.0, 4.0, '阿弥陀は 西洋', '月・水', 'あみだは、西洋。月や、水に、当たります。', MOONC],
  [4.0, 5.0, '釈迦は 東洋', '地・土', 'しゃかは、東洋。地や、土に、当たります。', EARTHC],
  [5.0, 6.0, '阿弥陀は 女・悪', '釈迦は 男・善', 'また、あみだは、女と、悪。しゃかは、男と、善に、当たります。', HO],
  [6.0, 7.0, '観音は', '「自由」と「真（まこと）」', 'そして、かんのんは、自由と、まことに、当たります。', SUNC],
  [7.0, 8.0, 'いろいろな事に 当てはめると', '三尊の 性質が わかりやすい', 'このように、いろいろなことに、当てはめると、さんぞんの性質が、わかりやすくなります。', OK],
  [8.0, 9.0, '観音は 日本系', '髪は まっすぐな 直毛', 'お姿にも、ちがいがあります。日本系の、かんのんは、髪が、まっすぐな、ちょくもうです。', SUNC],
  [9.0, 10.0, '宝玉の 王冠や 胸飾り', '高貴な 装飾を 身につける', 'ほうぎょくを、あしらった、王冠や、むなかざりなど、高貴な装飾を、身につけています。', HO],
  [10.0, 11.0, '御本体は', '純金 とされる', 'ごほんたいは、じゅんきん、とされます。', SUNC],
  [11.0, 12.0, '阿弥陀・釈迦は 外国系', '髪は 縮れている', 'いっぽう、外国系の、あみだと、しゃかは、髪が、ちぢれています。', HO],
  [12.0, 13.0, '装飾品は 無く', '裸体に 白布を 纏うのみ', '装飾品は無く、裸体に、白い布を、まとうのみの、お姿です。', HO],
  [13.0, 14.0, '唐銅（ブロンズ）や', '鍍金（金メッキ）で 作られる', 'からかね、つまりブロンズや、ときん、つまり金メッキで、作られています。', HO],
  [14.0, 15.0, '純金の 観音', '唐銅・鍍金の 阿弥陀・釈迦', 'じゅんきんの、かんのん。からかねや、ときんの、あみだと、しゃか。', HO],
  [15.0, 16.0, '仏の 三つの姿', '「三身（さんじん）」', 'ほとけの、三つの姿、さんじんにも、さんぞんが、当てはめられます。', HO],
  [16.0, 17.0, '法身（ほっしん）は 阿弥陀', '真理 そのもの', 'ほっしんは、あみだ。真理、そのものです。', MOONC],
  [17.0, 18.0, '報身（ほうじん）は 釈迦', '修行で 悟りを 開いた姿', 'ほうじんは、しゃか。修行によって、悟りを、開いた姿です。', EARTHC],
  [18.0, 19.0, '応身（おうじん）は 観音', '姿を変えて 衆生を 救う', 'おうじんは、かんのん。しゅじょうを、救うために、姿を変えて、現れたものです。', SUNC],
  [19.0, 20.0, '三尊は 三位一体', '観音は 日本・純金・応身', 'さんぞんは、三位一体。中でも、かんのんは、日本と、高貴さに、結びついているのです。', OK],
  [20.0, 22.0, "ご視聴ありがとうございました", "", "ごしちょう、ありがとうございました。"],
];
// 1つの字幕を見せる時間（秒）。読み上げの長さに合わせ、ゆっくり読めるように長めにとる
// どの動画か：window.PART に字幕の番号の範囲（[最初, 最後]）。最後の「ご視聴ありがとうございました」はいつもつける
// 字幕には元の番号（id）をつけておく（声のファイル名と効果音はこの番号で選ぶ）
CAPS.forEach((c, i) => c.id = i);
{ const pt = window.PART || [0, CAPS.length - 2], end = CAPS[CAPS.length - 1]; CAPS.splice(0, CAPS.length, ...CAPS.filter(c => c !== end && c.id >= pt[0] && c.id <= pt[1]), end); }
CAPS.forEach(c => { c.dur = Math.max(3.8, c[4].replace(/[、。\s]/g, '').length * 0.2 + 2.0); });
CAPS[CAPS.length - 1].dur = 5.5; // 最後の「ご視聴ありがとうございました」はゆっくり余韻をとる
function captions(t) {
  R(0, SH, W, H - SH, '#0d0b18'); R(0, SH, W, 1, '#3a3358');
  const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return;
  const a = clamp((t - c[0]) / .15);
  T(c[2], 90, c[3] ? 231.5 : 237, 9, c[5] || '#f3ead6', 'center', a);
  if (c[3]) T(c[3], 90, 244.5, 8.5, '#f3ead6', 'center', a);
}

// ---------- 道具 ----------
// 大きなハート。c：色、r：大きさ
function heart(cx, cy, r, c) {
  disc(cx - r / 2, cy - r / 4, r / 2 + .5, c); disc(cx + r / 2, cy - r / 4, r / 2 + .5, c);
  for (let y = 0; y <= r; y++) { const w = rd((r - y) * 1.05); R(cx - w, cy - r / 4 + y, w * 2 + 1, 1, c); }
}
// 雲。dark：雨雲
function cloud(cx, cy, k = 1, dark = false) {
  const c = dark ? '#4a4a5a' : '#f3f3fa', c2 = dark ? '#3a3a48' : '#d8d8ea';
  disc(cx - 10 * k, cy + 2 * k, 7 * k, c2); disc(cx + 10 * k, cy + 2 * k, 7 * k, c2);
  disc(cx, cy - 3 * k, 10 * k, c); disc(cx - 9 * k, cy + 1 * k, 7 * k, c); disc(cx + 9 * k, cy + 1 * k, 7 * k, c);
  R(cx - 16 * k, cy + 2 * k, 32 * k, 6 * k, c);
}
// 雨
function rain(x0, x1, y0, y1, t, c = '#8aa8d0') {
  for (let i = 0; i < 18; i++) { const q = (t * 2.2 + i / 18) % 1; R(x0 + ((i * 37) % (x1 - x0)), lerp(y0, y1, q), 1, 4, c); }
}
// きらきら（十字の光）
function spark(x, y, c = '#fff1b0', s = 2) { P(x, y, c); for (let i = 1; i <= s; i++) { P(x - i, y, c); P(x + i, y, c); P(x, y - i, c); P(x, y + i, c); } }
// 花（地面から生える）。k：咲き方（0〜1）
function flower(x, gy, k, c = '#ff8ab0') {
  const h = rd(4 + 10 * k); R(x, gy - h, 1, h, '#3f8f3a');
  if (k > .5) { const r = k > .8 ? 2 : 1; [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dx, dy]) => P(x + dx, gy - h + dy, c, r)); P(x, gy - h, '#ffd84a'); }
}
// 吹き出し
function bubble(cx, cy, s, c, a = 1, size = 7) {
  A(a, () => {
    const w = s.length * size / 2 + 6;
    R(cx - w, cy - 7, w * 2, 14, '#f3ead6'); R(cx - w + 1, cy - 6, w * 2 - 2, 12, '#ffffff');
    R(cx - 2, cy + 7, 4, 2, '#f3ead6'); P(cx - 3, cy + 9, '#f3ead6', 2);
  });
  T(s, cx, cy, size, c, 'center', a);
}
// 地球（世の中）
function globe(cx, cy, r, t, dim = 0) {
  disc(cx, cy, r, mix('#2a6ab0', '#2a2a3a', dim));
  [[-4, -3, 5], [5, 2, 4], [-2, 6, 3]].forEach(([dx, dy, rr]) => disc(cx + dx * r / 12, cy + dy * r / 12, rr * r / 12, mix('#3f8f3a', '#3a3a40', dim)));
  A(.5, () => P(cx - r / 2, cy - r / 2, '#fff', 2));
}
// 人を倒したり傾けたりして描く（足もとを中心にまわす）
function personRot(x, y, an, ...a) {
  ctx.save(); ctx.translate(x * S, y * S); ctx.rotate(an); ctx.translate(-x * S, -y * S);
  person(x, y, ...a); ctx.restore();
}
// 筆文字を透明度つきで
function BA(s, x, y, size, c, a) { A(a, () => B(s, x, y, size, c)); }
// 明るい人・暗い人の色
const LIT = ['#2c2f52', '#fff1b0'], DIM = ['#2a2a30', '#6a6a78'];

// ---------- 三尊のお姿 ----------
// kind：0 観音（日本系・直毛・宝玉の王冠と胸飾り・純金）／1 阿弥陀（外国系・縮れ毛・白布・唐銅）／2 釈迦（外国系・縮れ毛・白布・鍍金）
const SON = [
  { name: '観音', skin: '#ffd84a', hi: '#fff6c0', sh: '#d8a830', glow: '#ffb02e' },
  { name: '阿弥陀', skin: '#b07848', hi: '#d09868', sh: '#7a4a2a', glow: '#6a9aff' },
  { name: '釈迦', skin: '#d0a858', hi: '#ecd090', sh: '#9a7a3a', glow: '#7ad07a' },
];
// (cx, cy) は顔のまんなか。k は大きさ（k=1 で 光の輪の上から蓮の台まで 高さ 44 マス：cy−11 〜 cy+33）
// glow：うしろの光の強さ
function buddha(kind, cx, cy, t, k = 1, a = 1, glow = 1) {
  const s = SON[kind];
  const r = (dx, dy, w, h, c) => R(cx + dx * k, cy + dy * k, Math.max(1, w * k), Math.max(1, h * k), c);
  const d = (dx, dy, rr, c) => disc(cx + dx * k, cy + dy * k, Math.max(1, rd(rr * k)), c);
  A(a, () => {
    // 光の輪
    A(a * clamp(glow, 0, 2) * (.22 + .08 * Math.sin(t * 4 + kind * 2)), () => d(0, 6, 22, s.glow));
    d(0, 0, 11, s.glow); d(0, 0, 9, mix(s.glow, '#000000', .55));
    // 体（すわった姿）
    for (let y = 0; y < 22; y++) {
      const w = 3 + y * .55;
      if (kind === 0) r(-w, 6 + y, w * 2 + 1, 1, y % 7 === 6 ? s.sh : s.skin); // 純金の衣
      else {
        // 裸体に白布：左の肩と胸は肌のまま、右の肩から斜めに白い布をまとう
        const cut = Math.min(w + 1, -w + Math.max(0, 10 - y) * 1.1);
        if (cut > -w) r(-w, 6 + y, cut + w, 1, s.skin);
        r(cut, 6 + y, w - cut + 1, 1, y % 7 === 6 ? '#d8d8e4' : '#f4f4fa');
      }
    }
    // 組んだ手
    r(-3, 18, 7, 3, s.skin); r(-3, 18, 7, 1, s.hi);
    // 顔
    d(0, 0, 5, s.skin); r(-2, -3, 2, 1, s.hi);
    r(-3, 0, 2, 1, '#3a2a1a'); r(2, 0, 2, 1, '#3a2a1a'); r(0, 3, 1, 1, '#a04040');
    if (kind === 0) {
      // 直毛：まっすぐな黒髪が肩まで
      r(-5, -6, 11, 3, '#1a1a2a'); r(-6, -4, 2, 10, '#1a1a2a'); r(5, -4, 2, 10, '#1a1a2a');
      // 宝玉をあしらった王冠
      r(-5, -9, 11, 3, '#ffe070'); [-5, -1, 3].forEach(x => r(x, -12, 2, 3, '#ffe070'));
      r(-4, -8, 1, 1, '#4a8aff'); r(0, -8, 1, 1, '#ff3a5a'); r(4, -8, 1, 1, '#3ad07a');
      // 胸飾り
      for (let i = -4; i <= 4; i++) r(i, 7 + rd((4 - Math.abs(i)) * .5), 1, 1, '#fff6c0');
      r(0, 9, 1, 1, '#ff3a5a');
    } else {
      // 縮れ毛（つぶつぶの髪）と頭のもり上がり
      const curl = (x, y) => r(x, y, 1, 1, (x + y) & 1 ? '#2a3a6a' : '#5a6aa8');
      for (let y = -6; y <= -2; y++) { const w = Math.floor(Math.sqrt(36 - y * y)); for (let x = -w; x <= w; x++) curl(x, y); }
      for (let y = -10; y <= -7; y++) { const w = y < -9 ? 1 : 2; for (let x = -w; x <= w; x++) curl(x, y); }
    }
    // 蓮の台
    for (let i = 0; i < 7; i++) d(-15 + i * 5, 29, 3.4, i % 2 ? '#ff9ac0' : '#ffb8d0');
    r(-17, 31, 35, 2, '#3f8f3a');
  });
}
// 名札
function sonTag(kind, x, y, a = 1, size = 8) { tag(SON[kind].name, x, y, [SUNC, MOONC, EARTHC][kind], a, size); }
// 点線（光の線）。k：どこまで引くか（0〜1）
function dline(x0, y0, x1, y1, k, c = '#fff1b0', t = 0) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3);
  for (let i = 0; i <= n * k; i++) if ((i + Math.floor(t * 10)) % 3) P(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c);
}
// 月
function moon(cx, cy, r, t) {
  A(.2 + .08 * Math.sin(t * 3), () => disc(cx, cy, r + 5, '#c8d8ff'));
  disc(cx, cy, r, '#eef0d8'); disc(cx + rd(r * .3), cy - rd(r * .2), rd(r * .25), '#d0d2b8'); disc(cx - rd(r * .35), cy + rd(r * .3), rd(r * .18), '#d0d2b8');
}
// 火（gy は足もと）
function fire(cx, gy, t, k = 1) {
  const fl = (sc, c) => {
    const h = 18 * k * sc;
    for (let y = 0; y < h; y++) {
      const q = y / h, w = rd((1 - q) * 6 * k * sc * (.85 + .15 * Math.sin(t * 14 + y))), sw = rd(Math.sin(t * 9 + y * .4) * q * 2 * k);
      R(cx - w + sw, gy - y, w * 2 + 1, 1, c);
    }
  };
  fl(1, '#ff5a2a'); fl(.7, '#ff9a2e'); fl(.4, '#ffd84a');
}
// 水のしずく
function drop(cx, cy, c = '#5ab0ff') {
  for (let y = 0; y < 5; y++) R(cx - (y >> 1), cy - 6 + y, (y >> 1) * 2 + 1, 1, c);
  disc(cx, cy, 2, c); P(cx - 1, cy - 1, '#d0f0ff');
}
// 水面（y より下が水）
function water(y, t) {
  R(0, y, W, SH - y, '#1a3a6a');
  for (let x = 0; x < W; x++) P(x, y + rd(Math.sin(x * .25 + t * 4) * 1.2), '#5ab0ff');
  for (let x = 6; x < W; x += 16) R(x + rd(Math.sin(t * 2 + x) * 2), y + 8 + (x % 3) * 4, 5, 1, '#3a6ab0');
}
// 土の山と芽（gy は足もと）
function mound(cx, gy, t) {
  for (let y = 0; y < 10; y++) { const w = rd(Math.sqrt(1 - (y / 10) ** 2) * 18); R(cx - w, gy - y, w * 2 + 1, 1, y % 3 ? '#7a5a34' : '#6a4a2a'); }
  const sw = Math.sin(t * 3) > 0 ? 1 : 0;
  R(cx, gy - 16, 1, 6, '#3f8f3a'); R(cx - 3 + sw, gy - 16, 3, 2, '#5ac05a'); R(cx + 1 + sw, gy - 18, 3, 2, '#5ac05a');
}
// 日本：鳥居
function torii(cx, gy, k = 1, c = '#e04a3a') {
  const r = (dx, dy, w, h) => R(cx + dx * k, gy + dy * k, w * k, h * k, c);
  r(-12, -26, 25, 3); r(-10, -21, 21, 2); r(-9, -23, 2, 23); r(8, -23, 2, 23); r(-1, -23, 2, 3);
}
// 西洋：とんがり屋根の塔
function tower(cx, gy, k = 1) {
  const r = (dx, dy, w, h, c) => R(cx + dx * k, gy + dy * k, w * k, h * k, c);
  r(-6, -22, 13, 22, '#8a8aa8'); r(-6, -22, 13, 1, '#b0b0c8');
  for (let y = 0; y < 12; y++) { const w = rd(y / 2); r(-w, -34 + y, w * 2 + 1, 1, '#5a6ab0'); }
  r(0, -39, 1, 5, '#d8d8e4'); r(-1, -37, 3, 1, '#d8d8e4');
  r(-1, -16, 3, 5, '#ffd84a'); r(-1, -7, 3, 7, '#3a3a50');
}
// 東洋：五重の塔（ここでは三重）
function pagoda(cx, gy, k = 1) {
  const r = (dx, dy, w, h, c) => R(cx + dx * k, gy + dy * k, w * k, h * k, c);
  for (let i = 0; i < 3; i++) { const w = 12 - i * 3, y = -10 - i * 10; r(-w + 4, y, (w - 4) * 2 + 1, 10, '#8a4a2a'); r(-w, y - 2, w * 2 + 1, 2, '#3a3a4a'); P(cx - w * k, gy + (y - 3) * k, '#3a3a4a', Math.max(1, k | 0)); P(cx + w * k, gy + (y - 3) * k, '#3a3a4a', Math.max(1, k | 0)); }
  r(0, -40, 1, 8, '#c8a040');
}
// 鳥（自由）
function bird(x, y, t, c = '#f3ead6') {
  R(x - 1, y, 3, 1, c);
  if (Math.floor(t * 8) % 2) { P(x - 2, y - 1, c); P(x - 3, y - 2, c); P(x + 2, y - 1, c); P(x + 3, y - 2, c); }
  else { P(x - 2, y + 1, c); P(x - 3, y + 1, c); P(x + 2, y + 1, c); P(x + 3, y + 1, c); }
}
// 菩提樹（gy は足もと）
function tree(cx, gy) {
  R(cx - 3, gy - 70, 7, 70, '#5a3a24'); R(cx - 1, gy - 70, 2, 70, '#6a4a2c');
  [[0, -96, 30], [-26, -84, 20], [26, -84, 20], [-12, -110, 18], [14, -110, 18]].forEach(([dx, dy, rr]) => disc(cx + dx, gy + dy, rr, '#2a5a2a'));
  [[-8, -100, 10], [18, -92, 8], [-22, -88, 7]].forEach(([dx, dy, rr]) => disc(cx + dx, gy + dy, rr, '#3a7a3a'));
}
// 王冠（バツ印つき：装飾品は無い）
function crownX(cx, cy, a = 1) {
  A(a, () => {
    R(cx - 8, cy, 17, 5, '#ffe070'); [-8, -1, 6].forEach(x => R(cx + x, cy - 5, 3, 5, '#ffe070')); P(cx, cy + 2, '#ff3a5a', 2);
    for (let i = -7; i <= 7; i++) { P(cx + i * 1.4, cy + 2 + i, BAD, 2); P(cx + i * 1.4, cy + 2 - i, BAD, 2); }
  });
}
// 三尊を三角形にならべる（観音が上、阿弥陀が左下、釈迦が右下）
const TRI = [[90, 60], [40, 140], [140, 140]];
function trio(t, k = .75, a = [1, 1, 1], glow = [1, 1, 1]) {
  TRI.forEach(([x, y], i) => buddha(i, x, y, t, k, a[i], glow[i]));
}

// ---------- 場面1：三尊 ----------
function scene1(lt, t) {
  if (lt < 1) {
    // 観音・阿弥陀・釈迦があらわれ、光の三角形でつながる
    const k = lt;
    R(0, 0, W, SH, '#0b0a1a'); drawStars(t); ground();
    const ap = [0, 1, 2].map(i => fadeIn(k, .05 + i * .18, .2));
    const ln = clamp((k - .6) / .3);
    dline(90, 60, 40, 140, ln, '#fff1b0', t); dline(40, 140, 140, 140, ln, '#fff1b0', t); dline(140, 140, 90, 60, ln, '#fff1b0', t);
    trio(t, .75, ap);
    TRI.forEach(([x, y], i) => sonTag(i, x, y + 31, ap[i]));
    BA('三尊', 90, 118, 13, HO, clamp((k - .75) / .2));
  } else if (lt < 2) {
    // それぞれに ちがう光（役割・性質）
    const k = lt - 1, on = Math.min(2, Math.floor(k * 3.3));
    R(0, 0, W, SH, '#0b0a1a'); drawStars(t, .6); ground();
    dline(90, 60, 40, 140, 1, '#5a5478', t); dline(40, 140, 140, 140, 1, '#5a5478', t); dline(140, 140, 90, 60, 1, '#5a5478', t);
    trio(t, .75, [1, 1, 1], [0, 1, 2].map(i => i === on ? 2 : .4));
    TRI.forEach(([x, y], i) => sonTag(i, x, y + 31, i === on ? 1 : .5, i === on ? 9 : 8));
    tag('それぞれの 役割', 90, 112, HO, fadeIn(lt, 1.1), 7);
  } else if (lt < 3) {
    // 観音：日本・日（太陽）・火
    const k = lt - 2;
    R(0, 0, W, SH, mix('#0f1028', '#5a2a1a', ease(clamp(k / .5)))); drawStars(t, .3); ground();
    A(fadeIn(lt, 2.1), () => sun(36, 40, t, 12));
    A(fadeIn(lt, 2.25), () => torii(28, 202));
    if (k > .4) fire(150, 202, t, 1.1);
    buddha(0, 90, 152, t, 1.1);
    tag('日本', 28, 166, SUNC, fadeIn(lt, 2.3), 8); tag('日', 36, 66, SUNC, fadeIn(lt, 2.15), 9); tag('火', 150, 166, SUNC, fadeIn(lt, 2.5), 9);
  } else {
    // 阿弥陀：西洋・月・水
    const k = lt - 3;
    R(0, 0, W, SH, '#0f1838'); drawStars(t, .7); water(184, t);
    A(fadeIn(lt, 3.1), () => moon(144, 38, 11, t));
    A(fadeIn(lt, 3.25), () => tower(28, 184));
    for (let i = 0; i < 4; i++) { const q = (t * .8 + i / 4) % 1; if (k > .4) drop(146 + (i % 2) * 14, lerp(70, 184, q)); }
    buddha(1, 90, 146, t, 1.1);
    tag('西洋', 28, 134, MOONC, fadeIn(lt, 3.3), 8); tag('月', 144, 62, MOONC, fadeIn(lt, 3.15), 9); tag('水', 152, 196, MOONC, fadeIn(lt, 3.5), 9);
  }
}

// ---------- 場面2：三尊の性質 ----------
function scene2(lt, t) {
  if (lt < 1) {
    // 釈迦：東洋・地・土
    const k = lt;
    R(0, 0, W, SH, '#2a2418'); drawStars(t, .3); ground();
    A(fadeIn(lt, .25), () => pagoda(30, 202));
    if (k > .4) mound(150, 202, t);
    buddha(2, 90, 152, t, 1.1);
    tag('東洋', 30, 150, EARTHC, fadeIn(lt, .3), 8); tag('地・土', 150, 166, EARTHC, fadeIn(lt, .5), 9);
  } else if (lt < 2) {
    // 阿弥陀は 女・悪、釈迦は 男・善
    const k = lt - 1;
    R(0, 0, 90, SH, '#0f1838'); R(90, 0, 90, SH, '#2a2418'); R(89, 0, 2, SH, '#3a3358');
    drawStars(t, .4); ground();
    moon(20, 24, 6, t); mound(160, 34, t);
    buddha(1, 45, 112, t, .9); buddha(2, 135, 112, t, .9);
    sonTag(1, 45, 150, 1); sonTag(2, 135, 150, 1);
    tag('女', 30, 176, MOONC, fadeIn(lt, 1.15), 12); tag('悪', 60, 176, BAD, fadeIn(lt, 1.3), 12);
    tag('男', 120, 176, EARTHC, fadeIn(lt, 1.5), 12); tag('善', 150, 176, OK, fadeIn(lt, 1.65), 12);
  } else if (lt < 3) {
    // 観音は 自由・真：光の中を鳥が自由に飛ぶ
    const k = lt - 2;
    R(0, 0, W, SH, '#3a2a5a'); drawStars(t, .4); ground();
    A(.25 + .1 * Math.sin(t * 4), () => { for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6 + t * .3; for (let j = 30; j < 90; j += 3) P(90 + Math.cos(an) * j, 130 + Math.sin(an) * j, '#fff1b0'); } });
    buddha(0, 90, 128, t, 1.3, 1, 1.5);
    for (let i = 0; i < 4; i++) { const q = (t * .25 + i / 4) % 1; bird(lerp(-10, 190, q), 40 + i * 12 + Math.sin(t * 3 + i) * 4, t + i * .3); }
    tag('自由', 34, 96, SUNC, fadeIn(lt, 2.15), 11);
    BA('真', 146, 96, 22, HO, fadeIn(lt, 2.45, .3));
  } else {
    // いろいろな事に当てはめた表
    const k = lt - 3, cols = [36, 90, 144];
    R(0, 0, W, SH, '#0b0a1a'); drawStars(t, .3);
    cols.forEach((x, i) => { R(x - 26, 18, 52, 190, mix([SUNC, MOONC, EARTHC][i], '#0b0a1a', .85)); sonTag(i, x, 28, 1, 9); });
    const rows = [['日本', '西洋', '東洋'], ['日', '月', '地'], ['火', '水', '土'], ['自由・真', '女・悪', '男・善']];
    rows.forEach((row, j) => row.forEach((s, i) => tag(s, cols[i], 60 + j * 34, '#f3ead6', clamp((k - .05 - j * .15) / .12), j === 3 ? 8 : 11)));
    [0, 1, 2].forEach(i => buddha(i, cols[i], 190, t, .32, fadeIn(lt, 3.75)));
  }
}

// ---------- 場面3：お姿のちがい ----------
function scene3(lt, t) {
  if (lt < 1) {
    // 観音は日本系：まっすぐな髪（直毛）
    const k = lt;
    R(0, 0, W, SH, '#3a1f1a'); drawStars(t, .3); ground();
    A(.6, () => torii(158, 202, .8));
    buddha(0, 90, 84, t, 2.4);
    const a = fadeIn(lt, .3);
    A(a, () => { for (let i = 0; i < 6; i++) P(lerp(140, 106, i / 6), lerp(66, 76, i / 6), HO, 2); });
    tag('直毛', 150, 60, HO, a, 10);
  } else if (lt < 2) {
    // 宝玉の王冠・胸飾り：キラキラ光る
    const k = lt - 1;
    R(0, 0, W, SH, '#3a1f1a'); drawStars(t, .3); ground();
    buddha(0, 90, 84, t, 2.4, 1, 1.4);
    const tw = i => .5 + .5 * Math.sin(t * 9 + i * 2);
    [[80, 57], [90, 56], [100, 57]].forEach(([x, y], i) => A(tw(i) * fadeIn(lt, 1.1), () => spark(x, y - 6, '#fff', 3)));
    [[80, 104], [100, 104], [90, 108]].forEach(([x, y], i) => A(tw(i + 3) * fadeIn(lt, 1.4), () => spark(x, y, '#fff', 2)));
    tag('王冠', 36, 52, HO, fadeIn(lt, 1.1), 9); tag('胸飾り', 36, 104, HO, fadeIn(lt, 1.4), 9);
    tag('高貴', 150, 150, SUNC, fadeIn(lt, 1.6), 11);
  } else if (lt < 3) {
    // 御本体は純金：金の光がまわる
    const k = lt - 2;
    R(0, 0, W, SH, '#2a1a0a'); drawStars(t, .3); ground();
    A(.3, () => { for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8 + t * .5; for (let j = 40; j < 100; j += 3) P(90 + Math.cos(an) * j, 110 + Math.sin(an) * j, '#ffd84a'); } });
    buddha(0, 90, 108, t, 1.8, 1, 2);
    for (let i = 0; i < 6; i++) { const q = (t * .6 + i / 6) % 1; A(1 - q, () => spark(40 + i * 20, 180 - q * 120, '#fff6c0')); }
    BA('純金', 90, 30, 18, '#ffd84a', fadeIn(lt, 2.15, .3));
  } else {
    // 阿弥陀・釈迦は外国系：縮れた髪
    const k = lt - 3;
    R(0, 0, W, SH, '#141a3a'); drawStars(t, .5); ground();
    buddha(1, 50, 96, t, 1.6); buddha(2, 130, 96, t, 1.6);
    sonTag(1, 50, 156, 1, 9); sonTag(2, 130, 156, 1, 9);
    const a = fadeIn(lt, 3.3);
    A(a, () => { for (let i = 0; i < 5; i++) { P(lerp(78, 62, i / 5), lerp(56, 80, i / 5), HO, 2); P(lerp(102, 118, i / 5), lerp(56, 80, i / 5), HO, 2); } });
    tag('縮れ毛', 90, 48, HO, a, 9);
    tag('外国系', 90, 184, '#c0b8e0', fadeIn(lt, 3.5), 8);
  }
}

// ---------- 場面4：外国系の仏 ----------
function scene4(lt, t) {
  if (lt < 1) {
    // 装飾品は無く、裸体に白布をまとうのみ
    const k = lt;
    R(0, 0, W, SH, '#141a3a'); drawStars(t, .4); ground();
    buddha(2, 84, 84, t, 2.4);
    crownX(156, 52, fadeIn(lt, .25));
    tag('装飾品 なし', 156, 72, BAD, fadeIn(lt, .3), 7);
    A(fadeIn(lt, .5), () => { for (let i = 0; i < 5; i++) P(lerp(150, 120, i / 5), lerp(130, 122, i / 5), HO, 2); });
    tag('白布', 156, 134, HO, fadeIn(lt, .5), 10);
  } else if (lt < 2) {
    // 唐銅（ブロンズ）と鍍金（金メッキ）
    const k = lt - 1;
    R(0, 0, W, SH, '#1a1420'); drawStars(t, .3); ground();
    buddha(1, 46, 106, t, 1.3); buddha(2, 134, 106, t, 1.3);
    // 鍍金：表面に金をうすく塗る（光の帯が上から下へ）
    const sy = lerp(80, 150, (t * .6) % 1);
    A(.5, () => { for (let x = 116; x < 153; x++) P(x, sy + Math.sin(x * .5) * 1.5, '#fff6c0'); });
    tag('唐銅', 46, 162, '#d09868', fadeIn(lt, 1.1), 10); tag('ブロンズ', 46, 176, '#b0a8c8', fadeIn(lt, 1.2), 7);
    tag('鍍金', 134, 162, '#ecd090', fadeIn(lt, 1.4), 10); tag('金メッキ', 134, 176, '#b0a8c8', fadeIn(lt, 1.5), 7);
  } else if (lt < 3) {
    // 純金の観音と、唐銅・鍍金の阿弥陀・釈迦
    const k = lt - 2;
    R(0, 0, W, SH, '#0f1028'); drawStars(t, .4); ground();
    buddha(1, 32, 140, t, .8, 1, .5); buddha(2, 148, 140, t, .8, 1, .5);
    buddha(0, 90, 92, t, 1.25, 1, 2);
    for (let i = 0; i < 5; i++) { const an = t * 1.2 + i * 1.256; A(.6 + .4 * Math.sin(t * 6 + i), () => spark(90 + Math.cos(an) * 30, 96 + Math.sin(an) * 30, '#fff6c0')); }
    tag('純金', 90, 30, '#ffd84a', fadeIn(lt, 2.1), 11);
    tag('唐銅', 32, 186, '#d09868', fadeIn(lt, 2.4), 9); tag('鍍金', 148, 186, '#ecd090', fadeIn(lt, 2.4), 9);
  } else {
    // 仏の三つの姿「三身」
    const k = lt - 3, xs = [36, 90, 144], cs = [MOONC, EARTHC, SUNC];
    R(0, 0, W, SH, '#0b0a1a'); drawStars(t); ground();
    BA('三身', 90, 44, 24, HO, fadeIn(lt, 3.05, .3));
    xs.forEach((x, i) => {
      const a = clamp((k - .3 - i * .15) / .15);
      A(a * (.35 + .1 * Math.sin(t * 4 + i)), () => disc(x, 130, 20, cs[i]));
      A(a, () => disc(x, 130, 13, mix(cs[i], '#0b0a1a', .4)));
      BA(['法身', '報身', '応身'][i], x, 130, 11, '#fff6f0', a);
      for (let j = 0; j < 5; j++) A(a, () => disc(x - 12 + j * 6, 160, 3, j % 2 ? '#ff9ac0' : '#ffb8d0'));
    });
  }
}

// ---------- 場面5：三身 ----------
function scene5(lt, t) {
  if (lt < 1) {
    // 法身は阿弥陀：真理そのもの（宇宙いっぱいの光）
    const k = lt;
    R(0, 0, W, SH, '#05081a'); drawStars(t); drawStars(t * 1.3 + 2, .6); ground('#2a2a44');
    for (let i = 0; i < 3; i++) { const q = (t * .4 + i / 3) % 1; A((1 - q) * .5, () => { const rr = rd(lerp(14, 90, q)); for (let a = 0; a < 64; a++) P(90 + Math.cos(a / 64 * 6.283) * rr, 118 + Math.sin(a / 64 * 6.283) * rr, MOONC); }); }
    buddha(1, 90, 118, t, 1.3, 1, 1.6);
    BA('法身', 90, 34, 18, MOONC, fadeIn(lt, .05, .3));
    tag('真理 そのもの', 90, 188, HO, fadeIn(lt, .4), 8);
  } else if (lt < 2) {
    // 報身は釈迦：木の下で修行し、悟りを開く
    const k = lt - 1, sat = ease(clamp((k - .45) / .25));
    R(0, 0, W, SH, mix('#141220', '#3a3a1a', sat)); drawStars(t, .4 * (1 - sat)); ground();
    tree(90, 202);
    A(sat, () => { for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8 + t * .4; for (let j = 26; j < 80; j += 3) P(90 + Math.cos(an) * j, 150 + Math.sin(an) * j, '#fff1b0'); } });
    buddha(2, 90, 160, t, 1.1, 1, lerp(.2, 2, sat));
    if (sat < .5) T('…', 120, 132, 9, '#b0a8c8', 'center', .5 + .5 * Math.sin(t * 4));
    BA('報身', 150, 30, 16, EARTHC, fadeIn(lt, 1.05, .3));
    tag('修行', 30, 120, '#b0a8c8', fadeIn(lt, 1.1) * (1 - sat), 9);
    tag('悟り', 30, 120, OK, sat, 10);
  } else if (lt < 3) {
    // 応身は観音：人を救うため、姿を変えて現れる
    const k = lt - 2, form = Math.floor(t * 2.5) % 2, xs = [40, 90, 140];
    R(0, 0, W, SH, '#1a2450'); drawStars(t, .5); ground();
    cloud(90, 96, 1.1);
    if (form) buddha(0, 90, 58, t, .9);
    else { A(.3, () => disc(90, 68, 16, '#fff1b0')); person(90, 88, LIT[0], LIT[1], 'give', 1.1); }
    if (Math.floor(t * 2.5 * 4) % 4 === 0) spark(90, 60, '#fff', 4);
    const reach = clamp((k - .3) / .4);
    xs.forEach((x, i) => {
      A(.25 * reach, () => { for (let y = 104; y < 202; y++) R(lerp(90, x, (y - 104) / 98) - 4, y, 8, 1, '#fff1b0'); });
      person(x, 202, reach > .6 ? LIT[0] : DIM[0], reach > .6 ? LIT[1] : DIM[1], reach > .6 ? 'up' : 'down', 1);
    });
    BA('応身', 150, 30, 16, SUNC, fadeIn(lt, 2.05, .3));
    tag('姿を変えて 救う', 48, 30, HO, fadeIn(lt, 2.3), 7);
  } else {
    // 結び：三尊は三位一体
    const k = lt - 3;
    R(0, 0, W, SH, '#0b0a1a'); drawStars(t); ground();
    A(.2 + .1 * Math.sin(t * 3), () => disc(90, 112, 70, '#fff1b0'));
    dline(90, 60, 40, 140, 1, '#fff1b0', t); dline(40, 140, 140, 140, 1, '#fff1b0', t); dline(140, 140, 90, 60, 1, '#fff1b0', t);
    trio(t, .75, [1, 1, 1], [1.6, 1.2, 1.2]);
    TRI.forEach(([x, y], i) => sonTag(i, x, y + 31, 1));
    BA('三位一体', 90, 120, 10, HO, fadeIn(lt, 3.1, .4));
    for (let i = 0; i < 6; i++) { const q = (t * .7 + i / 6) % 1; A(1 - q, () => spark(20 + i * 28, 196 - q * 150)); }
  }
}

// ---------- 進行 ----------
const SCENES = [
  [0, 4, scene1, '三尊 三位一体'],
  [4, 8, scene2, '三尊の性質'],
  [8, 12, scene3, 'お姿のちがい'],
  [12, 15, scene4, '外国系の仏'],
  [15, 16, (lt, t) => scene4(lt + 3, t), '三身'],
  [16, 20, scene5, '三身'],
];
// この動画に出てくる見出しにだけ、順に 一・二・三… をつける（見出しが1つだけなら番号なし）
const HEADS = [...new Set(SCENES.filter(s => CAPS.some(c => c[0] >= s[0] && c[0] < s[1])).map(s => s[3]))];
const headOf = s => HEADS.length > 1 ? '一二三四五'[HEADS.indexOf(s)] + ' ' + s : s;
function frame(t) {
  lastVT = t;
  ctx.clearRect(0, 0, cv.width, cv.height);
  const sc = SCENES.find(s => t >= s[0] && t < s[1]) || SCENES[SCENES.length - 1];
  const lt = t - sc[0];
  sc[2](lt, AT);
  // 場面の見出し
  T(headOf(sc[3]), 4, 6, 6.5, '#f3ead6', 'left', clamp(1.6 - lt) * .9 + .25);
  // 場面の切りかわり（黒くフェード）
  const same = (x) => (SCENES.find(s => x >= s[0] && x < s[1]) || sc)[3] === sc[3];
  const d = Math.min(t - sc[0] + (sc[0] === 0 || same(sc[0] - .01) ? 9 : 0), sc[1] - t + (sc[1] === DUR || same(sc[1]) ? 9 : 0));
  if (d < .05) A(1 - d / .05, () => R(0, 0, W, SH, '#000'));
  // 終わり：ゆっくり暗くして「ご視聴ありがとうございました」
  if (t > DUR) {
    const e = t - DUR;
    A(clamp(e / 1.2) * .8, () => R(0, 0, W, SH, "#000"));
    T("ご視聴", 90, 80, 16, "#ffe8b0", "center", clamp((e - .5) / .8));
    T("ありがとう", 90, 104, 16, "#ffe8b0", "center", clamp((e - .5) / .8));
    T("ございました", 90, 128, 16, "#ffe8b0", "center", clamp((e - .5) / .8));
  }
  captions(t);
  // 字幕の左：いま読んでいる人（めたん・つむぎ・はう・小夜）がしゃべる。オレンジのキャラクターはタイトルの左
  const ci = CAPS.findIndex(c => t >= c[0] && t < c[1]), si = ci < 0 ? CAPS.length - 1 : ci;
  speakerDot(voiceOf(si), 9, 227, AT, playing && speaking && si === seg);
}

// ---------- 進み方：字幕1つずつ、読み上げが終わってから次へ ----------
let AT = 0; // AT：鼓動や粒の動き用の時計（字幕の進みとは別に、いつも同じ速さで進む）
let running = false, playing = false, muted = false, seg = 0, pos = 0, lastNow = 0, waitT = 0, speaking = false;
const STARTS = []; let TOTAL = 0;
CAPS.forEach(c => { STARTS.push(TOTAL); TOTAL += c.dur; });
const segAt = p => { let i = 0; while (i < CAPS.length - 1 && p >= STARTS[i + 1]) i++; return i; };
function loop(now) {
  const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now;
  if (playing) {
    AT += dt / 1.4;
    const end = STARTS[seg] + CAPS[seg].dur;
    let np = pos + dt;
    if (np >= end) {
      // 読み上げがまだ続いていたら、終わるまで待つ（声が出ない端末のため 8 秒で打ち切る）
      if (speaking && !muted && waitT < 8) { np = end - .001; waitT += dt; }
      else if (seg < CAPS.length - 1) { np = end; enterSeg(seg + 1, true); }
      else { np = TOTAL; finish(); }
    }
    pos = np;
  }
  draw();
  requestAnimationFrame(loop);
}
function draw() {
  const i = segAt(Math.min(pos, TOTAL - .001)), c = CAPS[i];
  const k = pos >= TOTAL ? 1 : clamp((pos - STARTS[i]) / c.dur);
  frame(lerp(c[0], c[1] - .001, k));
  if (!seeking) seekBar.value = pos;
  curT.textContent = mmss(pos);
}
// その字幕に入る：声を読み、効果音を鳴らす
function enterSeg(i, sfx) {
  seg = i; waitT = 0;
  if (muted || !playing) { stopSpeak(); return; }
  speak(i);
  if (sfx && SFX[CAPS[i].id]) try { wakeAudio(); SFX[CAPS[i].id](); } catch (e) {}
}
function finish() {
  playing = false; stopSpeak(); bgmOn(false);
  ppBtn.textContent = '▶ もう一度';
}
function stopSpeak() {
  speaking = false; cur = null;
  if (koeSrc) { try { koeSrc.onended = null; koeSrc.stop(); } catch (e) {} koeSrc = null; }
  try { if (ttsOK) speechSynthesis.cancel(); } catch (e) {}
}

// ---------- 操作パネル ----------
const seekBar = document.getElementById('seekBar'), curT = document.getElementById('curT');
const ppBtn = document.getElementById('ppBtn'), rsBtn = document.getElementById('rsBtn'), sndBtn = document.getElementById('sndBtn');
const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
seekBar.max = TOTAL.toFixed(1);
document.getElementById('totT').textContent = mmss(TOTAL);
let seeking = false;
// ---------- 女性の声で読み上げ（御神書索引と同じしくみ） ----------
let cur = null;
const ttsOK = 'speechSynthesis' in window;
const MALE = ['otoya', 'ichiro', 'keita', 'hattori', 'daichi', 'naoki', 'male'];
const FEMALE = ['kyoko', 'o-ren', 'oren', 'nanami', 'haruka', 'ayumi', 'sayaka', 'mizuki', 'female', 'google'];
function voiceQuality(v) {
  const s = ((v.voiceURI || '') + ' ' + (v.name || '')).toLowerCase();
  if (s.includes('eloquence')) return -1;
  if (s.includes('premium')) return 3;
  if (s.includes('enhanced') || s.includes('natural') || s.includes('neural')) return 2;
  if (s.includes('compact')) return 0;
  return 1;
}
function pickVoice() {
  let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) {}
  const name = v => ((v.voiceURI || '') + ' ' + (v.name || '')).toLowerCase();
  const ja = vs.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('ja') && !MALE.some(m => name(v).includes(m)));
  const rank = v => { const i = FEMALE.findIndex(f => name(v).includes(f)); return i < 0 ? FEMALE.length : i; };
  ja.sort((a, b) => (voiceQuality(b) - voiceQuality(a)) || (rank(a) - rank(b)));
  return ja[0] || null;
}
let voice = null;
if (ttsOK) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); }; } catch (e) {} }
let lastUtter = null;
function speakTTS(text, token) {
  if (!ttsOK) { speaking = false; return; }
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 0.9; u.pitch = 1.1; u.volume = 1;
    voice = voice || pickVoice(); if (voice) u.voice = voice;
    u.onend = u.onerror = () => { if (cur === token) speaking = false; };
    lastUtter = u; // 読み上げ中に消えないよう持っておく（消えると「読み終わり」が届かない）
    speechSynthesis.speak(u);
  } catch (e) { speaking = false; }
}

// ---------- ナレーション：VOICEVOX の4人（めたん・つむぎ・はう・小夜）と AivisSpeech の3人（まお・まい・コハク）で作った声を流す ----------
// 「順番」のときは、字幕1つごとに グループの人を順番に読む（VOICEVOX：めたん→つむぎ→はう→小夜、AivisSpeech：まお→まい→コハク）（ランダムではない）。
// iPhone でも声・音楽・効果音がいっしょに鳴る（iPhone の読み上げ機能を使うと、読む間ほかの音が止まってしまうため）。
// 録音が読めないときだけ、端末の声で読み上げる。字幕の文を変えたら作り直すこと
const KOE_V = 1;
// [フォルダ, クレジットの名前, ボタンの名前, 録音の形式]。4つの動画で同じ声を使う（ファイルの番号は 字幕の番号 c.id）
const VOICES = [['../koe', '四国めたん', 'めたん', 'wav'], ['../koe-tsumugi', '春日部つむぎ', 'つむぎ', 'wav'], ['../koe-hau', '雨晴はう', 'はう', 'wav'], ['../koe-sayo', '小夜/SAYO', '小夜', 'wav'],
  ['../koe-mao', 'まお', 'まお', 'mp3'], ['../koe-mai', 'まい', 'まい', 'mp3'], ['../koe-kohaku', 'コハク', 'コハク', 'mp3']];
// 「声」のグループ：VOICEVOX・AivisSpeech（ボタンで切り替える）。ランダムは全員から選ぶ
const ENGINES = [['VOICEVOX', [0, 1, 2, 3]], ['AivisSpeech', [4, 5, 6]]]; // AivisSpeech の並び：まお→まい→コハク
const RAND = ENGINES.length; // 「ランダム」のボタンの番号
const ALL = VOICES.map((v, i) => i);
const MIX = -1; // 「順番」
const koeOK = VOICES.map(() => []), koeRaw = [], koeBuf = VOICES.map(() => []); // koeOK[v][i] が false：その録音がない（押した瞬間に端末の声で読むため、先に分かるようにしておく）
function loadVoice(v) {
  if (koeRaw[v]) return;
  koeRaw[v] = CAPS.map((c, i) => fetch(VOICES[v][0] + '/' + String(c.id).padStart(2, '0') + '.' + VOICES[v][3] + '?v=' + KOE_V).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null).then(ab => { koeOK[v][i] = !!ab; return ab; }));
  if (ac) CAPS.forEach((c, i) => koeDecode(v, i));
}
let voiceNo = MIX;
let vset = 0; // 0：VOICEVOX、1：AivisSpeech、2：ランダム（全員から字幕ごとに選ぶ）
try { const n = parseInt(localStorage.getItem('sansonVoice5')); if (n >= MIX && n < 4) voiceNo = n; } catch (e) {}
try { const n = parseInt(localStorage.getItem('sansonEngine')); if (n >= 0 && n <= RAND) vset = n; } catch (e) {}
// 字幕ごとの読み手
let segVoice = [], randVoice = [];
function shuffleVoices() {
  segVoice = []; randVoice = [];
  CAPS.forEach((c, i) => segVoice.push(i)); // 「順番」：グループの人を、字幕ごとに順番にくり返す（ランダムではない）
  // 「ランダム」のとき：全員を まぜた順に 1人ずつ。全員が話し終わったら（1周したら）まぜ直して次の周へ。
  // 周の切れ目でも、前の周の最後の人が 次の周の最初にならないようにする
  while (randVoice.length < CAPS.length) {
    const bag = ALL.slice();
    for (let k = bag.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [bag[k], bag[j]] = [bag[j], bag[k]]; }
    if (randVoice.length && bag[0] === randVoice[randVoice.length - 1]) bag.push(bag.shift());
    randVoice.push(...bag);
  }
  randVoice.length = CAPS.length;
}
shuffleVoices();
const group = () => ENGINES[vset][1];
const voiceOf = i => vset === RAND ? randVoice[i] : voiceNo === MIX ? group()[segVoice[i] % group().length] : group()[voiceNo];
function koeDecode(v, i) {
  if (!koeBuf[v][i]) koeBuf[v][i] = koeRaw[v][i].then(ab => ab && new Promise(res => {
    try { ac.decodeAudioData(ab.slice(0), b => res(b), () => res(null)); } catch (e) { res(null); }
  }));
  return koeBuf[v][i];
}
let koeSrc = null;
function speak(i) {
  stopSpeak();
  speaking = true;
  const token = {}; cur = token;
  const v = voiceOf(i);
  if (!ac || koeOK[v][i] === false) { speakTTS(CAPS[i][4], token); return; }
  koeDecode(v, i).then(b => {
    if (cur !== token) return; // もう別の字幕に進んだ・止めた
    if (!b) { speakTTS(CAPS[i][4], token); return; }
    const s = ac.createBufferSource(); s.buffer = b;
    s.connect(ac.destination);
    s.onended = () => { if (cur === token) speaking = false; };
    koeSrc = s; s.start();
  });
}

// ---------- 音楽と効果音（Web Audio で作る） ----------
let ac = null, bgm = null;
function tone(f, at, len, type, vol, f2, dest) {
  const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + len);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + len);
  o.connect(g).connect(dest || ac.destination); o.start(t0); o.stop(t0 + len + .05);
}
// ざわざわした音（ゴォー・シュワー・息など）。type と freq で音色、up で「だんだん大きく」
function noise(at, len, vol, freq = 900, type = 'bandpass', up = 0, q = 1) {
  const b = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter(), t0 = ac.currentTime + at;
  fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02 + up * len);
  g.gain.linearRampToValueAtTime(0, t0 + len);
  s.buffer = b; s.connect(fl).connect(g).connect(ac.destination); s.start(t0);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// 背景の音楽：声が聞こえるように小さく、ゆっくり（1拍 = 0.5秒）
const MEL = [64,67,69,72,69,67,64,62, 64,69,72,74,72,69,67,64], BASS = [45,45,40,40,43,43,40,40];
let beat = 0, nextBeat = 0;
function bgmTick() {
  if (!ac) return;
  while (nextBeat < ac.currentTime + .6) {
    const at = nextBeat - ac.currentTime;
    tone(NOTE(MEL[beat % 16]), at, .45, 'triangle', .05, 0, bgm);
    if (beat % 2 === 0) tone(NOTE(BASS[(beat >> 1) % 8]), at, .9, 'triangle', .1, 0, bgm);
    beat++; nextBeat += .5;
  }
  setTimeout(bgmTick, 200);
}
const chime = () => { tone(1320, 0, .25, 'sine', .1); tone(1760, .08, .3, 'sine', .08); };
// 雷の音（ゴロッ・ピシャッ）：前の版の発熱の音。いきなり大きく鳴って、だんだん消える
function thunder(at, len, vol) {
  const b = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
  fl.type = "bandpass"; fl.frequency.value = 900; g.gain.value = vol;
  s.buffer = b; s.connect(fl).connect(g).connect(ac.destination); s.start(ac.currentTime + at);
}
// 心臓の音（ドクン）：低い音を2つ続ける
// iPhone のスピーカーは低い音が出にくいので、少し高めの音を重ねる
const thump = at => { tone(170, at, .16, "triangle", .4, 70); tone(80, at, .18, "sine", .4, 40); tone(140, at + .2, .14, "triangle", .3, 60); };
// 字幕の番号ごとの効果音（場面に合わせて1回ずつ）
const SFX = {
  0: () => { tone(196, .2, 2.6, 'sine', .12); [0, 1, 2].forEach(i => tone(NOTE([64, 67, 72][i]), .5 + i * .45, .8, 'triangle', .06)); }, // 三尊があらわれる：ゴーン・ポン・ポン・ポン
  1: () => [0, 1, 2].forEach(i => tone(NOTE([72, 76, 79][i]), .3 + i * .9, .6, 'sine', .07)),                     // 順番に光る
  2: () => { tone(NOTE(72), .2, 1.2, 'sine', .07, NOTE(84)); noise(1.2, 2.2, .06, 1200, 'bandpass', .3, .7); },  // 日がのぼる・火がもえる
  3: () => { [84, 79, 76].forEach((n, i) => tone(NOTE(n), .3 + i * .25, .8, 'sine', .05)); [0, .5, 1, 1.5].forEach(d => tone(1600, 1.4 + d, .1, 'sine', .05, 700)); }, // 月・しずく ポチャン
  4: () => { tone(110, .3, .5, 'triangle', .2, 70); [60, 62, 67].forEach((n, i) => tone(NOTE(n), 1.2 + i * .25, .5, 'triangle', .06)); }, // 土・芽が出る
  5: () => { [0, .4].forEach(d => tone(NOTE(69), .8 + d, .3, 'sine', .06)); [0, .4].forEach(d => tone(NOTE(60), 2 + d, .3, 'triangle', .07)); }, // 左・右
  6: () => { [0, .25, .5, .75].forEach((d, i) => tone(1800 + (i % 2) * 300, .4 + d, .1, 'sine', .04, 2400)); tone(1320, 1.8, .9, 'sine', .07); }, // 鳥・真
  7: () => [0, .45, .9, 1.35].forEach((d, i) => tone(NOTE(67 + i * 2), .3 + d, .3, 'square', .035)),            // 表がうまる
  8: () => { tone(NOTE(76), .3, .5, 'triangle', .06); tone(NOTE(79), .7, .8, 'triangle', .06); },               // 直毛
  9: () => { [0, .15, .3, .45, .6].forEach((d, i) => tone(2000 + i * 180, .6 + d, .12, 'sine', .05)); },          // 王冠・胸飾り：キラキラ
  10: () => { tone(NOTE(72), .2, 2.4, 'sine', .07); tone(NOTE(79), .3, 2.2, 'sine', .05); [84, 88, 91].forEach((n, i) => tone(NOTE(n), .8 + i * .2, .6, 'triangle', .05)); }, // 純金：キラーン
  11: () => { [0, .12, .24, .36].forEach(d => tone(700, .4 + d, .05, 'triangle', .05, 500)); tone(NOTE(67), 1.2, .7, 'triangle', .06); }, // 縮れ毛：ポコポコ
  12: () => { tone(330, .4, .25, 'square', .04, 220); noise(1.4, .8, .06, 2500, 'highpass', .4); },             // ✕・布がふわり
  13: () => { tone(520, .3, 1.2, 'triangle', .08, 500); tone(780, 1.6, 1.4, 'sine', .06); },                    // 唐銅：カーン／鍍金：キラーン
  14: () => { [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), .3 + i * .15, .6, 'sine', .06)); },                 // 純金が光る
  15: () => [0, .5, 1].forEach((d, i) => { tone(NOTE([62, 66, 69][i]), .6 + d, 1, 'triangle', .07); }),           // 三身：三つの光
  16: () => { tone(NOTE(57), .2, 2.8, 'sine', .07, NOTE(69)); tone(NOTE(64), .5, 2.4, 'sine', .04, NOTE(76)); },   // 法身：広がる光
  17: () => { tone(NOTE(55), .3, 1.4, 'triangle', .05); [67, 71, 74, 79].forEach((n, i) => tone(NOTE(n), 1.8 + i * .15, .8, 'triangle', .06)); }, // 修行 → 悟り
  18: () => { [0, .8, 1.6].forEach(d => { tone(1200, .3 + d, .2, 'sine', .05, 1600); tone(1600, .4 + d, .2, 'sine', .04, 1200); }); [64, 67, 72].forEach((n, i) => tone(NOTE(n), 2.4 + i * .2, .6, 'triangle', .06)); }, // 姿を変える・救う
  19: () => { [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * .18, .7, 'square', .05)); tone(NOTE(84), .7, 1.6, 'triangle', .1); },
  20: () => { bgm.gain.setTargetAtTime(0, ac.currentTime, 1.2); [60, 64, 67, 72].forEach((n, i) => tone(NOTE(n), i * .25, 3.5 - i * .25, "triangle", .07)); }, // 終わりの和音と音楽のフェードアウト
};
function startSound() {
  try {
    // iPhone の消音スイッチが入っていても声と音が出るようにする（声も音もすべて Web Audio で鳴らすので使える）
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      ac.onstatechange = () => { if (playing && !muted) wakeAudio(); };
      bgm = ac.createGain(); bgm.gain.value = 0; bgm.connect(ac.destination);
      nextBeat = ac.currentTime + .1; bgmTick();
      koeRaw.forEach((r, v) => r && CAPS.forEach((c, i) => koeDecode(v, i))); // 録音の声を先に準備しておく
    }
    ac.resume();
  } catch (e) {}
}
// iPhone で声の読み上げなどのあと音が止まっていたら、また鳴るようにする
function wakeAudio() { try { if (ac && ac.state !== "running") ac.resume(); } catch (e) {} }
// 背景の音楽を出す・止める（音量を上げ下げする）
function bgmOn(on) { if (bgm) bgm.gain.setTargetAtTime(on && !muted ? .7 : 0, ac.currentTime, .15); }

// 最初から再生（ボタンを押したその場で声を出す：iPhone は押した瞬間でないと声が出ないため）
function playFromStart() {
  startSound();
  document.getElementById('startBox').classList.add('hide');
  pos = 0; AT = 0; playing = true; bgmOn(true);
  ppBtn.textContent = '⏸ 一時停止';
  shuffleVoices();
  enterSeg(0, true);
  if (!running) { running = true; lastNow = performance.now(); requestAnimationFrame(loop); }
}
document.getElementById('startBtn').onclick = playFromStart;
rsBtn.onclick = playFromStart;
ppBtn.onclick = () => {
  if (!running || pos >= TOTAL) { playFromStart(); return; }
  playing = !playing;
  if (playing) {
    startSound(); bgmOn(true); ppBtn.textContent = '⏸ 一時停止';
    enterSeg(segAt(pos), false); // 止めたところの字幕を、もう一度読む
  } else {
    stopSpeak(); bgmOn(false); ppBtn.textContent = '▶ 再生';
  }
};
// 再生位置のバー：動かすと好きな場面へ
seekBar.addEventListener('input', () => {
  seeking = true; stopSpeak();
  pos = Math.min(parseFloat(seekBar.value), TOTAL - .01); seg = segAt(pos);
  if (!running) draw();
});
seekBar.addEventListener('change', () => {
  seeking = false;
  if (!running) { playFromStart(); pos = parseFloat(seekBar.value); seg = segAt(pos); enterSeg(seg, false); return; }
  if (pos < TOTAL && !playing && ppBtn.textContent === '▶ もう一度') { playing = true; bgmOn(true); ppBtn.textContent = '⏸ 一時停止'; }
  if (playing) enterSeg(seg, false);
});
// 声・音のオン・オフ
sndBtn.onclick = () => {
  muted = !muted;
  sndBtn.textContent = muted ? '🔇 声・音 OFF' : '🔊 声・音 ON';
  sndBtn.classList.toggle('off', muted);
  if (muted) { stopSpeak(); bgmOn(false); }
  else if (playing) { startSound(); bgmOn(true); enterSeg(seg, false); }
};

// 声を選ぶ：選んだ声で、いまの字幕から読み直す
const eBtns = document.querySelectorAll('.voices button[data-e]'), nameRow = document.getElementById('nameRow');
const useVoices = () => vset === RAND ? ALL : voiceNo === MIX ? group() : [group()[voiceNo]];
// 1人を選ぶ段：いまのグループの人数ぶん、ボタンを作り直す
function makeNameBtns() {
  nameRow.querySelectorAll('button').forEach(b => b.remove());
  if (vset === RAND) return;
  [MIX, ...group().map((v, k) => k)].forEach(k => {
    const b = document.createElement('button');
    b.dataset.v = k; b.textContent = k === MIX ? '順番' : VOICES[group()[k]][2];
    b.onclick = () => {
      voiceNo = k;
      try { localStorage.setItem('sansonVoice5', voiceNo); } catch (e) {}
      pickChanged();
    };
    nameRow.appendChild(b);
  });
}
function showVoice() {
  if (vset < RAND && voiceNo >= group().length) voiceNo = MIX;
  eBtns.forEach(b => b.classList.toggle('on', +b.dataset.e === vset));
  // ランダムのときは 1人を選ぶ段をかくす
  nameRow.classList.toggle('hide', vset === RAND);
  nameRow.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === voiceNo));
  const cr = e => ENGINES[e][0] + ':' + [...new Set(ENGINES[e][1].filter(v => useVoices().includes(v)).map(v => VOICES[v][1]))].join('・');
  document.getElementById('credit').textContent = '声：' + (vset === RAND ? ENGINES.map((e, k) => cr(k)).join('／') : cr(vset));
}
function pickChanged() {
  showVoice(); stopSpeak(); useVoices().forEach(loadVoice);
  if (playing && !muted) { startSound(); enterSeg(seg, false); }
}
// VOICEVOX・AivisSpeech・ランダム の切り替え：選んだ方の声で、いまの字幕から読み直す
eBtns.forEach(b => b.onclick = () => {
  vset = +b.dataset.e;
  if (vset === RAND) shuffleVoices(); // ランダムを押すたびに、くじを引き直す
  try { localStorage.setItem('sansonEngine', vset); } catch (e) {}
  makeNameBtns(); pickChanged();
});
makeNameBtns(); showVoice(); useVoices().forEach(loadVoice);

// ---------- タイトルの左のオレンジのキャラクター（前に字幕の左にいたときと同じ動き） ----------
// 再生中：しゃべる（手をふる）→ 最後の場面でジャンプ → 終わったら歩く。止まっているときは歩く
let lastVT = 0;
(function titleMascot() {
  const c = document.getElementById('ccTitle'); if (!c) return;
  const g = c.getContext('2d'), q = 4, oy = 5; // 1ドット4画素。上にジャンプの分をあける
  function draw(now) {
    const t = now / 1000 / 1.4;
    const mode = !playing ? 'walk' : lastVT >= DUR ? 'walk' : lastVT >= CAPS[CAPS.length - 2][0] ? 'jump' : 'talk';
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x * q), Math.round(y * q), Math.round(w * q), Math.round(h * q)); };
    g.clearRect(0, 0, c.width, c.height);
    const col = '#d97757', f = Math.floor(t * 6) % 4;
    const hop = mode === 'jump' ? -Math.abs(Math.sin(t * 7)) * 4 : (f % 2 ? -1 : 0);
    const up = [f === 1, f === 3, f === 3, f === 1];
    [2, 4, 7, 9].forEach((x, i) => R(x, oy + 6, 1, up[i] && mode === 'walk' ? 1 : 2, col));
    const y0 = oy + hop;
    R(2, y0, 8, 6, col);
    const wave = mode === 'talk' && Math.sin(t * 10) > 0 ? -1 : 0;
    R(0, y0 + 2 + wave, 2, 2, col); R(10, y0 + 2 - wave, 2, 2, col);
    const blink = (t % 3) > 2.85;
    R(3, y0 + 1 + (blink ? .6 : 0), 1, blink ? .4 : 1, '#1a1612'); R(8, y0 + 1 + (blink ? .6 : 0), 1, blink ? .4 : 1, '#1a1612');
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// 最初の一枚（文字の準備ができてから）
Promise.race([Promise.all([document.fonts.ready, document.fonts.load('20px "Yuji Syuku"', '三尊')]), new Promise(r => setTimeout(r, 1500))]).then(() => { if (!running) frame(lerp(CAPS[0][0], CAPS[0][1], .95)); });
