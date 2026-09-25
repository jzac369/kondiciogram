'use strict';
/* =====================================================================
   KONDICIOGRAM: biorytmy podľa filmu „Jáchyme, hoď ho do stroje!“
   Model: fyzický 23 d, citový 28 d, intelektový 33 d, sínus od dňa narodenia.
   Znak dňa sa určuje na intervale <t-0.5, t+0.5>: prechod nulou nadol = X,
   nahor = 0, inak * (plus) alebo . (mínus). S týmto modelom stroj
   reprodukuje filmový výtlačok (NAR. 16. 2. 1935, rok 1973) znak po znaku.
   ===================================================================== */

const $ = s => document.querySelector(s);
const MS = 864e5;
const P = { F: 23, C: 28, I: 33 };
const CH = ['F', 'C', 'I'];
const CH_NAME = { F: 'Fyzický', C: 'Citový', I: 'Intelektový' };
const CH_PRINT = { F: 'FYZICKY', C: 'CITOVY', I: 'INTELEKT' };
const CH_COLOR = { F: '#ff7a45', C: '#7dff9a', I: '#ffd23f' };
const MONTHS_CZ = ['LEDEN', 'UNOR', 'BREZEN', 'DUBEN', 'KVETEN', 'CERVEN', 'CERVENEC', 'SRPEN', 'ZARI', 'RIJEN', 'LISTOPAD', 'PROSINEC'];
const MONTHS_SK = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
const MONTHS_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];
const DOW = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
const DOW_LOC = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];
const KOUDELKA_BIRTH = '1935-02-16';

/* ---------------- úložisko (localStorage s poistkou) ---------------- */
const mem = {};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : (k in mem ? mem[k] : d); } catch (e) { return k in mem ? mem[k] : d; } },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { } }
};
const K_LAST = 'kg.last';   // posledný vyplnený štítok (bez prihlasovania)

/* ---------------- dátumy (celé dni v UTC) ---------------- */
const dn = (y, m, d) => Math.round(Date.UTC(y, m, d) / MS);
function todayN() { const n = new Date(); return dn(n.getFullYear(), n.getMonth(), n.getDate()); }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return dn(y, m - 1, d); }
function fromN(n) { const d = new Date(n * MS); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay() }; }
function isoN(n) { const f = fromN(n); return `${f.y}-${String(f.m + 1).padStart(2, '0')}-${String(f.d).padStart(2, '0')}`; }
const fmt = n => { const f = fromN(n); return `${f.d}. ${f.m + 1}. ${f.y}`; };
const fmtLong = n => { const f = fromN(n); return `${DOW[f.w]} ${f.d}. ${MONTHS_GEN[f.m]}`; };
const fmtShort = n => { const f = fromN(n); return `${f.d}. ${f.m + 1}.`; };
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const nf = x => x.toLocaleString('sk-SK');

function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
const ascii = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const keyOf = name => ascii(name.trim()).replace(/\s+/g, ' ');
// rovnaké meno v ľubovoľnom poradí, veľkosti písmen a s/bez diakritiky dá rovnaký výsledok
const nameSeed = name => keyOf(name).split(' ').sort().join(' ');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ---------------- dotazník ---------------- */
// e = posun kriviek (bias), w = váhy pre celkový index, chrono = najlepšia hodina
const QUESTIONS = [
  { id: 'sleep', kick: 'Otázka o spánku', title: 'Koľko hodín denne spávate?', opts: [
    { t: 'Menej ako 5, spím až keď je hotovo', e: { F: -.2, I: -.15 } },
    { t: '5 až 6 hodín', e: { F: -.08, I: -.05 } },
    { t: '7 až 8 hodín, ako to má byť', e: { F: .1, I: .05 } },
    { t: '9 a viac, spánok je môj šport', e: { F: .02, C: .05, I: -.05 } }] },
  { id: 'move', kick: 'Otázka o pohybe', title: 'Koľko sa týždenne hýbete?', opts: [
    { t: 'Iba k chladničke a späť', e: { F: -.2 } },
    { t: 'Prechádzka so psom, nákup, schody', e: { F: .03 } },
    { t: '2 až 3-krát týždenne si zacvičím', e: { F: .15, C: .03 } },
    { t: 'Trénujem, ako keby som išiel na spartakiádu', e: { F: .25, C: .05, I: -.03 } }] },
  { id: 'coffee', kick: 'Otázka o káve', title: 'Koľko šálok kávy (turek sa tiež počíta) vypijete denne?', opts: [
    { t: 'Ani jednu', e: { C: .03 } },
    { t: '1 až 2', e: { I: .1 } },
    { t: '3 až 4', e: { I: .12, C: -.05 } },
    { t: '5 a viac, srdce sa mi ide zblázniť', e: { I: .02, C: -.15, F: -.05 } }] },
  { id: 'beer', kick: 'Otázka o pive', title: 'Koľko pív vypijete za týždeň?', opts: [
    { t: 'Ani jedno', e: { F: .05 } },
    { t: '1 až 3, na zdravie', e: { C: .08 } },
    { t: '4 až 10, veď sme u nás', e: { F: -.08, C: .05, I: -.05 } },
    { t: 'Krčmárka ma volá krstným menom', e: { F: -.2, C: -.05, I: -.15 } }] },
  { id: 'stress', kick: 'Otázka o práci', title: 'Ako vás zaťažuje práca alebo škola?', opts: [
    { t: 'Pohodička, ako na chate', e: { C: .15 } },
    { t: 'Normálne, dá sa to', e: { C: .03 } },
    { t: 'Termíny, porady, šéf za chrbtom', e: { C: -.12, I: .03 } },
    { t: 'Horím ako prehriata Tatra v kopci', e: { C: -.25, F: -.08 } }] },
  { id: 'love', kick: 'Otázka o láske', title: 'Ako ste na tom v láske?', opts: [
    { t: 'Som sám/sama a spokojný/á', e: { C: .05 } },
    { t: 'Zaľúbený/á až po uši', e: { C: .2, I: -.05 } },
    { t: 'V dlhom vzťahu alebo v manželstve', e: { C: .08 } },
    { t: 'Je to komplikované', e: { C: -.18 } }] },
  { id: 'brain', kick: 'Otázka o hlave', title: 'Ako často trénujete hlavu? Knihy, krížovky, šach…', opts: [
    { t: 'Nikdy, na to mám televízor', e: { I: -.12 } },
    { t: 'Občas krížovka v novinách', e: { I: .02 } },
    { t: 'Pravidelne čítam', e: { I: .12 } },
    { t: 'Každý deň, doma som šachový veľmajster', e: { I: .2, C: -.03 } }] },
  { id: 'chrono', kick: 'Otázka o dennom rytme', title: 'Kedy najviac žijete?', opts: [
    { t: 'Ráno, som ranné vtáča', chrono: 'Najlepšie vám to dnes pôjde medzi 7:00 a 10:00.' },
    { t: 'Po obede, keď strávim knedľu', chrono: 'Najlepšie vám to dnes pôjde medzi 13:00 a 15:30.' },
    { t: 'Večer, som sova', chrono: 'Najlepšie vám to dnes pôjde medzi 19:00 a 23:00.' },
    { t: 'Nikdy, ale snažím sa', chrono: 'Stroj nenašiel ani jednu vhodnú hodinu. Skúste aspoň kávu o 10:00.' }] },
  { id: 'job', kick: 'Posledná otázka', title: 'Aké je vaše povolanie?', opts: [
    { t: 'Robotník, remeselník, manuálna práca', w: { F: .5, C: .2, I: .3 }, job: 'robotnik' },
    { t: 'Úradník, kancelária, štempel', w: { F: .15, C: .3, I: .55 }, job: 'urednik' },
    { t: 'Učiteľ, lekár, predavač, služby', w: { F: .25, C: .45, I: .3 }, job: 'sluzby' },
    { t: 'Umelec, tvorca, rojko', w: { F: .15, C: .5, I: .35 }, job: 'umelec' },
    { t: 'Technik, inžinier, programátor', w: { F: .15, C: .25, I: .6 }, job: 'technik' },
    { t: 'Študent', w: { F: .3, C: .3, I: .4 }, job: 'student' },
    { t: 'Dôchodca alebo na voľnej nohe', w: { F: .35, C: .4, I: .25 }, job: 'dochodca' }] }
];

