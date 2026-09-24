'use strict';
/* Dáta pre „Výběr osudového partnera“: fiktívne osoby sa skladajú z týchto zoznamov (mená a miesta po slovensky, zvyšok po česky).
   Ženské priezviská sa tvoria z mužských podľa slovenských pravidiel (Novotný → Novotná, Oravec → Oravcová, Vlček → Vlčková, Varga → Vargová). */

const FEMALE_FIRST = [
  'Zuzana', 'Katarína', 'Lucia', 'Martina', 'Jana', 'Veronika', 'Monika', 'Andrea', 'Simona', 'Petra',
  'Barbora', 'Michaela', 'Dominika', 'Ivana', 'Eva', 'Kristína', 'Lenka', 'Alžbeta', 'Silvia', 'Adriana',
  'Natália', 'Soňa', 'Beáta', 'Viera', 'Helena', 'Gabriela', 'Daniela', 'Miroslava', 'Mária', 'Anna',
  'Jarmila', 'Zdenka', 'Oľga', 'Ľudmila', 'Marta', 'Margita', 'Alena', 'Dagmar', 'Irena', 'Iveta',
  'Renáta', 'Tatiana', 'Denisa', 'Nikola', 'Kamila', 'Paulína', 'Laura', 'Sofia', 'Ema', 'Nina',
  'Tamara', 'Klaudia', 'Erika', 'Marcela', 'Magdaléna', 'Terézia', 'Anežka', 'Bibiána', 'Emília', 'Vanda',
  'Stanislava', 'Radka', 'Hana', 'Blanka', 'Romana', 'Lívia', 'Jolana', 'Bronislava', 'Svetlana', 'Edita',
  'Žaneta', 'Diana', 'Karolína', 'Viktória', 'Sandra', 'Patrícia', 'Rebeka', 'Tímea', 'Kvetoslava', 'Ľubica',
  'Jaroslava', 'Vladimíra', 'Božena', 'Milada', 'Nadežda', 'Agáta', 'Ingrida', 'Judita', 'Juliana', 'Kornélia',
  'Lýdia', 'Otília', 'Petronela', 'Regína', 'Rozália', 'Sabína', 'Zlatica', 'Xénia', 'Aneta', 'Jozefína',
  'Leona', 'Olívia', 'Stela', 'Valéria', 'Vilma', 'Estera', 'Linda', 'Marianna', 'Nora', 'Adela',
  'Dana', 'Elena'
];

const MALE_FIRST = [
  'Peter', 'Martin', 'Tomáš', 'Michal', 'Juraj', 'Marek', 'Ján', 'Jozef', 'Lukáš', 'Milan',
  'Róbert', 'Pavol', 'Miroslav', 'Stanislav', 'Dušan', 'Igor', 'Rastislav', 'Matej', 'Vladimír', 'Ondrej',
  'Branislav', 'Radovan', 'Ľubomír', 'Viliam', 'Roman', 'Daniel', 'Jakub', 'Samuel', 'Adam', 'Filip',
  'Dominik', 'Patrik', 'Richard', 'Erik', 'Oliver', 'Šimon', 'Andrej', 'Anton', 'František', 'Jaroslav',
  'Ladislav', 'Karol', 'Štefan', 'Vincent', 'Viktor', 'Vojtech', 'Zdenko', 'Zoltán', 'Imrich', 'Ivan',
  'Emil', 'Eduard', 'Alexander', 'Albert', 'Alojz', 'Bohumil', 'Bohuslav', 'Boris', 'Cyril', 'Metod',
  'Denis', 'Drahomír', 'Eugen', 'Fedor', 'Gabriel', 'Gustáv', 'Henrich', 'Ignác', 'Július', 'Kamil',
  'Kristián', 'Leopold', 'Ľudovít', 'Marián', 'Maroš', 'Matúš', 'Mikuláš', 'Norbert', 'Oskar', 'Oto',
  'Radoslav', 'Rudolf', 'Svätopluk', 'Teodor', 'Tibor', 'Valentín', 'Vladislav', 'Leonard', 'Hubert', 'Dávid',
  'Kornel', 'Ľuboš', 'Miloš', 'Radomír', 'Slavomír', 'Svetozár', 'Tadeáš', 'Blažej', 'Benedikt', 'Hugo',
  'Ervín', 'Silvester', 'Tobiáš', 'Kliment'
];

