import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const dbFilePath = path.join(__dirname, "../../../db.json");

interface User {
  id: string;
  type: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  localUserId: string | null;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Marker {
  id: string;
  title: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  address: string | null;
  publicStatus: string;
  verificationStatus: string;
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: string;
  submittedByLocalUserId: string | null;
  approvedByAdminId: string | null;
  lastVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MarkerReport {
  id: string;
  markerId: string;
  localUserId: string;
  reportedStatus: string;
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: string;
  issueType: string;
  comment: string | null;
  createdAt: Date;
}

interface Guide {
  id: string;
  slug: string;
  category: string;
  priority: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GuideTranslation {
  id: string;
  guideId: string;
  language: string;
  title: string;
  shortDescription: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GuideChecklistItem {
  id: string;
  guideId: string;
  order: number;
  textCs: string;
  textEn: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminSession {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
}

interface DBState {
  users: User[];
  markers: Marker[];
  markerReports: MarkerReport[];
  guides: Guide[];
  guideTranslations: GuideTranslation[];
  guideChecklistItems: GuideChecklistItem[];
  adminSessions: AdminSession[];
}

function parseJSONWithDates(jsonString: string): DBState {
  return JSON.parse(jsonString, (key, value) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  });
}

function matchesFilter(record: any, where: any): boolean {
  if (!where) return true;
  for (const [key, filterVal] of Object.entries(where)) {
    if (filterVal && typeof filterVal === "object" && !Array.isArray(filterVal) && !(filterVal instanceof Date)) {
      const f = filterVal as any;
      if ("in" in f) {
        if (!f.in.includes(record[key])) return false;
      }
      if ("gte" in f) {
        if (record[key] < f.gte) return false;
      }
      if ("lte" in f) {
        if (record[key] > f.lte) return false;
      }
    } else {
      if (record[key] !== filterVal) return false;
    }
  }
  return true;
}

function sortRecords(records: any[], orderBy: any): any[] {
  if (!orderBy) return records;
  const sorted = [...records];
  const keys = Object.keys(orderBy);
  if (keys.length === 0) return sorted;
  
  const key = keys[0];
  const direction = orderBy[key];
  
  sorted.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    
    if (valA instanceof Date) valA = valA.getTime();
    if (valB instanceof Date) valB = valB.getTime();
    
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    if (direction === "asc") {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
  return sorted;
}

function seedInitialDB(): DBState {
  const state: DBState = {
    users: [
      {
        id: randomUUID(),
        type: "ADMIN",
        email: "admin@praha-blackout.demo",
        role: "ADMIN",
        name: "Prague Admin",
        preferredLanguage: "en",
        localUserId: null,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        type: "ANONYMOUS",
        localUserId: "local_user_demo888",
        preferredLanguage: "en",
        email: null,
        role: "USER",
        name: null,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    markers: [],
    markerReports: [],
    guides: [],
    guideTranslations: [],
    guideChecklistItems: [],
    adminSessions: [],
  };

  const markersData = [
    {
      title: "General University Hospital in Prague",
      description: "Main emergency medical care. Emergency power generators are functional.",
      category: "HOSPITAL",
      latitude: 50.0735,
      longitude: 14.4211,
      address: "U Nemocnice 499/2, 128 08 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "MEDIUM",
    },
    {
      title: "St. Ludmila Pharmacy",
      description: "Distribution of basic medicines and medical supplies.",
      category: "PHARMACY",
      latitude: 50.0759,
      longitude: 14.4368,
      address: "Belgická 36, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "LOW",
    },
    {
      title: "MOL Prague Argentinska",
      description: "Gas station with a backup generator. Fuel sale limited to max 20L per person.",
      category: "GAS_STATION",
      latitude: 50.1065,
      longitude: 14.4445,
      address: "Argentinská 1, 170 00 Praha 7",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: "HIGH",
    },
    {
      title: "Police of the Czech Republic - Krakovska Station",
      description: "Police station. Incident reporting and emergency assistance.",
      category: "POLICE_STATION",
      latitude: 50.0792,
      longitude: 14.4278,
      address: "Krakovská 5, 110 00 Praha 1",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "LOW",
    },
    {
      title: "Fire Station 1 - Sokolska",
      description: "Prague Fire Rescue Service. Emergency water supply and technical assistance.",
      category: "FIRE_STATION",
      latitude: 50.0768,
      longitude: 14.4299,
      address: "Sokolská 62, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "MEDIUM",
    },
    {
      title: "Albert Supermarket - I.P. Pavlova",
      description: "Grocery store. Limited opening hours, cash payment only (CZK/EUR).",
      category: "SUPERMARKET",
      latitude: 50.0752,
      longitude: 14.4305,
      address: "Jugoslávská 662/6, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "HIGH",
    },
    {
      title: "Prague Main Railway Station (Transport Hub)",
      description: "Train station. Backup lighting on. Information boards out of service.",
      category: "PUBLIC_TRANSPORT_HUB",
      latitude: 50.0831,
      longitude: 14.4361,
      address: "Wilsonova 300/8, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "HIGH",
    },
    {
      title: "Prague 2 District Office",
      description: "Prague 2 Crisis Coordination Center. Official information and volunteer registration.",
      category: "CITY_DISTRICT_OFFICE",
      latitude: 50.0757,
      longitude: 14.4292,
      address: "nám. Míru 600/20, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: "MEDIUM",
    },
    {
      title: "Sokol Vinohrady Community Center",
      description: "Place for heating, drinking water, and charging small electronics.",
      category: "COMMUNITY_CENTER",
      latitude: 50.0772,
      longitude: 14.4411,
      address: "Polská 2400/1a, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: "MEDIUM",
    },
    {
      title: "Londynska Elementary School",
      description: "Temporary emergency shelter and evacuation center for citizens.",
      category: "SCHOOL",
      latitude: 50.0741,
      longitude: 14.4335,
      address: "Londýnská 782/34, 120 00 Praha 2",
      publicStatus: "CLOSED",
      verificationStatus: "APPROVED",
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "UNKNOWN",
    },
    {
      title: "Senior Home Machova",
      description: "Care for senior citizens and vulnerable individuals. Looking for volunteers to help.",
      category: "ELDERLY_CARE",
      latitude: 50.0718,
      longitude: 14.4385,
      address: "Máchova 430/14, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "MEDIUM",
    },
    {
      title: "Namesti Miru Emergency Support Point",
      description: "Distribution of hot food, drinking water, blankets, and crisis psychological support.",
      category: "EMERGENCY_SUPPORT_POINT",
      latitude: 50.0751,
      longitude: 14.4365,
      address: "náměstí Míru, 120 00 Praha 2",
      publicStatus: "OPEN",
      verificationStatus: "APPROVED",
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: "HIGH",
    }
  ];

  for (const m of markersData) {
    state.markers.push({
      id: randomUUID(),
      ...m,
      submittedByLocalUserId: null,
      approvedByAdminId: null,
      lastVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const guidesData = [
    {
      slug: "before-blackout",
      category: "BEFORE_BLACKOUT",
      priority: 1,
      isPublished: true,
      translations: {
        cs: {
          title: "Co dělat před výpadkem",
          shortDescription: "Jak se preventivně připravit na nečekaný výpadek proudu v domácnosti.",
          content: "### Příprava domácnosti na výpadek\n\n1. **Zásoby vody**: Mějte připraveno alespoň 3 litry pitné vody na osobu a den na minimálně 3 dny.\n2. **Trvanlivé potraviny**: Udržujte zásoby jídla, které nevyžaduje vaření ani chlazení.\n3. **Svítilny a baterie**: Umístěte svítilny na snadno dostupná místa. Vyvarujte se svíček kvůli riziku požáru.\n4. **Záložní zdroje**: Udržujte své powerbanky a telefony plně nabité.\n5. **Hotovost**: Mějte u sebe dostatek hotovosti, bankomaty a platební terminály nebudou fungovat.\n6. **Komunikace**: Dohodněte se s rodinou na nouzovém plánu a místě setkání.",
        },
        en: {
          title: "What to do before a blackout",
          shortDescription: "How to preventively prepare for an unexpected power outage in your household.",
          content: "### Preparing Your Household\n\n1. **Water Supply**: Keep at least 3 liters of drinking water per person per day for at least 3 days.\n2. **Non-perishable Food**: Maintain a supply of food that does not require cooking or refrigeration.\n3. **Flashlights & Batteries**: Keep flashlights in easily accessible spots. Avoid candles due to fire risks.\n4. **Power Sources**: Keep your power banks and phones fully charged.\n5. **Cash**: Keep enough cash on hand, as ATMs and card terminals will not work.\n6. **Communication Plan**: Agree with family members on an emergency plan and meeting point.",
        }
      },
      checklist: [
        { order: 1, textCs: "Nabijte telefony a powerbanky", textEn: "Charge your phone and power banks" },
        { order: 2, textCs: "Připravte pitnou vodu (3l/osoba/den)", textEn: "Prepare drinking water (3l/person/day)" },
        { order: 3, textCs: "Připravte svítilny a baterie", textEn: "Prepare flashlights and batteries" },
        { order: 4, textCs: "Uložte si důležité kontakty offline", textEn: "Save important contacts offline" },
        { order: 5, textCs: "Zkontrolujte starší sousedy", textEn: "Check on elderly neighbors" }
      ]
    },
    {
      slug: "during-blackout",
      category: "DURING_BLACKOUT",
      priority: 2,
      isPublished: true,
      translations: {
        cs: {
          title: "Co dělat během výpadku",
          shortDescription: "Klíčové kroky pro bezpečnost a zachování klidu ihned po výpadku proudu.",
          content: "### Okamžitá reakce při výpadku\n\n1. **Zachovejte klid**: Většina výpadků končí během několika hodin.\n2. **Ochrana elektroniky**: Odpojte citlivé spotřebiče ze zásuvek, abyste je chránili před přepětím při obnovení dodávek.\n3. **Lednice a mrazák**: Nechte dveře chladničky a mrazničky zavřené. Lednice udrží chlad cca 4 hodiny, plný mrazák až 48 hodin.\n4. **Osvětlení**: Používejte přednostně baterky. Pokud musíte použít svíčky, nenechávejte je nikdy bez dozoru.\n5. **Zjišťování informací**: Ladte přenosné rádio na frekvence Českého rozhlasu Radiožurnál pro nouzové vysílání.",
        },
        en: {
          title: "What to do during a blackout",
          shortDescription: "Key steps for safety and keeping calm immediately after a power outage.",
          content: "### Immediate Reaction\n\n1. **Stay Calm**: Most power outages end within a few hours.\n2. **Unplug Electronics**: Unplug sensitive appliances to protect them from power surges when power is restored.\n3. **Fridge & Freezer**: Keep refrigerator and freezer doors closed. A fridge keeps food cold for about 4 hours; a full freezer up to 48 hours.\n4. **Lighting**: Use flashlights. If you must use candles, never leave them unattended.\n5. **Stay Informed**: Tune a portable radio to official emergency broadcast frequencies.",
        }
      },
      checklist: [
        { order: 1, textCs: "Zachovejte klid", textEn: "Stay calm" },
        { order: 2, textCs: "Vypněte / odpojte citlivou elektroniku", textEn: "Turn off/unplug sensitive electronics" },
        { order: 3, textCs: "Používejte raději baterky než svíčky", textEn: "Use flashlights instead of candles if possible" },
        { order: 4, textCs: "Sledujte oficiální zprávy na mobilu či rádiu", textEn: "Check official city communications if internet is available" },
        { order: 5, textCs: "Omezte zbytečné cestování", textEn: "Avoid unnecessary travel" }
      ]
    },
    {
      slug: "water-and-food",
      category: "WATER_AND_FOOD",
      priority: 3,
      isPublished: true,
      translations: {
        cs: {
          title: "Voda a potraviny",
          shortDescription: "Jak bezpečně hospodařit s vodou a jídlem během delšího výpadku.",
          content: "### Hospodaření s vodou a potravinami\n\n1. **Šetřete vodou**: Dodávka vody z kohoutku může při výpadku elektřiny u čerpacích stanic selhat. Kohoutkovou vodu používejte pouze k pití.\n2. **Potraviny z lednice**: Nejprve spotřebujte potraviny podléhající rychlé zkáze z chladničky.\n3. **Příprava jídla**: K vaření používejte kempingový vařič, ale **pouze ve venkovních prostorech** kvůli riziku otravy oxidem uhelnatým!\n4. **Nouzové zdroje**: Zjistěte si polohu nejbližšího nouzového odběrného místa pitné vody v naší aplikaci.",
        },
        en: {
          title: "Water and Food",
          shortDescription: "How to safely manage food and water during a prolonged blackout.",
          content: "### Water and Food Management\n\n1. **Conserve Water**: Tap water supply might fail if water pumps lose power. Limit water usage to drinking.\n2. **Eat Perishables First**: Consume perishable foods from the fridge first before opening non-perishable canned food.\n3. **Cooking Safety**: Use camping stoves only outdoors to prevent carbon monoxide poisoning!\n4. **Emergency Points**: Find the nearest emergency water distribution point using our interactive map.",
        }
      },
      checklist: [
        { order: 1, textCs: "Udržujte zásoby vody doma", textEn: "Keep drinking water at home" },
        { order: 2, textCs: "Připravte si trvanlivé potraviny", textEn: "Prepare non-perishable food" },
        { order: 3, textCs: "Neotvírejte zbytečně lednici a mrazák", textEn: "Avoid opening fridge/freezer often" },
        { order: 4, textCs: "Najděte nejbližší nouzový zdroj pitné vody", textEn: "Check nearby supermarkets or support points" }
      ]
    },
    {
      slug: "medical-help",
      category: "MEDICAL_HELP",
      priority: 4,
      isPublished: true,
      translations: {
        cs: {
          title: "Lékařská pomoc a hygiena",
          shortDescription: "Jak řešit zdravotní potíže a léky bez elektrického proudu.",
          content: "### Zdravotní péče při výpadku\n\n1. **Krizové linky**: Tísňová volání (112, 155, 150, 158) fungují i při lokálním výpadku mobilní sítě. Pokud není signál vašeho operátora, vyjměte SIM kartu a volejte 112.\n2. **Léky**: Ujistěte se, že máte zásobu životně důležitých léků na minimálně 7 dní.\n3. **Zdravotnické přístroje**: Lidé závislí na elektrických přístrojích (např. kyslíkové koncentrátory) by měli ihned kontaktovat nejbližší nemocnici nebo nouzové podpůrné místo.",
        },
        en: {
          title: "Medical Help and Hygiene",
          shortDescription: "How to manage health issues and medication without electricity.",
          content: "### Medical Care During an Outage\n\n1. **Emergency Lines**: Emergency numbers (112, 155) work even during local network outages. If your operator is offline, remove the SIM card and call 112.\n2. **Medications**: Make sure you have at least a 7-day supply of essential medications.\n3. **Medical Devices**: People dependent on life-support equipment (e.g. oxygen concentrators) should immediately go to the nearest hospital or emergency support point.",
        }
      },
      checklist: [
        { order: 1, textCs: "Udržujte léky snadno dostupné", textEn: "Keep essential medication available" },
        { order: 2, textCs: "Zjistěte polohu nejbližší funkční nemocnice", textEn: "Know the nearest hospital or pharmacy" },
        { order: 3, textCs: "Uložte si čísla na záchranné složky offline", textEn: "Save emergency numbers offline" },
        { order: 4, textCs: "Zkontrolujte lidi závislé na el. přístrojích", textEn: "Check on people who need medical devices" }
      ]
    },
    {
      slug: "communication",
      category: "COMMUNICATION",
      priority: 5,
      isPublished: true,
      translations: {
        cs: {
          title: "Komunikace a informace",
          shortDescription: "Jak zůstat v kontaktu se svými blízkými a získávat ověřené informace.",
          content: "### Udržení komunikace\n\n1. **Šetřete baterie telefonu**: Zapněte režim extrémní úspory energie, snižte jas, vypněte Bluetooth a lokalizační služby.\n2. **SMS zprávy**: Pokud je síť přetížena, SMS zprávy mají vyšší šanci na doručení než běžný hovor nebo mobilní data.\n3. **Rozhlas**: Hlavním zdrojem informací bude Český rozhlas. Mějte po ruce klasické rádio na baterky nebo rádio v autě.\n4. **Nouzové kontakty**: Mějte zapsaná důležitá telefonní čísla na papíře.",
        },
        en: {
          title: "Communication and Information",
          shortDescription: "How to stay in contact with loved ones and get verified information.",
          content: "### Keeping in Touch\n\n1. **Save Phone Battery**: Turn on battery saver mode, lower brightness, turn off Bluetooth and location tracking.\n2. **Use SMS**: When networks are congested, SMS messages have a higher success rate than voice calls or mobile data.\n3. **Radio Broadcasts**: Classic portable radios or car radios tuned to public broadcasting will be the primary source of news.\n4. **Physical Contacts**: Write down essential phone numbers on a physical sheet of paper.",
        }
      },
      checklist: [
        { order: 1, textCs: "Aktivujte úsporný režim v telefonu", textEn: "Keep phone battery low-power mode enabled" },
        { order: 2, textCs: "Při slabém signálu preferujte SMS zprávy", textEn: "Use SMS when mobile data is unstable" },
        { order: 3, textCs: "Dohodněte si s rodinou krizové místo setkání", textEn: "Agree on a meeting point with family" },
        { order: 4, textCs: "Uložte si důležité kontakty fyzicky na papír", textEn: "Save addresses and contacts offline" }
      ]
    },
    {
      slug: "heating-and-safety",
      category: "HEATING",
      priority: 6,
      isPublished: true,
      translations: {
        cs: {
          title: "Topení a bezpečnost",
          shortDescription: "Bezpečné chování v chladném počasí a prevence nehod v domácnosti.",
          content: "### Vytápění a prevence otravy oxidem uhelnatým\n\n1. **Udržení tepla**: Zavřete místnosti, které nepoužíváte. Zdržujte se všichni v jedné místnosti.\n2. **Vrstvy oblečení**: Používejte termoprádlo, teplé svetry, čepice a spacáky.\n3. **POZOR na jedovaté plyny**: Nikdy nepoužívejte plynové grily, dřevěné uhlí nebo generátory uvnitř bytu či domu! Hrozí udušení a otrava oxidem uhelnatým (CO).\n4. **Zabezpečení**: Zamkněte vchodové dveře. Při nefunkčním pouličním osvětlení se vyhněte pohybu venku po setmění.",
        },
        en: {
          title: "Heating and Safety",
          shortDescription: "Staying warm in cold weather and preventing domestic hazards.",
          content: "### Heating and Carbon Monoxide Prevention\n\n1. **Retain Warmth**: Close off unused rooms. Gather family members in a single room to conserve heat.\n2. **Dress in Layers**: Wear thermal underwear, warm sweaters, hats, and use sleeping bags.\n3. **Toxic Gas Warning**: Never use outdoor gas grills, charcoal heaters, or power generators indoors! It poses a fatal risk of carbon monoxide (CO) poisoning.\n4. **Security**: Keep your entrance locked. Avoid walking outside after dark if street lighting is completely off.",
        }
      },
      checklist: [
        { order: 1, textCs: "Nikdy nepoužívejte venkovní vařiče uvnitř", textEn: "Do not use outdoor grills indoors" },
        { order: 2, textCs: "Větrejte při použití alternativního topení", textEn: "Ventilate if using alternative heating" },
        { order: 3, textCs: "Oblečte se do více vrstev teplého oblečení", textEn: "Wear layered clothing" },
        { order: 4, textCs: "Dbejte na nebezpečí udušení/požáru", textEn: "Watch for carbon monoxide risks" }
      ]
    },
    {
      slug: "after-power-returns",
      category: "AFTER_POWER_RETURNS",
      priority: 7,
      isPublished: true,
      translations: {
        cs: {
          title: "Po obnovení dodávek",
          shortDescription: "Co zkontrolovat a udělat, jakmile se elektřina opět zapne.",
          content: "### Bezpečný návrat k běžnému provozu\n\n1. **Postupné zapínání**: Nezapínejte všechny elektrické spotřebiče naráz, abyste předešli přetížení rozvodné sítě. Zapínejte je postupně.\n2. **Kontrola potravin**: Zkontrolujte jídlo v lednici a mrazáku. Pokud teplota v mrazáku stoupla nad 4 °C na delší dobu, jídlo vyhoďte.\n3. **Doplnění zásob**: Dobijte všechny powerbanky a doplňte nouzové zásoby vody a jídla pro případ dalšího výpadku.\n4. **Sdílení**: Podělte se o aktuální informace a pomozte sousedům s úklidem.",
        },
        en: {
          title: "After Power Returns",
          shortDescription: "What to check and do once the power is successfully restored.",
          content: "### Returning to Normal Safely\n\n1. **Gradual Turn-on**: Do not turn on all appliances immediately to avoid overloading the electrical grid. Power them back on step by step.\n2. **Food Safety Check**: Evaluate the items in your fridge and freezer. If freezer food has thawed or stayed above 4°C for hours, discard it.\n3. **Refill Supplies**: Recharge your power banks and restock emergency drinking water and canned foods.\n4. **Update Statuses**: Use the app to update the status of places you visit.",
        }
      },
      checklist: [
        { order: 1, textCs: "Spotřebiče zapínejte postupně", textEn: "Turn appliances back on gradually" },
        { order: 2, textCs: "Zkontrolujte stav potravin v lednici", textEn: "Check food safety" },
        { order: 3, textCs: "Znovu dobijte powerbanky a telefony", textEn: "Recharge devices" },
        { order: 4, textCs: "Aktualizujte stavy míst, která jste navštívili", textEn: "Update marker statuses if you visited a place" }
      ]
    }
  ];

  for (const g of guidesData) {
    const guideId = randomUUID();
    state.guides.push({
      id: guideId,
      slug: g.slug,
      category: g.category,
      priority: g.priority,
      isPublished: g.isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    state.guideTranslations.push({
      id: randomUUID(),
      guideId,
      language: "cs",
      title: g.translations.cs.title,
      shortDescription: g.translations.cs.shortDescription,
      content: g.translations.cs.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    state.guideTranslations.push({
      id: randomUUID(),
      guideId,
      language: "en",
      title: g.translations.en.title,
      shortDescription: g.translations.en.shortDescription,
      content: g.translations.en.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const item of g.checklist) {
      state.guideChecklistItems.push({
        id: randomUUID(),
        guideId,
        order: item.order,
        textCs: item.textCs,
        textEn: item.textEn,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  saveDB(state);
  return state;
}

function loadDB(): DBState {
  if (fs.existsSync(dbFilePath)) {
    try {
      const content = fs.readFileSync(dbFilePath, "utf-8");
      return parseJSONWithDates(content);
    } catch (e) {
      console.error("Failed to load db.json, seeding new db", e);
    }
  }
  return seedInitialDB();
}

function saveDB(state: DBState) {
  fs.writeFileSync(dbFilePath, JSON.stringify(state, null, 2), "utf-8");
}

class MockCollection<T extends { id?: string; createdAt?: Date; updatedAt?: Date }> {
  protected collectionKey: keyof DBState;

  constructor(collectionKey: keyof DBState) {
    this.collectionKey = collectionKey;
  }

  protected getList(db: DBState): T[] {
    return db[this.collectionKey] as unknown as T[];
  }

  protected setList(db: DBState, list: T[]) {
    (db as any)[this.collectionKey] = list;
  }

  async count(args: any = {}): Promise<number> {
    const db = loadDB();
    const list = this.getList(db);
    const where = args.where;
    const filtered = list.filter(item => matchesFilter(item, where));
    return filtered.length;
  }

  async findMany(args: any = {}): Promise<any[]> {
    const db = loadDB();
    const list = this.getList(db);
    const where = args.where;
    let filtered = list.filter(item => matchesFilter(item, where));
    
    if (args.orderBy) {
      filtered = sortRecords(filtered, args.orderBy);
    }
    
    const result = filtered.map(item => this.populateRelations(db, item, args.include));
    return JSON.parse(JSON.stringify(result));
  }

  async findUnique(args: any = {}): Promise<any | null> {
    const db = loadDB();
    const list = this.getList(db);
    const where = args.where;
    const record = list.find(item => matchesFilter(item, where));
    if (!record) return null;
    
    const result = this.populateRelations(db, record, args.include);
    return JSON.parse(JSON.stringify(result));
  }

  async create(args: any = {}): Promise<any> {
    const db = loadDB();
    const list = this.getList(db);
    
    const newRecord: any = {
      id: randomUUID(),
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    list.push(newRecord);
    this.setList(db, list);
    saveDB(db);
    
    return JSON.parse(JSON.stringify(newRecord));
  }

  async update(args: any = {}): Promise<any> {
    const db = loadDB();
    const list = this.getList(db);
    const where = args.where;
    const data = args.data;
    
    const idx = list.findIndex(item => matchesFilter(item, where));
    if (idx === -1) {
      throw new Error(`Record to update not found for where: ${JSON.stringify(where)}`);
    }
    
    const updatedRecord = {
      ...list[idx],
      ...data,
      updatedAt: new Date(),
    };
    
    list[idx] = updatedRecord;
    this.setList(db, list);
    saveDB(db);
    
    return JSON.parse(JSON.stringify(updatedRecord));
  }

  async upsert(args: any = {}): Promise<any> {
    const db = loadDB();
    const list = this.getList(db);
    const where = args.where;
    const update = args.update;
    const create = args.create;
    
    let idx = -1;
    if (where.guideId_language) {
      const { guideId, language } = where.guideId_language;
      idx = list.findIndex((t: any) => t.guideId === guideId && t.language === language);
    } else {
      idx = list.findIndex(item => matchesFilter(item, where));
    }
    
    let record;
    if (idx !== -1) {
      record = {
        ...list[idx],
        ...update,
        updatedAt: new Date(),
      };
      list[idx] = record;
    } else {
      record = {
        id: randomUUID(),
        ...create,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      list.push(record);
    }
    
    this.setList(db, list);
    saveDB(db);
    return JSON.parse(JSON.stringify(record));
  }

  async delete(args: any = {}): Promise<any> {
    const db = loadDB();
    let list = this.getList(db);
    const where = args.where;
    
    const idx = list.findIndex(item => matchesFilter(item, where));
    if (idx === -1) {
      throw new Error(`Record to delete not found for where: ${JSON.stringify(where)}`);
    }
    
    const deleted = list[idx];
    list = list.filter((_, i) => i !== idx);
    this.setList(db, list);
    saveDB(db);
    
    return JSON.parse(JSON.stringify(deleted));
  }

  async deleteMany(args: any = {}): Promise<{ count: number }> {
    const db = loadDB();
    let list = this.getList(db);
    const where = args.where;
    
    let count = 0;
    if (!where || Object.keys(where).length === 0) {
      count = list.length;
      list = [];
    } else {
      const beforeLength = list.length;
      list = list.filter(item => !matchesFilter(item, where));
      count = beforeLength - list.length;
    }
    
    this.setList(db, list);
    saveDB(db);
    return { count };
  }

  private populateRelations(db: DBState, item: any, include: any): any {
    if (!include) return item;
    const cloned = { ...item };
    
    if (this.collectionKey === "markers") {
      if (include.reports) {
        let reports = db.markerReports.filter(r => r.markerId === cloned.id);
        if (include.reports.orderBy) {
          reports = sortRecords(reports, include.reports.orderBy);
        }
        cloned.reports = reports;
      }
      if (include._count && include._count.select && include._count.select.reports) {
        const reportsCount = db.markerReports.filter(r => r.markerId === cloned.id).length;
        cloned._count = { reports: reportsCount };
      }
    }
    
    if (this.collectionKey === "markerReports") {
      if (include.marker) {
        cloned.marker = db.markers.find(m => m.id === cloned.markerId) || null;
      }
    }
    
    if (this.collectionKey === "guides") {
      if (include.translations) {
        cloned.translations = db.guideTranslations.filter(t => t.guideId === cloned.id);
      }
      if (include.checklistItems) {
        let items = db.guideChecklistItems.filter(ci => ci.guideId === cloned.id);
        if (include.checklistItems.orderBy) {
          items = sortRecords(items, include.checklistItems.orderBy);
        }
        cloned.checklistItems = items;
      }
    }
    
    return cloned;
  }
}

class MarkerReportsCollection extends MockCollection<MarkerReport> {
  async groupBy(args: any = {}): Promise<any[]> {
    const { by, _count, where } = args;
    const db = loadDB();
    const filtered = db.markerReports.filter(r => matchesFilter(r, where));
    
    const groupsMap: Record<string, any[]> = {};
    for (const item of filtered) {
      const key = by.map((prop: string) => (item as any)[prop]).join("|");
      if (!groupsMap[key]) {
        groupsMap[key] = [];
      }
      groupsMap[key].push(item);
    }
    
    const results = Object.entries(groupsMap).map(([key, items]) => {
      const firstItem = items[0];
      const groupResult: any = {};
      for (const prop of by) {
        groupResult[prop] = (firstItem as any)[prop];
      }
      if (_count) {
        groupResult._count = {};
        for (const countProp of Object.keys(_count)) {
          groupResult._count[countProp] = items.length;
        }
      }
      return groupResult;
    });
    
    return results;
  }
}

const mockPrisma = {
  $disconnect: async () => {},
  user: new MockCollection<User>("users"),
  marker: new MockCollection<Marker>("markers"),
  markerReport: new MarkerReportsCollection("markerReports"),
  guide: new MockCollection<Guide>("guides"),
  guideTranslation: new MockCollection<GuideTranslation>("guideTranslations"),
  guideChecklistItem: new MockCollection<GuideChecklistItem>("guideChecklistItems"),
  adminSession: new MockCollection<AdminSession>("adminSessions"),
};

loadDB();

export const prisma = mockPrisma as unknown as PrismaClient;