/* ---------------- ikony (vlastné čiarové, 24×24) ---------------- */
const ICONS = {
  sleep: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  move: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12',
  coffee: 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h2a2 2 0 0 1 0 4h-2M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3',
  beer: 'M5 8h10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M5 8a3 3 0 0 1 3-4 3 3 0 0 1 5 0 2.5 2.5 0 0 1 2 4M8.5 12v5.5M11.5 12v5.5',
  stress: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16M11 13v2h2v-2',
  love: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  brain: 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z',
  chrono: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2',
  job: 'M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z',
  soundOn: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  soundOff: 'M4 9h4l5-4v14l-5-4H4zM16 9.5l5 5M21 9.5l-5 5',
  cake: 'M4 20h16v-7H4zM4 16c2 1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4 0M12 13V9M12 6.5v-1',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  counter: 'M3 7h18v10H3zM9 7v10M15 7v10',
  card: 'M6 4h14v16H4V6zM8 9h2M12 9h2M16 9h1M8 13h1M11 13h2M15 13h2',
  pin: 'M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

function biasOf(answers) {
  const bias = { F: 0, C: 0, I: 0 };
  for (const q of QUESTIONS) {
    const i = answers ? answers[q.id] : null;
    if (i == null) continue;
    const o = q.opts[i];
    if (o.e) for (const k in o.e) bias[k] += o.e[k];
  }
  for (const k of CH) bias[k] = Math.round(clamp(bias[k], -.4, .4) * 100) / 100;
  return bias;
}
function derive(u) {
  let w = { F: 1, C: 1, I: 1 }, chrono = null, job = null;
  for (const q of QUESTIONS) {
    const i = u.answers ? u.answers[q.id] : null;
    if (i == null) continue;
    const o = q.opts[i];
    if (o.w) { w = o.w; job = o.job; }
    if (o.chrono) chrono = o.chrono;
  }
  const ws = w.F + w.C + w.I;
  const services = u.services && (u.services.k || u.services.p) ? u.services : { k: true, p: false };
  return { ...u, services, sex: u.sex || 'f', bias: biasOf(u.answers), w: { F: w.F / ws, C: w.C / ws, I: w.I / ws }, chrono, job, birthN: parseISO(u.birth) };
}

/* ---------------- dierny štítok (Hollerithov kód, 80 stĺpcov) ---------------- */
const PC_ROWS = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const pad2 = n => String(n).padStart(2, '0');
function holl(ch) {
  if (/[0-9]/.test(ch)) return [ch];
  const c = ch.charCodeAt(0);
  if (ch >= 'A' && ch <= 'I') return ['12', String(c - 64)];
  if (ch >= 'J' && ch <= 'R') return ['11', String(c - 73)];
  if (ch >= 'S' && ch <= 'Z') return ['0', String(c - 81)];
  return { '.': ['12', '3', '8'], '-': ['11'], '+': ['12', '6', '8'], '/': ['0', '1'] }[ch] || [];
}
// polia: meno 1-24, narodenie 26-33, dotazník 35-43, dnes 45-50, dni 52-57, korekcia 59-72
const PC_FIELDS = [[0, 24, 'PRIJMENI A JMENO'], [25, 33, 'NAROZEN'], [34, 43, 'DOTAZNIK'], [44, 50, 'DNES'], [51, 57, 'DNU'], [58, 72, 'KOREKCE'], [73, 80, 'SLUZBY']];
function cardText(d) {
  const name = ascii(d.name || '').replace(/[^A-Z0-9 .\-]/g, '').padEnd(24).slice(0, 24);
  let birth = ' '.repeat(8), days = ' '.repeat(6);
  if (d.birth) {
    const n = parseISO(d.birth), f = fromN(n);
    birth = pad2(f.d) + pad2(f.m + 1) + f.y;
    days = String(Math.max(0, todayN() - n)).padStart(6, '0');
  }
  const ans = QUESTIONS.map(q => d.answers && d.answers[q.id] != null ? String(d.answers[q.id] + 1) : ' ').join('');
  const t = fromN(todayN()), today = pad2(t.d) + pad2(t.m + 1) + String(t.y).slice(2);
  const b = biasOf(d.answers), sb = x => (x < 0 ? '-' : '+') + pad2(Math.round(Math.abs(x) * 100));
  const kor = Object.keys(d.answers || {}).length ? `F${sb(b.F)} C${sb(b.C)} I${sb(b.I)}` : ' '.repeat(14);
  const sv = d.services || { k: true }, svc = `${sv.k ? 'K' : '-'}${sv.p ? 'P' + (d.sex === 'm' ? 'M' : 'Z') : '--'}`;
  return `${name} ${birth} ${ans} ${today} ${days} ${kor} ${svc}`.padEnd(80).slice(0, 80);
}
function punchSVG(text, prev) {
  const W = 740, H = 318, x0 = 24.5, dx = 8.82, y0 = 60, dy = 21.4, X = c => x0 + c * dx;
  let s = `<svg class="pc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dierny štítok: ${esc(text.replace(/\s+/g, ' ').trim())}">`;
  s += `<path class="pc-body" d="M22 1H${W - 9}q8 0 8 8V${H - 9}q0 8-8 8H9q-8 0-8-8V22Z"/>`;
  s += `<rect class="pc-band" x="1" y="${H - 14}" width="${W - 2}" height="6"/>`;
  for (const [a, b, cap] of PC_FIELDS) {
    if (a) s += `<line class="pc-sep" x1="${X(a) - dx / 2}" y1="22" x2="${X(a) - dx / 2}" y2="${H - 16}"/>`;
    s += `<text class="pc-capt" x="${(X(a) + X(b - 1)) / 2}" y="34">${cap}</text>`;
  }
  for (let c = 0; c < 80; c++) {
    const ch = text[c];
    if (ch !== ' ') s += `<text class="pc-int" x="${X(c)}" y="15">${esc(ch)}</text>`;
    for (let r = 2; r < 12; r++) s += `<text class="pc-dig" x="${X(c)}" y="${y0 + r * dy + 2.2}">${PC_ROWS[r]}</text>`;
  }
  for (let c = 0; c < 80; c++) {
    const fresh = !prev || prev[c] !== text[c];
    for (const r of holl(text[c])) {
      const ri = PC_ROWS.indexOf(r);
      s += `<rect class="hole${fresh && prev ? ' new' : ''}" x="${X(c) - 2.3}" y="${y0 + ri * dy - 6}" width="4.6" height="12" rx=".6"/>`;
    }
  }
  s += `<text class="pc-foot" x="${W - 12}" y="${H - 18}" text-anchor="end">VYPOCETNI STREDISKO · 80 SLOUPCU</text>`;
  return s + '</svg>';
}
const cardPrev = new WeakMap();
function renderCard(el, text) {
  el.innerHTML = punchSVG(text, cardPrev.get(el));
  cardPrev.set(el, text);
}

/* ---------------- biorytmy ---------------- */
const val = (u, ch, t) => Math.sin(2 * Math.PI * t / P[ch]) + u.bias[ch];
function sym(u, ch, t) {
  const a = val(u, ch, t - .5), b = val(u, ch, t + .5);
  if (a >= 0 && b < 0) return 'X';
  if (a < 0 && b >= 0) return '0';
  return a >= 0 ? '*' : '.';
}
const isCrit = s => s === 'X' || s === '0';
function dayState(u, n) {
  const t = n - u.birthN, r = {};
  for (const ch of CH) r[ch] = { v: val(u, ch, t), s: sym(u, ch, t) };
  return r;
}
function overall(u, st) {
  let s = 0;
  for (const ch of CH) s += u.w[ch] * clamp(st[ch].v, -1, 1);
  return Math.round(clamp((s + 1) / 2, 0, 1) * 100);
}

/* ---------------- zvuk ihličkovej tlačiarne (WebAudio) ---------------- */
// Prehliadače povolia zvuk až po prvom kliknutí/dotyku. Preto sa AudioContext „odomkne“ pri prvej interakcii
// a všetko ide cez jeden hlavný zosilňovač s kompresorom (hlasné, ale bez skreslenia).
const soundOn = true;   // zvuk je vždy zapnutý
let AC = null, MASTER = null;
function ac() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      MASTER = AC.createGain(); MASTER.gain.value = 1;
      MASTER.connect(comp).connect(AC.destination);
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC && AC.state !== 'closed' ? AC : null;
}
function unlockAudio() {
  const a = ac(); if (!a) return;
  const s = a.createBufferSource(); s.buffer = a.createBuffer(1, 1, 22050); s.connect(a.destination); s.start(0); // iOS
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

// jeden riadok ihličkovej tlačiarne: rýchle údery ihiel (ra-ta-ta-ta) a posun papiera
function printerBurst(chars) {
  if (!soundOn) return;
  const a = ac(); if (!a || a.state !== 'running') return;
  const hits = Math.max(6, Math.min(48, Math.round(chars * .9))), sr = a.sampleRate;
  const len = hits * .0105 + .03, buf = a.createBuffer(1, Math.ceil(sr * len), sr), d = buf.getChannelData(0);
  let t = 0;
  for (let h = 0; h < hits; h++) {
    const start = Math.floor(t * sr), amp = .75 + Math.random() * .25, dec = sr * .0022;
    for (let i = 0; i < sr * .006 && start + i < d.length; i++) d[start + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / dec);
    t += .0085 + Math.random() * .004;
  }
  const src = a.createBufferSource(); src.buffer = buf;
  const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
  const pk = a.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 3200; pk.Q.value = 1.2; pk.gain.value = 8;
  const g = a.createGain(); g.gain.value = .9;
  src.connect(hp).connect(pk).connect(g).connect(MASTER); src.start();
  // posun papiera: tupé „vrrrm“
  const t0 = a.currentTime + len, o = a.createOscillator(), og = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t0); o.frequency.linearRampToValueAtTime(60, t0 + .07);
  og.gain.setValueAtTime(.0001, t0); og.gain.exponentialRampToValueAtTime(.35, t0 + .01); og.gain.exponentialRampToValueAtTime(.0001, t0 + .09);
  o.connect(og).connect(MASTER); o.start(t0); o.stop(t0 + .1);
}
function beep(f = 880, d = .06) {
  if (!soundOn) return;
  const a = ac(); if (!a || a.state !== 'running') return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime;
  o.type = 'square'; o.frequency.value = f;
  g.gain.setValueAtTime(.18, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(g).connect(MASTER); o.start(); o.stop(t0 + d + .01);
}
// Vloženie štítku do stroja: spojenie ako cez vytáčaný modem.
// Tónová voľba → tón ústredne 2100 Hz → prepínanie tónov (FSK) → „bong“ → šum a škrípanie pri dohadovaní rýchlosti → dátový šum.
function modemSound() {
  const a = ac(); if (!a) return;
  const go = () => {
    const t0 = a.currentTime + .05, sr = a.sampleRate, out = a.createGain();
    out.gain.value = .55; out.connect(MASTER);
    const tone = (f, s, e, g = .3, type = 'sine') => {
      const o = a.createOscillator(), v = a.createGain();
      o.type = type; o.frequency.value = f;
      v.gain.setValueAtTime(0, s); v.gain.linearRampToValueAtTime(g, s + .005); v.gain.setValueAtTime(g, e - .005); v.gain.linearRampToValueAtTime(0, e);
      o.connect(v).connect(out); o.start(s); o.stop(e + .01); return o;
    };
    const noise = (s, e, f, q, g) => {
      const b = a.createBuffer(1, Math.ceil(sr * (e - s)), sr), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = a.createBufferSource(); n.buffer = b;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const v = a.createGain(); v.gain.setValueAtTime(g, s); v.gain.setValueAtTime(g, e - .02); v.gain.linearRampToValueAtTime(0, e);
      n.connect(bp).connect(v).connect(out); n.start(s); return { bp, v };
    };
    // 1) tónová voľba (DTMF), 7 číslic
    const DTMF = [[941, 1336], [697, 1209], [770, 1336], [852, 1477], [697, 1336], [770, 1209], [852, 1336]];
    let t = t0;
    for (const [lo, hi] of DTMF) { tone(lo, t, t + .07, .22); tone(hi, t, t + .07, .22); t += .11; }
    // 2) tón ústredne / odpoveď protistrany 2100 Hz s preklopením fázy
    t += .12; tone(2100, t, t + .42, .25); tone(2100, t + .45, t + .8, .25); t += .85;
    // 3) FSK: rýchle prepínanie dvoch dvojíc tónov (V.21)
    const f1 = a.createOscillator(), f2 = a.createOscillator(), fv = a.createGain();
    f1.type = f2.type = 'sine'; fv.gain.setValueAtTime(0, t); fv.gain.linearRampToValueAtTime(.16, t + .01);
    for (let k = 0; k < 110; k++) {
      const tk = t + k * .0045;
      f1.frequency.setValueAtTime(Math.random() < .5 ? 980 : 1180, tk);
      f2.frequency.setValueAtTime(Math.random() < .5 ? 1650 : 1850, tk);
    }
    const fe = t + .5; fv.gain.setValueAtTime(.16, fe - .01); fv.gain.linearRampToValueAtTime(0, fe);
    f1.connect(fv); f2.connect(fv); fv.connect(out); f1.start(t); f2.start(t); f1.stop(fe + .02); f2.stop(fe + .02); t = fe;
    // 4) „bong“
    tone(1200, t, t + .16, .22); tone(2400, t, t + .16, .1); t += .2;
    // 5) škrípanie: šum s posuvným filtrom a pulzujúcou hlasitosťou
    const sc = noise(t, t + 1.15, 1800, 3, .9);
    sc.bp.frequency.setValueAtTime(1800, t); sc.bp.frequency.linearRampToValueAtTime(2600, t + .4);
    sc.bp.frequency.setValueAtTime(1000, t + .45); sc.bp.frequency.linearRampToValueAtTime(3000, t + 1.1);
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 28; lg.gain.value = .45;
    lfo.connect(lg).connect(sc.v.gain); lfo.start(t); lfo.stop(t + 1.15);
    tone(1800, t + .1, t + .45, .08, 'square'); tone(600, t + .55, t + .9, .07, 'square');
    t += 1.15;
    // 6) dátový šum (zhasína)
    const hiss = noise(t, t + .7, 2200, .7, .35);
    hiss.v.gain.setValueAtTime(.35, t); hiss.v.gain.linearRampToValueAtTime(0, t + .7);
  };
  if (a.state === 'running') go(); else a.resume().then(go).catch(() => { });
}

/* ---------------- stav aplikácie ---------------- */
let U = null;               // odvodený aktuálny štítok
let reg = null;             // stav dotazníka

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
  const has = !!U && (id === 'scr-dash' || id === 'scr-machine' || (id === 'scr-reg' && reg && reg.editing));
  $('#newBtn').classList.toggle('hidden', !has);
  $('#whoami').classList.toggle('hidden', !has);
  if (U) $('#whoami').innerHTML = icon('card') + ' ' + esc(U.name);
  window.scrollTo(0, 0);
}

/* ================= ÚVOD (bez prihlasovania) ================= */
function chosenServices() {
  const sv = { k: $('#svcK').checked, p: $('#svcP').checked };
  $('#svcErr').textContent = sv.k || sv.p ? '' : 'Zaškrtněte aspoň jednu službu.';
  return sv.k || sv.p ? sv : null;
}
$('#toRegister').addEventListener('click', () => { const sv = chosenServices(); if (sv) startReg(false, sv); });
$('#demoBtn').addEventListener('click', () => {
  const sv = chosenServices(); if (!sv) return;
  U = derive({ name: 'Koudelka František', birth: KOUDELKA_BIRTH, answers: {}, demo: true, services: sv, sex: 'f' });
  runMachine(() => showDash(false));
});

/* ================= REGISTRÁCIA / DOTAZNÍK ================= */
function startReg(editing, services) {
  const sv = editing ? U.services : services;
  reg = {
    editing,
    step: 0,
    data: editing ? { name: U.name, birth: U.birth, answers: { ...(U.answers || {}) }, services: sv, sex: U.sex, gender: U.gender || null } : { name: '', birth: '', answers: {}, services: sv, sex: null, gender: null },
    steps: [...(editing ? [] : ['account']), 'birth', 'gender', ...(sv.p ? ['seek'] : []), ...(sv.k ? QUESTIONS.map(q => q.id) : [])]
  };
  show('scr-reg');
  renderStep();
}
function renderStep() {
  const id = reg.steps[reg.step], box = $('#regStep');
  $('#regErr').textContent = '';
  updRegCard();
  $('#regBack').textContent = reg.step === 0 ? (reg.editing ? 'Zrušiť' : 'Späť na úvod') : 'Späť';
  $('#regNext').textContent = reg.step === reg.steps.length - 1 ? 'Hoď ho do stroja!' : 'Ďalej';

  if (id === 'account') {
    box.innerHTML = `<div class="q-kicker">Nový štítok</div><h2 class="q-title">Kto ste, súdruh občan?</h2>
      <label>Meno a priezvisko súdruha<input id="rName" type="text" maxlength="40" autocomplete="name" placeholder="napr. František Koudelka" value="${esc(reg.data.name)}"></label>`;
    $('#rName').focus();
    $('#rName').addEventListener('input', () => { reg.data.name = $('#rName').value; updRegCard(); });
  } else if (id === 'birth') {
    box.innerHTML = `<div class="q-kicker">Základný údaj</div><h2 class="q-title">Kedy ste sa narodili, súdruh?</h2>
      ${datePicker('rBirth', reg.data.birth)}
      <div id="birthHint" class="birth-hint"></div>`;
    const upd = () => {
      const v = dateValue('rBirth');
      if (!v) { $('#birthHint').textContent = ''; return; }
      if (v === 'invalid') { $('#birthHint').textContent = '> CHYBA: TAKY DEN V KALENDARI NENI'; return; }
      const n = parseISO(v), t = todayN() - n;
      $('#birthHint').textContent = t >= 0 ? `> NARODENÝ ${DOW_LOC[fromN(n).w].toUpperCase()}, DNES ${nf(t)}. DEŇ ŽIVOTA` : '> CHYBA: BUDÚCNOSŤ ZATIAĽ NEPOČÍTAME';
      if (t >= 0) { reg.data.birth = v; updRegCard(); }
    };
    $('#rBirth').addEventListener('change', upd); upd();
  } else if (id === 'gender') {
    const cur = reg.data.gender, opts = [['m', 'Muž'], ['f', 'Žena']];
    box.innerHTML = `<div class="q-kicker">Základný údaj · ${reg.step + 1}/${reg.steps.length}</div><h2 class="q-title">${icon('card', 'q-ic')}Ste muž, alebo žena, súdruh?</h2>
      <div class="opts">${opts.map(([v, t], i) => `<button type="button" class="opt ${cur === v ? 'sel' : ''}" data-v="${v}"><span class="code">${i + 1}</span>${t}</button>`).join('')}</div>
      <p class="kbd-hint">Odpoveď vyberiete aj klávesom 1 alebo 2.</p>`;
    box.querySelector('.opts').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      reg.data.gender = b.dataset.v;
      if (!reg.data.sex) reg.data.sex = b.dataset.v === 'm' ? 'f' : 'm';   // predvolený výber partnera
      box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
      beep(660, .04);
      setTimeout(() => { if (reg && reg.steps[reg.step] === 'gender') nextStep(); }, 260);
    });
  } else if (id === 'seek') {
    const cur = reg.data.sex, opts = [['f', 'Partnerku (ženu)'], ['m', 'Partnera (muže)']];
    box.innerHTML = `<div class="q-kicker">Výběr osudového partnera · ${reg.step + 1}/${reg.steps.length}</div><h2 class="q-title">${icon('love', 'q-ic')}Koho má stroj hledat?</h2>
      <div class="opts">${opts.map(([v, t], i) => `<button type="button" class="opt ${cur === v ? 'sel' : ''}" data-v="${v}"><span class="code">${i + 1}</span>${t}</button>`).join('')}</div>
      <p class="kbd-hint">Odpověď vyberete i klávesou 1 nebo 2.</p>`;
    box.querySelector('.opts').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      reg.data.sex = b.dataset.v; updRegCard();
      box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
      beep(660, .04);
      const same = reg.data.gender && reg.data.gender === b.dataset.v;
      let note = box.querySelector('.birth-hint');
      if (!note) { note = document.createElement('div'); note.className = 'birth-hint'; box.appendChild(note); }
      note.textContent = same ? SAME_SEX_NOTES[fnv(nameSeed(reg.data.name || '') + reg.data.birth) % SAME_SEX_NOTES.length] : '';
      setTimeout(() => { if (reg && reg.steps[reg.step] === 'seek') nextStep(); }, same ? 3200 : 260);
    });
  } else {
    const q = QUESTIONS.find(x => x.id === id), cur = reg.data.answers[id];
    box.innerHTML = `<div class="q-kicker">${esc(q.kick)} · ${reg.step + 1}/${reg.steps.length}</div><h2 class="q-title">${icon(q.id, 'q-ic')}${esc(q.title)}</h2>
      <div class="opts">${q.opts.map((o, i) => `<button type="button" class="opt ${cur === i ? 'sel' : ''}" data-i="${i}"><span class="code">${i + 1}</span>${esc(o.t)}</button>`).join('')}</div>
      <p class="kbd-hint">Odpoveď vyberiete aj klávesom 1 až ${q.opts.length}. Backspace vás vráti späť.</p>`;
    box.querySelector('.opts').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      reg.data.answers[id] = +b.dataset.i;
      $('#regErr').textContent = ''; box.querySelector('.opts').classList.remove('need');
      updRegCard();
      box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
      beep(660, .04);
      setTimeout(() => { if (reg && reg.steps[reg.step] === id) nextStep(); }, 260);
    });
  }
}
const SAME_SEX_NOTES = [
  '> STROJ ZAZNAMENAL NESTANDARDNI OBJEDNAVKU. PREPOCITAVAM... SCHVALENO. LASKA NEZNA NORMU.',
  '> ZVLASTNI PRANI PRIJATO. REFERENT SE ZACERVENAL, STROJ NE.',
  '> FORMULAR TAKOVOU KOLONKU NEMA. STROJ JI DOPSAL PROPISKOU.',
  '> VEDOUCI STREDISKA NESOUHLASI. STROJ HO PREHLASOVAL 1:0.'
];
function updRegCard() { if (reg) renderCard($('#regCard'), cardText(reg.data)); }