const MALE_LAST = [
  'Horváth', 'Kováč', 'Varga', 'Tóth', 'Balogh', 'Lukáč', 'Hudák', 'Šimko', 'Mikula', 'Benko',
  'Polák', 'Krajčír', 'Oravec', 'Blaho', 'Kučera', 'Štefanko', 'Jurčo', 'Hruška', 'Gajdoš', 'Baláž',
  'Pekár', 'Ďurica', 'Chovanec', 'Matuška', 'Záhorský', 'Kollár', 'Novák', 'Novotný', 'Kováčik', 'Molnár',
  'Nagy', 'Farkaš', 'Kráľ', 'Ondruš', 'Sedlák', 'Mráz', 'Holub', 'Slovák', 'Kubík', 'Hronec',
  'Bartoš', 'Vlček', 'Ševčík', 'Mihálik', 'Marko', 'Adamec', 'Bednár', 'Černák', 'Fabián', 'Gregor',
  'Hajduk', 'Jakubec', 'Janík', 'Kamenický', 'Kočiš', 'Kopecký', 'Kotlár', 'Kozák', 'Lacko', 'Macko',
  'Majerník', 'Martinák', 'Matejka', 'Michalík', 'Mikuš', 'Nemec', 'Oláh', 'Palko', 'Pavlík', 'Petráš',
  'Poliak', 'Porubský', 'Rusnák', 'Slanina', 'Sloboda', 'Šoltés', 'Takáč', 'Tomko', 'Uhrin', 'Urban',
  'Vaško', 'Vojtko', 'Zajac', 'Zeman', 'Žiak', 'Kmeť', 'Dudáš', 'Hlinka', 'Lipták', 'Bielik',
  'Chalupka', 'Drobný', 'Gašpar', 'Jankovič', 'Križan', 'Kuchár', 'Medveď', 'Rybár', 'Sokol', 'Šťastný',
  'Tichý', 'Veselý', 'Vrábeľ', 'Zelenák'
];

function femaleSurname(m) {
  if (m.endsWith('ý')) return m.slice(0, -1) + 'á';
  if (m.endsWith('ec')) return m.slice(0, -2) + 'cová';
  if (m.endsWith('ek')) return m.slice(0, -2) + 'ková';
  if (m.endsWith('a') || m.endsWith('o')) return m.slice(0, -1) + 'ová';
  return m + 'ová';
}
const FEMALE_LAST = MALE_LAST.map(femaleSurname);

