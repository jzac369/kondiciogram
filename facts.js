'use strict';
/* ================= ZAUJÍMAVOSTI A OSOBNÁ ŠŤASTENA (sekcia na nástenke) =================
   Všetko sa počíta z dátumu narodenia a dneška; rovnaké údaje = rovnaký výsledok.
   Súbor sa načíta pred app.js, funkcie z app.js (fromN, dn, fmt, …) používa až pri vykreslení. */

// ---------- slovenský menný kalendár (index = mesiac 0–11, deň 1–31) ----------
const MENINY = [
  ['', 'Alexandra, Karina', 'Daniela', 'Drahoslav', 'Andrea', 'Antónia', 'Bohuslava', 'Severín', 'Alexej', 'Dáša', 'Malvína', 'Ernest', 'Rastislav', 'Radovan', 'Dobroslav', 'Kristína', 'Nataša', 'Bohdana', 'Drahomíra, Mário', 'Dalibor', 'Vincent', 'Zora', 'Miloš', 'Timotej', 'Gejza', 'Tamara', 'Bohuš', 'Alfonz', 'Gašpar', 'Ema', 'Emil'],
  ['Tatiana', 'Erika, Erik', 'Blažej', 'Veronika', 'Agáta', 'Dorota', 'Vanda', 'Zoja', 'Zdenko', 'Gabriela', 'Dezider', 'Perla', 'Arpád', 'Valentín', 'Pravoslav', 'Ida, Liana', 'Miloslava', 'Jaromír', 'Vlasta', 'Lívia', 'Eleonóra', 'Etela', 'Roman, Romana', 'Matej', 'Frederik, Frederika', 'Viktor', 'Alexander', 'Zlatica', 'Radomír'],
  ['Albín', 'Anežka', 'Bohumil, Bohumila', 'Kazimír', 'Fridrich', 'Radoslav, Radoslava', 'Tomáš', 'Alan, Alana', 'Františka', 'Branislav, Bruno', 'Angela, Angelika', 'Gregor', 'Vlastimil', 'Matilda', 'Svetlana', 'Boleslav', 'Ľubica', 'Eduard', 'Jozef', 'Víťazoslav, Klaudius', 'Blahoslav', 'Beňadik', 'Adrián', 'Gabriel', 'Marián', 'Emanuel', 'Alena', 'Soňa', 'Miroslav', 'Vieroslava', 'Benjamín'],
  ['Hugo', 'Zita', 'Richard', 'Izidor', 'Miroslava', 'Irena', 'Zoltán', 'Albert', 'Milena', 'Igor', 'Július', 'Estera', 'Aleš', 'Justína', 'Fedor', 'Dana, Danica', 'Rudolf, Rudolfa', 'Valér', 'Jela', 'Marcel', 'Ervín', 'Slavomír', 'Vojtech', 'Juraj', 'Marek', 'Jaroslava', 'Jaroslav', 'Jarmila', 'Lea', 'Anastázia'],
  ['', 'Žigmund', 'Galina, Timea', 'Florián', 'Lesana, Lesia', 'Hermína', 'Monika', 'Ingrida', 'Roland', 'Viktória', 'Blažena', 'Pankrác', 'Servác', 'Bonifác', 'Žofia, Sofia', 'Svetozár', 'Gizela, Aneta', 'Viola', 'Gertrúda', 'Bernard', 'Zina', 'Júlia, Juliana', 'Želmíra', 'Ela', 'Urban, Vivien', 'Dušan', 'Iveta', 'Viliam', 'Vilma', 'Ferdinand', 'Petrana, Petronela'],
  ['Žaneta', 'Xénia, Oxana', 'Karolína', 'Lenka', 'Laura', 'Norbert', 'Róbert, Robin', 'Medard', 'Stanislava', 'Margaréta, Gréta', 'Dobroslava', 'Zlatko', 'Anton', 'Vasil', 'Vít', 'Blanka, Bianka', 'Adolf', 'Vratislav', 'Alfréd', 'Valéria', 'Alojz', 'Paulína', 'Sidónia', 'Ján', 'Olívia, Tadeáš', 'Adriána', 'Ladislav, Ladislava', 'Beáta', 'Peter, Pavol, Petra', 'Melánia'],
  ['Diana', 'Berta', 'Miloslav', 'Prokop', 'Cyril, Metod', 'Patrik, Patrícia', 'Oliver', 'Ivan', 'Lujza', 'Amália', 'Milota', 'Nina', 'Margita', 'Kamil', 'Henrich', 'Drahomír, Rút', 'Bohuslav', 'Kamila', 'Dušana', 'Iľja, Eliáš', 'Daniel', 'Magdaléna', 'Oľga', 'Vladimír', 'Jakub, Timur', 'Anna, Hana, Anita', 'Božena', 'Krištof', 'Marta', 'Libuša', 'Ignác'],
  ['Božidara', 'Gustáv', 'Jerguš', 'Dominik, Dominika', 'Hortenzia', 'Jozefína', 'Štefánia', 'Oskar', 'Ľubomíra', 'Vavrinec', 'Zuzana', 'Darina', 'Ľubomír', 'Mojmír', 'Marcela', 'Leonard', 'Milica', 'Elena, Helena', 'Lýdia', 'Anabela, Liliana', 'Jana', 'Tichomír', 'Filip', 'Bartolomej', 'Ľudovít', 'Samuel', 'Silvia', 'Augustín', 'Nikola, Nikolaj', 'Ružena', 'Nora'],
  ['Drahoslava', 'Linda, Rebeka', 'Belo', 'Rozália', 'Regína', 'Alica', 'Marianna', 'Miriama', 'Martina', 'Oleg', 'Bystrík', 'Mária, Marlena', 'Ctibor', 'Ľudomil', 'Jolana', 'Ľudmila', 'Olympia', 'Eugénia', 'Konštantín', 'Ľuboslav, Ľuboslava', 'Matúš', 'Móric', 'Zdenka', 'Ľuboš, Ľubor', 'Vladislav, Vladislava', 'Edita', 'Cyprián', 'Václav', 'Michal, Michaela', 'Jarolím'],
  ['Arnold', 'Levoslav', 'Stela', 'František', 'Viera', 'Natália', 'Eliška', 'Brigita', 'Dionýz', 'Slavomíra', 'Valentína', 'Maximilián', 'Koloman', 'Boris', 'Terézia', 'Vladimíra', 'Hedviga', 'Lukáš', 'Kristián', 'Vendelín', 'Uršuľa', 'Sergej', 'Alojzia', 'Kvetoslava', 'Aurel', 'Demeter', 'Sabína', 'Dobromila', 'Klára', 'Šimon, Simona', 'Aurélia'],
  ['Denis, Denisa', '', 'Hubert', 'Karol', 'Imrich', 'Renáta', 'René', 'Bohumír', 'Teodor', 'Tibor', 'Martin, Maroš', 'Svätopluk', 'Stanislav', 'Irma', 'Leopold', 'Agnesa', 'Klaudia', 'Eugen', 'Alžbeta', 'Félix', 'Elvíra', 'Cecília', 'Klement', 'Emília', 'Katarína', 'Kornel', 'Milan', 'Henrieta', 'Vratko', 'Ondrej, Andrej'],
  ['Edmund', 'Bibiána', 'Oldrich', 'Barbora, Barbara', 'Oto', 'Mikuláš', 'Ambróz', 'Marína', 'Izabela', 'Radúz', 'Hilda', 'Otília', 'Lucia', 'Branislava, Bronislava', 'Ivica', 'Albína', 'Kornélia', 'Sláva', 'Judita', 'Dagmara', 'Bohdan', 'Adela', 'Nadežda', 'Adam, Eva', '', 'Štefan', 'Filoména', 'Ivana, Ivona', 'Milada', 'Dávid', 'Silvester']
];
const MENINY_SVIATOK = { '0-1': 'Deň vzniku Slovenskej republiky', '4-1': 'Sviatok práce', '10-2': 'Pamiatka zosnulých', '11-25': 'Prvý sviatok vianočný' };