// výber dátumu po slovensky: deň / mesiac slovom / rok (namiesto „dd/mm/yyyy“ z prehliadača)
function datePicker(id, iso) {
  const [y, m, d] = iso ? iso.split('-').map(Number) : [0, 0, 0], maxY = fromN(todayN()).y;
  const opt = (v, t, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${t}</option>`;
  let days = '', months = '', years = '';
  for (let i = 1; i <= 31; i++) days += opt(i, i + '.', i === d);
  MONTHS_SK.forEach((n, i) => { months += opt(i + 1, n, i + 1 === m); });
  for (let i = maxY; i >= 1900; i--) years += opt(i, i, i === y);
  return `<div class="date3" id="${id}" role="group" aria-label="Dátum narodenia">
    <label>Deň<select data-p="d">${opt('', 'deň', !d)}${days}</select></label>
    <label>Mesiac<select data-p="m">${opt('', 'mesiac', !m)}${months}</select></label>
    <label>Rok<select data-p="y">${opt('', 'rok', !y)}${years}</select></label>
  </div>`;
}
// '' = nevyplnené, 'invalid' = neexistujúci deň (napr. 31. február), inak RRRR-MM-DD
function dateValue(id) {
  const box = $('#' + id), g = p => +box.querySelector(`[data-p="${p}"]`).value;
  const d = g('d'), m = g('m'), y = g('y');
  if (!d || !m || !y) return '';
  if (new Date(Date.UTC(y, m - 1, d)).getUTCDate() !== d) return 'invalid';
  return `${y}-${pad2(m)}-${pad2(d)}`;
}
function setDate(id, iso) {
  const [y, m, d] = iso.split('-').map(Number), box = $('#' + id);
  box.querySelector('[data-p="d"]').value = d; box.querySelector('[data-p="m"]').value = m; box.querySelector('[data-p="y"]').value = y;
}
function nextStep() {
  // chyba musí byť dobre viditeľná aj na mobile: zvýraznené hlásenie, zatrasenie, posun k otázke
  const id = reg.steps[reg.step], err = m => {
    const e = $('#regErr'), opts = document.querySelector('#regStep .opts');
    e.textContent = m; e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake');
    if (opts) { opts.classList.remove('need'); void opts.offsetWidth; opts.classList.add('need'); opts.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    if (navigator.vibrate) navigator.vibrate(120);
    beep(220, .25);
  };
  if (id === 'account') {
    const name = $('#rName').value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return err('Zadajte meno, aspoň 2 znaky.');
    reg.data.name = name;
  } else if (id === 'birth') {
    const v = dateValue('rBirth');
    if (!v) return err('Vyberte deň, mesiac aj rok narodenia.');
    if (v === 'invalid') return err('Taký dátum neexistuje, skontrolujte deň a mesiac.');
    const n = parseISO(v);
    if (n > todayN()) return err('Ešte ste sa nenarodili? Stroj to neberie.');
    if (n < dn(1900, 0, 1)) return err('Stroj počíta od roku 1900.');
    reg.data.birth = v;
  } else if (id === 'gender') { if (!reg.data.gender) return err('Vyberte, či ste muž, alebo žena.'); }
  else if (id === 'seek') { if (!reg.data.sex) return err('Vyberte, koho má stroj hledat.'); }
  else if (reg.data.answers[id] == null) return err('Vyberte jednu možnosť.');

  if (reg.step < reg.steps.length - 1) { reg.step++; renderStep(); return; }
  finishReg();
}
// súhrn štítku pre záznam (ukladá sa len so súhlasom návštevníka)
function cardSummary(u) {
  const st = dayState(u, todayN()), sv = u.services;
  const m = sv.p ? matchData(u, u.sex) : null, ok = m && !m.minor;
  return {
    name: u.name.slice(0, 60), birth: u.birth, age: ageYears(u.birthN, todayN()),
    services: sv.k && sv.p ? 'K+P' : sv.k ? 'K' : 'P', sex: sv.p ? u.sex : '',
    answers: QUESTIONS.map(q => u.answers && u.answers[q.id] != null ? u.answers[q.id] + 1 : '-').join(''),
    today: CH.map(ch => ch + st[ch].s).join(' '), index: sv.k ? overall(u, st) : null,
    partner: ok ? m.name : '', partnerBirth: ok ? isoN(m.c.b) : '', partnerCity: ok ? m.city : '', match: ok ? m.c.p.T : null
  };
}
function finishReg() {
  const d = reg.data, demo = reg.editing && U.demo;
  const card = { name: d.name, birth: d.birth, answers: d.services.k ? d.answers : {}, services: d.services, sex: d.sex || 'f', gender: d.gender || '' };
  U = derive(demo ? { ...card, demo: true } : card);
  // len aby sa výsledok nestratil po obnovení stránky; žiadne účty ani heslá
  if (!demo) store.set(K_LAST, card);
  if (!demo && window.kgTrack) window.kgTrack.card(cardSummary(U));
  reg = null;
  runMachine(() => showDash(false));
}
$('#regNext').addEventListener('click', nextStep);
$('#regBack').addEventListener('click', () => {
  if (reg.step === 0) { const ed = reg.editing; reg = null; ed ? showDash(false) : show('scr-login'); return; }
  reg.step--; renderStep();
});
document.addEventListener('keydown', e => {
  if (!reg || $('#scr-reg').classList.contains('hidden')) return;
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); nextStep(); return; }
  // v dotazníku: klávesy 1–7 vyberú odpoveď (rovnaký kód, aký sa dieruje do štítku), Backspace = späť
  if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
  const opt = document.querySelectorAll('#regStep .opt')[+e.key - 1];
  if (/^[1-9]$/.test(e.key) && opt) { e.preventDefault(); opt.click(); }
  else if (e.key === 'Backspace' && reg.step > 0) { e.preventDefault(); $('#regBack').click(); }
});

/* ================= STROJ: štítok dnu, kondiciogram von ================= */
let machineTimer = null, machineDone = null, machineTO = [];
function machineStop() {
  clearInterval(machineTimer); machineTimer = null;
  machineTO.forEach(clearTimeout); machineTO = [];
  const p = $('#paper0'); printJobs.set(p, (printJobs.get(p) || 0) + 1);
  $('#machine').classList.remove('busy', 'shake');
}
function nextMonths(n) {
  const f = fromN(todayN()), out = [];
  for (let i = 0; i < n; i++) out.push({ y: f.y + Math.floor((f.m + i) / 12), m: (f.m + i) % 12 });
  return out;
}
function ttyShow(lines, cursor = true) {
  $('#tty').innerHTML = lines.map(esc).join('<br>') + (cursor ? '<span class="cur">█</span>' : '');
}
function runMachine(done) {
  machineStop();
  show('scr-machine');
  $('#lamps').innerHTML = Array.from({ length: 32 }, (_, i) =>
    `<i class="${i % 3 ? '' : 'g'}" style="animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(0.5 + Math.random()).toFixed(2)}s"></i>`).join('');
  const mc = $('#machCard'); cardPrev.delete(mc); renderCard(mc, cardText(U));
  $('#cardIn').classList.remove('feeding', 'gone');
  $('#paperOut').classList.remove('feed'); $('#paper0').innerHTML = '';
  $('#feedBtn').disabled = false;
  $('#toDash').classList.add('hidden'); $('#machPrint').classList.add('hidden');
  ttyShow(['SAMOCINNY POCITAC - PRIPRAVEN', `STITEK: ${ascii(U.name)}`, '', 'VLOZTE STITEK DO STROJE.', 'STISKNETE VELKE TLACITKO.']);
  machineDone = () => { const f = done; machineDone = null; machineStop(); f(); };
}
$('#feedBtn').addEventListener('click', () => {
  if (!machineDone) return;
  const btn = $('#feedBtn'), mach = $('#machine');
  btn.disabled = true; modemSound();
  $('#cardIn').classList.add('feeding');
  mach.classList.add('busy', 'shake');
  machineTO.push(setTimeout(() => { $('#cardIn').classList.add('gone'); mach.classList.remove('shake'); printerBurst(30); }, 1500));
  const t = todayN() - U.birthN, b = U.bias, sg = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  const msgs = [
    'SAMOCINNY POCITAC - PRIPRAVEN',
    `CTU STITEK ........ ${ascii(U.name)}`,
    `DATUM NAROZENI .... ${fmt(U.birthN)}`,
    `DNESNI DATUM ...... ${fmt(todayN())}`,
    `PROZITYCH DNU ..... ${t}`,
    'CYKLY 23 / 28 / 33  OK',
    ...(U.services.k ? [`KOREKCE ........... F ${sg(b.F)} C ${sg(b.C)} I ${sg(b.I)}`] : []),
    ...(U.services.p ? [`HLEDAM PROTEJSEK .. ROCNIKY ${fromN(U.birthN).y - 12}-${fromN(U.birthN).y + 12}`, 'OSUDOVY PROTEJSEK NALEZEN.'] : []),
    U.services.k && U.services.p ? 'TISKNU KONDICIOGRAM A SEZNAMKU ...' : U.services.k ? 'TISKNU KONDICIOGRAM ...' : 'TISKNU VYSLEDEK SEZNAMKY ...'
  ];
  let i = 0;
  machineTO.push(setTimeout(() => {
    machineTimer = setInterval(() => {
      if (i < msgs.length) { ttyShow(msgs.slice(0, ++i)); return; }   // počas hlásení znie modem
      clearInterval(machineTimer); machineTimer = null;
      $('#paperOut').classList.add('feed');
      const months = U.demo ? [0, 1, 2, 3].map(m => ({ y: 1973, m })) : nextMonths(3);
      printTo($('#paper0'), U, months, true, {
        follow: true,
        onDone: () => {
          mach.classList.remove('busy');
          ttyShow([...msgs.slice(-3), 'HOTOVO. ODTRHNETE PAPIR.']);
          $('#toDash').classList.remove('hidden'); $('#machPrint').classList.remove('hidden');
          $('#toDash').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    }, 300);
  }, 1300));
});
$('#toDash').addEventListener('click', () => { if (machineDone) machineDone(); });

/* ================= ÚVOD: REKLAMNÉ TITULKY (česky, štýl 70. rokov) ================= */
const CREDITS = [
  ['SOUDRUZI A SOUDRUŽKY!', 'NECHTE SI VYPOČÍTAT KONDICI!'],
  ['VÍTE, KDY MÁTE KRITICKÝ DEN?', 'STROJ TO VÍ ZA VÁS!'],
  ['S KONDICIOGRAMEM', 'SPLNÍTE NORMU NA 120 %'],
  ['KONEC ÚRAZŮM NA PRACOVIŠTI!', 'ZNÁTE SVÉ DNY X?'],
  ['VĚDECKY. PŘESNĚ. ZDARMA.', 'KONDICIOGRAM PRO KAŽDOU RODINU'],
  ['V DEN OŠIDNÝ NEJEZDĚTE K TCHYNI', 'STROJ VÁS VČAS VAROVAL'],
  ['NOVINKA VÝPOČETNÍHO STŘEDISKA', 'SAMOČINNÝ POČÍTAČ SPC-74'],
  ['PODEPISUJTE JEN VE DNY S HVĚZDIČKOU', 'KONDICIOGRAM VÁM ŘEKNE KDY'],
  ['LÁSKA PODLE PLÁNU', 'OSUDOVÝ PARTNER DO PĚTI MINUT'],
  ['BEZ FRONTY. BEZ PŘÍDĚLU. BEZ PROTEKCE.', 'STAČÍ DATUM NAROZENÍ'],
  ['DOPORUČENO ZÁVODNÍM LÉKAŘEM', 'VÁŠ RÁDCE NA CELÝ ROK'],
  ['ELEKTRONKY UŽ JSOU NAHŘÁTÉ', 'VYPLŇTE DĚRNÝ ŠTÍTEK JEŠTĚ DNES!']
];
(function credits() {
  const box = $('#credits'); if (!box) return;
  let i = 0;
  setInterval(() => {
    if ($('#scr-login').classList.contains('hidden') || document.hidden) return;
    box.classList.add('out');
    setTimeout(() => { i = (i + 1) % CREDITS.length; $('#crS').textContent = CREDITS[i][0]; $('#crB').textContent = CREDITS[i][1]; box.classList.remove('out'); }, 460);
  }, 6500);   // pomaly, aby sa slogan stihol prečítať
})();

/* ================= ÚVOD: SAMOČINNÝ POČÍTAČ SPC-74 POČÍTA UKÁŽKY ================= */
// obrazovka vypíše výpočet pre náhodný dátum narodenia (skutočné biorytmy na dnešok), tlačiareň ho potom vytlačí
(function pcDemo() {
  const scr = $('#pcScreen'), pap = $('#pcPaper');
  if (!scr || !pap) return;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const advice = st => {
    if (st.F.s === 'X') return 'DNES NERIDTE AUTO.';
    if (st.C.s === 'X') return 'VYHNETE SE TCHYNI.';
    if (st.I.s === 'X') return 'DNES NIC NEPODEPISOVAT.';
    const pool = CH.some(ch => st[ch].s === '0') ? ['POZOR NA SCHODY.', 'MLCET JE ZLATO.', 'JEDNO PIVO, NE VIC.', 'DNES RADEJI NIC NESLIBUJTE.']
      : CH.every(ch => st[ch].s === '*') ? ['VHODNY DEN NA RANDE.', 'KUPTE KVETINY.', 'POZADEJTE O PRIDANI.', 'DNES VAM TO MYSLI.']
      : ['ZACNETE DIETU ZITRA.', 'SEF MA DNES PRAVDU.', 'DNES STACI NEVYCNIVAT.', 'OBED VAS ZACHRANI.'];
    return pool[rnd(0, pool.length - 1)];
  };
  const dots = (label, v, w) => label + ' ' + '.'.repeat(Math.max(2, w - label.length - v.length - 2)) + ' ' + v;
  // servisné hlásenia stroja, striedajú sa s výpočtami; riadky začínajúce „!“ blikajú ako varovanie
  const SYS = [
    ['!!!! VAROVANI !!!!', '', 'PREHRIVANI ELEKTRONKY EP-17', dots('TEPLOTA', '87 C', 26), '', 'DOPORUCUJI VYMENIT', 'ELEKTRONKU PRI PRISTI', 'SMENE UDRZBY.'],
    ['> AUTOTEST PAMETI...', dots('FERITOVA PAMET', '16 KB', 26), dots('VADNE BUNKY', '3', 26), dots('STAV', 'VYHOVUJE', 26), '', dots('CTECKA STITKU', 'OK', 26), dots('DERNA PASKA', '78 %', 26), '', 'SYSTEM PRIPRAVEN.'],
    ['!POZOR: DOCHAZI PASKA', '', dots('ZBYVA', '12 M', 22), 'DOPLNTE ROLI C. 4', 'ZE SKLADU MATERIALU.', '', 'ZADANKU PODEPISE', 'VEDOUCI STREDISKA.'],
    ['!KOLISANI NAPETI V SITI', '', dots('NAPETI', '198 V', 24), dots('STABILIZATOR', 'ZAPNUT', 24), '', 'NEZAPINEJTE VARIC', 'V KANCELARI SEFA.'],
    ['> STATISTIKA SMENY', '', dots('ZPRACOVANO STITKU', '1 274', 27), dots('KRITICKYCH DNU', '318', 27), dots('OSUDOVYCH PAROVANI', '42', 27), dots('PLNENI PLANU', '104 %', 27), '', 'CEST PRACI!'],
    ['!CHYBA 1F: ZASEKNUTY STITEK', '', 'OTEVRETE KRYT C. 2', 'A OPATRNE VYTAHNETE', 'STITEK PINZETOU.', '', '!NEPOUZIVAT NUZ NA CHLEBA!'],
    ['> PLANOVANA UDRZBA...', dots('MAZANI CIVEK', 'OK', 26), dots('CISTENI HLAV', 'OK', 26), dots('KALIBRACE BIORYTMU', 'OK', 26), '', 'DALSI REVIZE ZA 30 DNI,', 'NEJLEPE V DEN S HVEZDICKOU.'],
    ['!VAROVANI: VLHKOST 91 %', '', 'HROZI KONDENZACE', 'NA RELE K-12.', '', 'OTEVRETE OKNO.', 'ZAVRETE TERMOSKU.'],
    ['!PREPETI NA ZDROJI Z-3', dots('POJISTKA 6,3 A', '?', 24), '', 'DOPORUCUJI VYMENIT', 'POJISTKU.', '', '!NEDRATOVAT!'],
    ['> SPOJENI S USTREDNOU...', dots('MODEM 300 BAUD', 'OK', 26), 'DOTAZ NA DATABAZI OBCANU', 'CEKAM NA ODPOVED...', '', 'ODPOVED: NEVIM.', 'OPAKUJI DOTAZ ZITRA.'],
    ['!PAPIR V TISKARNE DOCHAZI', '', dots('ZBYVA', '40 LISTU', 24), 'DODAVKA DO SKLADU', 'V PRISTI PETILETCE.'],
    ['> PROVOZNI DENIK SPC-74', dots('PROVOZNI HODINY', '18 422', 26), dots('PORUCH TENTO MESIC', '7', 26), dots('Z TOHO VINOU OBSLUHY', '7', 26), '', 'OBSLUHA BYLA UPOZORNENA.'],
    ['!VENTILATOR V-2 STOJI', '', 'CHLAZENI NEDOSTATECNE.', 'OBSLUHA AT FOUKA', 'DO MRIZKY C. 3', 'AZ DO ODVOLANI.'],
    ['!NEOPRAVNENY PRISTUP', '', 'NEKDO VLOZIL DO CTECKY', 'LISTEK Z JIDELNY.', '', 'STITEK VRACEN.', 'KNEDLIKY VYDANY NEBUDOU.']
  ];
  let sysOrder = [], sysI = 0;
  const nextSys = () => {
    if (sysI >= sysOrder.length) { sysOrder = SYS.map((_, k) => k).sort(() => Math.random() - .5); sysI = 0; }
    return SYS[sysOrder[sysI++]];
  };
  // vypíše riadky znak po znaku; riadky s „!“ na konci blikajú
  async function typeLines(lines) {
    let out = '';
    for (const raw of lines) {
      const l = raw.replace(/^!/, '');
      for (let i = 1; i <= l.length; i++) { scr.innerHTML = esc(out + l.slice(0, i)) + '<span class="cur">█</span>'; await wait(22); }
      out += l + '\n'; await wait(l ? 90 : 40);
    }
    return out;
  }
  async function sysScreen() {
    const lines = nextSys();
    await typeLines(lines);
    scr.innerHTML = lines.map(raw => raw.startsWith('!') ? `<span class="blink">${esc(raw.slice(1))}</span>` : esc(raw)).join('\n') + '\n<span class="cur">_</span>';
    if (lines.some(l => l.startsWith('!'))) beep(880, .12);
    await wait(6500);
  }
  (async function loop() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    let first = true;
    for (;;) {
      if (document.hidden || $('#scr-login').classList.contains('hidden')) { await wait(1500); continue; }
      if (!first && Math.random() < .55) { await sysScreen(); continue; }   // medzi výpočty vloží servisné hlásenie
      const birth = first ? parseISO(KOUDELKA_BIRTH) : dn(rnd(1935, 2004), rnd(0, 11), rnd(1, 28));
      first = false;
      const who = { birthN: birth, bias: { F: 0, C: 0, I: 0 } }, st = dayState(who, todayN()), tip = advice(st);
      const lines = [
        '> VYPOCET PROBIHA...',
        dots('NAROZEN', fmt(birth), 26), '',
        dots('FYZICKY', st.F.s, 20), dots('CITOVY', st.C.s, 20), dots('INTELEKT', st.I.s, 20), '',
        'STROJ DOPORUCUJE:'
      ];
      scr.innerHTML = ''; pap.textContent = '';
      const out = await typeLines(lines);
      scr.innerHTML = esc(out) + `<span class="box">${esc(tip)}</span> <span class="cur">_</span>`;
      await wait(600);
      // tlačiareň: rovnaké údaje na papier, riadok po riadku
      const p = ['KONDICIOGRAM', '-'.repeat(18), 'DATUM: ' + fmt(todayN()), 'NAR.:  ' + fmt(birth), '-'.repeat(18),
        dots('FYZICKY', st.F.s, 18), dots('CITOVY', st.C.s, 18), dots('INTELEKT', st.I.s, 18), '-'.repeat(18), 'STROJ DOPORUCUJE:'];
      const words = tip.split(' '); let row = '';
      for (const w of words) { if ((row + ' ' + w).trim().length > 18) { p.push(row.trim()); row = ''; } row += ' ' + w; }
      p.push(row.trim());
      for (const l of p) { pap.textContent += l + '\n'; await wait(110); }
      await wait(7000);
    }
  })();
})();

/* ================= VÝBĚR OSUDOVÉHO PARTNERA (česky; jména, města a obce slovensky) ================= */
// seznamy jmen, míst, povolání, zálib, inzerátů, milostného provozu a hlášek stroje jsou v names.js
const ZODIAC = [[120, 'Kozoroh'], [219, 'Vodnář'], [321, 'Ryby'], [420, 'Beran'], [521, 'Býk'], [621, 'Blíženci'], [723, 'Rak'], [823, 'Lev'], [923, 'Panna'], [1023, 'Váhy'], [1122, 'Štír'], [1222, 'Střelec'], [1300, 'Kozoroh']];
const zodiac = n => { const f = fromN(n), k = (f.m + 1) * 100 + f.d; return ZODIAC.find(z => k < z[0])[1]; };
const DOW_CZ = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const MONTHS_CZ_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const fmtLongCz = n => { const f = fromN(n); return `${DOW_CZ[f.w]} ${f.d}. ${MONTHS_CZ_GEN[f.m]}`; };
const yearsCz = a => a === 1 ? 'rok' : (a >= 2 && a <= 4 ? 'roky' : 'let');
const CH_NAME_CZ = { F: 'Fyzický', C: 'Citový', I: 'Intelektový' };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const compatPct = d => { const p = {}; for (const ch of CH) p[ch] = Math.round((Math.cos(2 * Math.PI * d / P[ch]) + 1) / 2 * 100); p.T = Math.round((p.F + p.C + p.I) / 3); return p; };

// jediný osudový partner: datum narození ±12 let (věk 18 až 90) s nejlepší shodou všech tří cyklů
function bestCandidate(u) {
  const adult = todayN() - 18 * 365.25, oldest = todayN() - 90 * 365.25;
  let best = null;
  for (let d = -4383; d <= 4383; d++) {
    if (Math.abs(d) < 200) continue;
    const b = u.birthN + d;
    if (b > adult || b < oldest) continue;
    const p = compatPct(d);
    if (!best || p.T > best.p.T) best = { b, p };
  }
  return best;
}
// všechno o partnerovi na jednom místě; stejné jméno + datum + pohlaví = vždy stejný výsledek
const matchCache = {};
function matchData(u, sex) {
  const key = nameSeed(u.name) + u.birth + sex;
  if (matchCache[key]) return matchCache[key];
  if (ageYears(u.birthN, todayN()) < 18) return (matchCache[key] = { minor: true });   // stroj páruje len plnoletých
  const c = bestCandidate(u);
  if (!c) return (matchCache[key] = null);
  const r = rng(fnv(key + ':0')), N = NAMES[sex];
  const name = `${pick(r, N.first)} ${pick(r, N.last)}`, city = pick(r, NAMES.cities), job = pick(r, N.job);
  const hob = [pick(r, NAMES.hobby)], h2 = pick(r, NAMES.hobby); if (h2 !== hob[0]) hob.push(h2);
  const ad = pick(r, NAMES.ads), love = pick(r, N.love);
  const robot = []; while (robot.length < 3) { const x = pick(r, NAMES.robot); if (!robot.includes(x)) robot.push(x); }
  const face = pick(r, sex === 'f' ? ['tvar-z1', 'tvar-z2'] : ['tvar-m1', 'tvar-m2']);
  const photo = { face, src: 'img/' + face + '.jpg', cut: FACE_CUT[face], bytes: 180 + Math.floor(r() * 700), err: pick(r, PHOTO_ERR) };
  const ticket = { film: pick(r, FILMS), time: pick(r, ['17:30', '19:30', '20:00']), row: 10 + Math.floor(r() * 5), seat: 3 + Math.floor(r() * 18), price: pick(r, [3, 4, 5, 6]), no: String(Math.floor(r() * 900000) + 100000) };
  const other = { birthN: c.b, bias: { F: 0, C: 0, I: 0 } };
  let date = null;
  for (let n = todayN(); n < todayN() + 60; n++) {
    const a = dayState(u, n), o = dayState(other, n);
    if (isCrit(a.C.s) || isCrit(o.C.s) || isCrit(a.F.s) || isCrit(o.F.s)) continue;
    const sc = a.C.v + o.C.v + .4 * (a.F.v + o.F.v);
    if (!date || sc > date.sc) date = { n, sc };
  }
  return (matchCache[key] = { c, sex, name, city, job, hob, ad, love, robot, photo, ticket, date: date && date.n, age: ageYears(c.b, todayN()), diff: Math.abs(c.b - u.birthN) });
}
const cap = s => s[0].toUpperCase() + s.slice(1);
// podobenka partnera: stroj ju číta z pásky riadok po riadku, ale skončí pri obočí a nahlási chybu
const FACE_CUT = { 'tvar-z1': .35, 'tvar-z2': .28, 'tvar-m1': .35, 'tvar-m2': .30 };
// vtipné názvy filmov v štýle 70. rokov (česky)
const FILMS = ['Láska v době děrných štítků', 'Soudruh Romeo a traktoristka Julie', 'Dovolená s elektronkou', 'Kritický den paní Novákové',
  'Srdce na bytovém pořadníku', 'Rande u samočinného počítače', 'Zamilovaný traktor', 'Noc ve výpočetním středisku',
  'Poslední polibek v paneláku', 'Jáchyme, vrať mi srdce!', 'Šest dnů s hvězdičkou', 'Muž, který překročil normu',
  'Pan Novák a ošidný den', 'Tchyně na služební cestě', 'Operace Kondiciogram', 'Dívka s děrnou páskou'];
const PHOTO_ERR = ['CHYBA CTENI Z PASKY.', 'PAMET POCITACE PREKROCENA.', 'DETEKOVANO POSKOZENI DAT.', 'DATA NENALEZENA.',
  'PASKA SE ZAMOTALA. VOLEJTE UDRZBU.', 'OBRAZEK ZABAVEN KADROVYM ODDELENIM.', 'NEDOSTATEK DERNYCH STITKU.', 'PREHRATA ELEKTRONKA C. 7.'];
const FACE_DOTS = {};
function prepFaceDots() {
  const faces = Object.keys(FACE_CUT); let left = faces.length;
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  faces.forEach(face => {
    const img = new Image();
    img.onload = img.onerror = () => {
      try {
        const C = 60, RW = 68, cell = 5, rows = RW;
        const off = document.createElement('canvas'); off.width = C; off.height = RW;
        const o = off.getContext('2d'); o.drawImage(img, 0, 0, C, RW);
        const d = o.getImageData(0, 0, C, RW).data;
        const cv = document.createElement('canvas'); cv.width = C * cell + 40; cv.height = rows * cell;
        const c = cv.getContext('2d'); c.fillStyle = '#1b1b20';
        const row = (y, drawY, shift, keep) => {
          for (let x = 0; x < C; x++) {
            const i = (y * C + x) * 4, lum = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
            const l = clamp((lum - .5) * 1.5 + .52, 0, 1);
            if (l < (B[y % 4][x % 4] + .5) / 16 && Math.random() < keep) {
              c.beginPath(); c.arc(20 + (x + shift) * cell + cell / 2, drawY * cell + cell / 2, cell * .42, 0, 7); c.fill();
            }
          }
        };
        for (let y = 0; y < rows; y++) row(y, y, 0, 1);
        FACE_DOTS[face] = cv.toDataURL('image/png');
      } catch (e) { /* napr. file:// bez servera: podobenka sa nevytlačí */ }
      if (--left === 0 && U && !$('#scr-dash').classList.contains('hidden')) printMain(false);
    };
    img.src = 'img/' + face + '.jpg';
  });
}
let photoJob = 0;
function drawPhoto(box, ph) {
  const cv = box.querySelector('canvas'), err = box.querySelector('.ph-err'), c = cv.getContext('2d'), W = cv.width, H = cv.height, job = ++photoJob;
  c.fillStyle = '#0b0805'; c.fillRect(0, 0, W, H); err.textContent = '';
  const img = new Image();
  img.onload = () => {
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d'); o.drawImage(img, 0, 0, W, H);
    const src = o.getImageData(0, 0, W, H).data, out = c.createImageData(W, H), d = out.data;
    for (let i = 0; i < src.length; i += 4) {     // jantárová obrazovka, jemné riadkovanie
      const y = (i / 4 / W) | 0, l = Math.pow((src[i] * .3 + src[i + 1] * .59 + src[i + 2] * .11) / 255, .9) * (y % 2 ? .78 : 1);
      d[i] = 255 * l; d[i + 1] = 165 * l; d[i + 2] = 60 * l; d[i + 3] = 255;
    }
    const stop = Math.round(H * ph.cut);
    let row = 0;
    const step = () => {
      if (job !== photoJob) return;
      if (row < stop) {
        c.putImageData(out, 0, 0, 0, row, W, 2); row += 2;
        return setTimeout(step, 45);
      }
      for (let g = 0; g < 3; g++) {                 // pár poškodených riadkov
        const y = stop + g * 2, off2 = (Math.random() * 12 - 6) | 0;
        c.putImageData(out, off2, 0, 0, y, W, 1);
      }
      err.textContent = `NACTENO ${ph.bytes} BAJTU.
${ph.err}
NELZE NACIST CELY OBRAZEK.`;
      beep(180, .18);
    };
    step();
  };
  img.src = ph.src;
}
// vstupenka do kina pre spárovanú dvojicu, dar od výpočtového strediska a MNV
function cinemaTicket(m) {
  const t = m.ticket, f = fromN(m.date);
  return `<div class="kino" aria-label="Vstupenka do kina na první rande">
      <div class="kino-main">
        <div class="kino-top"><span class="kino-name">KINO MÍR</span><span class="kino-no">Č. ${t.no}</span></div>
        <div class="kino-kind">VSTUPENKA · 2 OSOBY · PRVNÍ RANDE</div>
        <div class="kino-film">„${esc(t.film)}“</div>
        <div class="kino-grid">
          <div><small>Den</small><b>${esc(fmtLongCz(m.date))}</b></div>
          <div><small>Začátek</small><b>${t.time}</b></div>
          <div><small>Řada</small><b>${t.row}</b></div>
          <div><small>Sedadla</small><b>${t.seat}, ${t.seat + 1}</b></div>
        </div>
        <div class="kino-price">Cena: 2 × ${t.price},– Kčs = <b>${t.price * 2},– Kčs</b></div>
        <div class="kino-note">Den vybral samočinný počítač: citová ani fyzická křivka nebude mít u nikoho z vás kritický ani ošidný den.</div>
        <div class="kino-stamp">UHRADÍ<br>VÝPOČETNÍ STŘEDISKO<br>A MNV<small>dar za nalezenou shodu</small></div>
      </div>
      <div class="kino-stub"><span>KONTROLNÍ ÚSTŘIŽEK</span><b>${f.d}. ${f.m + 1}.</b><b>${t.time}</b><span>ŘADA ${t.row}</span><span>Č. ${t.no}</span></div>
    </div>`;
}
function renderMatch() {
  if (!U) return;
  const sex = $('#mSex').value, m = matchData(U, sex), out = $('#mOut');
  $('#mTitle').textContent = sex === 'f' ? 'Vaše osudová partnerka' : 'Váš osudový partner';
  if (m && m.minor) { out.innerHTML = '<p><b>Stroj páruje jen plnoleté osoby.</b> Vraťte se, až vám bude 18 let. Do té doby doporučujeme kondiciogram.</p>'; return; }
  if (!m) { out.innerHTML = '<p>Stroj páruje osoby od 18 do 90 let. Ve vašem okolí ±12 let nikoho takového nenašel.</p>'; return; }
  const segs = p => Array.from({ length: 20 }, (_, i) => `<i class="${i < Math.round(p / 5) ? 'on' : ''}"></i>`).join('');
  const cj = String(fnv('P' + nameSeed(U.name) + U.birth) % 1000000).padStart(6, '0');
  out.innerHTML = `<div class="sz-form">
      <div class="sz-head"><span>SEZNAMOVACÍ SLUŽBA SPC-74</span><span>Č. j. ${cj}/74</span></div>
      <div class="sz-top one">
        <div class="sz-name">
          <div class="sz-lbl">Jméno a příjmení</div><div class="sz-val big">${esc(m.name)}</div>
          <div class="sz-lbl">Narozen${m.sex === 'f' ? 'a' : ''}</div><div class="sz-val">${fmt(m.c.b)} · ${m.age} ${yearsCz(m.age)} · ${zodiac(m.c.b)}</div>
        </div>
      </div>
      <dl class="sz-fields">
        <dt>Místo pobytu</dt><dd>${esc(m.city)}</dd>
        <dt>Povolání</dt><dd>${esc(cap(m.job))}</dd>
        <dt>Zájmy</dt><dd>${esc(m.hob.join(', '))}</dd>
        <dt>Milostný život</dt><dd><b>${esc(m.love)}</b></dd>
        <dt>Inzerát</dt><dd>„${esc(m.ad)}“</dd>
      </dl>
      <div class="sz-stamp" aria-hidden="true">${m.sex === 'f' ? 'OSUDOVÁ' : 'OSUDOVÝ'}<small>SCHVÁLENO · SPC-74</small></div>
    </div>
    <div class="sz-side">
      <div class="sz-meter">
        <div class="sz-meter-head"><span>SHODA<br>BIORYTMŮ</span><span class="nixie">${m.c.p.T}</span></div>
        ${CH.map(ch => `<div class="seg-row"><span class="seg-lbl">${CH_NAME_CZ[ch]}</span><span class="segs">${segs(m.c.p[ch])}</span><span class="seg-val">${m.c.p[ch]} %</span></div>`).join('')}
        <div class="sz-small">rozdíl v datech narození: ${nf(m.diff)} dní</div>
      </div>
      ${m.date != null ? cinemaTicket(m) : ''}
      <div class="robot-box"><div class="robot-lbl">Hlášení stroje</div>${m.robot.map(x => `<div>&gt; ${esc(x)}</div>`).join('')}</div>
    </div>`;
}
$('#mSex').addEventListener('change', () => {
  U.sex = $('#mSex').value;
  if (!U.demo) store.set(K_LAST, { name: U.name, birth: U.birth, answers: U.answers, services: U.services, sex: U.sex });
  renderMatch(); printMain(false); printerBurst(18);
});

// časť výtlačku s osudovým partnerom (česky, veľkými písmenami bez diakritiky ako zvyšok výpisu)
function partnerLines(u, width) {
  const m = matchData(u, u.sex || 'f'), L = [], W = Math.max(34, width);
  const wrap = (label, text, lw = 16) => {
    const words = text.split(' '), pad = ' '.repeat(lw); let line = label.padEnd(lw);
    for (const w of words) {
      if (line.trim().length && (line + w).length > W) { L.push(line.trimEnd()); line = pad; }
      line += w + ' ';
    }
    L.push(line.trimEnd());
  };
  L.push((u.sex === 'm' ? 'VYBER OSUDOVEHO PARTNERA' : 'VYBER OSUDOVE PARTNERKY').padEnd(Math.max(26, W - 10)) + 'C. ' + String(fnv('P' + nameSeed(u.name) + u.birth) % 1000000).padStart(6, '0'));
  L.push('PRO:'.padEnd(16) + ascii(u.name) + ', NAR. ' + fmt(u.birthN));
  L.push({ cls: 'muted-line', h: '-'.repeat(W) });
  if (m && m.minor) { L.push('OSOBA MLADSI 18 LET.', 'STROJ PARUJE JEN PLNOLETE OSOBY.', 'VRATTE SE, AZ VAM BUDE 18 LET.'); return L; }
  if (!m) { L.push('ZADNY PROTEJSEK V ROZSAHU 18 AZ 90 LET.'); return L; }
  L.push('PODOBENKA:');
  if (FACE_DOTS[m.photo.face]) L.push({ cls: 'dm-line', h: `<img class="dm-photo" src="${FACE_DOTS[m.photo.face]}" alt="Podobenka osudového protějšku">` });
  L.push('');
  wrap('JMENO', ascii(m.name));
  wrap('NAROZEN', `${fmt(m.c.b)}  (${m.age} ${ascii(yearsCz(m.age)).toUpperCase()}, ${ascii(zodiac(m.c.b))})`);
  wrap('BYDLISTE', ascii(m.city));
  wrap('POVOLANI', ascii(m.job));
  wrap('ZALIBY', ascii(m.hob.join(', ')));
  wrap('MILOSTNY ZIVOT', ascii(m.love));
  wrap('INZERAT', '"' + ascii(m.ad).replace(/[„“]/g, '"') + '"');
  wrap('SHODA', `F ${m.c.p.F} %  C ${m.c.p.C} %  I ${m.c.p.I} %  CELKEM ${m.c.p.T} %`);
  if (m.date != null) {
    wrap('RANDE', ascii(fmtLongCz(m.date)));
  }
  L.push('');
  L.push('HLASENI STROJE:');
  m.robot.forEach(x => wrap('  >', x, 4));
  return L;
}

// klik na logo vľavo hore = späť na úvod (rozcestník)
$('#homeLink').addEventListener('click', e => { e.preventDefault(); machineStop(); machineDone = null; reg = null; show('scr-login'); });


/* ================= NÁSTENKA ================= */
let lastDay = todayN();
function showDash(animatePrint) {
  lastDay = todayN();
  show('scr-dash');
  const today = todayN(), t = today - U.birthN, bf = fromN(U.birthN), age = ageYears(U.birthN, today);
  $('#dGreeting').textContent = `Dobrý deň, ${U.name}!`;
  $('#dFacts').innerHTML = `Narodili ste sa <b>${DOW_LOC[bf.w]} ${fmt(U.birthN)}</b>. Dnes je ${fmtLong(today)} a vy prežívate svoj <b>${nf(t)}. deň</b> života (${age} ${yearsWord(age)}).` +
    (U.demo ? ' <i>Toto je ukážkový profil, nič sa neukladá.</i>' : '');
  document.body.classList.toggle('no-k', !U.services.k);
  document.body.classList.toggle('no-p', !U.services.p);
  $('#printerTitle').textContent = U.services.k && U.services.p ? 'Váš kondiciogram a osudový partner' : U.services.k ? 'Váš kondiciogram' : 'Váš osudový partner';
  $('#mSex').value = U.sex;
  if (U.services.k) { renderVerdict(); drawScope(); renderRisks(); }
  renderCard($('#dashCard'), cardText(U));
  if (U.services.p) renderMatch();
  renderFacts(U);
  $('#shareNote').textContent = '';
  if (!$('#actSel').options.length) $('#actSel').innerHTML = ACTIVITIES.map((a, i) => `<option value="${i}">${esc(a.n)}</option>`).join('');
  $('#planOut').innerHTML = ''; $('#pOut').innerHTML = '';
  if (!$('#yearInp').value) $('#yearInp').value = fromN(today).y;
  if (U.demo) { $('#rangeSel').value = 'year'; $('#yearInp').value = 1973; $('#yearInp').classList.remove('hidden'); }
  printMain(animatePrint);
}
function ageYears(b, n) { const x = fromN(b), y = fromN(n); return y.y - x.y - ((y.m < x.m || (y.m === x.m && y.d < x.d)) ? 1 : 0); }
const yearsWord = a => a === 1 ? 'rok' : (a >= 2 && a <= 4 ? 'roky' : 'rokov');

/* ---- verdikt ---- */
const POOL = {
  F: {
    '*': ['Telo je v prevádzke na 100 %. Ideálny deň vyniesť uhlie z pivnice.', 'Svaly hlásia pripravenosť. Dnes choďte po schodoch, nie výťahom!', 'Fyzicky ste ako nová Tatra po generálke.', 'Vhodný deň na futbal s kolegami z podniku.'],
    '.': ['Šetrite sily. Ťažké bremená nechajte na zajtra.', 'Telo ide v úspornom režime. Polievka a skorší spánok.', 'Sťahovanie klavíra dnes stroj neodporúča.', 'Za autobusom dnes nebežte, príde ďalší.'],
    'X': ['Fyzicky kritický deň, najhorší variant. Opatrne na schodoch a za volantom!', 'Stroj neodporúča liezť na rebrík ani vešať záclony.'],
    '0': ['Fyzicky ošidný deň: niečo medzi. Telo sa prepína, nepreceňujte ho.', 'Opatrne s náradím. Ani dobre, ani zle, a práve preto pozor.']
  },
  C: {
    '*': ['Nálada je výborná. Vhodný deň vyznať city alebo zavolať mame.', 'Úsmev vám dnes pristane, kolegovia to ocenia.', 'Citovo stabilný deň, nerozhádže vás ani rad v samoobsluhe.', 'Ideálny deň na rodinnú oslavu aj na smiech.'],
    '.': ['Ste citlivejší. Návštevu u svokry radšej odložte.', 'Emócie sú v útlme. Pustite si platňu s obľúbenými šlágrami.', 'Hádky dnes nevyhráte, tak ich ani nezačínajte.', 'Deň na ticho, čaj a deku.'],
    'X': ['Citovo kritický deň! V láske ani pri nákupoch sa neunáhlite.', 'Na urazené listy dnes radšej neodpovedajte.'],
    '0': ['Citovo ošidný deň: nálada nevie, kam sa pohnúť. Buďte opatrní.', 'Nálada skáče hore-dole. Dôležité rozhovory o citoch nechajte na zajtra.']
  },
  I: {
    '*': ['Hlava pracuje ako samočinný počítač. Hodí sa na skúšky aj porady.', 'Ideálny deň na krížovku, šach alebo vyúčtovanie.', 'Myšlienky sú ostré ako nová žiletka.', 'Vhodný deň naučiť sa niečo nové.'],
    '.': ['Mozog je na dovolenke pri mori. Dôležité podpisy odložte.', 'Na počítanie je dnes slabší deň, nechajte to na stroj.', 'Do televíznej súťaže sa dnes neprihlasujte.', 'Rutinná práca áno, veľké rozhodnutia nie.'],
    'X': ['Intelektovo kritický deň: pozor na chyby z nepozornosti a zabudnuté kľúče.', 'Pred odchodom z domu skontrolujte, či ste vypli sporák.'],
    '0': ['Intelektovo ošidný deň: hlava pracuje napoly. Dvakrát si prepočítajte výdavok.', 'Zmluvy čítajte dvakrát, aj s malým písmom.']
  }
};
const JOB_TIP = {
  robotnik: { hi: 'Na pracovisku podáte výkon ako úderník.', lo: 'Na pracovisku nech ťažšie kusy dvíhajú dvaja.' },
  urednik: { hi: 'Spisy sa dnes budú vybavovať samé.', lo: 'Pečiatky dnes dávajte len tam, kam patria.' },
  sluzby: { hi: 'Zákazníci, žiaci aj pacienti vás dnes budú mať radi.', lo: 'Dnes nepočúvajte sťažnosti, len ich zapíšte.' },
  umelec: { hi: 'Múza je dnes v službe. Tvorte!', lo: 'Múza má dnes voľno. Umyte aspoň štetce.' },
  technik: { hi: 'Dnes opravíte aj to, čo sa opraviť nedá.', lo: 'Nové verzie dnes nenasadzujte.' },
  student: { hi: 'Keď sa dnes učíte, zapamätáte si dvojnásobok.', lo: 'Radšej opakujte, nové učivo nechajte na lepší deň.' },
  dochodca: { hi: 'Dnes je dobrý deň na záhradu aj na vnúčatá.', lo: 'Dnes stačí lavička v parku a noviny.' }
};
function meterSVG(ch, v) {
  const ang = clamp(v, -1.2, 1.2) / 1.2 * 50;
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = (-50 + i * 10) * Math.PI / 180, r1 = 58, r2 = i % 5 ? 52 : 48;
    return `<line x1="${75 + r1 * Math.sin(a)}" y1="${82 - r1 * Math.cos(a)}" x2="${75 + r2 * Math.sin(a)}" y2="${82 - r2 * Math.cos(a)}" stroke="#4a2a14" stroke-width="${i % 5 ? 1.5 : 2.5}"/>`;
  }).join('');
  return `<svg viewBox="0 0 150 100" role="img" aria-label="${CH_NAME[ch]} ${Math.round(v * 100)} %">
    <rect x="3" y="3" width="144" height="94" rx="12" fill="#f7ecd0" stroke="#4a2a14" stroke-width="3"/>
    <path d="M ${75 - 58 * Math.sin(50 * Math.PI / 180)} ${82 - 58 * Math.cos(50 * Math.PI / 180)} A 58 58 0 0 1 75 24" fill="none" stroke="#7b4623" stroke-width="6" opacity=".35"/>
    <path d="M 75 24 A 58 58 0 0 1 ${75 + 58 * Math.sin(50 * Math.PI / 180)} ${82 - 58 * Math.cos(50 * Math.PI / 180)}" fill="none" stroke="#d65a24" stroke-width="6" opacity=".6"/>
    ${ticks}
    <text x="22" y="92" font-family="Courier Prime" font-size="13" fill="#4a2a14">−</text>
    <text x="121" y="92" font-family="Courier Prime" font-size="13" fill="#4a2a14">+</text>
    <g class="needle" style="transform:rotate(-50deg)" data-ang="${ang}"><line x1="75" y1="82" x2="75" y2="30" stroke="#b8241b" stroke-width="2.5" stroke-linecap="round"/></g>
    <circle cx="75" cy="82" r="6" fill="#4a2a14"/>
  </svg>`;
}
function renderVerdict() {
  const today = todayN(), st = dayState(U, today), t = today - U.birthN, idx = overall(U, st);
  $('#todayStamp').textContent = 'DNES ' + fmt(today);
  $('#meters').innerHTML = CH.map(ch => `<div class="meter">${meterSVG(ch, st[ch].v)}
    <div class="lbl">${CH_PRINT[ch]} · ${st[ch].s}</div><div class="val">${st[ch].v >= 0 ? '+' : ''}${Math.round(st[ch].v * 100)} %</div></div>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.querySelectorAll('#meters .needle').forEach(n => n.style.transform = `rotate(${n.dataset.ang}deg)`)));
  $('#nixie').textContent = idx;
  const crits = CH.filter(ch => st[ch].s === 'X'), tricky = CH.filter(ch => st[ch].s === '0'), vh = $('#verdictHead');
  vh.classList.toggle('crit', crits.length > 0);
  vh.textContent = crits.length === 3 ? 'TROJITÝ KRITICKÝ DEŇ!' : crits.length ? 'KRITICKÝ DEŇ!' : tricky.length ? 'Ošidný deň, buďte opatrní' :
    idx >= 75 ? 'Výborná kondícia' : idx >= 57 ? 'Dobrá kondícia' : idx >= 43 ? 'Priemerná kondícia' : idx >= 25 ? 'Slabšia kondícia' : 'Zostaňte radšej v posteli';
  let html = '';
  if (crits.length >= 2) html += `<li class="crit"><span class="s">!</span><div class="alarm">Stroj hlási ${crits.length} kritické cykly naraz. Podľa kondiciogramu by ste dnes nemali vstávať z postele.</div></li>`;
  html += CH.map((ch, k) => {
    const s = st[ch].s, pool = POOL[ch][s];
    return `<li class="${s === 'X' ? 'crit' : s === '0' ? 'tricky' : ''}"><span class="s">${s}</span><b>${CH_NAME[ch]}:</b> ${esc(pool[(t + k) % pool.length])}</li>`;
  }).join('');
  if (U.job) html += `<li><span class="s">${icon('job')}</span><b>V práci:</b> ${esc(idx >= 50 ? JOB_TIP[U.job].hi : JOB_TIP[U.job].lo)}</li>`;
  $('#verdictList').innerHTML = html;
  $('#bestHour').innerHTML = icon('chrono') + ' ' + esc(U.chrono || 'Vyplňte dotazník a stroj vám vypočíta aj najlepšiu hodinu dňa.');
}