// miesta v tvare, ako ich použijeme vo vete („narodila sa v …“, „žije v …“): 68 miest a 68 obcí
const TOWNS = [
  'v Bratislave', 'v Košiciach', 'v Prešove', 'v Žiline', 'v Nitre', 'v Banskej Bystrici', 'v Trnave', 'v Trenčíne', 'v Martine', 'v Poprade',
  'v Prievidzi', 'vo Zvolene', 'v Považskej Bystrici', 'v Michalovciach', 'v Nových Zámkoch', 'v Spišskej Novej Vsi', 'v Komárne', 'v Leviciach', 'v Humennom', 'v Bardejove',
  'v Liptovskom Mikuláši', 'v Ružomberku', 'v Piešťanoch', 'v Topoľčanoch', 'v Lučenci', 'v Rožňave', 'v Dolnom Kubíne', 'v Senici', 'v Skalici', 'v Banskej Štiavnici',
  'v Kežmarku', 'v Levoči', 'v Pezinku', 'v Malackách', 'v Čadci', 'v Dubnici nad Váhom', 'v Dunajskej Strede', 'v Galante', 'v Hlohovci', 'v Partizánskom',
  'v Púchove', 'v Sabinove', 'v Snine', 'v Starej Ľubovni', 'vo Svidníku', 'v Šali', 'v Šamoríne', 'v Senci', 'v Stupave', 'v Trebišove',
  'vo Vranove nad Topľou', 'v Rimavskej Sobote', 'v Revúcej', 'v Brezne', 'v Detve', 'v Žiari nad Hronom', 'v Žarnovici', 'v Kremnici', 'v Novej Bani', 'v Handlovej',
  'v Bojniciach', 'v Novákoch', 'v Myjave', 'v Novom Meste nad Váhom', 'v Starej Turej', 'v Bánovciach nad Bebravou', 'v Nemšovej', 'v Ilave'
];
const VILLAGES = [
  'v Terchovej', 'v Ždiari', 'v Čičmanoch', 'v Štrbe', 'v Heľpe', 'v Liptovskej Tepličke', 'v Očovej', 'v Detvianskej Hute', 'v Zázrivej', 'v Čiernom Balogu',
  'v Telgárte', 'v Zuberci', 'v Habovke', 'v Oravskej Lesnej', 'v Oravskom Podzámku', 'v Zákamennom', 'v Rabči', 'v Oščadnici', 'v Skalitom', 'v Starej Bystrici',
  'v Súľove-Hradnej', 'v Lednických Rovniach', 'v Moravanoch nad Váhom', 'v Častej', 'v Smoleniciach', 'v Červenom Kláštore', 'v Lendaku', 'v Osturni', 'v Hrabušiciach', 'v Markušovciach',
  'v Betliari', 'v Krásnohorskom Podhradí', 'v Jasove', 'v Herľanoch', 'v Ladomirovej', 'v Bodružali', 'v Uliči', 'v Novej Sedlici', 'v Tokajíku', 'v Kokave nad Rimavicou',
  'v Klenovci', 'v Hontianskych Nemciach', 'vo Svätom Antone', 'v Štiavnických Baniach', 'v Kremnických Baniach', 'v Hronseku', 'v Tajove', 'v Španej Doline', 'v Donovaloch', 'v Liptovských Sliačoch',
  'v Pribyline', 'v Liptovskom Jáne', 'vo Važci', 'v Bobrovci', 'v Kraľovanoch', 'v Párnici', 'v Blatnici', 'v Mošovciach', 'v Bošáci', 'v Beckove',
  'v Čachticiach', 'v Kopčanoch', 'v Plaveckom Štvrtku', 'v Gabčíkove', 'v Patinciach', 'v Kamenici nad Hronom', 'v Oponiciach', 'v Mojmírovciach'
];
const CITIES = [...TOWNS, ...VILLAGES];

// ===== Výběr osudového partnera je česky; jména, města a obce zůstávají slovensky =====

