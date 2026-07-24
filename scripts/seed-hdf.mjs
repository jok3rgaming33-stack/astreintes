import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const ZONE_ID = "HDF";

// Coordonnées GPS exactes issues de l'annuaire officiel HDF
// LOONIS et POCHEZ ont des coordonnées réelles (Lille Sainghin + Quaedypre)
const PEOPLE = [
  // CIR (10)
  { nom: "BAHUCHET",        prenom: "Ludovic",          codePostal: "80000", ville: "Amiens",                  role: "CIR",      lat: 49.7520,  lng: 2.35978  },
  { nom: "BENSABER",        prenom: "Hocine",            codePostal: "59140", ville: "Dunkerque",               role: "CIR",      lat: 51.0153,  lng: 2.30788  },
  { nom: "MECHERI",         prenom: "Ayoub",             codePostal: "59000", ville: "Lille",                   role: "CIR",      lat: 50.6318,  lng: 3.02764  },
  { nom: "SEBIANE",         prenom: "Bassim",            codePostal: "59000", ville: "Lille",                   role: "CIR",      lat: 50.6251,  lng: 3.03896  },
  { nom: "GUENARD",         prenom: "Benjamin",          codePostal: "60000", ville: "Beauvais",                role: "CIR",      lat: 49.4397,  lng: 2.88304  },
  { nom: "PEPIN",           prenom: "Patrick",           codePostal: "62000", ville: "Arras",                   role: "CIR",      lat: 50.5373,  lng: 2.81568  },
  { nom: "ABOUELHAK",       prenom: "Salah Eddine",      codePostal: "80000", ville: "Amiens",                  role: "CIR",      lat: 49.7003,  lng: 2.79167  },
  { nom: "SAHRAOUI",        prenom: "Samir",             codePostal: "59140", ville: "Dunkerque",               role: "CIR",      lat: 51.0107,  lng: 2.28809  },
  { nom: "SOUIDI",          prenom: "Abdesselam",        codePostal: "62000", ville: "Arras",                   role: "CIR",      lat: 50.4335,  lng: 2.78191  },
  { nom: "POCHEZ",          prenom: "Sylvain",           codePostal: "59380", ville: "Quaedypre",               role: "CIR",      lat: 50.9830,  lng: 2.45300  },

  // Référents (9)
  { nom: "EL BADDAGUI",     prenom: "Abdelaghni",        codePostal: "62000", ville: "Arras",                   role: "Référent", lat: 50.4144,  lng: 2.83589  },
  { nom: "FAUVEAUX",        prenom: "Arnaud",            codePostal: "59300", ville: "Valenciennes",            role: "Référent", lat: 50.2448,  lng: 3.27774  },
  { nom: "THOMPSON",        prenom: "Clement",           codePostal: "59140", ville: "Dunkerque",               role: "Référent", lat: 50.8188,  lng: 2.00086  },
  { nom: "TOURNAND",        prenom: "Kevin",             codePostal: "80000", ville: "Amiens",                  role: "Référent", lat: 49.9254,  lng: 2.30474  },
  { nom: "TOURNET",         prenom: "Anthony",           codePostal: "59300", ville: "Valenciennes",            role: "Référent", lat: 50.3486,  lng: 3.12026  },
  { nom: "DOM",             prenom: "Stephen",           codePostal: "08000", ville: "Charleville-Mézières",    role: "Référent", lat: 49.7541,  lng: 4.71733  },
  { nom: "MESSADI",         prenom: "Nacim",             codePostal: "59000", ville: "Lille",                   role: "Référent", lat: 50.6096,  lng: 3.00912  },
  { nom: "ROGERE",          prenom: "Thomas",            codePostal: "59440", ville: "Avesnes-sur-Helpe",       role: "Référent", lat: 50.2880,  lng: 4.04130  },
  { nom: "SYLLA",           prenom: "Abdoul Karim",      codePostal: "59140", ville: "Dunkerque",               role: "Référent", lat: 51.0174,  lng: 2.37581  },

  // TMF (16)
  { nom: "BEN SAADI",       prenom: "Ameziane",          codePostal: "62000", ville: "Arras",                   role: "TMF",      lat: 50.2715,  lng: 2.76865  },
  { nom: "BEN MOUSSATI",    prenom: "Ossama",            codePostal: "80000", ville: "Amiens",                  role: "TMF",      lat: 49.9504,  lng: 2.31012  },
  { nom: "BOMY",            prenom: "Kevin",             codePostal: "59140", ville: "Dunkerque",               role: "TMF",      lat: 50.9525,  lng: 2.19185  },
  { nom: "DUBOIS",          prenom: "Sebastien",         codePostal: "62000", ville: "Arras",                   role: "TMF",      lat: 50.4976,  lng: 2.48135  },
  { nom: "CATTAREE",        prenom: "Mickael",           codePostal: "02000", ville: "Laon",                    role: "TMF",      lat: 49.1540,  lng: 3.02412  },
  { nom: "SENECHAL",        prenom: "Kevin",             codePostal: "60000", ville: "Beauvais",                role: "TMF",      lat: 49.3391,  lng: 2.49936  },
  { nom: "NIASSE",          prenom: "Serigne Moussa",    codePostal: "60000", ville: "Beauvais",                role: "TMF",      lat: 49.1892,  lng: 2.46103  },
  { nom: "HAGUENIN",        prenom: "Guillaume",         codePostal: "60000", ville: "Compiègne",               role: "TMF",      lat: 49.4043,  lng: 3.00118  },
  { nom: "ISSOP",           prenom: "Mohammad",          codePostal: "59000", ville: "Lille",                   role: "TMF",      lat: 50.6424,  lng: 3.06905  },
  { nom: "SONK",            prenom: "Anicet",            codePostal: "59000", ville: "Lille",                   role: "TMF",      lat: 50.5486,  lng: 3.02667  },
  { nom: "MOEGNE MALI",     prenom: "Djamal",            codePostal: "59000", ville: "Lille",                   role: "TMF",      lat: 50.6300,  lng: 3.04523  },
  { nom: "ZIANE",           prenom: "Ayoub",             codePostal: "59300", ville: "Valenciennes",            role: "TMF",      lat: 50.4540,  lng: 3.02883  },
  { nom: "ANAAM",           prenom: "Moussa",            codePostal: "59000", ville: "Lille",                   role: "TMF",      lat: 50.6712,  lng: 2.97394  },
  { nom: "BARRY",           prenom: "Mounir",            codePostal: "59000", ville: "Lille",                   role: "TMF",      lat: 50.6424,  lng: 3.06905  },
  { nom: "BENAHMED",        prenom: "Samir",             codePostal: "59300", ville: "Valenciennes",            role: "TMF",      lat: 50.3909,  lng: 3.48288  },
  { nom: "THIEBAUT",        prenom: "Christopher",       codePostal: "62000", ville: "Arras",                   role: "TMF",      lat: 50.4540,  lng: 2.94011  },

  // TMRa (16)
  { nom: "BENDAHO",         prenom: "Riad",              codePostal: "02000", ville: "Laon",                    role: "TMRa",     lat: 49.8608,  lng: 3.26899  },
  { nom: "HATIF",           prenom: "Yannick",           codePostal: "02000", ville: "Aisne",                   role: "TMRa",     lat: 49.8338,  lng: 4.37047  },
  { nom: "MARRON",          prenom: "Nicolas",           codePostal: "08000", ville: "Charleville-Mézières",    role: "TMRa",     lat: 49.7389,  lng: 4.70126  },
  { nom: "NDONGO",          prenom: "Thierry",           codePostal: "80000", ville: "Amiens",                  role: "TMRa",     lat: 49.8763,  lng: 2.31297  },
  { nom: "LAHAEYE",         prenom: "Pierre",            codePostal: "59140", ville: "Dunkerque",               role: "TMRa",     lat: 50.9698,  lng: 2.42647  },
  { nom: "MOUSSAOUI",       prenom: "Rachid",            codePostal: "59140", ville: "Dunkerque",               role: "TMRa",     lat: 51.0182,  lng: 2.30148  },
  { nom: "VARENNE",         prenom: "Anthony",           codePostal: "62200", ville: "Boulogne-sur-Mer",        role: "TMRa",     lat: 50.8129,  lng: 2.13960  },
  { nom: "BAILLOEUIL",      prenom: "Johann",            codePostal: "60000", ville: "Beauvais",                role: "TMRa",     lat: 49.2899,  lng: 2.87813  },
  { nom: "LEROUX",          prenom: "Julien",            codePostal: "80000", ville: "Amiens",                  role: "TMRa",     lat: 49.8552,  lng: 2.17488  },
  { nom: "EL MOUSSAOUI",    prenom: "Zoher",             codePostal: "59000", ville: "Lille",                   role: "TMRa",     lat: 50.6069,  lng: 3.06073  },
  { nom: "FAUVEAUX",        prenom: "Julien",            codePostal: "59300", ville: "Valenciennes",            role: "TMRa",     lat: 50.3000,  lng: 3.39330  },
  { nom: "AIT KHOUYA MOUH", prenom: "Khalid",            codePostal: "62000", ville: "Arras",                   role: "TMRa",     lat: 50.4646,  lng: 2.83080  },
  { nom: "AIT KHOUYA MOUH", prenom: "Smail",             codePostal: "62000", ville: "Arras",                   role: "TMRa",     lat: 50.4335,  lng: 2.78191  },
  { nom: "VINCENT",         prenom: "Geoffrey",          codePostal: "62000", ville: "Arras",                   role: "TMRa",     lat: 50.3580,  lng: 2.84519  },
  { nom: "RIANE",           prenom: "Madjid",            codePostal: "59100", ville: "Roubaix",                 role: "TMRa",     lat: 50.6723,  lng: 3.21427  },
  { nom: "LHOU",            prenom: "Lahcen",            codePostal: "59300", ville: "Valenciennes",            role: "TMRa",     lat: 50.2399,  lng: 3.89568  },

  // TMRe (22)
  { nom: "BOITELET",        prenom: "Wilfried",          codePostal: "02000", ville: "Laon",                    role: "TMRe",     lat: 49.6582,  lng: 3.37255  },
  { nom: "FOURNIER",        prenom: "Bertrand",          codePostal: "02000", ville: "Laon",                    role: "TMRe",     lat: 49.5679,  lng: 3.62073  },
  { nom: "LAMBERT",         prenom: "Jonathan",          codePostal: "08000", ville: "Charleville-Mézières",    role: "TMRe",     lat: 49.7728,  lng: 4.71887  },
  { nom: "VAZ DE SOUSA",    prenom: "Joao",              codePostal: "08000", ville: "Charleville-Mézières",    role: "TMRe",     lat: 49.6963,  lng: 4.69636  },
  { nom: "LEMAIRE",         prenom: "Gaetan",            codePostal: "80000", ville: "Amiens",                  role: "TMRe",     lat: 49.8328,  lng: 2.82580  },
  { nom: "NAIJI",           prenom: "Mourad",            codePostal: "80000", ville: "Amiens",                  role: "TMRe",     lat: 49.8720,  lng: 2.33091  },
  { nom: "VILBERT",         prenom: "Thibaut",           codePostal: "80000", ville: "Amiens",                  role: "TMRe",     lat: 49.8949,  lng: 2.29672  },
  { nom: "KOUKI",           prenom: "Nasreddine",        codePostal: "59140", ville: "Dunkerque",               role: "TMRe",     lat: 51.0153,  lng: 2.30788  },
  { nom: "LOONIS",          prenom: "Quentin",           codePostal: "59000", ville: "Lille Sainghin",          role: "TMRe",     lat: 50.5670,  lng: 2.94600  },
  { nom: "MARZAK",          prenom: "Rachid",            codePostal: "59140", ville: "Dunkerque",               role: "TMRe",     lat: 50.7520,  lng: 2.24863  },
  { nom: "BEVIERE",         prenom: "Ludovic",           codePostal: "60000", ville: "Beauvais",                role: "TMRe",     lat: 49.2854,  lng: 2.99141  },
  { nom: "CORBEAU",         prenom: "Regis",             codePostal: "60000", ville: "Beauvais",                role: "TMRe",     lat: 49.1676,  lng: 2.86961  },
  { nom: "HAFFNER",         prenom: "Eddy",              codePostal: "60000", ville: "Beauvais",                role: "TMRe",     lat: 49.3295,  lng: 2.19939  },
  { nom: "SAHRAOUI",        prenom: "Abdelhak",          codePostal: "60000", ville: "Beauvais",                role: "TMRe",     lat: 49.2212,  lng: 2.28577  },
  { nom: "SERROUKAS",       prenom: "Dimitris",          codePostal: "59000", ville: "Lille",                   role: "TMRe",     lat: 50.5486,  lng: 3.02667  },
  { nom: "VERHAEGHE",       prenom: "Thierry",           codePostal: "59000", ville: "Lille",                   role: "TMRe",     lat: 50.6934,  lng: 2.91405  },
  { nom: "DERUDDER",        prenom: "Nicolas",           codePostal: "59300", ville: "Valenciennes",            role: "TMRe",     lat: 50.4328,  lng: 3.09065  },
  { nom: "DUDZINSKI",       prenom: "Bastien",           codePostal: "59300", ville: "Valenciennes",            role: "TMRe",     lat: 50.2774,  lng: 3.35792  },
  { nom: "MARCHAND",        prenom: "Pierre-Mickael",    codePostal: "59300", ville: "Valenciennes",            role: "TMRe",     lat: 50.4804,  lng: 3.13615  },
  { nom: "EL BADDAGUI",     prenom: "Younes",            codePostal: "62000", ville: "Arras",                   role: "TMRe",     lat: 50.4144,  lng: 2.83589  },
  { nom: "TRIOUX",          prenom: "Alexandre",         codePostal: "62000", ville: "Arras",                   role: "TMRe",     lat: 50.4861,  lng: 2.54719  },
  { nom: "TURBANT",         prenom: "Arnaud",            codePostal: "62000", ville: "Arras",                   role: "TMRe",     lat: 50.1216,  lng: 2.62923  },
  { nom: "DAOUDI",          prenom: "Benyounes",         codePostal: "59000", ville: "Lille",                   role: "TMRe",     lat: 50.6229,  lng: 3.05849  },
  { nom: "HARIZI",          prenom: "Mohamed",           codePostal: "59100", ville: "Roubaix",                 role: "TMRe",     lat: 50.7197,  lng: 3.16412  },
  { nom: "HARRER",          prenom: "Cyrille",           codePostal: "59000", ville: "Lille",                   role: "TMRe",     lat: 50.6630,  lng: 3.04987  },
  { nom: "RIANE",           prenom: "Djaafar",           codePostal: "59100", ville: "Roubaix",                 role: "TMRe",     lat: 50.6603,  lng: 3.17693  },
  { nom: "RUVIO",           prenom: "Gianni",            codePostal: "59300", ville: "Valenciennes",            role: "TMRe",     lat: 50.2994,  lng: 3.80060  },
  { nom: "THOMAS",          prenom: "Florian",           codePostal: "59300", ville: "Valenciennes",            role: "TMRe",     lat: 50.3328,  lng: 3.25880  },
];

try {
  // Insert zone
  await client.query(
    `INSERT INTO zones (id, label) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [ZONE_ID, "Hauts-de-France"]
  );

  // Delete all existing HDF resources and reseed cleanly
  await client.query(`DELETE FROM resources WHERE zone_id = $1`, [ZONE_ID]);

  let inserted = 0;
  for (const p of PEOPLE) {
    const id = `base-HDF-${p.nom.replace(/\s+/g, "_").toUpperCase()}_${p.prenom.replace(/\s+/g, "_").toUpperCase()}`;
    await client.query(
      `INSERT INTO resources (id, zone_id, prenom, nom, ville, code_postal, role, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, ZONE_ID, p.prenom, p.nom, p.ville, p.codePostal, p.role, p.lat, p.lng]
    );
    inserted++;
  }
  console.log(`[seed-hdf] Done — ${inserted}/${PEOPLE.length} rows inserted`);
} finally {
  await client.end();
}
