// ================= ZÁZNAM NÁVŠTEV (len so súhlasom návštevníka) =================
// Ukladá: mesto, kraj, krajinu, skrátenú IP adresu, zariadenie, čas na stránke
// a pri vyplnení štítku meno, dátum narodenia a výsledky. Bez súhlasu sa neukladá nič.
import { firebaseConfig, OPERATOR } from './firebase-config.js';

const V = '10.12.2';
const CONSENT_KEY = 'kg.consent';
let F = null, db = null, visitRef = null, geo = null, visibleMs = 0, visibleFrom = null, lastSent = -1;

const getConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } };
const setConsent = v => { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { } };

export async function firebase() {
  if (!firebaseConfig) return null;
  if (db) return { F, db };
  const [{ initializeApp, getApps }, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  F = fs; db = fs.getFirestore(app);
  return { F, db, app };
}

function maskIp(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) { const p = ip.split('.'); return `${p[0]}.${p[1]}.x.x`; }
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + ':…';
  return '';
}
async function getGeo() {
  try {
    const r = await fetch('https://ipwho.is/?fields=ip,city,region,country_code', { cache: 'no-store' });
    const j = await r.json();
    return { city: (j.city || '').slice(0, 80), region: (j.region || '').slice(0, 80), country: (j.country_code || '').slice(0, 4), ipPart: maskIp(j.ip || '') };
  } catch (e) { return { city: '', region: '', country: '', ipPart: '' }; }
}
function device() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return Math.min(screen.width, screen.height) >= 700 ? 'tablet' : 'mobil';
  return 'počítač';
}
function browser() {
  const ua = navigator.userAgent;
  return /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'iný';
}
// čas na stránke = čas, keď bola karta viditeľná
const activeMs = () => visibleMs + (visibleFrom ? Date.now() - visibleFrom : 0);
function trackVisibility() {
  visibleFrom = document.hidden ? null : Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (visibleFrom) visibleMs += Date.now() - visibleFrom; visibleFrom = null; ping(); }
    else visibleFrom = Date.now();
  });
  addEventListener('pagehide', ping);
  setInterval(ping, 15000);
}
async function ping() {
  if (!visitRef) return;
  const s = Math.min(86400, Math.round(activeMs() / 1000));
  if (s === lastSent) return;
  lastSent = s;
  try { await F.updateDoc(visitRef, { duration: s }); } catch (e) { }
}

async function startVisit() {
  const fb = await firebase(); if (!fb) return;
  geo = await getGeo();
  const d = new Date();
  try {
    visitRef = await F.addDoc(F.collection(db, 'visits'), {
      consent: true, t: F.serverTimestamp(),
      day: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      hour: d.getHours(), dow: d.getDay(), ...geo,
      device: device(), browser: browser(), lang: (navigator.language || '').slice(0, 10),
      ref: document.referrer ? (() => { try { return new URL(document.referrer).hostname.slice(0, 80); } catch (e) { return ''; } })() : '',
      screen: `${screen.width}x${screen.height}`, duration: 0
    });
  } catch (e) { visitRef = null; }
}

// zavolá app.js po vyplnení štítku
async function logCard(c) {
  if (getConsent() !== 'yes') return;
  const fb = await firebase(); if (!fb) return;
  if (!geo) geo = await getGeo();
  try { await F.addDoc(F.collection(db, 'cards'), { consent: true, t: F.serverTimestamp(), vid: visitRef ? visitRef.id : '', ...geo, ...c }); } catch (e) { }
}

function showBanner() {
  const b = document.getElementById('consentBar'); if (!b) return;
  b.classList.remove('hidden');
  b.querySelector('#consentYes').onclick = () => { setConsent('yes'); b.classList.add('hidden'); startVisit(); };
  b.querySelector('#consentNo').onclick = () => { setConsent('no'); b.classList.add('hidden'); };
}

window.kgTrack = {
  enabled: () => !!firebaseConfig,
  card: c => { logCard(c).catch(() => { }); },
  consent: getConsent,
  reset: () => { setConsent(''); showBanner(); }
};

if (firebaseConfig) {
  document.body.classList.add('tracking-on');
  const op = document.getElementById('opName'); if (op) op.textContent = OPERATOR ? ` (${OPERATOR})` : '';
  const rs = document.getElementById('consentReset'); if (rs) rs.addEventListener('click', () => { setConsent(''); showBanner(); });
  trackVisibility();
  const c = getConsent();
  if (c === 'yes') startVisit();
  else if (c !== 'no') showBanner();
}