/* ---- osciloskop ---- */
function drawScope() {
  const cv = $('#scope'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = 240;
  if (!W) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#06140b'; c.fillRect(0, 0, W, H);
  const today = todayN(), from = -15, to = 15, pad = 22, gh = H - pad * 2;
  const X = d => (d - from) / (to - from) * W, Y = v => pad + (1 - (clamp(v, -1.45, 1.45) + 1.45) / 2.9) * gh;
  c.strokeStyle = 'rgba(125,255,154,.12)'; c.lineWidth = 1;
  for (let d = from; d <= to; d += 5) { c.beginPath(); c.moveTo(X(d), 0); c.lineTo(X(d), H); c.stroke(); }
  for (let v = -1; v <= 1; v += .5) { c.beginPath(); c.moveTo(0, Y(v)); c.lineTo(W, Y(v)); c.stroke(); }
  c.strokeStyle = 'rgba(125,255,154,.45)'; c.beginPath(); c.moveTo(0, Y(0)); c.lineTo(W, Y(0)); c.stroke();
  c.setLineDash([4, 4]); c.strokeStyle = 'rgba(255,255,255,.55)';
  c.beginPath(); c.moveTo(X(0), 0); c.lineTo(X(0), H); c.stroke(); c.setLineDash([]);
  const t0 = today - U.birthN;
  for (const ch of CH) {
    c.strokeStyle = CH_COLOR[ch]; c.shadowColor = CH_COLOR[ch]; c.shadowBlur = 8; c.lineWidth = 2;
    c.beginPath();
    for (let d = from; d <= to; d += .2) { const x = X(d), y = Y(val(U, ch, t0 + d)); d === from ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    c.beginPath(); c.fillStyle = CH_COLOR[ch]; c.arc(X(0), Y(val(U, ch, t0)), 4, 0, 7); c.fill();
  }
  c.shadowBlur = 0; c.fillStyle = 'rgba(125,255,154,.8)'; c.font = '16px VT323, monospace'; c.textAlign = 'center';
  for (let d = from; d <= to; d += 5) c.fillText(d === 0 ? 'DNES' : fmtShort(today + d), clamp(X(d), 22, W - 22), H - 5);
  c.textAlign = 'left'; c.fillText('+', 6, Y(1) + 5); c.fillText('−', 6, Y(-1) + 5);
}

/* ---- riziká a jubileá ---- */
function renderRisks() {
  const today = todayN(), out = [];
  for (let n = today; n < today + 30 && out.length < 8; n++) {
    const st = dayState(U, n), cr = CH.filter(ch => isCrit(st[ch].s));
    if (cr.length) out.push(`<li><span class="d">${fmtShort(n)} ${DOW[fromN(n).w].slice(0, 2)}</span><span>${cr.map(ch => `${CH_NAME[ch]} <span class="x">${st[ch].s}</span> ${st[ch].s === 'X' ? 'kritický' : 'ošidný'}`).join(', ')}</span></li>`);
  }
  $('#riskOut').innerHTML = `<li><b>Kritické (X) a ošidné (0) dni v najbližších 30 dňoch</b></li>` + (out.join('') || '<li>Žiadne. Stroj je spokojný.</li>');
  const t = today - U.birthN;
  let triple = null;
  for (let n = today; n < today + 400; n++) { const st = dayState(U, n); if (CH.every(ch => st[ch].s === '*' && st[ch].v > .5)) { triple = n; break; } }
  const next1000 = (Math.floor(t / 1000) + 1) * 1000;
  let rep = null; for (let k = 1; k <= 9; k++) { const r = 11111 * k; if (r > t) { rep = r; break; } }
  const bY = fromN(U.birthN).y;
  const film = bY <= 1974 ? `V roku premiéry filmu (1974) ste mali ${1974 - bY} ${yearsWord(1974 - bY)}.` : `Film mal premiéru ${bY - 1974} ${yearsWord(bY - 1974)} pred vaším narodením.`;
  $('#milestones').innerHTML =
    `<p>${icon('cake')} ${nf(next1000)}. deň života oslávite <b>${fmtLong(U.birthN + next1000)} ${fromN(U.birthN + next1000).y}</b>.</p>` +
    (rep ? `<p>${icon('counter')} Jubileum <b>${nf(rep)}</b> dní pripadne na ${fmt(U.birthN + rep)}.</p>` : '') +
    (triple != null ? `<p>${icon('star')} Najbližší deň, keď sú všetky tri krivky vysoko nad nulou: <b>${fmtLong(triple)}</b>.</p>` : '') +
    `<p>${icon('film')} ${film}</p>`;
}

/* ---- plánovač ---- */
const ACTIVITIES = [
  { n: 'Futbal, turistika, športový výkon', w: { F: 1, C: .2, I: 0 } },
  { n: 'Rande alebo vyznanie lásky', w: { F: .2, C: 1, I: .1 } },
  { n: 'Skúška alebo dôležitá porada', w: { F: 0, C: .2, I: 1 } },
  { n: 'Rozhovor so šéfom o prémiách', w: { F: 0, C: .6, I: .8 } },
  { n: 'Svadba', w: { F: .5, C: 1, I: .3 } },
  { n: 'Maľovanie bytu alebo brigáda', w: { F: 1, C: .3, I: .1 } },
  { n: 'Návšteva svokry', w: { F: .2, C: 1, I: .5 } },
  { n: 'Kúpa auta (poradovník 5 rokov)', w: { F: 0, C: .4, I: 1 } },
  { n: 'Dlhá cesta autom k moru', w: { F: .7, C: .3, I: .7 } }
];
$('#planBtn').addEventListener('click', () => {
  const a = ACTIVITIES[+$('#actSel').value], today = todayN(), ws = a.w.F + a.w.C + a.w.I, res = [];
  for (let n = today; n < today + 60; n++) {
    const st = dayState(U, n);
    if (CH.some(ch => a.w[ch] >= .5 && isCrit(st[ch].s))) continue;
    let s = 0; for (const ch of CH) s += a.w[ch] * clamp(st[ch].v, -1, 1);
    res.push({ n, sc: Math.round((s / ws + 1) / 2 * 100), st });
  }
  res.sort((x, y) => y.sc - x.sc || x.n - y.n);
  printerBurst(20);
  $('#planOut').innerHTML = res.slice(0, 3).map(r =>
    `<li><b>${fmtLong(r.n)}</b>${r.n === today ? ' (dnes)' : ''}, vhodnosť ${r.sc} %<br><span class="syms">${CH.map(ch => ch + r.st[ch].s).join(' ')}</span></li>`).join('')
    || '<li>V najbližších 60 dňoch stroj nič vhodné nenašiel. Skúste inú činnosť.</li>';
});

/* ---- partnerská zhoda ---- */
function compat(name, birthISO) {
  const d = Math.abs(parseISO(birthISO) - U.birthN), pct = {};
  for (const ch of CH) pct[ch] = Math.round((Math.cos(2 * Math.PI * d / P[ch]) + 1) / 2 * 100);
  const tot = Math.round((pct.F + pct.C + pct.I) / 3);
  const txt = tot >= 80 ? 'Súzvuk ako na spartakiáde. Stroj vám žehná.' : tot >= 60 ? 'Dobrá dvojka. Stroj povoľuje aj spoločnú dovolenku.' :
    tot >= 40 ? 'Priemer. Na chate sa znesiete, pri stavbe chaty už nie.' : 'Stroj odporúča oddelené spálne a spoločný iba televízor.';
  printerBurst(24);
  $('#pOut').innerHTML = `<p class="p-total">${esc(name || 'Partner')}: ${tot} %</p>` + CH.map(ch =>
    `<div class="bar-lbl"><span>${CH_NAME[ch]}</span><span>${pct[ch]} %</span></div><div class="bar"><i style="width:0" data-w="${pct[ch]}"></i></div>`).join('') +
    `<p class="small-txt">${txt}</p>`;
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('#pOut .bar i').forEach(b => b.style.width = b.dataset.w + '%')));
}
$('#pBtn').addEventListener('click', () => {
  const b = dateValue('pBirth');
  if (!b) { $('#pOut').innerHTML = '<p class="err">Vyberte deň, mesiac aj rok narodenia.</p>'; return; }
  if (b === 'invalid') { $('#pOut').innerHTML = '<p class="err">Taký dátum neexistuje.</p>'; return; }
  compat($('#pName').value.trim(), b);
});
$('#pKoud').addEventListener('click', () => { $('#pName').value = 'František Koudelka'; setDate('pBirth', KOUDELKA_BIRTH); compat('František Koudelka', KOUDELKA_BIRTH); });