// [ženský tvar, mužský tvar]
const JOBS = [
  ['učitelka na základní škole', 'učitel na základní škole'], ['zdravotní sestra', 'zdravotní bratr'], ['účetní', 'účetní'], ['knihovnice', 'knihovník'], ['kadeřnice', 'kadeřník'],
  ['architektka', 'architekt'], ['lékárnice', 'lékárník'], ['programátorka', 'programátor'], ['cukrářka', 'cukrář'], ['veterinářka', 'veterinář'],
  ['průvodčí ve vlaku', 'průvodčí ve vlaku'], ['fotografka', 'fotograf'], ['referentka na městském úřadě', 'referent na městském úřadě'], ['fyzioterapeutka', 'fyzioterapeut'], ['kuchařka', 'kuchař'],
  ['automechanička', 'automechanik'], ['elektrikářka', 'elektrikář'], ['truhlářka', 'truhlář'], ['geodetka', 'geodet'], ['záchranářka', 'záchranář'],
  ['hasička', 'hasič'], ['policistka', 'policista'], ['pilotka', 'pilot'], ['strojvedoucí', 'strojvedoucí'], ['řidička autobusu', 'řidič autobusu'],
  ['taxikářka', 'taxikář'], ['pošťačka', 'pošťák'], ['prodavačka v potravinách', 'prodavač v potravinách'], ['číšnice', 'číšník'], ['barmanka', 'barman'],
  ['someliérka', 'someliér'], ['pekařka', 'pekař'], ['řeznice', 'řezník'], ['zahradnice', 'zahradník'], ['květinářka', 'květinář'],
  ['lesnice', 'lesník'], ['včelařka', 'včelař'], ['vinařka', 'vinař'], ['agronomka', 'agronom'], ['zootechnička', 'zootechnik'],
  ['krejčová', 'krejčí'], ['obuvnice', 'obuvník'], ['hodinářka', 'hodinář'], ['zlatnice', 'zlatník'], ['keramička', 'keramik'],
  ['sklářka', 'sklář'], ['malířka obrazů', 'malíř obrazů'], ['sochařka', 'sochař'], ['grafička', 'grafik'], ['ilustrátorka', 'ilustrátor'],
  ['spisovatelka', 'spisovatel'], ['novinářka', 'novinář'], ['redaktorka v rozhlase', 'redaktor v rozhlase'], ['moderátorka', 'moderátor'], ['herečka v divadle', 'herec v divadle'],
  ['zpěvačka ve sboru', 'zpěvák ve sboru'], ['houslistka', 'houslista'], ['klavíristka', 'klavírista'], ['učitelka hudby', 'učitel hudby'], ['tanečnice', 'tanečník'],
  ['trenérka plavání', 'trenér plavání'], ['instruktorka lyžování', 'instruktor lyžování'], ['horská vůdkyně', 'horský vůdce'], ['průvodkyně na hradě', 'průvodce na hradě'], ['archeoložka', 'archeolog'],
  ['historička', 'historik'], ['archivářka', 'archivář'], ['překladatelka', 'překladatel'], ['tlumočnice', 'tlumočník'], ['právnička', 'právník'],
  ['notářka', 'notář'], ['soudkyně', 'soudce'], ['ekonomka', 'ekonom'], ['bankéřka', 'bankéř'], ['pojišťovací agentka', 'pojišťovací agent'],
  ['realitní makléřka', 'realitní makléř'], ['personalistka', 'personalista'], ['projektová manažerka', 'projektový manažer'], ['asistentka ředitele', 'asistent ředitele'], ['psycholožka', 'psycholog'],
  ['logopedka', 'logoped'], ['sociální pracovnice', 'sociální pracovník'], ['učitelka ve školce', 'učitel ve školce'], ['zubařka', 'zubař'], ['dětská lékařka', 'dětský lékař'],
  ['chirurgyně', 'chirurg'], ['laborantka', 'laborant'], ['chemička', 'chemik'], ['meteoroložka', 'meteorolog'], ['astronomka na hvězdárně', 'astronom na hvězdárně'],
  ['stavební inženýrka', 'stavební inženýr'], ['strojařka', 'strojař'], ['svářečka', 'svářeč'], ['instalatérka', 'instalatér'], ['kominice', 'kominík'],
  ['dispečerka dopravy', 'dispečer dopravy'], ['letuška', 'steward'], ['recepční v hotelu', 'recepční v hotelu'], ['masérka', 'masér'], ['módní návrhářka', 'módní návrhář']
];

