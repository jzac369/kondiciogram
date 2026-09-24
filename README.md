# Kondiciogram: Jáchyme, hoď ho do stroje!

Zábavná webová stránka v štýle 70. rokov. Zadáte dátum narodenia, odpoviete na pár otázok a samočinný počítač vám na perforovaný papier vytlačí osobný kondiciogram, ako vo filme *Jáchyme, hoď ho do stroje!* (1974).

Voľne inšpirované fenoménom kondiciogramov zo 70. rokov. Je to len sranda. A možno nie.

## Ako to spustiť

Stačí otvoriť `index.html` v prehliadači. Server ani build nie sú potrebné. Písma sa načítavajú z Google Fonts.

## Čo stránka vie

- **Bez registrácie a hesiel.** Stačí vyplniť štítok. Rovnaké meno, dátum narodenia a odpovede dajú vždy rovnaký kondiciogram. Posledný štítok si prehliadač zapamätá, aby sa výsledok nestratil po obnovení stránky.
- **Dve služby na rozcestníku:** Kondiciogram a Výber partnera podľa počítača (stačí meno a dátum narodenia).
- **Displej v hornom pruhu** vypisuje 48 hlášok stroja (česky, veľkými písmenami, bez diakritiky).
- **Zvuk:** pri vložení štítku do stroja zaznie vytáčaný modem, pri tlači ihličková tlačiareň. Zvuk je vždy zapnutý.
- **Dátum** sa vyberá po slovensky: deň, mesiac slovom, rok.
- **Dotazník** s 9 otázkami: spánok, pohyb, káva, pivo, stres, láska, tréning hlavy, denný rytmus a povolanie.
- **Dierny štítok** v Hollerithovom kóde (80 stĺpcov), ktorý sa dieruje priebežne podľa odpovedí.
- **Stroj:** štítok zajde do stroja a z tlačiarne vyjde kondiciogram so zvukom ihličkovej tlačiarne.
- **Tlač na papier alebo do PDF** v dizajne perforovaného papiera (A4 na šírku).
- **Dnešný verdikt**, osciloskop biorytmov, plánovač dní, partnerská zhoda a osudový partner alebo partnerka (fiktívna osoba).
- **Kontrola s filmom:** pre dátum 16. 2. 1935 a rok 1973 stroj vytlačí rovnaké znaky ako originál z filmu.
- Rozloženie pre mobil, tablet, iPad (na výšku aj na šírku) a počítač.

## Logika kondiciogramu

Tri sínusové cykly od dňa narodenia: fyzický (23 dní), citový (28 dní) a intelektový (33 dní). Znak dňa sa určí na intervale ⟨t − ½, t + ½⟩:

| Znak | Význam |
|------|--------|
| `*`  | plusová fáza |
| `.`  | mínusová fáza |
| `X`  | kritický deň, krivka klesá cez nulu |
| `0`  | kritický deň, krivka stúpa cez nulu |

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
