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

// ---------- vybrané osobnosti zo Slovenska a Česka: [deň, mesiac (1–12), rok, meno, kto] ----------
const OSOBNOSTI = [
  [28, 3, 1592, 'Ján Amos Komenský', 'učiteľ národov'], [14, 5, 1316, 'Karol IV.', 'rímsky cisár a český kráľ'], [13, 5, 1717, 'Mária Terézia', 'panovníčka'],
  [15, 5, 1720, 'Maximilián Hell', 'astronóm'], [23, 1, 1734, 'Wolfgang Kempelen', 'vynálezca šachového automatu'], [27, 12, 1566, 'Ján Jesenius', 'lekár'],
  [25, 1, 1688, 'Juraj Jánošík', 'zbojník'], [29, 7, 1793, 'Ján Kollár', 'básnik'], [13, 5, 1795, 'Pavol Jozef Šafárik', 'jazykovedec'],
  [28, 10, 1815, 'Ľudovít Štúr', 'kodifikátor spisovnej slovenčiny'], [24, 4, 1822, 'Janko Kráľ', 'básnik'], [20, 7, 1822, 'Gregor Mendel', 'otec genetiky'],
  [2, 3, 1824, 'Bedřich Smetana', 'skladateľ'], [4, 2, 1820, 'Božena Němcová', 'spisovateľka'], [8, 9, 1841, 'Antonín Dvořák', 'skladateľ'],
  [2, 2, 1849, 'Pavol Országh Hviezdoslav', 'básnik'], [7, 3, 1850, 'Tomáš Garrigue Masaryk', 'prvý prezident ČSR'], [3, 7, 1854, 'Leoš Janáček', 'skladateľ'],
  [6, 5, 1856, 'Sigmund Freud', 'zakladateľ psychoanalýzy, rodák z Příbora'], [10, 5, 1859, 'Aurel Stodola', 'konštruktér turbín'], [24, 7, 1860, 'Alfons Mucha', 'maliar'],
  [17, 5, 1860, 'Martin Kukučín', 'spisovateľ'], [17, 2, 1864, 'Jozef Murgaš', 'priekopník rádia'], [23, 8, 1868, 'Dušan Jurkovič', 'architekt'],
  [18, 10, 1874, 'Jozef Gregor Tajovský', 'spisovateľ'], [3, 9, 1875, 'Ferdinand Porsche', 'konštruktér áut'], [26, 2, 1878, 'Ema Destinnová', 'operná speváčka'],
  [21, 7, 1880, 'Milan Rastislav Štefánik', 'astronóm a generál'], [5, 7, 1880, 'Jan Kubelík', 'huslista'], [3, 7, 1883, 'Franz Kafka', 'spisovateľ'],
  [30, 4, 1883, 'Jaroslav Hašek', 'autor Švejka'], [17, 12, 1887, 'Josef Lada', 'maliar a ilustrátor'], [21, 9, 1888, 'Martin Benka', 'maliar'],
  [9, 1, 1890, 'Karel Čapek', 'spisovateľ, vymyslel slovo robot'], [20, 12, 1890, 'Jaroslav Heyrovský', 'nositeľ Nobelovej ceny'], [9, 4, 1891, 'Vlasta Burian', 'kráľ komikov'],
  [25, 11, 1895, 'Ludvík Svoboda', 'generál a prezident'], [11, 12, 1900, 'Hermína Týrlová', 'animátorka'], [23, 9, 1901, 'Jaroslav Seifert', 'básnik, nositeľ Nobelovej ceny'],
  [27, 2, 1902, 'Ľudovít Fulla', 'maliar'], [12, 12, 1902, 'Koloman Sokol', 'grafik'], [27, 12, 1904, 'Laco Novomeský', 'básnik'],
  [6, 2, 1905, 'Jan Werich', 'herec a spisovateľ'], [19, 6, 1905, 'Jiří Voskovec', 'herec'], [28, 4, 1908, 'Oskar Schindler', 'záchranca ľudí'],
  [3, 11, 1910, 'Karel Zeman', 'filmový režisér'], [24, 2, 1912, 'Jiří Trnka', 'animátor'], [27, 10, 1913, 'Otto Wichterle', 'vynálezca mäkkých kontaktných šošoviek'],
  [28, 3, 1914, 'Bohumil Hrabal', 'spisovateľ'], [29, 6, 1914, 'Rafael Kubelík', 'dirigent'], [21, 2, 1921, 'Zdeněk Miler', 'autor Krtka'],
  [27, 11, 1921, 'Alexander Dubček', 'politik'], [16, 3, 1922, 'Zdeněk Liška', 'filmový skladateľ'], [19, 9, 1922, 'Emil Zátopek', 'bežec'],
  [20, 3, 1924, 'Jozef Kroner', 'herec'], [4, 7, 1924, 'Oldřich Lipský', 'režisér filmu Jáchyme, hoď ho do stroje!'], [6, 8, 1928, 'Andy Warhol', 'umelec s koreňmi na Slovensku'],
  [2, 2, 1929, 'Věra Chytilová', 'režisérka'], [1, 4, 1929, 'Milan Kundera', 'spisovateľ'], [12, 6, 1930, 'Adolf Born', 'ilustrátor'],
  [1, 10, 1931, 'Jiří Suchý', 'divadelník'], [9, 12, 1931, 'Ladislav Smoljak', 'režisér'], [18, 2, 1932, 'Miloš Forman', 'režisér'],
  [2, 7, 1932, 'Waldemar Matuška', 'spevák'], [11, 7, 1933, 'Olga Havlová', 'prvá dáma'], [4, 9, 1934, 'Jan Švankmajer', 'animátor'],
  [28, 3, 1936, 'Zdeněk Svěrák', 'herec a scenárista'], [5, 10, 1936, 'Václav Havel', 'dramatik a prezident'], [6, 1, 1938, 'Jozef Golonka', 'hokejista'],
  [23, 2, 1938, 'Jiří Menzel', 'režisér'], [14, 3, 1938, 'Petr Nárožný', 'herec'], [14, 7, 1939, 'Karel Gott', 'spevák'],
  [14, 12, 1939, 'Josef Abrhám', 'herec'], [3, 2, 1940, 'Milan Lasica', 'herec a humorista'], [20, 5, 1940, 'Stan Mikita', 'hokejista'],
  [20, 8, 1941, 'Július Satinský', 'herec a humorista'], [3, 5, 1942, 'Věra Čáslavská', 'gymnastka'], [18, 5, 1942, 'Emília Vášáryová', 'herečka'],
  [1, 11, 1942, 'Marta Kubišová', 'speváčka'], [22, 8, 1943, 'Luděk Sobota', 'herec, František Koudelka z filmu'], [23, 10, 1943, 'Václav Neckář', 'spevák'],
  [12, 4, 1944, 'Karel Kryl', 'pesničkár'], [28, 10, 1944, 'Marián Labuda', 'herec'], [6, 9, 1946, 'Hana Zagorová', 'speváčka'],
  [24, 6, 1947, 'Helena Vondráčková', 'speváčka'], [26, 8, 1948, 'Magda Vášáryová', 'herečka a diplomatka'], [7, 12, 1948, 'Pavol Hammel', 'spevák'],
  [22, 1, 1951, 'Ondrej Nepela', 'krasokorčuliar'], [21, 10, 1952, 'Miroslav Žbirka', 'spevák'], [7, 6, 1953, 'Libuše Šafránková', 'herečka'],
  [12, 2, 1956, 'Marika Gombitová', 'speváčka'], [18, 9, 1956, 'Peter Šťastný', 'hokejista'], [18, 10, 1956, 'Martina Navrátilová', 'tenistka'],
  [7, 3, 1960, 'Ivan Lendl', 'tenista'], [29, 1, 1965, 'Dominik Hašek', 'hokejový brankár'], [16, 6, 1966, 'Jan Železný', 'oštepár'],
  [15, 2, 1972, 'Jaromír Jágr', 'hokejista'], [30, 8, 1972, 'Pavel Nedvěd', 'futbalista'], [16, 1, 1976, 'Martina Moravcová', 'plavkyňa'],
  [18, 3, 1977, 'Zdeno Chára', 'hokejista'], [12, 1, 1979, 'Marián Hossa', 'hokejista'], [20, 5, 1982, 'Petr Čech', 'futbalový brankár'],
  [6, 5, 1989, 'Dominika Cibulková', 'tenistka'], [26, 1, 1990, 'Peter Sagan', 'cyklista'], [13, 6, 1995, 'Petra Vlhová', 'lyžiarka']
];

