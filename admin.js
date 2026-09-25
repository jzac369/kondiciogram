// ================= ZÓNA ZÁVODNEJ RADY (administrácia a analytika) =================
// Prihlásenie cez Firebase Authentication (e-mail a heslo si nastaví prevádzkovateľ vo Firebase Console).
// Dáta čítajú len prihlásení správcovia; chránia ich pravidlá vo firestore.rules.
import { firebaseConfig, ADMIN_EMAIL, RETENTION_DAYS } from './firebase-config.js';
import { firebase } from './tracker.js?v=20260925b';   // tracker sa načíta len raz (cez admin.js)

const V = '10.12.2';
const $a = s => document.querySelector(s);
const escA = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let auth = null, A = null, data = { visits: [], cards: [] };

async function authMod() {
  const fb = await firebase(); if (!fb) return null;
  if (!A) {
    A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
    auth = A.getAuth();
    A.onAuthStateChanged(auth, u => render(u));
  }
  return A;
}

function openAdmin() {
  show('scr-admin');
  if (!firebaseConfig) { $a('#admBody').innerHTML = setupHelp(); return; }
  $a('#admBody').innerHTML = '<p class="muted">Připojuji se k databázi…</p>';
  authMod().then(() => render(auth.currentUser)).catch(e => { $a('#admBody').innerHTML = `<p class="err">Chyba připojení: ${escA(e.message)}</p>`; });
}

function setupHelp() {
  return `<div class="adm-setup">
    <h3>Stroj zatiaľ nie je pripojený k databáze</h3>
    <ol>
      <li>Vo <b>Firebase Console</b> vytvorte projekt a pridajte <b>Web app</b>.</li>
      <li>Zapnite <b>Firestore Database</b> (región europe-west) a <b>Authentication → Email/Password</b>.</li>
      <li>V Authentication → Users vytvorte účet závodnej rady (svoj e-mail a heslo).</li>
      <li>Do Firestore → Rules vložte obsah súboru <code>firestore.rules</code> a doplňte doň svoj e-mail.</li>
      <li>Do <code>firebase-config.js</code> vložte konfiguráciu webovej aplikácie, e-mail správcu a prevádzkovateľa.</li>
    </ol>
    <p class="muted">Kým to nie je hotové, stránka nič nezbiera.</p>
  </div>`;
}

function render(user) {
  if ($a('#scr-admin').classList.contains('hidden')) return;
  const body = $a('#admBody');
  if (!user) {
    body.innerHTML = `<form id="admLogin" class="adm-login">
        <p>Přístup jen pro členy závodní rady. Neoprávněný vstup bude zapsán do kádrového posudku.</p>
        <label>E-mail<input id="admEmail" type="email" autocomplete="username" required value="${escA(ADMIN_EMAIL)}"></label>
        <label>Heslo<input id="admPass" type="password" autocomplete="current-password" required></label>
        <div id="admErr" class="err" role="alert"></div>
        <button class="btn" type="submit">Vstoupit</button>
      </form>`;
    $a('#admLogin').addEventListener('submit', async e => {
      e.preventDefault();
      try { await A.signInWithEmailAndPassword(auth, $a('#admEmail').value.trim(), $a('#admPass').value); }
      catch (err) { $a('#admErr').textContent = 'Přístup odepřen. Zkontrolujte e-mail a heslo.'; }
    });
    return;
  }
  body.innerHTML = `<div class="adm-bar"><span>Přihlášen: <b>${escA(user.email)}</b></span>
      <span class="row"><button id="admReload" class="btn small" type="button">Obnovit</button>
      <button id="admCsvC" class="btn small ghost" type="button">Export štítků (CSV)</button>
      <button id="admCsvV" class="btn small ghost" type="button">Export návštěv (CSV)</button>
      <button id="admPurge" class="btn small ghost" type="button">Smazat starší než ${RETENTION_DAYS} dní</button>
      <button id="admOut" class="btn small ghost" type="button">Odhlásit</button></span></div>
    <div id="admData"><p class="muted">Načítám záznamy…</p></div>`;
  $a('#admOut').onclick = () => A.signOut(auth);
  $a('#admReload').onclick = load;
  $a('#admCsvC').onclick = () => csv('stitky', data.cards, ['cas', 'name', 'birth', 'age', 'city', 'region', 'country', 'ipPart', 'services', 'sex', 'answers', 'today', 'index', 'partner', 'partnerBirth', 'partnerCity', 'match']);
  $a('#admCsvV').onclick = () => csv('navstevy', data.visits, ['cas', 'city', 'region', 'country', 'ipPart', 'device', 'browser', 'lang', 'ref', 'screen', 'duration']);
  $a('#admPurge').onclick = purge;
  load();
}

