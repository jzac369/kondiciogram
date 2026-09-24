'use strict';
/* Dáta pre „Vhodného partnera“: fiktívne osoby sa skladajú z týchto zoznamov.
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

// [ženský tvar, mužský tvar]
const JOBS = [
  ['učiteľka na základnej škole', 'učiteľ na základnej škole'], ['zdravotná sestra', 'zdravotný brat'], ['účtovníčka', 'účtovník'], ['knihovníčka', 'knihovník'], ['kaderníčka', 'kaderník'],
  ['architektka', 'architekt'], ['lekárnička', 'lekárnik'], ['programátorka', 'programátor'], ['cukrárka', 'cukrár'], ['veterinárka', 'veterinár'],
  ['sprievodkyňa vo vlaku', 'sprievodca vo vlaku'], ['fotografka', 'fotograf'], ['referentka na mestskom úrade', 'referent na mestskom úrade'], ['fyzioterapeutka', 'fyzioterapeut'], ['kuchárka', 'kuchár'],
  ['automechanička', 'automechanik'], ['elektrikárka', 'elektrikár'], ['stolárka', 'stolár'], ['geodetka', 'geodet'], ['záchranárka', 'záchranár'],
  ['hasička', 'hasič'], ['policajtka', 'policajt'], ['pilotka', 'pilot'], ['rušňovodička', 'rušňovodič'], ['vodička autobusu', 'vodič autobusu'],
  ['taxikárka', 'taxikár'], ['poštová doručovateľka', 'poštový doručovateľ'], ['predavačka v potravinách', 'predavač v potravinách'], ['čašníčka', 'čašník'], ['barmanka', 'barman'],
  ['sommelierka', 'sommelier'], ['pekárka', 'pekár'], ['mäsiarka', 'mäsiar'], ['záhradníčka', 'záhradník'], ['kvetinárka', 'kvetinár'],
  ['lesníčka', 'lesník'], ['včelárka', 'včelár'], ['vinárka', 'vinár'], ['agronómka', 'agronóm'], ['zootechnička', 'zootechnik'],
  ['krajčírka', 'krajčír'], ['obuvníčka', 'obuvník'], ['hodinárka', 'hodinár'], ['zlatníčka', 'zlatník'], ['keramikárka', 'keramikár'],
  ['sklárka', 'sklár'], ['maliarka obrazov', 'maliar obrazov'], ['sochárka', 'sochár'], ['grafička', 'grafik'], ['ilustrátorka', 'ilustrátor'],
  ['spisovateľka', 'spisovateľ'], ['novinárka', 'novinár'], ['redaktorka v rozhlase', 'redaktor v rozhlase'], ['moderátorka', 'moderátor'], ['herečka v divadle', 'herec v divadle'],
  ['speváčka v zbore', 'spevák v zbore'], ['huslistka', 'huslista'], ['klaviristka', 'klavirista'], ['učiteľka hudby', 'učiteľ hudby'], ['tanečnica', 'tanečník'],
  ['trénerka plávania', 'tréner plávania'], ['inštruktorka lyžovania', 'inštruktor lyžovania'], ['horská vodkyňa', 'horský vodca'], ['sprievodkyňa na hrade', 'sprievodca na hrade'], ['archeologička', 'archeológ'],
  ['historička', 'historik'], ['archivárka', 'archivár'], ['prekladateľka', 'prekladateľ'], ['tlmočníčka', 'tlmočník'], ['právnička', 'právnik'],
  ['notárka', 'notár'], ['sudkyňa', 'sudca'], ['ekonómka', 'ekonóm'], ['bankárka', 'bankár'], ['poisťovacia agentka', 'poisťovací agent'],
  ['realitná maklérka', 'realitný maklér'], ['personalistka', 'personalista'], ['projektová manažérka', 'projektový manažér'], ['asistentka riaditeľa', 'asistent riaditeľa'], ['psychologička', 'psychológ'],
  ['logopédka', 'logopéd'], ['sociálna pracovníčka', 'sociálny pracovník'], ['učiteľka v škôlke', 'učiteľ v škôlke'], ['zubárka', 'zubár'], ['detská lekárka', 'detský lekár'],
  ['chirurgička', 'chirurg'], ['laborantka', 'laborant'], ['chemička', 'chemik'], ['meteorologička', 'meteorológ'], ['astronómka na hvezdárni', 'astronóm na hvezdárni'],
  ['stavebná inžinierka', 'stavebný inžinier'], ['strojárka', 'strojár'], ['zváračka', 'zvárač'], ['inštalatérka', 'inštalatér'], ['kominárka', 'kominár'],
  ['dispečerka dopravy', 'dispečer dopravy'], ['letuška', 'steward'], ['recepčná v hoteli', 'recepčný v hoteli'], ['masérka', 'masér'], ['módna návrhárka', 'módny návrhár']
];

const HOBBIES = [
  'turistika v Tatrách', 'záhradka na chate', 'volejbal', 'tanečné kurzy', 'krížovky', 'huby a les', 'platne zo 70. rokov', 'plávanie', 'bežky', 'šach',
  'rybačka', 'divadlo', 'motorky Jawa', 'bicykel', 'pečenie koláčov', 'kino', 'zjazdové lyžovanie', 'korčuľovanie', 'hokej na zamrznutom rybníku', 'futbal',
  'stolný tenis', 'tenis', 'bedminton', 'bowling', 'kolky', 'joga', 'beh', 'nordic walking', 'horolezectvo', 'vodáctvo na Hrone',
  'splav Dunajca', 'kempovanie', 'jaskyne', 'hrady a zrúcaniny', 'kúpele', 'termálne kúpaliská', 'fotografovanie', 'kamera Super 8', 'zbieranie známok', 'zbieranie mincí',
  'zbieranie pohľadníc', 'staré autá', 'oprava bicyklov', 'modelárstvo', 'vláčiky', 'rádioamatérstvo', 'astronómia', 'pozorovanie vtákov', 'včelárstvo', 'bylinky',
  'pestovanie paradajok', 'kaktusy', 'orchidey', 'akvárium', 'psy', 'mačky', 'jazda na koni', 'varenie', 'grilovanie', 'zaváranie',
  'víno a vinice', 'syry', 'bryndzové halušky', 'pletenie', 'háčkovanie', 'šitie', 'výšivky', 'drevorezba', 'keramika', 'akvarely',
  'kreslenie', 'kaligrafia', 'písanie básní', 'detektívky', 'historické romány', 'sci-fi', 'antikvariáty', 'kvízy', 'hlavolamy', 'sudoku',
  'mariáš', 'spoločenské hry', 'cudzie jazyky', 'cestovanie vlakom', 'geocaching', 'folklór', 'ľudové tance', 'spev v zbore', 'gitara', 'akordeón',
  'heligónka', 'klavír', 'jazz', 'rock and roll', 'disko', 'opereta', 'rozhlasové hry', 'otužovanie', 'sauna', 'dobrovoľníctvo'
];

// inzeráty sú písané bez rodu, sedia k partnerovi aj partnerke
const ADS = [
  'Hľadá niekoho, s kým sa dá rozprávať aj mlčať.', 'Ozvi sa, ak ťa bavia nedeľné obedy a dlhé prechádzky.', 'Hľadá parťáka na túry, ktorý neutečie pred prvým kopcom.', 'Vie uvariť halušky aj opraviť kvapkajúci kohútik.', 'Hľadá niekoho, kto sa smeje aj na slabších vtipoch.',
  'Na prvé rande prinesie kondiciogram, aby nevyšlo na kritický deň.', 'Hľadá spoločnosť na večery pri platniach a čaji.', 'Pozná všetky zastávky električky a chce ti ukázať tie najkrajšie.', 'Hľadá niekoho, s kým postaví chatu aj vzťah.', 'Ozvi sa, ak vieš tancovať twist alebo sa ho chceš naučiť.',
  'Hľadá spolujazdca na výlety do Tatier.', 'Má záhradku, psa a voľné miesto pri stole.', 'Hľadá niekoho, kto nepozerá na hodinky, keď je dobre.', 'Pečie najlepšiu bábovku v paneláku a nemá ju s kým jesť.', 'Hľadá človeka, ktorý si pamätá narodeniny aj bez kalendára.',
  'Ozvi sa, ak ťa neodradí dážď ani stan.', 'Hľadá niekoho, kto pochopí, prečo sú doma tri rádiá.', 'Stroj tvrdí, že sa k sebe hodíme. Kto by sa hádal so strojom?', 'Hľadá partiu na kolky a spoločnú cestu domov.', 'Hľadá spoločnosť do kina na polnočné predstavenie.',
  'Kto dočíta tento inzerát do konca, má u mňa kávu.', 'Hľadá niekoho, kto má rád rána rovnako ako noci.', 'Vie, kde rastú najlepšie dubáky. Prezradí to iba správnemu človeku.', 'Hľadá spriaznenú dušu, ktorá tiež zbiera pohľadnice.', 'Ozvi sa, ak máš radšej vlak ako auto.',
  'Hľadá niekoho na spoločné nedeľné krížovky.', 'Nechce princa ani princeznú, stačí slušný človek s humorom.', 'Hľadá spoločnosť na tanečnú zábavu v kultúrnom dome.', 'Má dva lístky na operetu. Jeden je voľný.', 'Hľadá niekoho, kto neznáša nudu.',
  'Ozvi sa, ak vieš, čo je to diaprojektor.', 'Hľadá spoločnosť na bicyklovanie popri Dunaji.', 'Kondiciogram hlási plusovú citovú fázu. Využi ju.', 'Hľadá niekoho, kto sa nebojí urobiť prvý krok.', 'Vie variť, prať aj žehliť. Chýba už len niekto na spoločnú večeru.',
  'Hľadá človeka, s ktorým sa dá smiať aj v rade na banány.', 'Ozvi sa, ak ťa baví spievať pri gitare.', 'Hľadá spoluautora spoločných spomienok.', 'Na Silvestra chce mať koho objať o polnoci.', 'Hľadá niekoho, kto má rád vôňu kávy a starých kníh.',
  'Ozvi sa, ak si myslíš, že najlepšie roky sú ešte pred nami.', 'Hľadá niekoho na dlhé listy aj krátke telefonáty.', 'Vymení samotu za spoločnú prechádzku parkom.', 'Hľadá niekoho, s kým bude jesť zmrzlinu aj v zime.', 'Ozvi sa, ak máš doma viac kníh ako tanierov.',
  'Hľadá spoločnosť na výstavy a vernisáže.', 'Kondiciogram má samé hviezdičky. Hľadá niekoho, s kým sa o ne podelí.', 'Hľadá niekoho, kto vie opraviť bicykel alebo aspoň podať kľúč.', 'Ozvi sa, ak ti chutí bryndza a dobrá nálada.', 'Hľadá parťáka na splav Dunajca.',
  'Nehľadá dokonalosť, hľadá úprimnosť.', 'Hľadá niekoho, kto sa nesťažuje na počasie.', 'Ozvi sa, ak ťa nebaví sedieť doma pri televízore.', 'Hľadá niekoho, kto bude pri hokeji fandiť rovnako nahlas.', 'Chce spoznať človeka, ktorý miluje leto na kúpalisku.',
  'Hľadá spoločnosť na nedeľné výlety autobusom do neznáma.', 'Ozvi sa, ak si nočná sova a nevadí ti ranné vtáča.', 'Hľadá niekoho, s kým sa dá variť bez hádok o soľ.', 'Stroj vyrátal ideálny deň na rande. Nepremárnime ho.', 'Hľadá niekoho, kto má rád Vianoce už od novembra.',
  'Ozvi sa, ak poznáš aspoň tri ľudové piesne.', 'Hľadá partnera do štvorhry v tenise aj v živote.', 'Pestuje paradajky a nádej. Oboje sa darí.', 'Hľadá niekoho, kto ocení domáci slivkový lekvár.', 'Ozvi sa, ak ťa baví hľadať hviezdy ďalekohľadom.',
  'Hľadá spolucestujúceho na dlhú cestu vlakom k moru.', 'Nemá auto, ale má bicykel s nosičom.', 'Hľadá niekoho, kto neodíde z kina pred koncom filmu.', 'Ozvi sa, ak vieš, že najlepšie rozhovory sú v kuchyni.', 'Hľadá človeka so zmyslom pre humor a poriadok. Stačí aj jedno.',
  'Hľadá spoločnosť na jarné upratovanie aj letné dobrodružstvá.', 'Ozvi sa, ak ťa teší prvý sneh.', 'Hľadá niekoho, s kým sa dá dlho mlčať pri ohni.', 'Rodina sa stále pýta „a kedy už?“. Pomôž.', 'Hľadá niekoho, kto pozná cestu k srdcu aj na chatu.',
  'Ozvi sa, ak si pamätáš Večerníček a stále ťa poteší.', 'Hľadá spolutanečníka na čardáš.', 'Nefajčí, pije s mierou, smeje sa bez miery.', 'Hľadá niekoho, kto má rád zvieratá aspoň tak ako ľudí.', 'Ozvi sa, ak veríš, že šťastie sa dá vypočítať.',
  'Hľadá niekoho na spoločné nedeľné raňajky.', 'Má vlastnú dielňu a chuť niečo spolu vytvoriť.', 'Hľadá niekoho, kto neprestal snívať.', 'Ozvi sa, ak ťa bavia hrady, zámky a zrúcaniny.', 'Hľadá spoločnosť na kúpeľný pobyt v Piešťanoch.',
  'Kritické dni prečká, plusové chce prežiť vo dvojici.', 'Hľadá niekoho, kto vie počúvať.', 'Ozvi sa, ak máš radšej listy písané rukou.', 'Hľadá parťáka na stanovačku pri jazere.', 'Kuchyňa je veľká, stôl ešte väčší, chýba len spoločnosť.',
  'Hľadá niekoho, kto sa teší z maličkostí.', 'Ozvi sa, ak ťa baví jazdiť na koni alebo aspoň kŕmiť kone jablkami.', 'Hľadá niekoho, s kým bude v aute nahlas spievať.', 'Ideálne rande: prechádzka, lokše a dlhý rozhovor.', 'Hľadá niekoho, kto zvládne aj pondelky.',
  'Ozvi sa, ak vieš, že najkrajšie výhľady sú po dlhom stúpaní.', 'Hľadá spoločnosť na večerné prechádzky po námestí.', 'Verí v lásku na prvý pohľad aj na druhý kondiciogram.', 'Hľadá niekoho, kto ešte posiela pohľadnice z dovolenky.', 'Ozvi sa. Stroj sa nemýli, a keď áno, aspoň bude zábava.'
];

const NAMES = {
  f: { first: FEMALE_FIRST, last: FEMALE_LAST, job: JOBS.map(j => j[0]) },
  m: { first: MALE_FIRST, last: MALE_LAST, job: JOBS.map(j => j[1]) },
  cities: CITIES,
  hobby: HOBBIES,
  ads: ADS
};