// ---------- orientačné ceny podľa obdobia (približne) ----------
const CENY = [   // len overené údaje: ČSÚ, ŠÚ SR, dobové cenníky
  { od: 1900, do: 1952, text: 'Ceny z tých čias sa s dneškom porovnávajú ťažko: menová reforma v roku 1953 všetky ceny aj úspory prepočítala. Napríklad pollitrová fľaša desiatky stála v roku 1952 ešte 9 Kčs, v roku 1983 už len 1,70 Kčs.' },
  { od: 1953, do: 1963, mena: 'Kčs', polozky: [['rožok', '0,30 – 0,40'], ['chlieb ražno-pšeničný (1 kg)', '2,60 (od konca 50. rokov)'], ['priemerná mesačná mzda', 'asi 1 200']] },
  { od: 1964, do: 1975, mena: 'Kčs', polozky: [['rožok', '0,30'], ['chlieb ražno-pšeničný (1 kg)', '2,60'], ['kockový cukor (1 kg)', '8'], ['Škoda 1000 MB (1964)', 'asi 44 000'], ['priemerná mesačná mzda (1970)', 'asi 1 900']] },
  { od: 1976, do: 1988, mena: 'Kčs', polozky: [['rožok', '0,30 – 0,40'], ['chlieb ražno-pšeničný (1 kg)', '2,60'], ['fľaškové pivo desiatka (0,5 l)', '1,70'], ['kockový cukor (1 kg)', '8'], ['Škoda 105 (1976)', 'asi 55 000'], ['priemerná mesačná mzda (1983)', '2 808']] },
  { od: 1989, do: 1990, mena: 'Kčs', polozky: [['rožok', '0,40'], ['chlieb (1 kg)', '2,80'], ['polotučné mlieko (1 l)', '2'], ['tvaroh', '1,50'], ['Škoda Favorit', '84 000'], ['priemerná mesačná mzda', 'asi 3 130']] },
  { od: 1991, do: 1992, text: 'V januári 1991 sa uvoľnili ceny a mnohé tovary za pár mesiacov výrazne zdraželi. Ešte v roku 1989 stál rožok 40 halierov a kilo chleba 2,80 Kčs.' },
  { od: 1993, do: 2008, text: 'Platila slovenská koruna a ceny sa rok čo rok menili. Pre porovnanie: rožok stál v roku 1989 40 halierov, v roku 2018 už 6 centov (asi 1,80 Sk). Kilo chleba sa za ten čas zdražilo z 2,80 Kčs na 1,33 €.' },
  { od: 2009, do: 2100, mena: '€', rok: 2018, polozky: [['rožok', '0,06'], ['chlieb (1 kg)', '1,33'], ['polotučné mlieko (1 l)', '0,74'], ['obedové menu', '3,82'], ['priemerná mesačná mzda', '1 013']] }
];