async function load() {
  const { F, db } = await firebase();
  const out = $a('#admData');
  try {
    const q = (col, n) => F.getDocs(F.query(F.collection(db, col), F.orderBy('t', 'desc'), F.limit(n)));
    const [v, c] = await Promise.all([q('visits', 5000), q('cards', 3000)]);
    const conv = d => { const x = d.data(); const t = x.t && x.t.toDate ? x.t.toDate() : new Date(); return { id: d.id, ...x, t, cas: t.toLocaleString('sk-SK') }; };
    data = { visits: v.docs.map(conv), cards: c.docs.map(conv) };
    out.innerHTML = dashboard(data);
  } catch (e) {
    out.innerHTML = `<p class="err">Záznamy se nepodařilo načíst: ${escA(e.message)}. Je e-mail správce uvedený ve firestore.rules?</p>`;
  }
}

// ---------- pomocné výpočty ----------
const count = (arr, f) => { const m = new Map(); for (const x of arr) { const k = f(x); if (k === '' || k == null) continue; m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor(s % 3600 / 60)} min` : s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
function bars(rows, max = 12) {
  const top = rows.slice(0, max), m = Math.max(1, ...top.map(r => r[1]));
  return top.length ? `<div class="adm-bars">${top.map(([k, n]) => `<div class="ab-row"><span class="ab-k">${escA(k)}</span><span class="ab-bar"><i style="width:${n / m * 100}%"></i></span><span class="ab-n">${n}</span></div>`).join('')}</div>` : '<p class="muted">Zatím žádná data.</p>';
}
function columns(labels, values) {
  const m = Math.max(1, ...values);
  return `<div class="adm-cols">${values.map((v, i) => `<div class="ac" title="${escA(labels[i])}: ${v}"><i style="height:${v / m * 100}%"></i><span>${escA(labels[i])}</span></div>`).join('')}</div>`;
}
const tile = (label, val, sub = '') => `<div class="adm-tile"><div class="nixie">${val}</div><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;

function dashboard({ visits, cards }) {
  const now = new Date(), today = dayKey(now), ago = n => new Date(now - n * 864e5);
  const v7 = visits.filter(v => v.t >= ago(7)), v30 = visits.filter(v => v.t >= ago(30));
  const durs = visits.map(v => v.duration || 0).filter(x => x > 0);
  const avg = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0;
  const withCard = new Set(cards.map(c => c.vid).filter(Boolean)).size;
  const partners = cards.filter(c => c.partner);

  // návštevy za 30 dní
  const days = [...Array(30)].map((_, i) => dayKey(ago(29 - i)));
  const perDay = days.map(d => visits.filter(v => dayKey(v.t) === d).length);
  const hours = [...Array(24)].map((_, h) => visits.filter(v => v.t.getHours() === h).length);
  const DOW = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  const dows = [1, 2, 3, 4, 5, 6, 0].map(d => visits.filter(v => v.t.getDay() === d).length);

  // štítky: vek, znamenia dnešného dňa, odpovede
  const ageGroup = a => a < 18 ? 'do 18' : a < 30 ? '18–29' : a < 45 ? '30–44' : a < 60 ? '45–59' : a < 75 ? '60–74' : '75+';
  const decade = c => (c.birth || '').slice(0, 3) + '0. léta';
  const svc = c => c.services === 'K+P' ? 'Kondiciogram + partner' : c.services === 'P' ? 'Jen partner' : 'Jen kondiciogram';
  const firstName = c => { const p = (c.name || '').trim().split(/\s+/); return p.length > 1 ? p[p.length - 1] : p[0]; };
  const todaySyms = []; cards.forEach(c => (c.today || '').split(' ').forEach(t => t && todaySyms.push(t)));
  const qStats = typeof QUESTIONS !== 'undefined' ? QUESTIONS.map((q, qi) => {
    const cnt = q.opts.map(() => 0); let n = 0;
    cards.forEach(c => { const ch = (c.answers || '')[qi]; if (ch && /\d/.test(ch)) { cnt[+ch - 1]++; n++; } });
    if (!n) return '';
    const best = cnt.indexOf(Math.max(...cnt));
    return `<li><b>${escA(q.title)}</b> Nejčastěji: „${escA(q.opts[best].t)}“ (${Math.round(cnt[best] / n * 100)} %)</li>`;
  }).join('') : '';
  const matchAvg = partners.length ? Math.round(partners.reduce((a, c) => a + (c.match || 0), 0) / partners.length) : 0;
  const repeat = count(cards, c => (c.name || '').toUpperCase() + '|' + c.birth).filter(([, n]) => n > 1).length;

  return `
  <div class="adm-tiles">
    ${tile('Návštěvy dnes', visits.filter(v => dayKey(v.t) === today).length)}
    ${tile('Za 7 dní', v7.length)}
    ${tile('Za 30 dní', v30.length)}
    ${tile('Celkem', visits.length, 'jen se souhlasem')}
    ${tile('Průměrný čas', fmtDur(avg), 'medián ' + fmtDur(median(durs)))}
    ${tile('Vyplněné štítky', cards.length, `konverze ${visits.length ? Math.round(withCard / visits.length * 100) : 0} %`)}
    ${tile('Osudoví partneři', partners.length, `průměrná shoda ${matchAvg} %`)}
    ${tile('Opakovaní občané', repeat, 'stejné jméno a datum')}
  </div>

  <div class="adm-grid">
    <section class="adm-box wide"><h4>Návštěvy za posledních 30 dní</h4>${columns(days.map(d => d.slice(8) + '.' + d.slice(5, 7) + '.'), perDay)}</section>
    <section class="adm-box"><h4>Podle hodiny</h4>${columns(hours.map((_, h) => String(h)), hours)}</section>
    <section class="adm-box"><h4>Podle dne v týdnu</h4>${columns([1, 2, 3, 4, 5, 6, 0].map(d => DOW[d]), dows)}</section>
    <section class="adm-box"><h4>Města</h4>${bars(count(visits, v => v.city || '?'), 15)}</section>
    <section class="adm-box"><h4>Kraje a země</h4>${bars(count(visits, v => [v.region, v.country].filter(Boolean).join(', ')), 12)}</section>
    <section class="adm-box"><h4>Zařízení a prohlížeče</h4>${bars(count(visits, v => v.device), 4)}${bars(count(visits, v => v.browser), 6)}</section>
    <section class="adm-box"><h4>Odkud přišli</h4>${bars(count(visits, v => v.ref || 'přímo / záložka'), 10)}</section>
    <section class="adm-box"><h4>Zvolené služby</h4>${bars(count(cards, svc), 3)}<h4>Hledají</h4>${bars(count(partners, c => c.sex === 'm' ? 'partnera' : 'partnerku'), 2)}</section>
    <section class="adm-box"><h4>Věk občanů</h4>${bars(count(cards, c => ageGroup(c.age || 0)), 6)}<h4>Ročníky</h4>${bars(count(cards, decade), 8)}</section>
    <section class="adm-box"><h4>Nejčastější křestní jména</h4>${bars(count(cards, firstName), 10)}</section>
    <section class="adm-box"><h4>Dnešní znaky při výpočtu</h4>${bars(count(todaySyms, x => x), 12)}</section>
    <section class="adm-box wide"><h4>Dotazník: nejčastější odpovědi</h4><ul class="adm-q">${qStats || '<li class="muted">Zatím žádná data.</li>'}</ul></section>
  </div>

  <section class="adm-box wide"><h4>Poslední štítky (${Math.min(150, cards.length)} z ${cards.length})</h4>
    <div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>Čas</th><th>Jméno</th><th>Narozen</th><th>Věk</th><th>Město</th><th>IP</th><th>Služby</th><th>Dnes</th><th>Osudový partner</th><th>Shoda</th></tr></thead><tbody>
    ${cards.slice(0, 150).map(c => `<tr><td>${escA(c.cas)}</td><td>${escA(c.name)}</td><td>${escA(c.birth)}</td><td>${escA(c.age)}</td><td>${escA(c.city)}</td><td>${escA(c.ipPart)}</td><td>${escA(c.services)}</td><td class="mono">${escA(c.today)}</td><td>${escA(c.partner || '–')}${c.partnerBirth ? ` <small>(${escA(c.partnerBirth)}, ${escA(c.partnerCity)})</small>` : ''}</td><td>${c.match ? c.match + ' %' : '–'}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">Zatím žádné štítky.</td></tr>'}
    </tbody></table></div></section>

  <section class="adm-box wide"><h4>Poslední návštěvy (${Math.min(150, visits.length)} z ${visits.length})</h4>
    <div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>Čas</th><th>Město</th><th>Kraj / země</th><th>IP</th><th>Zařízení</th><th>Prohlížeč</th><th>Čas na stránce</th><th>Odkud</th></tr></thead><tbody>
    ${visits.slice(0, 150).map(v => `<tr><td>${escA(v.cas)}</td><td>${escA(v.city)}</td><td>${escA([v.region, v.country].filter(Boolean).join(', '))}</td><td>${escA(v.ipPart)}</td><td>${escA(v.device)}</td><td>${escA(v.browser)}</td><td>${fmtDur(v.duration || 0)}</td><td>${escA(v.ref || '–')}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Zatím žádné návštěvy.</td></tr>'}
    </tbody></table></div></section>`;
}

function csv(name, rows, cols) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = '﻿' + [cols.join(';'), ...rows.map(r => cols.map(c => q(r[c])).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = `kondiciogram-${name}-${dayKey(new Date())}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

async function purge() {
  if (!confirm(`Opravdu trvale smazat záznamy starší než ${RETENTION_DAYS} dní?`)) return;
  const { F, db } = await firebase();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 864e5);
  let n = 0;
  for (const col of ['visits', 'cards']) {
    const snap = await F.getDocs(F.query(F.collection(db, col), F.where('t', '<', cutoff), F.limit(2000)));
    for (const d of snap.docs) { await F.deleteDoc(d.ref); n++; }
  }
  alert(`Smazáno záznamů: ${n}`);
  load();
}

document.getElementById('adminBtn').addEventListener('click', openAdmin);
document.getElementById('admBack').addEventListener('click', () => show('scr-login'));

// na testovanie prehľadu bez databázy
export { dashboard };
