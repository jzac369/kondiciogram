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
const K_USERS = 'kg.users', K_SESSION = 'kg.session', K_SOUND = 'kg.sound';

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
    { t: 'Trénujem, ako keby prišla spartakiáda', e: { F: .25, C: .05, I: -.03 } }] },
  { id: 'coffee', kick: 'Otázka o káve', title: 'Koľko šálok kávy (turka sa počíta) vypijete denne?', opts: [
    { t: 'Ani jednu', e: { C: .03 } },
    { t: '1 až 2', e: { I: .1 } },
    { t: '3 až 4', e: { I: .12, C: -.05 } },
    { t: '5 a viac, srdce mi búši do rytmu', e: { I: .02, C: -.15, F: -.05 } }] },
  { id: 'beer', kick: 'Otázka o pive', title: 'Koľko pív vypijete za týždeň?', opts: [
    { t: 'Ani jedno', e: { F: .05 } },
    { t: '1 až 3, na zdravie', e: { C: .08 } },
    { t: '4 až 10, veď sme u nás', e: { F: -.08, C: .05, I: -.05 } },
    { t: 'Výčapník ma volá krstným menom', e: { F: -.2, C: -.05, I: -.15 } }] },
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
  { id: 'chrono', kick: 'Otázka o dennom rytme', title: 'Kedy ste najviac pri sebe?', opts: [
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
  return { ...u, bias: biasOf(u.answers), w: { F: w.F / ws, C: w.C / ws, I: w.I / ws }, chrono, job, birthN: parseISO(u.birth) };
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
const PC_FIELDS = [[0, 24, 'PRIJMENI A JMENO'], [25, 33, 'NAROZEN'], [34, 43, 'DOTAZNIK'], [44, 50, 'DNES'], [51, 57, 'DNU'], [58, 72, 'KOREKCE'], [73, 80, 'KG']];
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
  return `${name} ${birth} ${ans} ${today} ${days} ${kor} 1974`.padEnd(80).slice(0, 80);
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
let soundOn = store.get(K_SOUND, true), AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
function printerBurst(chars) {
  if (!soundOn) return;
  const a = ac(); if (!a) return;
  if (a.state === 'suspended') a.resume();
  const step = .011, len = Math.max(.05, Math.min(.3, chars * step * .35));
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const ph = ((i / a.sampleRate) % step) / step;
    d[i] = (Math.random() * 2 - 1) * (ph < .3 ? 1 : .06);
  }
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .8;
  const g = a.createGain(); g.gain.value = .16;
  src.connect(bp).connect(g).connect(a.destination); src.start();
  // posun papiera
  const o = a.createOscillator(), og = a.createGain(), t0 = a.currentTime + len;
  o.type = 'square'; o.frequency.value = 70;
  og.gain.setValueAtTime(.0001, t0); og.gain.exponentialRampToValueAtTime(.05, t0 + .01); og.gain.exponentialRampToValueAtTime(.0001, t0 + .06);
  o.connect(og).connect(a.destination); o.start(t0); o.stop(t0 + .07);
}
function beep(f = 880, d = .06) {
  if (!soundOn) return;
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime;
  o.type = 'square'; o.frequency.value = f;
  g.gain.setValueAtTime(.04, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(g).connect(a.destination); o.start(); o.stop(t0 + d);
}
function updSoundBtn() { $('#soundBtn').innerHTML = soundOn ? icon('soundOn') + ' Zvuk' : icon('soundOff') + ' Ticho'; }

/* ---------------- stav aplikácie ---------------- */
let users = store.get(K_USERS, {});
let U = null;               // odvodený aktuálny používateľ
let reg = null;             // stav registrácie

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
  const logged = id === 'scr-dash' || id === 'scr-machine' || (id === 'scr-reg' && reg && reg.editing);
  $('#logoutBtn').classList.toggle('hidden', !logged);
  $('#whoami').classList.toggle('hidden', !logged || !U);
  if (U) $('#whoami').innerHTML = icon('card') + ' ' + esc(U.name);
  window.scrollTo(0, 0);
}

/* ================= PRIHLÁSENIE ================= */
function renderSaved() {
  const list = Object.values(users);
  $('#savedWrap').classList.toggle('hidden', !list.length);
  $('#savedCards').innerHTML = list.map(u =>
    `<span class="pcard" data-k="${esc(u.key)}" role="button" tabindex="0">${esc(ascii(u.name))}<button class="del" data-del="${esc(u.key)}" title="Zmazať štítok" aria-label="Zmazať štítok">×</button></span>`).join('');
}
$('#savedCards').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    e.stopPropagation();
    const k = del.dataset.del;
    if (confirm(`Naozaj skartovať štítok ${users[k].name}? Údaje sa z tohto prehliadača zmažú.`)) {
      delete users[k]; store.set(K_USERS, users); renderSaved();
    }
    return;
  }
  const c = e.target.closest('.pcard');
  if (c) { $('#loginName').value = users[c.dataset.k].name; $('#loginPin').focus(); }
});
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const k = keyOf($('#loginName').value), pin = $('#loginPin').value.trim();
  const u = users[k];
  if (!u) { $('#loginErr').textContent = 'Takýto štítok stroj nepozná. Zaregistrujte sa.'; beep(220, .25); return; }
  if (u.pin !== fnv(k + ':' + pin)) { $('#loginErr').textContent = 'Nesprávne osobné číslo. Stroj sa mračí.'; beep(220, .25); return; }
  $('#loginErr').textContent = '';
  $('#loginPin').value = '';
  store.set(K_SESSION, k);
  U = derive(u);
  showDash(true);
});
$('#toRegister').addEventListener('click', () => startReg(false));
$('#demoBtn').addEventListener('click', () => {
  U = derive({ key: '__demo', name: 'Koudelka František', birth: KOUDELKA_BIRTH, answers: {}, demo: true });
  runMachine(() => showDash(false));
});