// ---------- Osobná šťastena: 5 častí × 30 viet = 150 rôznych veštieb ----------
const STASTENA = [
  [ // úvod
    'Vidím vo vašich hviezdach svetlo, ktoré ešte len prichádza.', 'Karty sa rozložili v zriedkavom poradí, aké vídam raz za mnoho rokov.',
    'Moja krištáľová guľa sa pri vašom mene rozžiarila ako lampa v rannej hmle.', 'Čiary vašej dlane rozprávajú príbeh, ktorý sa ešte nezačal, ale už sa naň teší.',
    'V kávovej usadenine vidím cestu, ktorá sa kľukatí, no vedie do slnka.', 'Hviezdy nad vaším domom sa nedávno potichu pohli správnym smerom.',
    'Vo sne sa mi zjavila biela sova a doniesla mi vaše meno.', 'Plameň sviečky sa pri vašom osude nakláňa k dobrému.',
    'Staré tarotové karty po mojej babičke pre vás vyťahujú samé svetlé listy.', 'Vietor mi pošepkal, že vaša najlepšia kapitola sa ešte len píše.',
    'Mesiac nad vaším rodným domom svieti jasnejšie, než by mal.', 'Keď som hodila fazuľky, všetky padli okolo slova šťastie.',
    'V zrkadle, ktoré neklame, vidím vašu tvár veselšiu, než je dnes.', 'Kyvadlo sa nad vaším menom rozkývalo do kruhu, a to je dobré znamenie.',
    'Vaša hviezda nie je na oblohe najväčšia, no bliká najvytrvalejšie.', 'Havran na mojom okne dnes zakrákal trikrát, čo vždy veští príjemné správy.',
    'V lístkoch čaju vidím kotvu a vedľa nej malý balón.', 'Nebo nad Tatrami mi v noci ukázalo znamenie, ktoré patrí vám.',
    'Moje staré hodiny sa pri vašom mene na chvíľu zastavili, aby si vás zapamätali.', 'Runy, ktoré mi padli z vrecúška, hovoria jasnou rečou.',
    'Osud pre vás pletie šál z mäkkej vlny a ešte ho nedoplietol.', 'V dyme bylinkového kadidla sa vytvoril obrázok otvorených dverí.',
    'Vaše číslo šťastia sa mi dnes trikrát objavilo na ceste.', 'Guľa vám praje, a to sa stáva len tým, ktorí si to naozaj zaslúžia.',
    'Hviezdy vám nesľubujú zázraky, sľubujú niečo lepšie: pokojné radosti.', 'Keď som miešala karty, jedna vyskočila sama a bola to Hviezda.',
    'V snehovej vločke na mojom okne som zazrela kúsok vašej budúcnosti.', 'Pod vašou dlaňou cítim teplo, aké majú len ľudia s dobrým osudom.',
    'Planéty sa kvôli vám zoradili tak, ako to robia len výnimočne.', 'Stará vešťica z jarmoku by vám povedala to isté čo ja: čaká vás niečo krásne.'
  ],
  [ // ľudia a láska
    'Príde k vám človek s úsmevom, ktorý si budete pamätať celý život.', 'Niekto, na koho ste dávno nepomysleli, vám napíše milý list.',
    'Pri stole plnom ľudí sa budete smiať tak, až vám vyhŕknu slzy.', 'Stretnete dušu, ktorá rozumie vašim vtipom aj vášmu mlčaniu.',
    'Starý priateľ vám vráti dávnu láskavosť v čase, keď to najviac oceníte.', 'Vaše srdce sa zahreje pri obyčajnom pozdrave od suseda.',
    'Niekto vám potichu drží palce viac, ako tušíte.', 'Dostanete objatie, ktoré vám vynahradí všetky zmeškané.',
    'V dave cudzích ľudí uvidíte tvár, ktorá sa vám stane blízkou.', 'Rodina sa zíde pri príležitosti, na ktorú sa bude dlho spomínať.',
    'Láska k vám príde nenápadne, ako teplý vietor na jar.', 'Dieťa vám povie vetu, ktorá vám rozjasní celý týždeň.',
    'Vaša dobrota sa vám vráti v podobe, akú ste nečakali.', 'Budete niekomu oporou a on vám to raz stonásobne oplatí.',
    'Pri tanci na zábave zistíte, že to ešte stále viete.', 'Človek, ktorého obdivujete, vás pochváli pred ostatnými.',
    'Nečakaný telefonát vám prinesie pozvanie, ktoré zmení vaše leto.', 'Dvaja ľudia, ktorí sa hnevali, sa kvôli vám zmieria.',
    'Nájdete priateľstvo tam, kde ste hľadali len radu.', 'Niekto vám upečie koláč len preto, že si na vás spomenul.',
    'Vo vlaku sa dáte do reči s človekom, ktorý vám otvorí nové dvere.', 'Vaše meno padne v rozhovore, v ktorom sa o vás hovorí len dobré.',
    'Láskavé slová, ktoré ste raz povedali, sa k vám vrátia ako pieseň.', 'Stretnutie po rokoch bude také, akoby ste sa videli včera.',
    'Vaša prítomnosť niekomu zachráni deň a vy sa o tom dozviete.', 'Niekto si s vami bude chcieť zaspievať a vy prekvapivo privolíte.',
    'Dostanete list písaný rukou, ktorý si odložíte do škatuľky s pokladmi.', 'Pri spoločnej večeri padne rozhodnutie, ktoré všetkých poteší.',
    'Váš úsmev bude dôvodom, prečo sa niekto rozhodne byť odvážnejší.', 'Človek, ktorému ste kedysi pomohli, vám príde poďakovať.'
  ],
  [ // práca, peniaze, šťastie
    'V práci sa vám podarí vec, o ktorej ostatní tvrdili, že sa nedá.', 'Nájdete peniaze vo vrecku kabáta, ktorý ste dlho nenosili.',
    'Vaša trpezlivosť bude odmenená sumou, ktorá vás milo prekvapí.', 'Dostanete ponuku, pri ktorej vám srdce poskočí od radosti.',
    'Nápad, ktorý vám príde pri umývaní riadu, bude mať veľkú cenu.', 'Šéf, kolega alebo učiteľ uzná, že ste mali pravdu.',
    'V lotérii života vám padne číslo, na ktoré ste nestavili.', 'Naučíte sa niečo nové a pôjde vám to ľahšie, než ste čakali.',
    'Vec, ktorú ste odkladali, sa zrazu vyrieši sama.', 'Dostanete darček, ktorý bude presne to, po čom ste potajomky túžili.',
    'Vaša šikovnosť zachráni situáciu a ľudia si to budú pamätať.', 'Na trhu alebo v obchode natrafíte na poklad za pár drobných.',
    'Dokončíte dielo, na ktoré budete hrdí ešte dlhé roky.', 'Zlá správa sa ukáže ako omyl a za ňou príde tá dobrá.',
    'Vyhráte súťaž, do ktorej ste sa prihlásili len zo žartu.', 'Vaše úspory porastú pokojne ako strom v záhrade.',
    'Zistíte, že máte talent, o ktorom ste netušili.', 'Papier, ktorý podpíšete, vám prinesie pokoj a istotu.',
    'Práca vám bude istý čas pripadať ako hra.', 'Niekto vám vráti požičané presne vo chvíli, keď sa to hodí.',
    'Pri upratovaní nájdete vec, ktorá má väčšiu hodnotu, než ste si mysleli.', 'Úrad, ktorý bol vždy pomalý, vám raz vybaví všetko na počkanie.',
    'Vaša rada inému prinesie šťastie aj vám.', 'Rozhodnutie, nad ktorým váhate, sa ukáže ako správne.',
    'Príde obdobie, keď vám bude všetko vychádzať na prvý raz.', 'Stroj, ktorý sa pokazil, sa po vašom dotyku znova rozbehne.',
    'Príde deň, keď si budete môcť dovoliť malý luxus bez výčitiek.', 'Kniha, ktorú otvoríte náhodou, vám dá odpoveď na dôležitú otázku.',
    'Vaša práca poteší viac ľudí, než si dokážete predstaviť.', 'Za odvahu, ktorú prejavíte, dostanete zaslúženú odmenu.'
  ],
  [ // domov, zdravie, cesty
    'Čaká vás cesta k vode, kde budete bez starostí pozerať na západ slnka.', 'Váš domov sa naplní vôňou, smiechom a hosťami.',
    'Budete sa cítiť zdraví a svieži, akoby vám niekto vrátil pár rokov.', 'Na výlete do hôr vám počasie vyjde presne podľa želania.',
    'Vaša záhrada alebo kvetináč vám prinesie úrodu, akú ste ešte nemali.', 'Prespíte noc tak sladko, že sa zobudíte s úsmevom.',
    'Uvidíte miesto, o ktorom ste snívali od detstva.', 'Nové kreslo, posteľ alebo hrnček vám urobí každodennú radosť.',
    'Prechádzka, ktorú podniknete len tak, vás privedie k niečomu nádhernému.', 'Zvieratko, ktoré stretnete, sa k vám pritúli ako k starému známemu.',
    'Zažijete leto, na ktoré budete spomínať každý Silvester.', 'Váš byt alebo dom zažije malú premenu, ktorá všetkých poteší.',
    'Po dlhom čase si oddýchnete tak, ako si zaslúžite.', 'Vlak, autobus aj počasie budú na vašej strane.',
    'V novom meste sa budete cítiť ako doma.', 'Vaše telo vám poďakuje za každý krok, ktorý mu doprajete.',
    'Pri kúpeli v teplej vode vás napadne myšlienka, ktorá vám zmení deň.', 'Na chate alebo chalupe prežijete najpokojnejší víkend za dlhé roky.',
    'Zimný večer pri čaji bude taký útulný, že naň nezabudnete.', 'Vrátite sa na miesto zo svojho detstva a bude krajšie, než ste si pamätali.',
    'Stretnete more, jazero alebo rieku, ktoré vás naučia trpezlivosti.', 'Prídu dni plné energie, keď všetko stihnete s ľahkosťou.',
    'Vaša kuchyňa uvarí jedlo, o ktorého recept sa budú hostia pýtať.', 'Na dovolenke zažijete nečakané dobrodružstvo s dobrým koncom.',
    'Pod hviezdami vám bude teplo, aj keď bude noc chladná.', 'Vaše kroky vás zavedú na kopec, z ktorého uvidíte ďaleko do budúcnosti.',
    'Prvý sneh, prvá čerešňa alebo prvý kvet vám prinesú zvláštnu radosť.', 'Vaša spálňa sa stane miestom tých najkrajších snov.',
    'Budete sa smiať na bicykli, v aute alebo vo vlaku ako malé dieťa.', 'Čaká vás čas, keď sa nebudete musieť nikam ponáhľať.'
  ],
  [ // znamenie na záver
    'Keď uvidíte na oblohe dúhu, vedzte, že sa to začína.', 'Znamenie spoznáte podľa toho, že vám niekto nečakane podá ruku.',
    'Nehľadajte to, samo si vás to nájde vo chvíli, keď sa najmenej nazdáte.', 'Ten deň začne obyčajne, ale skončí tak, že si ho zapíšete do kalendára.',
    'Majte otvorené oči, lebo šťastie rado chodí nenápadne.', 'Keď vám na plece sadne lienka, spomeňte si na moje slová.',
    'Osud vám pošle tri malé znamenia a to štvrté bude to veľké.', 'Hviezdy radia: usmievajte sa, zvyšok zariadia ony.',
    'Keď začujete svoju obľúbenú pieseň z cudzieho okna, bude to ono.', 'Všetko príde v správny čas, ani o deň skôr, ani o deň neskôr.',
    'Až nájdete štvorlístok, nekupujte los, šťastie je už na ceste.', 'Keď bude mať pena na vašej káve tvar srdiečka, pousmejte sa.',
    'Nedovoľte nikomu, aby vám to vyhováral, lebo guľa sa nemýli.', 'Pri najbližšom splne si potichu niečo zaželajte.',
    'Stačí, keď zostanete sami sebou, zvyšok je už napísaný.', 'Keď poštár zazvoní dvakrát, otvorte s úsmevom.',
    'Odložte si túto predpoveď, raz si na ňu spomeniete a zasmejete sa.', 'Keď vám bude najlepšie, obzrite sa, kto stojí vedľa vás.',
    'Moja guľa sa v dobrých veciach ešte nikdy nezmýlila.', 'Keď vietor zmení smer, zmení sa aj vaše šťastie, a to k lepšiemu.',
    'Vaša šťastná farba je zelená a šťastné číslo sa vám ukáže samo.', 'Keď niekde uvidíte číslo sedem trikrát za sebou, budete vedieť.',
    'Ďakujte každému dňu, lebo jeden z nich vám prinesie všetko naraz.', 'Ak budete pochybovať, pozrite sa na nočnú oblohu a spomeňte si.',
    'Na znak, že je to pravda, sa vám dnes v noci prisní niečo pekné.', 'Keď zazvoní telefón v nezvyčajnú hodinu, nebojte sa zdvihnúť.',
    'Zapamätajte si túto chvíľu, raz o nej budete rozprávať vnúčatám.', 'Keď vám na ulici niekto pochváli topánky, šťastie je za rohom.',
    'Veštkyňa sa lúči, no vaša hviezda žiari ďalej.', 'A pamätajte: to najlepšie sa stane, keď sa na to prestanete pozerať.'
  ]
];
// číslo veštby 0–149 → päť viet; dvojica (1. a 2. veta) jednoznačne určuje číslo, takže všetkých 150 veštieb je rôznych
function stastena(no) {
  const r = no % 30, q = Math.floor(no / 30) % 5;
  return [STASTENA[0][r], STASTENA[1][(r + q * 6 + 1) % 30], STASTENA[2][(r * 7 + q * 11 + 2) % 30], STASTENA[3][(r * 11 + q * 5 + 3) % 30], STASTENA[4][(r * 13 + q * 17 + 4) % 30]];
}

