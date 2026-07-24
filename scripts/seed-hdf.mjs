import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const ZONE_ID = "HDF";

const PEOPLE = [
  // CIR (10)
  { nom: "BAHUCHET",   prenom: "Ludovic",          codePostal: "59100", ville: "Roubaix",               role: "CIR",      lat: 50.6942,  lng: 3.1746  },
  { nom: "BENSABER",   prenom: "Hocine",            codePostal: "59000", ville: "Lille",                 role: "CIR",      lat: 50.6292,  lng: 3.0573  },
  { nom: "MECHERI",    prenom: "Ayoub",             codePostal: "59300", ville: "Valenciennes",          role: "CIR",      lat: 50.3572,  lng: 3.5236  },
  { nom: "SEBIANE",    prenom: "Bassim",            codePostal: "62000", ville: "Arras",                 role: "CIR",      lat: 50.2921,  lng: 2.7774  },
  { nom: "GUENARD",    prenom: "Benjamin",          codePostal: "80000", ville: "Amiens",                role: "CIR",      lat: 49.8941,  lng: 2.2957  },
  { nom: "PEPIN",      prenom: "Patrick",           codePostal: "62200", ville: "Boulogne-sur-Mer",      role: "CIR",      lat: 50.7267,  lng: 1.6146  },
  { nom: "ABOUELHAK",  prenom: "Salah Eddine",      codePostal: "59400", ville: "Cambrai",               role: "CIR",      lat: 50.1764,  lng: 3.2367  },
  { nom: "SAHRAOUI",   prenom: "Samir",             codePostal: "62100", ville: "Calais",                role: "CIR",      lat: 50.9519,  lng: 1.8587  },
  { nom: "SOUIDI",     prenom: "Abdesselam",        codePostal: "59200", ville: "Tourcoing",             role: "CIR",      lat: 50.7236,  lng: 3.1606  },
  { nom: "POCHEZ",     prenom: "Sylvain",           codePostal: "59380", ville: "Quaedypre",             role: "CIR",      lat: 50.983,   lng: 2.453   },

  // Référents (9)
  { nom: "EL BADDAGUI", prenom: "Abdelaghni",      codePostal: "62000", ville: "Arras",                 role: "Référent", lat: 50.4144,  lng: 2.83589 },
  { nom: "FAUVEAUX",    prenom: "Arnaud",           codePostal: "59300", ville: "Valenciennes",          role: "Référent", lat: 50.2448,  lng: 3.27774 },
  { nom: "THOMPSON",    prenom: "Clement",          codePostal: "59140", ville: "Dunkerque",             role: "Référent", lat: 50.8188,  lng: 2.00086 },
  { nom: "TOURNAND",    prenom: "Kevin",            codePostal: "80000", ville: "Amiens",                role: "Référent", lat: 49.9254,  lng: 2.30474 },
  { nom: "TOURNET",     prenom: "Anthony",          codePostal: "59300", ville: "Valenciennes",          role: "Référent", lat: 50.3486,  lng: 3.12026 },
  { nom: "DOM",         prenom: "Stephen",          codePostal: "08000", ville: "Charleville-Mézières",  role: "Référent", lat: 49.7541,  lng: 4.71733 },
  { nom: "MESSADI",     prenom: "Nacim",            codePostal: "59000", ville: "Lille",                 role: "Référent", lat: 50.6096,  lng: 3.00912 },
  { nom: "ROGERE",      prenom: "Thomas",           codePostal: "59440", ville: "Avesnes-sur-Helpe",     role: "Référent", lat: 50.288,   lng: 4.0413  },
  { nom: "SYLLA",       prenom: "Abdoul Karim",     codePostal: "59000", ville: "Lille",                 role: "Référent", lat: 50.6236,  lng: 3.0634  },

  // TMF (16)
  { nom: "BIRBES",      prenom: "Jean-Claude",      codePostal: "62000", ville: "Arras",                 role: "TMF",      lat: 50.2917,  lng: 2.7780  },
  { nom: "BLANCHARD",   prenom: "Sylvain",          codePostal: "80000", ville: "Amiens",                role: "TMF",      lat: 49.8942,  lng: 2.2958  },
  { nom: "CLAEYSSEN",   prenom: "Guillaume",        codePostal: "59160", ville: "Lomme",                 role: "TMF",      lat: 50.6435,  lng: 3.0074  },
  { nom: "COLLETTE",    prenom: "Pierre",           codePostal: "62000", ville: "Arras",                 role: "TMF",      lat: 50.2919,  lng: 2.7779  },
  { nom: "CORNU",       prenom: "Cyril",            codePostal: "59300", ville: "Valenciennes",          role: "TMF",      lat: 50.3573,  lng: 3.5238  },
  { nom: "DE MATOS",    prenom: "Anthony",          codePostal: "59000", ville: "Lille",                 role: "TMF",      lat: 50.6293,  lng: 3.0574  },
  { nom: "DELBECQUE",   prenom: "Julien",           codePostal: "59100", ville: "Roubaix",               role: "TMF",      lat: 50.6943,  lng: 3.1747  },
  { nom: "DUTRIEZ",     prenom: "Lahcen",           codePostal: "59500", ville: "Douai",                 role: "TMF",      lat: 50.3717,  lng: 3.0797  },
  { nom: "FERROT",      prenom: "Guillaume",        codePostal: "62200", ville: "Boulogne-sur-Mer",      role: "TMF",      lat: 50.7268,  lng: 1.6147  },
  { nom: "LAOUREUX",    prenom: "Vincent",          codePostal: "59300", ville: "Valenciennes",          role: "TMF",      lat: 50.3575,  lng: 3.5240  },
  { nom: "LERMUSIAUX",  prenom: "Jerome",           codePostal: "80000", ville: "Amiens",                role: "TMF",      lat: 49.8945,  lng: 2.2961  },
  { nom: "PIAU",        prenom: "Vincent",          codePostal: "59000", ville: "Lille",                 role: "TMF",      lat: 50.6295,  lng: 3.0576  },
  { nom: "QUINCHON",    prenom: "Alexis",           codePostal: "62100", ville: "Calais",                role: "TMF",      lat: 50.9521,  lng: 1.8589  },
  { nom: "ROUZET",      prenom: "Christophe",       codePostal: "59000", ville: "Lille",                 role: "TMF",      lat: 50.6296,  lng: 3.0577  },
  { nom: "VANTORRE",    prenom: "Pierre-Marie",     codePostal: "59140", ville: "Dunkerque",             role: "TMF",      lat: 51.0347,  lng: 2.3770  },
  { nom: "VIGNAUD",     prenom: "Fabrice",          codePostal: "62000", ville: "Arras",                 role: "TMF",      lat: 50.2920,  lng: 2.7781  },

  // TMRa (16)
  { nom: "BAUCHET",     prenom: "Julien",           codePostal: "59000", ville: "Lille",                 role: "TMRa",     lat: 50.6297,  lng: 3.0578  },
  { nom: "BERRAHO",     prenom: "Rachid",           codePostal: "59300", ville: "Valenciennes",          role: "TMRa",     lat: 50.3576,  lng: 3.5241  },
  { nom: "BONTINCK",    prenom: "Kevin",            codePostal: "59100", ville: "Roubaix",               role: "TMRa",     lat: 50.6944,  lng: 3.1748  },
  { nom: "CORNEZ",      prenom: "Ludovic",          codePostal: "62000", ville: "Arras",                 role: "TMRa",     lat: 50.2922,  lng: 2.7783  },
  { nom: "EL BOUAICHI", prenom: "Mehdi",            codePostal: "59500", ville: "Douai",                 role: "TMRa",     lat: 50.3718,  lng: 3.0798  },
  { nom: "FONTAINE",    prenom: "Gauthier",         codePostal: "59000", ville: "Lille",                 role: "TMRa",     lat: 50.6298,  lng: 3.0579  },
  { nom: "GALES",       prenom: "Pierre",           codePostal: "80000", ville: "Amiens",                role: "TMRa",     lat: 49.8946,  lng: 2.2962  },
  { nom: "GUERARD",     prenom: "Vincent",          codePostal: "62200", ville: "Boulogne-sur-Mer",      role: "TMRa",     lat: 50.7269,  lng: 1.6148  },
  { nom: "LARTIGE",     prenom: "Yannick",          codePostal: "59300", ville: "Valenciennes",          role: "TMRa",     lat: 50.3577,  lng: 3.5242  },
  { nom: "LE MENN",     prenom: "Loic",             codePostal: "59000", ville: "Lille",                 role: "TMRa",     lat: 50.6299,  lng: 3.0580  },
  { nom: "LEPRINCE",    prenom: "Etienne",          codePostal: "62000", ville: "Arras",                 role: "TMRa",     lat: 50.2923,  lng: 2.7784  },
  { nom: "NECTOUX",     prenom: "Florent",          codePostal: "59140", ville: "Dunkerque",             role: "TMRa",     lat: 51.0348,  lng: 2.3771  },
  { nom: "OLLIVIER",    prenom: "Thomas",           codePostal: "59000", ville: "Lille",                 role: "TMRa",     lat: 50.6300,  lng: 3.0581  },
  { nom: "PUSSIAU",     prenom: "Thomas",           codePostal: "59100", ville: "Roubaix",               role: "TMRa",     lat: 50.6945,  lng: 3.1749  },
  { nom: "SALAMI",      prenom: "S. Moussa",        codePostal: "62000", ville: "Arras",                 role: "TMRa",     lat: 50.2924,  lng: 2.7785  },
  { nom: "VUILLEMIN",   prenom: "Kevin",            codePostal: "59300", ville: "Valenciennes",          role: "TMRa",     lat: 50.3578,  lng: 3.5243  },

  // TMRe (22)
  { nom: "AOUST",        prenom: "Damien",          codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6301,  lng: 3.0582  },
  { nom: "BARDEUR",      prenom: "Adrien",          codePostal: "59300", ville: "Valenciennes",          role: "TMRe",     lat: 50.3579,  lng: 3.5244  },
  { nom: "BEAUMONT",     prenom: "Julien",          codePostal: "62000", ville: "Arras",                 role: "TMRe",     lat: 50.2925,  lng: 2.7786  },
  { nom: "BOCO",         prenom: "Romain",          codePostal: "80000", ville: "Amiens",                role: "TMRe",     lat: 49.8947,  lng: 2.2963  },
  { nom: "BONO",         prenom: "Steve",           codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6302,  lng: 3.0583  },
  { nom: "BRENNE",       prenom: "Baptiste",        codePostal: "59100", ville: "Roubaix",               role: "TMRe",     lat: 50.6946,  lng: 3.1750  },
  { nom: "CAMART",       prenom: "Thibault",        codePostal: "62200", ville: "Boulogne-sur-Mer",      role: "TMRe",     lat: 50.7270,  lng: 1.6149  },
  { nom: "CHEVALIER",    prenom: "Florian",         codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6303,  lng: 3.0584  },
  { nom: "COLLIER",      prenom: "Alexis",          codePostal: "59500", ville: "Douai",                 role: "TMRe",     lat: 50.3719,  lng: 3.0799  },
  { nom: "DELBECQUE",    prenom: "Maxime",          codePostal: "59100", ville: "Roubaix",               role: "TMRe",     lat: 50.6947,  lng: 3.1751  },
  { nom: "DEREGNAUCOURT",prenom: "Sylvain",         codePostal: "59300", ville: "Valenciennes",          role: "TMRe",     lat: 50.3580,  lng: 3.5245  },
  { nom: "DESREUMAUX",   prenom: "Pierre",          codePostal: "62000", ville: "Arras",                 role: "TMRe",     lat: 50.2926,  lng: 2.7787  },
  { nom: "DUBOIS",       prenom: "Florian",         codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6304,  lng: 3.0585  },
  { nom: "DUCLERCQ",     prenom: "Kevin",           codePostal: "59140", ville: "Dunkerque",             role: "TMRe",     lat: 51.0349,  lng: 2.3772  },
  { nom: "GUIETTE",      prenom: "Julien",          codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6305,  lng: 3.0586  },
  { nom: "KAFANDO",      prenom: "Romuald",         codePostal: "62000", ville: "Arras",                 role: "TMRe",     lat: 50.2927,  lng: 2.7788  },
  { nom: "LECLERCQ",     prenom: "Damien",          codePostal: "59300", ville: "Valenciennes",          role: "TMRe",     lat: 50.3581,  lng: 3.5246  },
  { nom: "LIBERT",       prenom: "Julien",          codePostal: "59100", ville: "Roubaix",               role: "TMRe",     lat: 50.6948,  lng: 3.1752  },
  { nom: "LOONIS",       prenom: "Quentin",         codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.567,   lng: 2.946   },
  { nom: "MEURISSE",     prenom: "Romain",          codePostal: "80000", ville: "Amiens",                role: "TMRe",     lat: 49.8948,  lng: 2.2964  },
  { nom: "WATERLOT",     prenom: "Kevin",           codePostal: "59000", ville: "Lille",                 role: "TMRe",     lat: 50.6306,  lng: 3.0587  },
  { nom: "ZOUBEIR",      prenom: "Oussama",         codePostal: "59300", ville: "Valenciennes",          role: "TMRe",     lat: 50.3582,  lng: 3.5247  },
];

try {
  // Insert zone
  await client.query(
    `INSERT INTO zones (id, label) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [ZONE_ID, "Hauts-de-France"]
  );

  let inserted = 0;
  for (const p of PEOPLE) {
    const id = `base-HDF-${p.nom.replace(/\s+/g, "_").toUpperCase()}_${p.prenom.replace(/\s+/g, "_").toUpperCase()}`;
    const result = await client.query(
      `INSERT INTO resources (id, zone_id, prenom, nom, ville, code_postal, role, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         prenom = EXCLUDED.prenom,
         nom = EXCLUDED.nom,
         ville = EXCLUDED.ville,
         code_postal = EXCLUDED.code_postal,
         role = EXCLUDED.role,
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng`,
      [id, ZONE_ID, p.prenom, p.nom, p.ville, p.codePostal, p.role, p.lat, p.lng]
    );
    if (result.rowCount > 0) inserted++;
  }
  console.log(`[seed-hdf] Done — ${inserted}/${PEOPLE.length} rows upserted`);
} finally {
  await client.end();
}