// ---------- orientačné ceny podľa obdobia (približne) ----------
const CENY = [
  { od: 1900, do: 1952, mena: 'Kčs', text: 'Z tých čias sa ceny ťažko porovnávajú: platili sa korunami, ale menová reforma v roku 1953 všetko prepočítala. Stroj odporúča neporovnávať a radšej si spomenúť na vôňu chleba z pece.' },
  { od: 1953, do: 1969, mena: 'Kčs', polozky: [['rožok', '0,30'], ['chlieb (1 kg)', '2,60'], ['pivo desiatka (0,5 l)', '1,70'], ['lístok do kina', '2–4'], ['osobné auto Škoda', 'okolo 35 000']] },
  { od: 1970, do: 1979, mena: 'Kčs', polozky: [['rožok', '0,30'], ['chlieb (1 kg)', '2,60'], ['pivo desiatka (0,5 l)', '1,70'], ['lístok do kina', '4–6'], ['Škoda 100', 'okolo 45 000']] },
  { od: 1980, do: 1989, mena: 'Kčs', polozky: [['rožok', '0,40'], ['chlieb (1 kg)', '3,20'], ['pivo desiatka (0,5 l)', '2,00'], ['lístok do kina', '6–10'], ['Škoda 105', 'okolo 60 000']] },
  { od: 1990, do: 1992, mena: 'Kčs', polozky: [['rožok', '0,60'], ['chlieb (1 kg)', '7'], ['pivo desiatka (0,5 l)', '5'], ['lístok do kina', '10–15'], ['Škoda Favorit', 'okolo 100 000']] },
  { od: 1993, do: 2008, mena: 'Sk', polozky: [['rožok', '1,50–3'], ['chlieb (1 kg)', '25–40'], ['pivo (0,5 l v krčme)', '15–30'], ['lístok do kina', '80–150'], ['nové auto', 'od 300 000']] },
  { od: 2009, do: 2100, mena: '€', polozky: [['rožok', '0,10–0,20'], ['chlieb (1 kg)', '1,50–3'], ['pivo (0,5 l v krčme)', '1,50–3'], ['lístok do kina', '6–10'], ['nové auto', 'od 15 000']] }
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
function osobnosti(bf) {
  const same = OSOBNOSTI.filter(o => o[0] === bf.d && o[1] === bf.m + 1);
  if (same.length) return { same: true, list: same };
  const doy = (d, m) => Math.round(Date.UTC(2001, m - 1, d) / 864e5);
  const me = doy(bf.d, bf.m + 1);
  const dist = o => { const x = Math.abs(doy(o[0], o[1]) - me); return Math.min(x, 365 - x); };
  const best = Math.min(...OSOBNOSTI.map(dist));
  return { same: false, list: OSOBNOSTI.filter(o => dist(o) === best).slice(0, 3) };
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
  const os = osobnosti(bf);
  out.push(tile('film', os.same ? 'V rovnaký deň sa narodil(a)' : 'Najbližšie k vašim narodeninám', `<ul class="fact-list">${os.list.map(o => `<li><b>${o[3]}</b> (${o[0]}. ${o[1]}. ${o[2]}), ${o[4]}</li>`).join('')}</ul>`));

  // ceny
  const c = CENY.find(x => bf.y >= x.od && bf.y <= x.do);
  out.push(tile('stress', `Ceny v roku ${bf.y}`, c.polozky ? `<ul class="fact-list">${c.polozky.map(([n, v]) => `<li>${n}: <b>${v} ${c.mena}</b></li>`).join('')}</ul><p class="muted small-txt">Približné ceny z tých čias.</p>` : `<p>${c.text}</p>`));

  // osobná šťastena
  const no = fnv('stastena' + nameSeed(u.name) + u.birth) % 150;
  box.innerHTML = out.join('');
  const st = document.getElementById('fortuneOut');
  if (st) st.innerHTML = `<div class="fortune-no">Veštba č. ${String(no + 1).padStart(3, '0')} zo 150</div><p>${stastena(no).join(' ')}</p>`;
}