const HOBBIES = [
  'turistika v Tatrách', 'zahrádka na chatě', 'volejbal', 'taneční kurzy', 'křížovky', 'houby a les', 'desky ze 70. let', 'plavání', 'běžky', 'šachy',
  'rybaření', 'divadlo', 'motorky Jawa', 'kolo', 'pečení koláčů', 'kino', 'sjezdové lyžování', 'bruslení', 'hokej na zamrzlém rybníku', 'fotbal',
  'stolní tenis', 'tenis', 'badminton', 'bowling', 'kuželky', 'jóga', 'běh', 'nordic walking', 'horolezectví', 'vodáctví na Hronu',
  'splav Dunajce', 'kempování', 'jeskyně', 'hrady a zříceniny', 'lázně', 'termální koupaliště', 'fotografování', 'kamera Super 8', 'sbírání známek', 'sbírání mincí',
  'sbírání pohlednic', 'stará auta', 'opravy kol', 'modelářství', 'vláčky', 'radioamatérství', 'astronomie', 'pozorování ptáků', 'včelaření', 'bylinky',
  'pěstování rajčat', 'kaktusy', 'orchideje', 'akvárium', 'psi', 'kočky', 'jízda na koni', 'vaření', 'grilování', 'zavařování',
  'víno a vinice', 'sýry', 'brynzové halušky', 'pletení', 'háčkování', 'šití', 'výšivky', 'řezbářství', 'keramika', 'akvarely',
  'kreslení', 'kaligrafie', 'psaní básní', 'detektivky', 'historické romány', 'sci-fi', 'antikvariáty', 'kvízy', 'hlavolamy', 'sudoku',
  'mariáš', 'společenské hry', 'cizí jazyky', 'cestování vlakem', 'geocaching', 'folklór', 'lidové tance', 'zpěv ve sboru', 'kytara', 'akordeon',
  'heligonka', 'klavír', 'jazz', 'rock and roll', 'disko', 'opereta', 'rozhlasové hry', 'otužování', 'sauna', 'dobrovolnictví'
];

