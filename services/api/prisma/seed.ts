import { PrismaClient, PublicStatus, VerificationStatus, CrowdLevel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing tables
  await prisma.adminSession.deleteMany({});
  await prisma.markerReport.deleteMany({});
  await prisma.marker.deleteMany({});
  await prisma.guideTranslation.deleteMany({});
  await prisma.guideChecklistItem.deleteMany({});
  await prisma.guide.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create local test users
  const adminUser = await prisma.user.create({
    data: {
      type: "ADMIN",
      email: "admin@praha-blackout.demo",
      role: "ADMIN",
      name: "Prague Admin",
      preferredLanguage: "en",
    },
  });

  const mockUser = await prisma.user.create({
    data: {
      type: "ANONYMOUS",
      localUserId: "local_user_demo888",
      preferredLanguage: "en",
    },
  });

  console.log("Users seeded.");

  // 3. Create Seed Markers (Prague locations)
  const markersData = [
    {
      title: "General University Hospital in Prague",
      description: "Main emergency medical care. Emergency power generators are functional.",
      category: "HOSPITAL",
      latitude: 50.0735,
      longitude: 14.4211,
      address: "U Nemocnice 499/2, 128 08 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.MEDIUM,
      lastVerifiedAt: new Date(),
    },
    {
      title: "St. Ludmila Pharmacy",
      description: "Distribution of basic medicines and medical supplies.",
      category: "PHARMACY",
      latitude: 50.0759,
      longitude: 14.4368,
      address: "Belgická 36, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.LOW,
      lastVerifiedAt: new Date(),
    },
    {
      title: "MOL Prague Argentinska",
      description: "Gas station with a backup generator. Fuel sale limited to max 20L per person.",
      category: "GAS_STATION",
      latitude: 50.1065,
      longitude: 14.4445,
      address: "Argentinská 1, 170 00 Praha 7",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: CrowdLevel.HIGH,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Police of the Czech Republic - Krakovska Station",
      description: "Police station. Incident reporting and emergency assistance.",
      category: "POLICE_STATION",
      latitude: 50.0792,
      longitude: 14.4278,
      address: "Krakovská 5, 110 00 Praha 1",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.LOW,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Fire Station 1 - Sokolska",
      description: "Prague Fire Rescue Service. Emergency water supply and technical assistance.",
      category: "FIRE_STATION",
      latitude: 50.0768,
      longitude: 14.4299,
      address: "Sokolská 62, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.MEDIUM,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Albert Supermarket - I.P. Pavlova",
      description: "Grocery store. Limited opening hours, cash payment only (CZK/EUR).",
      category: "SUPERMARKET",
      latitude: 50.0752,
      longitude: 14.4305,
      address: "Jugoslávská 662/6, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.HIGH,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Prague Main Railway Station (Transport Hub)",
      description: "Train station. Backup lighting on. Information boards out of service.",
      category: "PUBLIC_TRANSPORT_HUB",
      latitude: 50.0831,
      longitude: 14.4361,
      address: "Wilsonova 300/8, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.HIGH,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Prague 2 District Office",
      description: "Prague 2 Crisis Coordination Center. Official information and volunteer registration.",
      category: "CITY_DISTRICT_OFFICE",
      latitude: 50.0757,
      longitude: 14.4292,
      address: "nám. Míru 600/20, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: CrowdLevel.MEDIUM,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Sokol Vinohrady Community Center",
      description: "Place for heating, drinking water, and charging small electronics.",
      category: "COMMUNITY_CENTER",
      latitude: 50.0772,
      longitude: 14.4411,
      address: "Polská 2400/1a, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: true,
      crowdLevel: CrowdLevel.MEDIUM,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Londynska Elementary School",
      description: "Temporary emergency shelter and evacuation center for citizens.",
      category: "SCHOOL",
      latitude: 50.0741,
      longitude: 14.4335,
      address: "Londýnská 782/34, 120 00 Praha 2",
      publicStatus: PublicStatus.CLOSED,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: false,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.UNKNOWN,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Senior Home Machova",
      description: "Care for senior citizens and vulnerable individuals. Looking for volunteers to help.",
      category: "ELDERLY_CARE",
      latitude: 50.0718,
      longitude: 14.4385,
      address: "Máchova 430/14, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.MEDIUM,
      lastVerifiedAt: new Date(),
    },
    {
      title: "Namesti Miru Emergency Support Point",
      description: "Distribution of hot food, drinking water, blankets, and crisis psychological support.",
      category: "EMERGENCY_SUPPORT_POINT",
      latitude: 50.0751,
      longitude: 14.4365,
      address: "náměstí Míru, 120 00 Praha 2",
      publicStatus: PublicStatus.OPEN,
      verificationStatus: VerificationStatus.APPROVED,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      crowdLevel: CrowdLevel.HIGH,
      lastVerifiedAt: new Date(),
    }
  ];

  for (const m of markersData) {
    await prisma.marker.create({
      data: m,
    });
  }

  console.log("Markers seeded.");

  // 4. Create 7 Emergency Guides
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
          content: "### Udržení komunikace\n\n1. **Šetřete baterii telefonu**: Zapněte režim extrémní úspory energie, snižte jas, vypněte Bluetooth a lokalizační služby.\n2. **SMS zprávy**: Pokud je síť přetížena, SMS zprávy mají vyšší šanci na doručení než běžný hovor nebo mobilní data.\n3. **Rozhlas**: Hlavním zdrojem informací bude Český rozhlas. Mějte po ruce klasické rádio na baterky nebo rádio v autě.\n4. **Nouzové kontakty**: Mějte zapsaná důležitá telefonní čísla na papíře.",
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
    const guide = await prisma.guide.create({
      data: {
        slug: g.slug,
        category: g.category,
        priority: g.priority,
        isPublished: g.isPublished,
      },
    });

    // Seed translations
    await prisma.guideTranslation.create({
      data: {
        guideId: guide.id,
        language: "cs",
        title: g.translations.cs.title,
        shortDescription: g.translations.cs.shortDescription,
        content: g.translations.cs.content,
      },
    });

    await prisma.guideTranslation.create({
      data: {
        guideId: guide.id,
        language: "en",
        title: g.translations.en.title,
        shortDescription: g.translations.en.shortDescription,
        content: g.translations.en.content,
      },
    });

    // Seed checklist items
    for (const item of g.checklist) {
      await prisma.guideChecklistItem.create({
        data: {
          guideId: guide.id,
          order: item.order,
          textCs: item.textCs,
          textEn: item.textEn,
        },
      });
    }
  }

  console.log("Guides seeded successfully.");
  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