/* ================= TLAČ KONDICIOGRAMU ================= */
const printJobs = new WeakMap();
function charWidth(el) {
  const s = document.createElement('span');
  s.className = 'pl'; s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  s.textContent = 'M'.repeat(50); el.appendChild(s);
  const w = s.getBoundingClientRect().width / 50; s.remove();
  return w || 9;
}
function monthsForRange() {
  const v = $('#rangeSel').value, f = fromN(todayN()), out = [];
  if (v === 'year') {
    const y = clamp(parseInt($('#yearInp').value, 10) || f.y, 1900, 2100);
    for (let m = 0; m < 12; m++) out.push({ y, m });
  } else {
    for (let i = 0; i < +v; i++) { const m = (f.m + i) % 12; out.push({ y: f.y + Math.floor((f.m + i) / 12), m }); }
  }
  return out;
}
const signOff = w => w >= 41 ? ['S POZDRAVEM VAS SAMOCINNY POCITAC SPC-74.'] : ['S POZDRAVEM VAS SAMOCINNY', 'POCITAC SPC-74.'];
function buildLines(u, months, avail) {
  const today = todayN(), L = [], sg = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  const chunk = avail >= 13 + 93 ? 31 : Math.max(5, Math.floor((avail - 13) / 3));
  const width = 12 + 3 * Math.min(31, chunk);
  const multiYear = months.some(o => o.y !== months[0].y);
  const seed = nameSeed(u.name) + u.birth, serial = String(fnv(seed) % 1000000).padStart(6, '0');
  // najprv prejsť dni obdobia, aby sa dali spočítať technické parametre hlavičky
  let symStr = '', critDays = 0, trickyDays = 0, allDays = 0;
  const corr = { FC: [0, 0, 0, 0, 0], CI: [0, 0, 0, 0, 0] };   // Σx, Σy, Σxy, Σx², Σy² pre koreláciu cyklov
  const addCorr = (k, x, y) => { const c = corr[k]; c[0] += x; c[1] += y; c[2] += x * y; c[3] += x * x; c[4] += y * y; };
  for (const { y, m } of months) {
    for (let d = 1; d <= daysInMonth(y, m); d++) {
      const t = dn(y, m, d) - u.birthN; if (t < 0) continue;
      allDays++;
      const s = CH.map(ch => sym(u, ch, t)); symStr += s.join('');
      if (s.includes('X')) critDays++; else if (s.includes('0')) trickyDays++;
      const v = CH.map(ch => val(u, ch, t));
      addCorr('FC', v[0], v[1]); addCorr('CI', v[1], v[2]);
    }
  }
  const pearson = k => { const [sx, sy, sxy, sxx, syy] = corr[k], n = allDays || 1, den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy)); return den ? (n * sxy - sx * sy) / den : 0; };
  const tNow = today - u.birthN, h = fnv(symStr + seed).toString(16).toUpperCase().padStart(8, '0');
  const ans = QUESTIONS.map(q => u.answers && u.answers[q.id] != null ? u.answers[q.id] + 1 : '-').join('');
  const params = [
    ['VYSTAVENO', fmt(today)],
    ['OBDOBI', `${months[0].m + 1}/${months[0].y} - ${months[months.length - 1].m + 1}/${months[months.length - 1].y}`],
    ['PROZITO', `${tNow} DNU`],
    ['FAZE', CH.map(ch => `${ch} ${pad2(((tNow % P[ch]) + P[ch]) % P[ch] + 1)}/${P[ch]}`).join(' ')],
    ['KOREKCE', CH.map(ch => `${ch} ${sg(u.bias[ch])}`).join(' ')],
    ['VAHY', CH.map(ch => `${ch} ${u.w[ch].toFixed(2)}`).join(' ')],
    ['KORELACE', `F/C ${sg(pearson('FC'))} C/I ${sg(pearson('CI'))}`],
    ['KRIT/OSID', `${critDays} / ${trickyDays} Z ${allDays} DNU`],
    ['INDEX', `${overall(u, dayState(u, today))} % (DNES)`],
    ['DOTAZNIK', /\d/.test(ans) ? ans : 'NEVYPLNEN'],
    ['STROJ', `SPC-74 / PASKA ${1000 + fnv('P' + seed) % 9000}`],
    // príkon elektrónkového modulu počas výpočtu: 0,70 až 2,60 kW, rovnaký pre rovnaký štítok
    ['PRIKON', `${(0.7 + (fnv('W' + seed) % 1901) / 1000).toFixed(2)} KW / MODUL ZDA-19B`],
    ['OPERATOR', 'JACHYM'],
    ['K.SOUCET', `${h.slice(0, 4)}-${h.slice(4)}`]
  ].map(([k, v]) => (k.padEnd(10) + v));

  L.push('KONDICIOGRAM'.padEnd(Math.max(14, width - 10)) + 'C. ' + serial);
  L.push('JMENO: ' + ascii(u.name));
  L.push('');
  L.push('        NAR. ' + fmt(u.birthN));
  L.push('');
  // na širokom papieri v dvoch stĺpcoch, na úzkom pod sebou
  const colW = Math.max(...params.map(p => p.length)) + 4;
  if (width >= colW * 2) for (let i = 0; i < params.length; i += 2) L.push((params[i].padEnd(colW) + (params[i + 1] || '')).trimEnd());
  else params.forEach(p => L.push(p));
  L.push({ cls: 'muted-line', h: '-'.repeat(width) });
  L.push('');
  for (const { y, m } of months) {
    const dim = daysInMonth(y, m);
    for (let s = 1; s <= dim; s += chunk) {
      const e = Math.min(dim, s + chunk - 1);
      const name = s === 1 ? MONTHS_CZ[m] + (multiYear ? ' ' + String(y).slice(2) : '') : '  (POKR.)';
      let head = ' ' + name.padEnd(11);
      const rows = CH.map(ch => ' ' + (' ' + CH_PRINT[ch]).padEnd(10) + ':');
      for (let d = s; d <= e; d++) {
        const n = dn(y, m, d), isT = n === today, ds = String(d);
        head += isT ? ' '.repeat(3 - ds.length) + `<span class="tdn">${ds}</span>` : ds.padStart(3);
        CH.forEach((ch, k) => {
          const c = n < u.birthN ? ' ' : sym(u, ch, n - u.birthN);
          rows[k] += isT ? `  <span class="td">${c}</span>` : '  ' + c;
        });
      }
      L.push({ h: head }); rows.forEach(r => L.push({ h: r })); L.push('');
    }
  }
  L.push({ cls: 'muted-line', h: '-'.repeat(width) });
  if (width >= 70) L.push('ZNAKY:  * USPESNY DEN   . NEUSPESNY DEN   0 OSIDNY DEN   X KRITICKY DEN');
  else L.push('ZNAKY:  * USPESNY DEN', '        . NEUSPESNY DEN', '        0 OSIDNY DEN', '        X KRITICKY DEN');
  L.push('KONEC VYPISU.', ...signOff(width));
  return L.map(x => typeof x === 'string' ? { h: esc(x) } : x);
}
// celý výpis podľa zvolených služieb: kondiciogram a pod ním (za perforáciou) výber osudového partnera
function buildAll(u, months, avail) {
  const sv = u.services || { k: true, p: false }, out = [];
  if (sv.k) out.push(...buildLines(u, months, avail));
  if (sv.p) {
    const w = sv.k ? 12 + 3 * Math.min(31, avail >= 106 ? 31 : Math.max(5, Math.floor((avail - 13) / 3))) : Math.min(avail, 72);
    if (sv.k) out.push({ h: '' }, { cls: 'muted-line perf', h: '- '.repeat(Math.ceil(w / 2)).slice(0, w) }, { h: '' });
    out.push(...partnerLines(u, Math.min(w, avail)).map(x => typeof x === 'string' ? { h: esc(x) } : x));
    out.push({ h: '' }, { h: 'KONEC VYPISU.' }, ...signOff(w).map(h => ({ h })));
  }
  return out;
}
function printTo(paper, u, months, animate, opts = {}) {
  const job = (printJobs.get(paper) || 0) + 1; printJobs.set(paper, job);
  paper.classList.remove('hidden');
  paper.innerHTML = '';
  // šírku znaku merať až s načítaným písmom, inak sa riadky nezmestia
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(() => { if (printJobs.get(paper) === job) { printJobs.set(paper, job - 1); printTo(paper, u, months, animate, opts); } });
    return;
  }
  const inner = paper.clientWidth - parseFloat(getComputedStyle(paper).paddingLeft) - parseFloat(getComputedStyle(paper).paddingRight);
  const lines = buildAll(u, months, Math.floor(inner / charWidth(paper)) - 1);
  const mk = (x, anim) => { const d = document.createElement('div'); d.className = 'pl' + (x.cls ? ' ' + x.cls : '') + (anim ? ' new' : ''); d.innerHTML = x.h || ' '; return d; };
  const printer = paper.closest('.printer');
  if (!animate) { const f = document.createDocumentFragment(); lines.forEach(x => f.appendChild(mk(x, false))); paper.appendChild(f); if (opts.onDone) opts.onDone(); return; }
  if (printer) printer.classList.add('busy');
  let i = 0;
  const tick = () => {
    if (printJobs.get(paper) !== job) return;
    if (i >= lines.length) { if (printer) printer.classList.remove('busy'); if (opts.onDone) opts.onDone(); return; }
    const x = lines[i++], el = mk(x, true); paper.appendChild(el);
    if (opts.follow) { const r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 20) window.scrollBy(0, r.bottom - innerHeight + 60); }
    const txtLen = (x.h || '').replace(/<[^>]+>/g, '').trim().length;
    if (txtLen) printerBurst(txtLen);
    setTimeout(tick, txtLen ? 85 : 35);
  };
  tick();
}
function printMain(animate) { printTo($('#paper'), U, monthsForRange(), animate); }

