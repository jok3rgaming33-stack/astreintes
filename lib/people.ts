export type Role = "CIR" | "REF" | "TMF" | "TMRa" | "TMRe";

export interface Person {
  nom: string;
  prenom: string;
  codePostal: string;
  ville: string;
  role: Role;
  lat: number;
  lng: number;
}

export const ROLE_COLORS: Record<Role, string> = {
  CIR: "#3b82f6",
  REF: "#22c55e",
  TMF: "#f97316",
  TMRa: "#ef4444",
  TMRe: "#a855f7",
};

export const ROLE_LABELS: Record<Role, string> = {
  CIR: "CIR",
  REF: "Référent",
  TMF: "TMF",
  TMRa: "TMRa",
  TMRe: "TMRe",
};

// Coordinates sourced from city names + postal codes (France)
export const PEOPLE: Person[] = [
  // CIR
  { nom: "BAKKOUCH",       prenom: "Mehdi",      codePostal: "87085", ville: "Limoges",                     role: "CIR", lat: 45.8336, lng: 1.2611 },
  { nom: "BERGAY",         prenom: "Fabien",     codePostal: "33523", ville: "Targon",                      role: "CIR", lat: 44.7333, lng: -0.3167 },
  { nom: "BONNEL",         prenom: "Michaël",    codePostal: "33062", ville: "Bonzac",                      role: "CIR", lat: 45.0167, lng: -0.1833 },
  { nom: "DARDY",          prenom: "Jérémie",    codePostal: "33162", ville: "Eysines",                     role: "CIR", lat: 44.8956, lng: -0.6697 },
  { nom: "FAYOL",          prenom: "Damien",     codePostal: "33030", ville: "Barsac",                      role: "CIR", lat: 44.6167, lng: -0.3333 },
  { nom: "GENESTE",        prenom: "Nicolas",    codePostal: "19023", ville: "Beynat",                      role: "CIR", lat: 45.1333, lng: 1.7333 },
  { nom: "PROVIN",         prenom: "Romain",     codePostal: "17438", ville: "Tanzac",                      role: "CIR", lat: 45.5167, lng: -0.5833 },
  { nom: "ROIG",           prenom: "Stéphane",   codePostal: "86263", ville: "Smarves",                     role: "CIR", lat: 46.4833, lng: 0.3167 },

  // REF
  { nom: "PEREIRA",        prenom: "Stéphane",   codePostal: "86194", ville: "Poitiers",                    role: "REF", lat: 46.5802, lng: 0.3401 },
  { nom: "CRUVEILLIER",    prenom: "Charly",     codePostal: "87085", ville: "Limoges",                     role: "REF", lat: 45.8400, lng: 1.2700 },
  { nom: "EL OUAZGHI",     prenom: "Samire",     codePostal: "33268", ville: "Margaux",                     role: "REF", lat: 45.0333, lng: -0.6667 },
  { nom: "JOLIVEAU",       prenom: "Kévin",      codePostal: "79049", ville: "Bressuire",                   role: "REF", lat: 46.8500, lng: -0.4833 },
  { nom: "AL SHEIKHLY",    prenom: "Laurent",    codePostal: "23246", ville: "Saint-Sulpice-les-Champs",    role: "REF", lat: 46.1333, lng: 2.0833 },
  { nom: "DEFOULOUNOUX",   prenom: "Olivier",    codePostal: "16236", ville: "Mouthiers-sur-Boëme",         role: "REF", lat: 45.5333, lng: 0.1167 },
  { nom: "FONTAINE",       prenom: "Alexandre",  codePostal: "33229", ville: "Lanton",                      role: "REF", lat: 44.7167, lng: -1.0333 },
  { nom: "REGIERO",        prenom: "Julien",     codePostal: "33424", ville: "Saint-Laurent-Médoc",         role: "REF", lat: 45.1500, lng: -0.8167 },
  { nom: "ALLOUCHE",       prenom: "Benjamin",   codePostal: "33302", ville: "Néac",                        role: "REF", lat: 44.9333, lng: -0.1833 },

  // TMF
  { nom: "CAPOT",          prenom: "Maxime",     codePostal: "17061", ville: "Bran",                        role: "TMF", lat: 45.3333, lng: -0.5833 },
  { nom: "DEVIJVER",       prenom: "Alexis",     codePostal: "86080", ville: "Cloué",                       role: "TMF", lat: 46.3833, lng: 0.2333 },
  { nom: "DUMAS",          prenom: "Loïc",       codePostal: "33542", ville: "Vérac",                       role: "TMF", lat: 44.9833, lng: -0.3167 },
  { nom: "FORISSIER",      prenom: "Alexandre",  codePostal: "33413", ville: "Saint-Germain-du-Puch",       role: "TMF", lat: 44.8833, lng: -0.3000 },
  { nom: "JOURDAN",        prenom: "Florian",    codePostal: "33318", ville: "Pessac",                      role: "TMF", lat: 44.8067, lng: -0.6311 },
  { nom: "MIZOURI",        prenom: "Amor",       codePostal: "17300", ville: "La Rochelle",                 role: "TMF", lat: 46.1604, lng: -1.1511 },
  { nom: "PAPILLON",       prenom: "Clement",    codePostal: "33063", ville: "Bordeaux",                    role: "TMF", lat: 44.8412, lng: -0.5741 },
  { nom: "POVOA",          prenom: "Jordan",     codePostal: "33501", ville: "Saucats",                     role: "TMF", lat: 44.6500, lng: -0.6333 },
  { nom: "RABIN",          prenom: "Jean Jacques",codePostal: "86089",ville: "Cuhon",                       role: "TMF", lat: 46.7333, lng: 0.2333 },
  { nom: "VANELLE",        prenom: "Alban",      codePostal: "33207", ville: "Izon",                        role: "TMF", lat: 44.9167, lng: -0.3500 },

  // TMRa
  { nom: "ARLES",          prenom: "Jonathan",   codePostal: "87186", ville: "Saint-Vitte-sur-Briance",     role: "TMRa", lat: 45.5833, lng: 1.4833 },
  { nom: "BROTHIER",       prenom: "Julien",     codePostal: "33014", ville: "Les Artigues-de-Lussac",      role: "TMRa", lat: 44.9667, lng: -0.1167 },
  { nom: "BRUNET",         prenom: "Nicolas",    codePostal: "86281", ville: "Saint-Martin-la-Pallu",       role: "TMRa", lat: 46.6333, lng: 0.2000 },
  { nom: "DJEDOU",         prenom: "Benoit",     codePostal: "16003", ville: "Agris",                       role: "TMRa", lat: 45.7167, lng: 0.2333 },
  { nom: "DUPRE",          prenom: "Ludovic",    codePostal: "24135", ville: "Cornille",                    role: "TMRa", lat: 45.2333, lng: 0.7333 },
  { nom: "GIRARD",         prenom: "Mickael",    codePostal: "17076", ville: "Celles",                      role: "TMRa", lat: 45.9167, lng: -0.5333 },
  { nom: "IEHLE",          prenom: "Guillaume",  codePostal: "33063", ville: "Bordeaux",                    role: "TMRa", lat: 44.8450, lng: -0.5680 },
  { nom: "JOURDAIN",       prenom: "Kevin",      codePostal: "86095", ville: "Dissay",                      role: "TMRa", lat: 46.7000, lng: 0.4167 },
  { nom: "KOZHUKHAR",      prenom: "Mikhail",    codePostal: "24138", ville: "Coulounieix-Chamiers",        role: "TMRa", lat: 45.2000, lng: 0.6833 },
  { nom: "OUCHAIF",        prenom: "Mounir",     codePostal: "33550", ville: "Villenave-d'Ornon",           role: "TMRa", lat: 44.7833, lng: -0.5667 },
  { nom: "RAYNAUD",        prenom: "Mickaël",    codePostal: "16167", ville: "Jarnac",                      role: "TMRa", lat: 45.6833, lng: -0.1667 },
  { nom: "RIVAUD",         prenom: "Antoine",    codePostal: "79191", ville: "Niort",                       role: "TMRa", lat: 46.3167, lng: -0.4667 },
  { nom: "VERGNAUD",       prenom: "Cedric",     codePostal: "23143", ville: "Noth",                        role: "TMRa", lat: 46.2167, lng: 1.4667 },

  // TMRe
  { nom: "BARBIER",        prenom: "Emilie",     codePostal: "19274", ville: "Ussac",                       role: "TMRe", lat: 45.2833, lng: 1.5000 },
  { nom: "BLOT",           prenom: "Félix Armand",codePostal:"23096", ville: "Guéret",                      role: "TMRe", lat: 46.1667, lng: 1.8667 },
  { nom: "BONARDEL RICHARD",prenom:"Melanie",    codePostal: "33290", ville: "Le Pian-Médoc",               role: "TMRe", lat: 45.0022, lng: -0.7156 },
  { nom: "CAUDRON",        prenom: "Cédric",     codePostal: "19153", ville: "Objat",                       role: "TMRe", lat: 45.2667, lng: 1.4000 },
  { nom: "DESVAUD",        prenom: "David",      codePostal: "16154", ville: "Gond-Pontouvre",              role: "TMRe", lat: 45.6667, lng: 0.1667 },
  { nom: "GHAI OUT",       prenom: "Abdelkader", codePostal: "19274", ville: "Ussac",                       role: "TMRe", lat: 45.2950, lng: 1.5100 },
  { nom: "GRAND",          prenom: "Pierre-Yves",codePostal: "87114", ville: "Panazol",                     role: "TMRe", lat: 45.8333, lng: 1.3333 },
  { nom: "GUEDON",         prenom: "Nicolas",    codePostal: "16125", ville: "Édon",                        role: "TMRe", lat: 45.5167, lng: 0.1833 },
  { nom: "HERBERE",        prenom: "Jeremy",     codePostal: "79231", ville: "Romans",                      role: "TMRe", lat: 46.5167, lng: -0.3500 },
  { nom: "HOLDERBAUM",     prenom: "Jonathan",   codePostal: "17415", ville: "Saintes",                     role: "TMRe", lat: 45.7500, lng: -0.6333 },
  { nom: "KAABOUNI",       prenom: "Abderrhamane",codePostal:"33249", ville: "Lormont",                     role: "TMRe", lat: 44.8870, lng: -0.5100 },
  { nom: "LAM KIM",        prenom: "Kenny",      codePostal: "33069", ville: "Le Bouscat",                  role: "TMRe", lat: 44.8667, lng: -0.6000 },
  { nom: "LUMINEAU",       prenom: "Christophe", codePostal: "86203", ville: "Queaux",                      role: "TMRe", lat: 46.3167, lng: 0.6833 },
  { nom: "MANGEOL",        prenom: "Yann",       codePostal: "17245", ville: "Montroy",                     role: "TMRe", lat: 46.1000, lng: -1.0333 },
  { nom: "MONNIN",         prenom: "Christophe", codePostal: "33191", ville: "Gours",                       role: "TMRe", lat: 45.0500, lng: -0.0167 },
  { nom: "ORSEAU",         prenom: "Paul",       codePostal: "79009", ville: "Amuré",                       role: "TMRe", lat: 46.4833, lng: -0.5000 },
  { nom: "PORCA",          prenom: "Kévin",      codePostal: "79116", ville: "Faye-l'Abbesse",              role: "TMRe", lat: 46.9000, lng: -0.3333 },
  { nom: "PREVOT",         prenom: "Jean-Marie", codePostal: "33980", ville: "Audenge",                     role: "TMRe", lat: 44.6833, lng: -1.0167 },
  { nom: "REYNOLDS",       prenom: "Stephen",    codePostal: "33527", ville: "Le Teich",                    role: "TMRe", lat: 44.6333, lng: -1.0167 },
  { nom: "ROUZIER",        prenom: "Nicolas",    codePostal: "86213", ville: "Rouillé",                     role: "TMRe", lat: 46.4000, lng: 0.0833 },
  { nom: "SELICHAR",       prenom: "Vivien",     codePostal: "17228", ville: "Médis",                       role: "TMRe", lat: 45.6833, lng: -0.9000 },
  { nom: "STANISLAS",      prenom: "Nicolas",    codePostal: "33550", ville: "Villenave-d'Ornon",           role: "TMRe", lat: 44.7700, lng: -0.5580 },
  { nom: "THOMAS",         prenom: "Edwin",      codePostal: "86194", ville: "Poitiers",                    role: "TMRe", lat: 46.5880, lng: 0.3480 },
];