// inzeráty jsou psané bez rodu, sedí k partnerovi i partnerce
const ADS = [
  'Hledá někoho, s kým se dá povídat i mlčet.', 'Ozvi se, pokud tě baví nedělní obědy a dlouhé procházky.', 'Hledá parťáka na túry, který neuteče před prvním kopcem.', 'Umí uvařit halušky i opravit kapající kohoutek.', 'Hledá někoho, kdo se směje i slabším vtipům.',
  'Na první rande přinese kondiciogram, aby to nevyšlo na kritický den.', 'Hledá společnost na večery u desek a čaje.', 'Zná všechny zastávky tramvaje a chce ti ukázat ty nejhezčí.', 'Hledá někoho, s kým postaví chatu i vztah.', 'Ozvi se, pokud umíš tancovat twist nebo se ho chceš naučit.',
  'Hledá spolujezdce na výlety do Tater.', 'Má zahrádku, psa a volné místo u stolu.', 'Hledá někoho, kdo se nedívá na hodinky, když je dobře.', 'Peče nejlepší bábovku v paneláku a nemá ji s kým jíst.', 'Hledá člověka, který si pamatuje narozeniny i bez kalendáře.',
  'Ozvi se, pokud tě neodradí déšť ani stan.', 'Hledá někoho, kdo pochopí, proč jsou doma tři rádia.', 'Stroj tvrdí, že se k sobě hodíme. Kdo by se hádal se strojem?', 'Hledá partu na kuželky a společnou cestu domů.', 'Hledá společnost do kina na půlnoční představení.',
  'Kdo dočte tento inzerát do konce, má u mě kafe.', 'Hledá někoho, kdo má rád rána stejně jako noci.', 'Ví, kde rostou nejlepší hřiby. Prozradí to jen správnému člověku.', 'Hledá spřízněnou duši, která taky sbírá pohlednice.', 'Ozvi se, pokud máš raději vlak než auto.',
  'Hledá někoho na společné nedělní křížovky.', 'Nechce prince ani princeznu, stačí slušný člověk s humorem.', 'Hledá společnost na taneční zábavu v kulturním domě.', 'Má dva lístky na operetu. Jeden je volný.', 'Hledá někoho, kdo nesnáší nudu.',
  'Ozvi se, pokud víš, co je to diaprojektor.', 'Hledá společnost na kolo podél Dunaje.', 'Kondiciogram hlásí úspěšnou citovou fázi. Využij ji.', 'Hledá někoho, kdo se nebojí udělat první krok.', 'Umí vařit, prát i žehlit. Chybí už jen někdo na společnou večeři.',
  'Hledá člověka, se kterým se dá smát i ve frontě na banány.', 'Ozvi se, pokud tě baví zpívat u kytary.', 'Hledá spoluautora společných vzpomínek.', 'Na Silvestra chce mít koho obejmout o půlnoci.', 'Hledá někoho, kdo má rád vůni kávy a starých knih.',
  'Ozvi se, pokud si myslíš, že nejlepší roky jsou ještě před námi.', 'Hledá někoho na dlouhé dopisy i krátké telefonáty.', 'Vymění samotu za společnou procházku parkem.', 'Hledá někoho, s kým bude jíst zmrzlinu i v zimě.', 'Ozvi se, pokud máš doma víc knih než talířů.',
  'Hledá společnost na výstavy a vernisáže.', 'Kondiciogram má samé hvězdičky. Hledá někoho, s kým se o ně podělí.', 'Hledá někoho, kdo umí opravit kolo nebo aspoň podat klíč.', 'Ozvi se, pokud ti chutná brynza a dobrá nálada.', 'Hledá parťáka na splav Dunajce.',
  'Nehledá dokonalost, hledá upřímnost.', 'Hledá někoho, kdo si nestěžuje na počasí.', 'Ozvi se, pokud tě nebaví sedět doma u televize.', 'Hledá někoho, kdo bude u hokeje fandit stejně nahlas.', 'Chce poznat člověka, který miluje léto na koupališti.',
  'Hledá společnost na nedělní výlety autobusem do neznáma.', 'Ozvi se, pokud jsi noční sova a nevadí ti ranní ptáče.', 'Hledá někoho, s kým se dá vařit bez hádek o sůl.', 'Stroj vypočítal ideální den na rande. Nepromarněme ho.', 'Hledá někoho, kdo má rád Vánoce už od listopadu.',
  'Ozvi se, pokud znáš aspoň tři lidové písničky.', 'Hledá partnera do čtyřhry v tenise i v životě.', 'Pěstuje rajčata a naději. Obojímu se daří.', 'Hledá někoho, kdo ocení domácí švestková povidla.', 'Ozvi se, pokud tě baví hledat hvězdy dalekohledem.',
  'Hledá spolucestujícího na dlouhou cestu vlakem k moři.', 'Nemá auto, ale má kolo s nosičem.', 'Hledá někoho, kdo neodejde z kina před koncem filmu.', 'Ozvi se, pokud víš, že nejlepší rozhovory jsou v kuchyni.', 'Hledá člověka se smyslem pro humor a pořádek. Stačí i jedno.',
  'Hledá společnost na jarní úklid i letní dobrodružství.', 'Ozvi se, pokud tě těší první sníh.', 'Hledá někoho, s kým se dá dlouho mlčet u ohně.', 'Rodina se pořád ptá „a kdy už?“. Pomoz.', 'Hledá někoho, kdo zná cestu k srdci i na chatu.',
  'Ozvi se, pokud si pamatuješ Večerníček a pořád tě potěší.', 'Hledá spolutanečníka na čardáš.', 'Nekouří, pije s mírou, směje se bez míry.', 'Hledá někoho, kdo má rád zvířata aspoň tak jako lidi.', 'Ozvi se, pokud věříš, že štěstí se dá vypočítat.',
  'Hledá někoho na společné nedělní snídaně.', 'Má vlastní dílnu a chuť něco spolu vytvořit.', 'Hledá někoho, kdo nepřestal snít.', 'Ozvi se, pokud tě baví hrady, zámky a zříceniny.', 'Hledá společnost na lázeňský pobyt v Piešťanech.',
  'Kritické dny přečká, ty úspěšné chce prožít ve dvou.', 'Hledá někoho, kdo umí naslouchat.', 'Ozvi se, pokud máš raději dopisy psané rukou.', 'Hledá parťáka na stanování u jezera.', 'Kuchyně je velká, stůl ještě větší, chybí jen společnost.',
  'Hledá někoho, kdo se raduje z maličkostí.', 'Ozvi se, pokud tě baví jezdit na koni nebo aspoň krmit koně jablky.', 'Hledá někoho, s kým bude v autě nahlas zpívat.', 'Ideální rande: procházka, lokše a dlouhý rozhovor.', 'Hledá někoho, kdo zvládne i pondělky.',
  'Ozvi se, pokud víš, že nejkrásnější výhledy jsou po dlouhém stoupání.', 'Hledá společnost na večerní procházky po náměstí.', 'Věří v lásku na první pohled i na druhý kondiciogram.', 'Hledá někoho, kdo ještě posílá pohlednice z dovolené.', 'Ozvi se. Stroj se nemýlí, a když ano, aspoň bude legrace.'
];