$('#rangeSel').addEventListener('change', () => { $('#yearInp').classList.toggle('hidden', $('#rangeSel').value !== 'year'); printMain(true); });
$('#yearInp').addEventListener('change', () => printMain(true));
$('#reprintBtn').addEventListener('click', () => printMain(true));

/* ---- zdieľanie (bez osobných údajov: len výsledok a odkaz na stránku) ---- */
const SITE_URL = 'https://jzac369.github.io/kondiciogram/';
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
function shareText() {
  const parts = ['Samočinný počítač SPC-74 ma hodil do stroja!'];
  if (U.services.k) parts.push(`Môj dnešný index kondície: ${overall(U, dayState(U, todayN()))} %.`);
  if (U.services.p) { const m = matchData(U, U.sex); if (m && !m.minor) parts.push(`Stroj mi vybral osudového partnera: ${m.name}.`); }
  parts.push('Vyskúšajte aj vy:');
  return parts.join(' ');
}
function shareNote(t) { const n = $('#shareNote'); n.textContent = t; clearTimeout(shareNote.tm); shareNote.tm = setTimeout(() => n.textContent = '', 6000); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch { const x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} x.remove(); return ok; }
}
if (navigator.share) $('.sh-nt').classList.remove('hidden');
$('#shareRow').addEventListener('click', async e => {
  const b = e.target.closest('.share-btn'); if (!b || !U) return;
  const txt = shareText(), url = SITE_URL, enc = encodeURIComponent, full = `${txt} ${url}`;
  const open = u => window.open(u, '_blank', 'noopener,width=640,height=560');
  switch (b.dataset.sh) {
    case 'fb': await copyText(full); open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`); shareNote('Text je skopírovaný, môžete ho vložiť do príspevku.'); break;
    case 'ms':
      if (isMobile()) location.href = `fb-messenger://share/?link=${enc(url)}`;
      else { await copyText(full); open('https://www.messenger.com/'); shareNote('Text s odkazom je skopírovaný, vložte ho do správy (Ctrl+V).'); }
      break;
    case 'wa': open(`https://wa.me/?text=${enc(full)}`); break;
    case 'vb': location.href = `viber://forward?text=${enc(full)}`; break;
    case 'tg': open(`https://t.me/share/url?url=${enc(url)}&text=${enc(txt)}`); break;
    case 'x': open(`https://twitter.com/intent/tweet?text=${enc(txt)}&url=${enc(url)}`); break;
    case 'cp': shareNote(await copyText(full) ? 'Skopírované do schránky.' : 'Kopírovanie sa nepodarilo.'); break;
    case 'nt': try { await navigator.share({ title: 'Kondiciogram', text: txt, url }); } catch {} break;
  }
});
/* ---- tlač na skutočný papier: plná šírka 31 stĺpcov, bloky mesiacov sa nedelia medzi strany ---- */
let printSrc = null;
function buildPrintSheet(u, months) {
  const lines = buildAll(u, months, 120);
  let html = '', blk = [];
  const flush = () => { if (blk.length) html += `<div class="blk">${blk.join('')}</div>`; blk = []; };
  for (const x of lines) {
    if (!x.h.trim()) { flush(); html += '<div class="pl"> </div>'; continue; }
    blk.push(`<div class="pl${x.cls ? ' ' + x.cls : ''}">${x.h}</div>`);
  }
  flush();
  $('#printSheet').innerHTML = `<div class="tractor l"></div><div class="tractor r"></div><div class="paper">${html}<div class="tear">- - - ODTRHNITE - - -</div></div>`;
}
function printKondiciogram(u, months) { printSrc = { u, months }; buildPrintSheet(u, months); setTimeout(() => window.print(), 60); }
// aj Ctrl+P z prehliadača vytlačí kondiciogram, nie celú stránku
window.addEventListener('beforeprint', () => {
  if (printSrc) buildPrintSheet(printSrc.u, printSrc.months);
  else if (U) buildPrintSheet(U, monthsForRange());
});
window.addEventListener('afterprint', () => { printSrc = null; });
$('#paperBtn').addEventListener('click', () => printKondiciogram(U, monthsForRange()));
$('#machPrint').addEventListener('click', () => printKondiciogram(U, U.demo ? [0, 1, 2, 3].map(m => ({ y: 1973, m })) : nextMonths(3)));
$('#editBtn').addEventListener('click', () => startReg(true));