// ---------- výpočty ----------
const ZVEROKRUH_SK = [[120, 'Kozorožec'], [219, 'Vodnár'], [321, 'Ryby'], [420, 'Baran'], [521, 'Býk'], [621, 'Blíženci'], [723, 'Rak'], [823, 'Lev'], [923, 'Panna'], [1023, 'Váhy'], [1122, 'Škorpión'], [1222, 'Strelec'], [1300, 'Kozorožec']];
const CIN_ZVIERA = ['Potkan', 'Byvol', 'Tiger', 'Zajac', 'Drak', 'Had', 'Kôň', 'Koza', 'Opica', 'Kohút', 'Pes', 'Prasa'];
const CIN_ZVIERA_POPIS = ['bystrosť a vynaliezavosť', 'vytrvalosť a spoľahlivosť', 'odvaha a vášeň', 'jemnosť a diplomacia', 'sebavedomie a šťastie', 'múdrosť a tajomnosť',
  'sloboda a energia', 'láskavosť a umelecké nadanie', 'vtip a zvedavosť', 'pracovitosť a úprimnosť', 'vernosť a spravodlivosť', 'štedrosť a pôžitkárstvo'];
const CIN_PRVOK = ['drevo', 'drevo', 'oheň', 'oheň', 'zem', 'zem', 'kov', 'kov', 'voda', 'voda'];
const PLANETY = [['Merkúr', .2408467], ['Venuša', .61519726], ['Mars', 1.8808476], ['Jupiter', 11.862615], ['Saturn', 29.447498]];
const MESIAC_FAZY = ['nov', 'dorastajúci kosáčik', 'prvá štvrť', 'dorastajúci Mesiac', 'spln', 'cúvajúci Mesiac', 'posledná štvrť', 'cúvajúci kosáčik'];
const SYN = 29.530588853;
const moonPhase = n => { const jd = n + 2440588; return (((jd - 2451550.1) / SYN) % 1 + 1) % 1; };   // 0 = nov, 0,5 = spln
const faza = p => MESIAC_FAZY[Math.round(p * 8) % 8];

