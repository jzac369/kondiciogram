// ================= NASTAVENIE PRIPOJENIA K DATABÁZE (Firebase) =================
// Kým je firebaseConfig = null, stránka nič nezbiera a administrátorská zóna ukáže návod.
// Hodnoty skopírujte z Firebase Console → Project settings → Your apps → Web app → SDK setup (Config).
// Tieto hodnoty nie sú tajné; dáta chránia pravidlá vo firestore.rules.

export const firebaseConfig = {
  apiKey: 'AIzaSyBtUV8J_XpZVFPTxdjFJ48z2AY0NE94neQ',
  authDomain: 'kondiciogram-92da6.firebaseapp.com',
  projectId: 'kondiciogram-92da6',
  storageBucket: 'kondiciogram-92da6.firebasestorage.app',
  messagingSenderId: '18557292051',
  appId: '1:18557292051:web:22f454d6b5fca3b59e79e6'
};
/* príklad:
export const firebaseConfig = {
  apiKey: '...',
  authDomain: 'kondiciogram-xxxx.firebaseapp.com',
  projectId: 'kondiciogram-xxxx',
  storageBucket: 'kondiciogram-xxxx.appspot.com',
  messagingSenderId: '...',
  appId: '...'
};
*/

// e-mail účtu závodnej rady (musí byť rovnaký aj vo firestore.rules)
export const ADMIN_EMAIL = 'foresttt11@outlook.com';

// prevádzkovateľ uvedený v informácii o ochrane údajov (meno a kontaktný e-mail)
export const OPERATOR = '';

// po koľkých dňoch sa majú záznamy mazať (tlačidlo v administrátorskej zóne)
export const RETENTION_DAYS = 365;