$('#refeedBtn').addEventListener('click', () => runMachine(() => showDash(false)));

/* ================= PREKLÁPACIE HODINY V HORNOM PRUHU ================= */
(function flipClock() {
  const h = $('#fcH'), m = $('#fcM'), d = $('#fcD');
  if (!h || !m) return;
  const DAYS = ['NE', 'PO', 'UT', 'ST', 'CT', 'PA', 'SO'];
  const set = (el, v) => { if (el.textContent === v) return; el.textContent = v; el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); };
  const tick = () => {
    const n = new Date();
    set(h, pad2(n.getHours())); set(m, pad2(n.getMinutes()));
    if (d) d.innerHTML = `${DAYS[n.getDay()]}<br>${n.getDate()}.${n.getMonth() + 1}.`;
    $('#flipClock').setAttribute('aria-label', `Aktuální čas ${n.getHours()}:${pad2(n.getMinutes())}`);
  };
  tick();
  setInterval(tick, 1000);
})();

/* ================= DISPLEJ V HORNOM PRUHU: HLÁŠKY STROJA ================= */
const HLASKY = [
  'STROJ DNES POVOLUJE SPOLECENSKY KONTAKT.',
  'INTELEKT V NORME. NEPREKRACOVAT!',
  'POUZITI OBCANA DNES BEZ OMEZENI.',
  'NORMA SPLNENA. KONDICE OTAZNA.',
  'UPOZORNENI: DNES PO 21:00 MUZE DOJIT KE ZTRATE USUDKU.',
  'OSOBA ZPUSOBILA K LEHKYM SPOLECENSKYM UKONUM.',
  'STROJ VAS ZARADIL MEZI OSOBY S PERSPEKTIVOU.',
  'OBCAN VYKAZUJE ZNAMKY PROVOZUSCHOPNOSTI.',
  'STROJ ZAZNAMENAL ZVYSENY VYSKYT POCHYBNOSTI.',
  'INTELEKT SE DOSTAVI PO OBEDE.',
  'STROJ DOPORUCUJE VYHNOUT SE KONTAKTU S VEDOUCIM PRACOVNIKEM.',
  'VASE INICIATIVA PREKROCILA POVOLENOU NORMU.',
  'OSOBA ZPUSOBILA KE SPOLECENSKEMU STYKU DO 14:20.',
  'VYSLEDEK JE PRIZNIVY. DUVOD NEZNAMY.',
  'STROJ PREDPOKLADA USPECH PRI MINIMALNIM USILI.',
  'DNESEK JE VHODNY K PLNENI NENAROCNYCH UKOLU.',
  'POCET SPRAVNYCH ROZHODNUTI JE DNES OMEZEN NA DVE.',
  'DNES SE VYHYBEJTE TECHNICE, DETEM A AUTORITAM.',
  'VASE PRACOVNI MORALKA BYLA ODESLANA DO SERVISNIHO STREDISKA.',
  'DNES FUNGUJETE V REZIMU "HLAVNE NEVYCNIVAT".',
  'VYPOCETNI STREDISKO DOPORUCUJE ODLOZIT VASI ODVAHU NA ZITREK.',
  'DNES JSTE VHODNY K ADMINISTRATIVNIMU PREDSTIRANI CINNOSTI.',
  'VASE ROZHODNOST SE NACHAZI MIMO PRACOVISTE.',
  'PO 17:00 LZE OCEKAVAT SPONTANNI UBYTEK ODPOVEDNOSTI.',
  'STROJ POVOLUJE JEDNU HADKU. POUZIJTE ROZUMNE.',
  'DNES JE POVOLENO DOKONCE I MIRNE PREHANENI.',
  'DNES SE NEDOPORUCUJE RIKAT "JA TO ZARIDIM".',
  'VASE SEBEDUVERA BYLA SCHVALENA V NEPRIMERENEM ROZSAHU.',
  'KOLEKTIV VAS DNES PRAVDEPODOBNE SNESE.',
  'DNES SE MUZETE MYLIT. STAV BUDE MIT JEN MIRNE NASLEDKY.',
  'VASE VYKONNOST ODPOVIDA STAVU PO OBEDE.',
  'STROJ VYHODNOTIL DNESEK JAKO SNESITELNY.',
  'PRI KOMPLIKACICH SE TVARTE, ZE JDE O PLANOVANY STAV.',
  'DNES DOPORUCUJEME POUZIVAT JEDNODUCHE VETY.',
  'NADMERNE PREMYSLENI MUZE VEST K NEZADOUCIM VYSLEDKUM.',
  'VASE PRODUKTIVITA BYLA OMYLEM ZAPOCITANA DVAKRAT.',
  'DNES JSTE KOMPATIBILNI S VETSINOU BEZNYCH SITUACI.',
  'DNES VAM PATRI 63 % VASEHO POTENCIALU.',
  'ERROR 206. NACITAM...',
  'DNES NIC NEBERTE OSOBNE. ANI SVUJ KONDICIOGRAM.',
  'VASE PERSPEKTIVA JE PRIZNIVA, POKUD SE NIC NESTANE.',
  'DNES MUZETE JEDNAT SPONTANNE PO PREDCHOZIM SCHVALENI.',
  'NAHLE PROJEVY ORIGINALITY HLASTE NADRIZENEMU.',
  'V PRIPADE USPECHU ZACHOVEJTE KLID.',
  'DNES SE NEDOPORUCUJE KONTAKT S REALITOU PRED 9:30.',
  'VASE EGO BYLO PREKROCENO O 18 %.',
  'KONDICE DOBRA. CHARAKTER SE NEPOSUZOVAL.',
  'VYSLEDEK BYL VYHODNOCEN JAKO "NEJAK BUDE".'
];
// hláška sa vypisuje znak po znaku ako na termináli; dlhší text pri písaní roluje doľava, potom chvíľu svieti a zhasne
(function ticker() {
  const view = document.querySelector('.tk-view'), el = $('#tkText');
  if (!view || !el) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let order = [], i = 0;
  const next = () => {
    if (i >= order.length) {
      order = HLASKY.map((_, k) => k);
      for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
      i = 0;
    }
    return HLASKY[order[i++]];
  };
  const shift = () => { const over = el.scrollWidth - view.clientWidth; el.style.transform = `translateX(${over > 0 ? -over : 0}px)`; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  (async function loop() {
    for (;;) {
      if (document.hidden) { await wait(1000); continue; }
      const msg = next();
      el.classList.remove('off');
      el.style.transform = 'translateX(0)';
      if (reduce) { el.textContent = msg; shift(); await wait(6000); continue; }
      for (let n = 1; n <= msg.length; n++) {
        el.textContent = msg.slice(0, n); shift();
        await wait(msg[n - 1] === ' ' ? 25 : 45 + Math.random() * 30);
      }
      await wait(msg.startsWith('ERROR') ? 1800 : 3200);
      el.classList.add('off');
      await wait(450);
      el.textContent = '';
    }
  })();
})();

/* ================= VŠEOBECNÉ ================= */
// „Nový štítok“: zahodí posledný štítok a vráti sa na výber služieb
$('#newBtn').addEventListener('click', () => {
  store.del(K_LAST); U = null; reg = null;
  machineStop(); machineDone = null;
  show('scr-login');
});
let rT = null;
window.addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    if (!U || $('#scr-dash').classList.contains('hidden')) return;
    drawScope(); printMain(false);
  }, 200);
});
// po polnoci sa stroj sám prepočíta
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && U && !$('#scr-dash').classList.contains('hidden') && todayN() !== lastDay) showDash(false);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (U && !$('#scr-dash').classList.contains('hidden')) drawScope(); });

// Google AdSense: sloty sa aktivujú, až keď je v index.html doplnené skutočné ID vydavateľa
function initAds() {
  document.querySelectorAll('ins.adsbygoogle').forEach(el => {
    if ((el.dataset.adClient || '').includes('XXXX') || el.dataset.adStatus) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
  });
}

(function init() {
  initAds();
  prepFaceDots();
  $('#pBirthBox').innerHTML = datePicker('pBirth', '');
  const last = store.get(K_LAST, null);
  if (last && last.name && last.birth) { U = derive(last); showDash(false); }
  else show('scr-login');
})();