function kratko(x) {   // 1234567890 → „1,2 mld.“
  if (x >= 1e9) return (x / 1e9).toFixed(1).replace('.', ',') + ' mld.';
  if (x >= 1e6) return (x / 1e6).toFixed(1).replace('.', ',') + ' mil.';
  return Math.round(x).toLocaleString('sk-SK');
}
function rozdielYMD(a, b) {   // presný rozdiel dvoch dátumov v rokoch, mesiacoch a dňoch
  const A = fromN(a), B = fromN(b);
  let y = B.y - A.y, m = B.m - A.m, d = B.d - A.d;
  if (d < 0) { m--; d += daysInMonth(B.m === 0 ? B.y - 1 : B.y, (B.m + 11) % 12); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}
const slovo = (n, a, b, c) => n === 1 ? a : n >= 2 && n <= 4 ? b : c;
const ymdText = r => [r.y ? `${r.y} ${slovo(r.y, 'rok', 'roky', 'rokov')}` : '', r.m ? `${r.m} ${slovo(r.m, 'mesiac', 'mesiace', 'mesiacov')}` : '', `${r.d} ${slovo(r.d, 'deň', 'dni', 'dní')}`].filter(Boolean).join(', ');
const datumDlhy = n => { const f = fromN(n); return `${DOW[f.w]} ${f.d}. ${MONTHS_GEN[f.m]} ${f.y}`; };

function menoMeniny(name) {   // nájde meniny podľa niektorého slova v mene
  const words = name.trim().split(/\s+/).map(w => w.toLowerCase());
  for (let m = 0; m < 12; m++) for (let d = 0; d < MENINY[m].length; d++) {
    const names = MENINY[m][d].split(', ').map(x => x.toLowerCase());
    const hit = words.find(w => names.includes(w));
    if (hit) return { m, d: d + 1, meno: MENINY[m][d].split(', ').find(x => x.toLowerCase() === hit) };
  }
  return null;
}

// ---------- šťastné čísla Lotto (6 z 49, žrebovanie v stredu a v nedeľu) ----------
function lottoDraw(u, today) {
  let n = today; while (![0, 3].includes(fromN(n).w)) n++;   // najbližšia streda alebo nedeľa (aj dnes)
  const r = rng(fnv('lotto' + nameSeed(u.name) + u.birth + isoN(n))), pool = Array.from({ length: 49 }, (_, i) => i + 1), nums = [];
  while (nums.length < 6) nums.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return { n, nums: nums.sort((a, b) => a - b), bonus: 1 + Math.floor(r() * 10) };
}

// ---------- vykreslenie sekcie ----------
function renderFacts(u) {
  const box = document.getElementById('factsOut'); if (!box) return;
  const today = todayN(), b = u.birthN, bf = fromN(b), t = today - b, age = ageYears(b, today);
  const tile = (ico, title, body, cls = '') => `<div class="fact ${cls}"><h4>${ico ? icon(ico) + ' ' : ''}${title}</h4>${body}</div>`;
  const big = s => `<div class="fact-big">${s}</div>`;
  const out = [];

  // dôchodok (orientačne 64 rokov)
  const ret = dn(bf.y + 64, bf.m, bf.d);
  out.push(tile('calendar', 'Dôchodok', today < ret
    ? big(ymdText(rozdielYMD(today, ret))) + `<p>zostáva do dôchodku (orientačne v 64 rokoch, ${fmt(ret)}). Stroj odporúča šetriť sily aj korunky.</p>`
    : big(ymdText(rozdielYMD(ret, today))) + `<p>ste už (orientačne) na zaslúženom odpočinku. Norma splnená, gratulujeme!</p>`));

  // miliardtá sekunda
  const bil = b + 1e9 / 86400, bil2 = b + 2e9 / 86400;
  out.push(tile('counter', 'Miliardtá sekunda', big(fmt(Math.floor(bil))) +
    `<p>${today >= Math.floor(bil) ? 'Túto hranicu ste prekročili' : 'Túto hranicu prekročíte'} ${datumDlhy(Math.floor(bil))} okolo 1:46 (ak ste sa narodili o polnoci). Dve miliardy sekúnd: ${fmt(Math.floor(bil2))}.</p>`));

  // jubileá
  const jub = [5000, 10000, 12345, 15000, 20000, 22222, 25000, 30000, 33333, 35000].filter(x => x > t).slice(0, 3);
  out.push(tile('cake', 'Najbližšie jubileá', jub.length ? `<ul class="fact-list">${jub.map(x => `<li><b>${x.toLocaleString('sk-SK')}. deň</b>: ${datumDlhy(b + x)}</li>`).join('')}</ul>` : '<p>Všetky okrúhle jubileá máte za sebou. Stroj sa klania.</p>'));

  // telo v číslach
  const awake = t * 16 * 60, adult = Math.max(0, t - 18 * 365.25);
  out.push(tile('move', 'Telo v číslach', `<ul class="fact-list">
      <li>srdce udrelo asi <b>${kratko(t * 24 * 60 * 72)}</b>-krát</li>
      <li>nadýchali ste sa asi <b>${kratko(t * 24 * 60 * 15)}</b>-krát</li>
      <li>prespali ste asi <b>${(t / 3 / 365.25).toFixed(1).replace('.', ',')} roka</b> života</li>
      <li>žmurkli ste asi <b>${kratko(awake * 15)}</b>-krát</li>
      <li>vlasy vám narástli spolu asi <b>${(t * .35 / 1000).toFixed(1).replace('.', ',')} m</b></li>
      <li>vypili ste asi <b>${kratko(adult * 2)}</b> káv (ak ich pijete dve denne od osemnástky)</li>
    </ul>`));

  // vek na planétach
  const yrs = t / 365.25;
  out.push(tile('star', 'Vek na iných planétach', `<ul class="fact-list">${PLANETY.map(([p, y]) => `<li>${p}: <b>${(yrs / y).toFixed(1).replace('.', ',')}</b> roka</li>`).join('')}</ul><p>Na Saturne by ste ešte len chodili do škôlky.</p>`));

  // Mesiac
  const pb = moonPhase(b), firstFull = b + ((.5 - pb + 1) % 1) * SYN;
  const fulls = today >= firstFull ? Math.floor((today - firstFull) / SYN) + 1 : 0;
  const nextFull = Math.ceil(today + ((.5 - moonPhase(today) + 1) % 1) * SYN);
  out.push(tile('sleep', 'Mesiac', big(faza(pb)) + `<p>bol na oblohe v deň vášho narodenia. Odvtedy ste zažili asi <b>${fulls.toLocaleString('sk-SK')}</b> splnov. Najbližší spln: ${datumDlhy(nextFull)}.</p>`));

  // znamenia
  const k = (bf.m + 1) * 100 + bf.d, zz = ZVEROKRUH_SK.find(z => k < z[0])[1];
  const cy = k < 204 ? bf.y - 1 : bf.y, ci = ((cy - 4) % 12 + 12) % 12;
  out.push(tile('star', 'Znamenia', big(`${zz} · ${CIN_ZVIERA[ci]}`) + `<p>Podľa zverokruhu ste ${zz}. Podľa čínskeho horoskopu ste v znamení zvieraťa ${CIN_ZVIERA[ci]} (prvok ${CIN_PRVOK[((cy - 4) % 10 + 10) % 10]}), ktoré prináša ${CIN_ZVIERA_POPIS[ci]}.</p>`));

  // prestupné roky a piatky 13.
  let leap = 0, fri13 = 0;
  for (let y = bf.y; y <= fromN(today).y; y++) {
    if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) { const f = dn(y, 1, 29); if (f >= b && f <= today) leap++; }
    for (let m = 0; m < 12; m++) { const f = dn(y, m, 13); if (f >= b && f <= today && fromN(f).w === 5) fri13++; }
  }
  out.push(tile('calendar', 'Prestupné roky a piatky 13.', `<ul class="fact-list"><li>prežili ste <b>${leap}</b> ${slovo(leap, 'prestupný deň 29. februára', 'prestupné dni 29. februára', 'prestupných dní 29. februára')}</li><li>a <b>${fri13}</b> ${slovo(fri13, 'piatok trinásteho', 'piatky trinásteho', 'piatkov trinásteho')}. Všetky ste zvládli!</li></ul>`));

  // meniny
  const mn = MENINY[bf.m][bf.d - 1], sv = MENINY_SVIATOK[`${bf.m}-${bf.d}`];
  const own = menoMeniny(u.name);
  let ownTxt = '';
  if (own) {
    const f = fromN(today); let nd = dn(f.y, own.m, own.d); if (nd < today) nd = dn(f.y + 1, own.m, own.d);
    ownTxt = `<p>Vaše meniny (${own.meno}): <b>${own.d}. ${MONTHS_GEN[own.m]}</b>${nd === today ? ', a to práve dnes! Všetko najlepšie!' : `, o ${nd - today} ${slovo(nd - today, 'deň', 'dni', 'dní')}`}.</p>`;
  }
  out.push(tile('card', 'Meniny', big(mn || sv || '—') + `<p>${mn ? 'mali meniny v deň vášho narodenia' : 'v tento deň nemá meniny nikto, je sviatok'}${mn && sv ? ` (${sv})` : ''}.</p>${ownTxt}`));

  // osobnosti
  const os = (typeof OSOBNOSTI !== 'undefined' && OSOBNOSTI[`${String(bf.m + 1).padStart(2, '0')}-${String(bf.d).padStart(2, '0')}`]) || [];
  if (os.length) out.push(tile('film', `Tiež sa narodili ${bf.d}. ${MONTHS_GEN[bf.m]}`, `<ul class="fact-list">${os.map(o => `<li><b>${o[1]}</b> (${o[0]}), ${o[2]}</li>`).join('')}</ul>`));

  // ceny
  const c = CENY.find(x => bf.y >= x.od && bf.y <= x.do);
  out.push(tile('stress', c.rok ? `Ceny dnes (${c.rok})` : `Ceny okolo roku ${bf.y}`, c.polozky ? `<ul class="fact-list">${c.polozky.map(([n, v]) => `<li>${n}: <b>${v} ${c.mena}</b></li>`).join('')}</ul><p class="muted small-txt">Zdroj: ČSÚ, ŠÚ SR, dobové cenníky.</p>` : `<p>${c.text}</p><p class="muted small-txt">Zdroj: ČSÚ, ŠÚ SR.</p>`));

  // osobná šťastena
  const no = fnv('stastena' + nameSeed(u.name) + u.birth) % 150;
  box.innerHTML = out.join('');
  // reklamná dlaždica medzi zaujímavosťami: ten istý uzol sa pri prekreslení len presunie (žiadne nové načítanie reklamy)
  if (!renderFacts.ad) { const tpl = document.getElementById('factAdTpl'); if (tpl) renderFacts.ad = tpl.content.firstElementChild.cloneNode(true); }
  if (renderFacts.ad) box.insertBefore(renderFacts.ad, box.children[6] || null);
  const lo = document.getElementById('lottoOut');
  if (lo) {
    const L = lottoDraw(u, today);
    lo.innerHTML = `<h4>Šťastné čísla do Lotta</h4>
      <div class="lotto-when">žrebovanie ${L.n === today ? 'dnes, ' : ''}${datumDlhy(L.n)}</div>
      <div class="lotto-balls">${L.nums.map(x => `<span class="ball">${x}</span>`).join('')}</div>
      <div class="lotto-when">šťastná cifra: <b>${L.bonus - 1}</b></div>
      <p class="lotto-note">Guľa vyberá čísla nanovo pre každé žrebovanie. Len pre zábavu, výhru nesľubuje. Hra je určená osobám nad 18 rokov.</p>`;
  }
  const st = document.getElementById('fortuneOut');
  if (st) st.innerHTML = `<div class="fortune-no">Veštba č. ${String(no + 1).padStart(3, '0')} zo 150</div><p>${stastena(no).join(' ')}</p>`;
}