/* ================= REGISTRÁCIA / DOTAZNÍK ================= */
function startReg(editing) {
  reg = {
    editing,
    step: 0,
    data: editing ? { name: U.name, birth: U.birth, answers: { ...(U.answers || {}) } } : { name: '', pin: '', birth: '', answers: {} },
    steps: [...(editing ? [] : ['account']), 'birth', ...QUESTIONS.map(q => q.id)]
  };
  show('scr-reg');
  renderStep();
}
function renderStep() {
  const id = reg.steps[reg.step], box = $('#regStep');
  $('#regErr').textContent = '';
  updRegCard();
  $('#regBack').textContent = reg.step === 0 ? (reg.editing ? 'Zrušiť' : 'Späť na prihlásenie') : 'Späť';
  $('#regNext').textContent = reg.step === reg.steps.length - 1 ? 'Hoď ho do stroja!' : 'Ďalej';

  if (id === 'account') {
    box.innerHTML = `<div class="q-kicker">Nový štítok</div><h2 class="q-title">Kto ste, súdruh používateľ?</h2>
      <label>Priezvisko a meno<input id="rName" type="text" maxlength="40" placeholder="napr. Koudelka František" value="${esc(reg.data.name)}"></label>
      <label>Osobné číslo, 4 číslice (PIN)<input id="rPin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" value="${esc(reg.data.pin)}"></label>
      <p class="muted small-txt">Štítok sa uloží len v tomto prehliadači. PIN chráni pred zvedavým kolegom, nie pred rozviedkou.</p>`;
    $('#rName').focus();
    $('#rName').addEventListener('input', () => { reg.data.name = $('#rName').value; updRegCard(); });
  } else if (id === 'birth') {
    const max = isoN(todayN());
    box.innerHTML = `<div class="q-kicker">Základný údaj</div><h2 class="q-title">Kedy ste sa narodili?</h2>
      <label>Dátum narodenia<input id="rBirth" type="date" min="1900-01-01" max="${max}" value="${esc(reg.data.birth)}"></label>
      <div id="birthHint" class="birth-hint"></div>`;
    const upd = () => {
      const v = $('#rBirth').value; if (!v) { $('#birthHint').textContent = ''; return; }
      const n = parseISO(v), t = todayN() - n;
      $('#birthHint').textContent = t >= 0 ? `> NARODENÝ ${DOW_LOC[fromN(n).w].toUpperCase()}, DNES ${nf(t)}. DEŇ ŽIVOTA` : '> CHYBA: BUDÚCNOSŤ ZATIAĽ NEPOČÍTAME';
    };
    $('#rBirth').addEventListener('input', () => { upd(); const v = $('#rBirth').value; if (v && parseISO(v) <= todayN() && parseISO(v) >= dn(1900, 0, 1)) { reg.data.birth = v; updRegCard(); } }); upd();
  } else {
    const q = QUESTIONS.find(x => x.id === id), cur = reg.data.answers[id];
    box.innerHTML = `<div class="q-kicker">${esc(q.kick)} · ${reg.step + 1}/${reg.steps.length}</div><h2 class="q-title">${icon(q.id, 'q-ic')}${esc(q.title)}</h2>
      <div class="opts">${q.opts.map((o, i) => `<button type="button" class="opt ${cur === i ? 'sel' : ''}" data-i="${i}"><span class="code">${i + 1}</span>${esc(o.t)}</button>`).join('')}</div>
      <p class="kbd-hint">Odpoveď vyberiete aj klávesom 1 až ${q.opts.length}. Backspace vás vráti späť.</p>`;
    box.querySelector('.opts').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      reg.data.answers[id] = +b.dataset.i;
      updRegCard();
      box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
      beep(660, .04);
      setTimeout(() => { if (reg && reg.steps[reg.step] === id) nextStep(); }, 260);
    });
  }
}
function updRegCard() { if (reg) renderCard($('#regCard'), cardText(reg.data)); }
function nextStep() {
  const id = reg.steps[reg.step], err = m => { $('#regErr').textContent = m; beep(220, .25); };
  if (id === 'account') {
    const name = $('#rName').value.trim(), pin = $('#rPin').value.trim();
    if (name.length < 2) return err('Zadajte meno, aspoň 2 znaky.');
    if (!/^\d{4}$/.test(pin)) return err('Osobné číslo musí mať presne 4 číslice.');
    if (users[keyOf(name)]) return err('Tento štítok už existuje. Prihláste sa alebo zvoľte iné meno.');
    reg.data.name = name; reg.data.pin = pin;
  } else if (id === 'birth') {
    const v = $('#rBirth').value;
    if (!v) return err('Bez dátumu narodenia stroj nepočíta.');
    const n = parseISO(v);
    if (n > todayN()) return err('Ešte ste sa nenarodili? Stroj to neberie.');
    if (n < dn(1900, 0, 1)) return err('Stroj počíta od roku 1900.');
    reg.data.birth = v;
  } else if (reg.data.answers[id] == null) return err('Vyberte jednu možnosť.');

  if (reg.step < reg.steps.length - 1) { reg.step++; renderStep(); return; }
  finishReg();
}
function finishReg() {
  const d = reg.data;
  if (reg.editing) {
    const base = { ...U, birth: d.birth, answers: d.answers };
    if (!U.demo) { users[U.key] = { ...users[U.key], birth: d.birth, answers: d.answers }; store.set(K_USERS, users); }
    U = derive(base);
  } else {
    const key = keyOf(d.name);
    users[key] = { key, name: d.name, pin: fnv(key + ':' + d.pin), birth: d.birth, answers: d.answers, created: Date.now() };
    store.set(K_USERS, users); store.set(K_SESSION, key);
    U = derive(users[key]);
  }
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
  btn.disabled = true; beep(1200, .12);
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
    `KOREKCE ........... F ${sg(b.F)} C ${sg(b.C)} I ${sg(b.I)}`,
    'TISKNU KONDICIOGRAM ...'
  ];
  let i = 0;
  machineTO.push(setTimeout(() => {
    machineTimer = setInterval(() => {
      if (i < msgs.length) { ttyShow(msgs.slice(0, ++i)); beep(500 + Math.random() * 900, .03); return; }
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
$('#skipMachine').addEventListener('click', () => { if (machineDone) machineDone(); });

/* ================= TITULKY ================= */
const CREDITS = [
  ['SAMOČINNÝ POČÍTAČ UVÁDZA', 'KONDICIOGRAM'], ['SCÉNÁR', 'VAŠE BIORYTMY'], ['HUDBA', 'IHLIČKOVÁ TLAČIAREŇ'],
  ['KAMERA', 'OSCILOSKOP'], ['STRIH', 'DIERNY ŠTÍTOK'], ['V HLAVNEJ ÚLOHE', 'VY']
];
let crI = 0;
setInterval(() => {
  if ($('#scr-login').classList.contains('hidden')) return;
  const c = document.querySelector('.credits'); c.classList.add('out');
  setTimeout(() => { crI = (crI + 1) % CREDITS.length; $('#crS').textContent = CREDITS[crI][0]; $('#crB').textContent = CREDITS[crI][1]; c.classList.remove('out'); }, 460);
}, 2800);

/* ================= VHODNÝ PARTNER / PARTNERKA ================= */
const NAMES = {
  f: {
    first: ['Zuzana', 'Katarína', 'Lucia', 'Martina', 'Jana', 'Veronika', 'Monika', 'Andrea', 'Simona', 'Petra', 'Barbora', 'Michaela', 'Dominika', 'Ivana', 'Eva', 'Kristína', 'Lenka', 'Alžbeta', 'Silvia', 'Adriana', 'Natália', 'Soňa', 'Beáta', 'Viera', 'Helena', 'Gabriela', 'Daniela', 'Miroslava'],
    last: ['Horváthová', 'Kováčová', 'Vargová', 'Tóthová', 'Baloghová', 'Lukáčová', 'Hudáková', 'Šimková', 'Mikulová', 'Benková', 'Poláková', 'Krajčírová', 'Oravcová', 'Blahová', 'Kučerová', 'Štefanková', 'Jurčová', 'Hrušková', 'Gajdošová', 'Balážová', 'Pekárová', 'Ďuricová', 'Chovancová', 'Matušková', 'Záhorská', 'Kollárová'],
    job: ['učiteľka na základnej škole', 'zdravotná sestra', 'účtovníčka v stavebnej firme', 'knihovníčka', 'kaderníčka s vlastným salónom', 'architektka', 'lekárnička', 'programátorka', 'cukrárka', 'veterinárka', 'sprievodkyňa vo vlaku', 'fotografka', 'referentka na mestskom úrade', 'fyzioterapeutka'],
    ad: ['Hľadá muža, s ktorým sa dá rozprávať aj mlčať.', 'Rada spozná niekoho, kto neutečie pred prvou túrou.', 'Hľadá partnera, ktorý vie, kde je v kuchyni linka.', 'Ozvi sa, ak máš rád nedeľné obedy a dlhé prechádzky.', 'Hľadá gavaliera, ktorý otvorí dvere aj fľašu vína.']
  },
  m: {
    first: ['Peter', 'Martin', 'Tomáš', 'Michal', 'Juraj', 'Marek', 'Ján', 'Jozef', 'Lukáš', 'Milan', 'Róbert', 'Pavol', 'Miroslav', 'Stanislav', 'Dušan', 'Igor', 'Rastislav', 'Matej', 'Vladimír', 'Ondrej', 'Branislav', 'Radovan', 'Ľubomír', 'Viliam', 'Roman', 'Daniel'],
    last: ['Horváth', 'Kováč', 'Varga', 'Tóth', 'Balogh', 'Lukáč', 'Hudák', 'Šimko', 'Mikula', 'Benko', 'Polák', 'Krajčír', 'Oravec', 'Blaho', 'Kučera', 'Štefanko', 'Jurčo', 'Hruška', 'Gajdoš', 'Baláž', 'Pekár', 'Ďurica', 'Chovanec', 'Matuška', 'Záhorský', 'Kollár'],
    job: ['učiteľ telesnej výchovy', 'záchranár', 'účtovník', 'automechanik', 'architekt', 'lekárnik', 'programátor', 'kuchár', 'veterinár', 'rušňovodič', 'fotograf', 'elektrikár', 'stolár s vlastnou dielňou', 'geodet'],
    ad: ['Hľadá ženu, s ktorou sa dá rozprávať aj mlčať.', 'Rád spozná niekoho, kto sa nebojí stanu a dažďa.', 'Vie uvariť halušky aj opraviť kvapkajúci kohútik.', 'Ozvi sa, ak máš rada výlety a večery pri platniach.', 'Hľadá dámu, ktorá sa smeje aj na jeho vtipoch.']
  },
  cities: ['Bratislave', 'Košiciach', 'Prešove', 'Žiline', 'Nitre', 'Banskej Bystrici', 'Trnave', 'Trenčíne', 'Martine', 'Poprade', 'Prievidzi', 'Zvolene', 'Považskej Bystrici', 'Michalovciach', 'Nových Zámkoch', 'Spišskej Novej Vsi', 'Komárne', 'Leviciach', 'Humennom', 'Bardejove', 'Liptovskom Mikuláši', 'Ružomberku', 'Piešťanoch', 'Topoľčanoch', 'Lučenci', 'Rožňave', 'Dolnom Kubíne', 'Senici', 'Skalici', 'Banskej Štiavnici', 'Kežmarku', 'Levoči', 'Pezinku', 'Malackách'],
  hobby: ['turistika v Tatrách', 'záhradka na chate', 'volejbal', 'tanečné kurzy', 'krížovky', 'huby a les', 'platne zo 70. rokov', 'plávanie', 'bežky', 'šach', 'rybačka', 'divadlo', 'motorky Jawa', 'bicykel', 'pečenie koláčov', 'kino']
};
const ZODIAC = [[120, 'Kozorožec'], [219, 'Vodnár'], [321, 'Ryby'], [420, 'Baran'], [521, 'Býk'], [621, 'Blíženci'], [723, 'Rak'], [823, 'Lev'], [923, 'Panna'], [1023, 'Váhy'], [1122, 'Škorpión'], [1222, 'Strelec'], [1300, 'Kozorožec']];
const zodiac = n => { const f = fromN(n), k = (f.m + 1) * 100 + f.d; return ZODIAC.find(z => k < z[0])[1]; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const compatPct = d => { const p = {}; for (const ch of CH) p[ch] = Math.round((Math.cos(2 * Math.PI * d / P[ch]) + 1) / 2 * 100); p.T = Math.round((p.F + p.C + p.I) / 3); return p; };
let matchIdx = 0, matchList = [], matchKey = '';
// kandidáti: dátumy narodenia ±12 rokov (min. 18-roční), zoradené podľa zhody cyklov
function matchCandidates() {
  const adult = todayN() - 18 * 365.25, cand = [];
  for (let d = -4383; d <= 4383; d++) {
    if (Math.abs(d) < 200) continue;
    const b = U.birthN + d;
    if (b > adult || b < dn(1900, 0, 1)) continue;
    cand.push({ b, p: compatPct(d) });
  }
  cand.sort((x, y) => y.p.T - x.p.T);
  const out = [];
  for (const c of cand) { if (out.every(o => Math.abs(o.b - c.b) > 45)) out.push(c); if (out.length >= 20) break; }
  return out;
}
function renderMatch(step) {
  const sex = $('#mSex').value, key = U.key + U.birth + sex;
  if (key !== matchKey) { matchKey = key; matchList = matchCandidates(); matchIdx = 0; }
  if (step) matchIdx = (matchIdx + 1) % Math.max(1, matchList.length);
  const out = $('#mOut');
  if (!matchList.length) { out.innerHTML = '<p>Stroj páruje len dospelých. Vráťte sa, keď budete mať 18 rokov.</p>'; return; }
  const c = matchList[matchIdx], r = rng(fnv(key + ':' + matchIdx)), N = NAMES[sex];
  const name = `${pick(r, N.first)} ${pick(r, N.last)}`, city = pick(r, NAMES.cities), job = pick(r, N.job);
  const hob = [pick(r, NAMES.hobby)], h2 = pick(r, NAMES.hobby); if (h2 !== hob[0]) hob.push(h2);
  const age = ageYears(c.b, todayN()), adTxt = pick(r, N.ad);
  const other = { birthN: c.b, bias: { F: 0, C: 0, I: 0 } };
  let best = null;
  for (let n = todayN(); n < todayN() + 60; n++) {
    const a = dayState(U, n), o = dayState(other, n);
    if (isCrit(a.C.s) || isCrit(o.C.s) || isCrit(a.F.s) || isCrit(o.F.s)) continue;
    const sc = a.C.v + o.C.v + .4 * (a.F.v + o.F.v);
    if (!best || sc > best.sc) best = { n, sc };
  }
  out.innerHTML = `<div class="ad-clip">
      <p class="who">${esc(name)}</p>
      <p class="meta">nar. ${fmt(c.b)} v ${esc(city)} · ${age} ${yearsWord(age)} · ${zodiac(c.b)}</p>
      <p>${icon('stress')} ${esc(job[0].toUpperCase() + job.slice(1))}</p>
      <p>${icon('pin')} Žije v ${esc(city)}</p>
      <p>${hob.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</p>
      <p><i>„${esc(adTxt)}“</i></p>
      <p class="muted small-txt">Kandidát ${matchIdx + 1} z ${matchList.length}. Fiktívna osoba, ktorú vygeneroval stroj.</p>
    </div>
    <div>
      <div class="m-total"><div class="nixie">${c.p.T}</div><div><b class="verdict-head">Zhoda biorytmov</b><div class="muted small-txt">rozdiel v dátumoch narodenia: ${nf(Math.abs(c.b - U.birthN))} dní</div></div></div>
      ${CH.map(ch => `<div class="bar-lbl"><span>${CH_NAME[ch]}</span><span>${c.p[ch]} %</span></div><div class="bar"><i style="width:${c.p[ch]}%"></i></div>`).join('')}
      ${best ? `<div class="m-date">${icon('calendar')} Ideálne prvé rande: <b>${fmtLong(best.n)}</b>. Citová ani fyzická krivka nebude mať u nikoho z vás kritický deň.</div>` : ''}
    </div>`;
}
$('#mNext').addEventListener('click', () => { renderMatch(true); printerBurst(18); });
$('#mSex').addEventListener('change', () => renderMatch(false));

/* ================= NÁSTENKA ================= */
let lastDay = todayN();
function showDash(animatePrint) {
  lastDay = todayN();
  show('scr-dash');
  const today = todayN(), t = today - U.birthN, bf = fromN(U.birthN), age = ageYears(U.birthN, today);
  $('#dGreeting').textContent = `Dobrý deň, ${U.name}!`;
  $('#dFacts').innerHTML = `Narodili ste sa <b>${DOW_LOC[bf.w]} ${fmt(U.birthN)}</b>. Dnes je ${fmtLong(today)} a vy prežívate svoj <b>${nf(t)}. deň</b> života (${age} ${yearsWord(age)}).` +
    (U.demo ? ' <i>Toto je ukážkový profil, nič sa neukladá.</i>' : '');
  renderVerdict();
  drawScope();
  renderRisks();
  renderCard($('#dashCard'), cardText(U));
  renderMatch(false);
  if (!$('#actSel').options.length) $('#actSel').innerHTML = ACTIVITIES.map((a, i) => `<option value="${i}">${esc(a.n)}</option>`).join('');
  $('#planOut').innerHTML = ''; $('#pOut').innerHTML = '';
  $('#paper2').classList.add('hidden');
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
    'X': ['Fyzický kritický deň, krivka padá. Opatrne na schodoch a za volantom!', 'Stroj neodporúča liezť na rebrík ani vešať záclony.'],
    '0': ['Fyzický kritický deň, krivka sa dvíha. Telo sa prepína, nepreceňujte ho.', 'Opatrne s náradím. Od zajtra už bude lepšie.']
  },
  C: {
    '*': ['Nálada je výborná. Vhodný deň vyznať city alebo zavolať mame.', 'Úsmev vám dnes pristane, kolegovia to ocenia.', 'Citovo stabilný deň, nerozhádže vás ani rad v samoobsluhe.', 'Ideálny deň na rodinnú oslavu aj na smiech.'],
    '.': ['Ste citlivejší. Návštevu u svokry radšej odložte.', 'Emócie sú v útlme. Pustite si platňu s obľúbenými šlágrami.', 'Hádky dnes nevyhráte, tak ich ani nezačínajte.', 'Deň na ticho, čaj a deku.'],
    'X': ['Citový kritický deň! V láske ani pri nákupoch sa neunáhlite.', 'Na urazené listy dnes radšej neodpovedajte.'],
    '0': ['Citový kritický deň, nálada sa láme k lepšiemu. Ešte chvíľu trpezlivosti.', 'Nálada skáče hore-dole. Dôležité rozhovory o citoch nechajte na zajtra.']
  },
  I: {
    '*': ['Hlava pracuje ako samočinný počítač. Hodí sa na skúšky aj porady.', 'Ideálny deň na krížovku, šach alebo vyúčtovanie.', 'Myšlienky sú ostré ako nová žiletka.', 'Vhodný deň naučiť sa niečo nové.'],
    '.': ['Mozog je na dovolenke pri mori. Dôležité podpisy odložte.', 'Na počítanie je dnes slabší deň, nechajte to na stroj.', 'Do televíznej súťaže sa dnes neprihlasujte.', 'Rutinná práca áno, veľké rozhodnutia nie.'],
    'X': ['Intelektový kritický deň: pozor na chyby z nepozornosti a zabudnuté kľúče.', 'Pred odchodom z domu skontrolujte, či ste vypli sporák.'],
    '0': ['Intelektový kritický deň, hlava sa reštartuje. Dvakrát si prepočítajte výdavok.', 'Zmluvy čítajte dvakrát, aj s malým písmom.']
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
  const crits = CH.filter(ch => isCrit(st[ch].s)), vh = $('#verdictHead');
  vh.classList.toggle('crit', crits.length > 0);
  vh.textContent = crits.length === 3 ? 'TROJITÝ KRITICKÝ DEŇ!' : crits.length ? 'KRITICKÝ DEŇ!' :
    idx >= 75 ? 'Výborná kondícia' : idx >= 57 ? 'Dobrá kondícia' : idx >= 43 ? 'Priemerná kondícia' : idx >= 25 ? 'Slabšia kondícia' : 'Zostaňte radšej v posteli';
  let html = '';
  if (crits.length >= 2) html += `<li class="crit"><span class="s">!</span><div class="alarm">Stroj hlási ${crits.length} kritické cykly naraz. Podľa kondiciogramu by ste dnes nemali vstávať z postele.</div></li>`;
  html += CH.map((ch, k) => {
    const s = st[ch].s, pool = POOL[ch][s];
    return `<li class="${isCrit(s) ? 'crit' : ''}"><span class="s">${s}</span><b>${CH_NAME[ch]}:</b> ${esc(pool[(t + k) % pool.length])}</li>`;
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
    if (cr.length) out.push(`<li><span class="d">${fmtShort(n)} ${DOW[fromN(n).w].slice(0, 2)}</span><span>${cr.map(ch => `${CH_NAME[ch]} <span class="x">${st[ch].s}</span>`).join(', ')}</span></li>`);
  }
  $('#riskOut').innerHTML = `<li><b>Kritické dni v najbližších 30 dňoch</b></li>` + (out.join('') || '<li>Žiadne. Stroj je spokojný.</li>');
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
  const b = $('#pBirth').value;
  if (!b) { $('#pOut').innerHTML = '<p class="err">Zadajte dátum narodenia.</p>'; return; }
  compat($('#pName').value.trim(), b);
});
$('#pKoud').addEventListener('click', () => { $('#pName').value = 'František Koudelka'; $('#pBirth').value = KOUDELKA_BIRTH; compat('František Koudelka', KOUDELKA_BIRTH); });

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
function buildLines(u, months, avail) {
  const today = todayN(), L = [], sg = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  const chunk = avail >= 13 + 93 ? 31 : Math.max(5, Math.floor((avail - 13) / 3));
  const width = 12 + 3 * Math.min(31, chunk);
  const multiYear = months.some(o => o.y !== months[0].y);
  const serial = String(fnv(u.name + u.birth) % 1000000).padStart(6, '0');
  L.push('KONDICIOGRAM'.padEnd(Math.max(14, width - 10)) + 'C. ' + serial);
  L.push('JMENO: ' + ascii(u.name));
  L.push('');
  L.push('        NAR. ' + fmt(u.birthN));
  L.push('');
  L.push(`VYSTAVENO ${fmt(today)}`);
  L.push(`OBDOBI    ${months[0].m + 1}/${months[0].y} - ${months[months.length - 1].m + 1}/${months[months.length - 1].y}`);
  if (CH.some(ch => u.bias[ch])) L.push(`KOREKCE   F ${sg(u.bias.F)} C ${sg(u.bias.C)} I ${sg(u.bias.I)}`);
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
  if (width >= 70) L.push('ZNAKY:  * DOBRY  . SLABY  X KRITICKY (SESTUP)  0 KRITICKY (VZESTUP)');
  else L.push('ZNAKY:  * DOBRY   . SLABY', '        X KRITICKY (SESTUP)', '        0 KRITICKY (VZESTUP)');
  L.push('KONEC VYPISU.', 'S POZDRAVEM VAS SAMOCINNY POCITAC.');
  return L.map(x => typeof x === 'string' ? { h: esc(x) } : x);
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
  const lines = buildLines(u, months, Math.floor(inner / charWidth(paper)) - 1);
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
/* ---- tlač na skutočný papier: plná šírka 31 stĺpcov, bloky mesiacov sa nedelia medzi strany ---- */
let printSrc = null;
function buildPrintSheet(u, months) {
  const lines = buildLines(u, months, 120);
  let html = '', blk = [];
  const flush = () => { if (blk.length) html += `<div class="blk">${blk.join('')}</div>`; blk = []; };
  for (const x of lines) {
    if (!x.h.trim()) { flush(); html += '<div class="pl"> </div>'; continue; }
    blk.push(`<div class="pl${x.cls ? ' ' + x.cls : ''}">${x.h}</div>`);
  }
  flush();
  $('#printSheet').innerHTML = `<div class="paper">${html}<div class="tear">- - - ODTRHNITE - - -</div></div>`;
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
function printProof(anim) {
  const k = derive({ name: 'Koudelka František', birth: KOUDELKA_BIRTH, answers: {} });
  printTo($('#paper2'), k, [0, 1, 2, 3].map(m => ({ y: 1973, m })), anim);
}
$('#proofBtn').addEventListener('click', () => printProof(true));
$('#editBtn').addEventListener('click', () => startReg(true));

$('#refeedBtn').addEventListener('click', () => runMachine(() => showDash(false)));

/* ================= VŠEOBECNÉ ================= */
$('#soundBtn').addEventListener('click', () => { soundOn = !soundOn; store.set(K_SOUND, soundOn); updSoundBtn(); beep(880, .05); });
$('#logoutBtn').addEventListener('click', () => {
  store.del(K_SESSION); U = null; reg = null;
  if (machineTimer) { clearInterval(machineTimer); machineTimer = null; machineDone = null; }
  renderSaved(); show('scr-login');
});
let rT = null;
window.addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    if (!U || $('#scr-dash').classList.contains('hidden')) return;
    drawScope(); printMain(false);
    if (!$('#paper2').classList.contains('hidden')) printProof(false);
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
  updSoundBtn();
  renderSaved();
  const k = store.get(K_SESSION, null);
  if (k && users[k]) { U = derive(users[k]); showDash(false); }
  else show('scr-login');
})();