// Milostný provoz (stav partnera), [ženský tvar, mužský tvar]
const LOVE = [
  ['stále panna', 'stále panic'], ['nezahájen', 'nezahájen'], ['ve zkušebním provozu', 've zkušebním provozu'],
  ['v generální opravě', 'v generální opravě'], ['dočasně mimo provoz', 'dočasně mimo provoz'], ['omezen na víkendy', 'omezen na víkendy'],
  ['po záruce, ale funkční', 'po záruce, ale funkční'], ['čeká na schválení nadřízeným', 'čeká na schválení nadřízeným'],
  ['přerušen z technických důvodů', 'přerušen z technických důvodů'], ['obnoven po rekonstrukci', 'obnoven po rekonstrukci'],
  ['v úsporném režimu', 'v úsporném režimu'], ['plně provozuschopná', 'plně provozuschopný'],
  ['zahájen, výsledky neprůkazné', 'zahájen, výsledky neprůkazné'], ['v třísměnném provozu', 'v třísměnném provozu']
];

// robotické hlášky stroje k výběru partnera (česky, velkými písmeny, bez diakritiky)
const ROBOT = [
  'PAROVANI DOKONCENO. NAVRAT NENI MOZNY.', 'OSUDOVOST OVERENA NA TRI DESETINNA MISTA.', 'DOPORUCENI: PRVNI SCHUZKU NEHLASIT NADRIZENEMU.',
  'CITOVA PREVODOVKA VYZADUJE MAZANI.', 'SLUCITELNOST V NORME. ROMANTIKA NAD NORMU NENI HRAZENA.', 'STROJ NERUCI ZA PRIPADNOU TCHYNI.',
  'VZTAH SCHVALEN VYPOCETNIM STREDISKEM.', 'ZARUCNI DOBA: 24 MESICU OD PRVNI SCHUZKY.', 'PRI PORUCHE KONTAKTUJTE SERVIS LASKY.',
  'ZADOSTI O VYMENU PARTNERA SE NEPRIJIMAJI.', 'OCEKAVANA SPOTREBA KVETIN: 3 KYTICE MESICNE.', 'DOPORUCENY ODSTUP NA PRVNI SCHUZCE: 60 CM.',
  'SYNCHRONIZACE SRDCI PROBIHA. NEVYPINAT.', 'SPOLECNA DOMACNOST MOZNA PO SCHVALENI BYTOVYM PODNIKEM.', 'RIZIKO ZAMILOVANI: VYSOKE.',
  'PORUCHA CITOVEHO OBVODU VYLOUCENA.', 'PARTNER DODAN BEZ NAVODU K OBSLUZE.', 'KONVERZACI DOPORUCUJEME ZAHAJIT TEMATEM POCASI.',
  'LASKA NA PRVNI POHLED: ZAMITNUTO. LASKA NA DRUHY VYPOCET: SCHVALENO.', 'VAROVANI: PARTNER MUZE OBSAHOVAT STOPY MAMINKY.'
];

const NAMES = {
  f: { first: FEMALE_FIRST, last: FEMALE_LAST, job: JOBS.map(j => j[0]), love: LOVE.map(l => l[0]) },
  m: { first: MALE_FIRST, last: MALE_LAST, job: JOBS.map(j => j[1]), love: LOVE.map(l => l[1]) },
  cities: CITIES,
  hobby: HOBBIES,
  ads: ADS,
  robot: ROBOT
};
