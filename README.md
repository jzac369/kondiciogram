# Kondiciogram: Jáchyme, hoď ho do stroje!

Zábavná webová stránka v štýle 70. rokov. Zadáte dátum narodenia, odpoviete na pár otázok a samočinný počítač vám na perforovaný papier vytlačí osobný kondiciogram, ako vo filme *Jáchyme, hoď ho do stroje!* (1974).

Voľne inšpirované fenoménom kondiciogramov zo 70. rokov. Je to len sranda. A možno nie.

## Ako to spustiť

Stačí otvoriť `index.html` v prehliadači. Server ani build nie sú potrebné. Písma sa načítavajú z Google Fonts.

## Čo stránka vie

- **Bez registrácie a hesiel.** Stačí vyplniť štítok. Rovnaké meno, dátum narodenia a odpovede dajú vždy rovnaký kondiciogram. Posledný štítok si prehliadač zapamätá, aby sa výsledok nestratil po obnovení stránky.
- **Dve služby na úvode (česky):** zaškrtávacie políčka „Kondiciogram“ a „Výběr osudového partnera“. Dá sa zvoliť jedna alebo obe; stroj ich vytlačí naraz na jeden výpis.
- **Výběr osudového partnera** je celý po česky (mená, mestá a obce po slovensky): jediný partner s najlepšou zhodou biorytmov, milostný provoz a hlášky stroja.
- **Displej v hornom pruhu** vypisuje 48 hlášok stroja (česky, veľkými písmenami, bez diakritiky).
- **Zvuk:** pri vložení štítku do stroja zaznie vytáčaný modem, pri tlači ihličková tlačiareň. Zvuk je vždy zapnutý.
- **Dátum** sa vyberá po slovensky: deň, mesiac slovom, rok.
- **Dotazník** s 9 otázkami: spánok, pohyb, káva, pivo, stres, láska, tréning hlavy, denný rytmus a povolanie.
- **Dierny štítok** v Hollerithovom kóde (80 stĺpcov), ktorý sa dieruje priebežne podľa odpovedí.
- **Stroj:** štítok zajde do stroja a z tlačiarne vyjde kondiciogram so zvukom ihličkovej tlačiarne.
- **Tlač na papier alebo do PDF**: A4 na šírku, bez okrajov, biele pozadie (šetrí atrament), dierky po stranách a písmo ihličkovej tlačiarne (Doto).
- **Dnešný verdikt**, osciloskop biorytmov, plánovač dní, partnerská zhoda a osudový partner alebo partnerka (fiktívna osoba).
- **Kontrola s filmom:** pre dátum 16. 2. 1935 a rok 1973 stroj vytlačí rovnaké znaky ako originál z filmu.
- Rozloženie pre mobil, tablet, iPad (na výšku aj na šírku) a počítač.

## Logika kondiciogramu

Tri sínusové cykly od dňa narodenia: fyzický (23 dní), citový (28 dní) a intelektový (33 dní). Znak dňa sa určí na intervale ⟨t − ½, t + ½⟩:

| Znak | Význam |
|------|--------|
| `*`  | úspešný, priaznivý deň (krivka nad nulou) |
| `.`  | neúspešný, nepriaznivý deň (krivka pod nulou) |
| `0`  | ošidný deň: niečo medzi, treba opatrnosť (krivka stúpa cez nulu) |
| `X`  | kritický deň: najhorší variant, výrazné varovanie (krivka padá cez nulu) |

Odpovede z dotazníka posunú každú krivku hore alebo dole najviac o 0,4. Povolanie určuje váhy cyklov v celkovom indexe.

## Reklama (Google AdSense)

Na stránke sú dve miesta pre reklamu, označené ako „Reklama · Inzercia“. Keď bude web verejný a schválený v AdSense:

1. V `index.html` odkomentujte skript `adsbygoogle.js` v `<head>` a doplňte svoje `ca-pub-…`.
2. V oboch prvkoch `<ins class="adsbygoogle">` doplňte `data-ad-client` a `data-ad-slot`.

Sloty sa potom aktivujú samy (funkcia `initAds` v `app.js`). Kým je tam zástupné ID, zobrazuje sa iba rámček „Tu môže byť vaša reklama“.

## Súbory

- `index.html`: štruktúra stránky
- `style.css`: retro dizajn, tlač a rozloženie pre rôzne zariadenia
- `app.js`: výpočty, dierny štítok, stroj, tlač a zvuky
- `img/`: ilustrácie a fotografia originálneho kondiciogramu z filmu

Biorytmy nemajú vedecké potvrdenie. Fanúšikovský projekt bez spojenia s autormi filmu.

## Zóna závodnej rady (administrácia a analytika)

Nenápadné tlačidlo **„Vstup je pro závodní radu“** v päte otvorí prihlásenie správcu. Po prihlásení je k dispozícii:

- návštevy dnes, za 7 a 30 dní, spolu, priemerný a mediánový čas na stránke,
- grafy návštev podľa dní, hodín a dní v týždni,
- mestá, kraje a krajiny, zariadenia, prehliadače, odkiaľ ľudia prišli,
- zvolené služby, koho hľadajú, vek a ročníky, najčastejšie krstné mená, dnešné znaky, najčastejšie odpovede v dotazníku,
- tabuľky posledných štítkov (meno, dátum narodenia, mesto, skrátená IP, výsledky, osudový partner) a návštev,
- export do CSV a mazanie záznamov starších ako 365 dní.

Záznamy sa ukladajú **len so súhlasom návštevníka** (lišta pri prvej návšteve, informácia o ochrane údajov v päte).

### Nastavenie (Firebase)

1. Vo [Firebase Console](https://console.firebase.google.com) vytvorte projekt a pridajte **Web app**.
2. Zapnite **Firestore Database** (región europe-west) a **Authentication → Email/Password**.
3. V **Authentication → Users** vytvorte účet správcu (svoj e-mail a heslo).
4. Do **Firestore → Rules** vložte obsah súboru `firestore.rules` a nahraďte `ADMIN@EXAMPLE.COM` svojím e-mailom.
5. Do `firebase-config.js` vložte konfiguráciu webovej aplikácie, e-mail správcu a meno a kontakt prevádzkovateľa.

Kým je `firebaseConfig = null`, stránka nič nezbiera a funguje ako predtým.
