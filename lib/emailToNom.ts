/**
 * Maps professional email addresses to the exact `nom` stored in the resources table.
 * Used both server-side (auth guard in shared-state.ts) and in syncUserRole.ts.
 */
export const EMAIL_TO_NOM: Record<string, string> = {
  "pabrantes@iliad-free.fr": "ABRANTES",
  "mbakkouch@iliad-free.fr": "BAKKOUCH",
  "fbergay@iliad-free.fr": "BERGAY",
  "mbonnel@iliad-free.fr": "BONNEL",
  "jdardy@iliad-free.fr": "DARDY",
  "dfayol@iliad-free.fr": "FAYOL",
  "ngeneste@iliad-free.fr": "GENESTE",
  "rprovin@iliad-free.fr": "PROVIN",
  "sroig@iliad-free.fr": "ROIG",
  "spereira@iliad-free.fr": "PEREIRA",
  "ccruveillier@iliad-free.fr": "CRUVEILLIER",
  "selouazghi@iliad-free.fr": "ELOUAZGHI",
  "kjoliveau@iliad-free.fr": "JOLIVEAU",
  "lalsheikhly@iliad-free.fr": "AL SHEIKHLY",
  "odefoulounoux@iliad-free.fr": "DE FOULOUNOUX",
  "afontaine@iliad-free.fr": "FONTAINE",
  "jregiero@iliad-free.fr": "REGIERO",
  "ballouche@iliad-free.fr": "ALLOUCHE",
  "mcapot@iliad-free.fr": "CAPOT",
  "adevijver@iliad-free.fr": "DE VIJVER",
  "ldumas@iliad-free.fr": "DUMAS",
  "aforissier@iliad-free.fr": "FORISSIER",
  "fjourdan@iliad-free.fr": "JOURDAN",
  "amizouri@iliad-free.fr": "MIZOURI",
  "cpapillon@iliad-free.fr": "PAPILLON",
  "jpovoa@iliad-free.fr": "POVOA",
  "jrabin@iliad-free.fr": "RABIN",
  "avanelle@iliad-free.fr": "VANELLE",
  "jarles@iliad-free.fr": "ARLES",
  "jbrothier@iliad-free.fr": "BROTHIER",
  "nbrunet@iliad-free.fr": "BRUNET",
  "bdjedou@iliad-free.fr": "DJEDOU",
  "ldupre@iliad-free.fr": "DUPRE",
  "mgirard@iliad-free.fr": "GIRARD",
  "giehle@iliad-free.fr": "IEHLE",
  "kjourdain@iliad-free.fr": "JOURDAIN",
  "mkozhukhar@iliad-free.fr": "KOZHUKHAR",
  "mouchaif@iliad-free.fr": "OUCHAIF",
  "mraynaud@iliad-free.fr": "RAYNAUD",
  "arivaud@iliad-free.fr": "RIVAUD",
  "cvergnaud@iliad-free.fr": "VERGNAUD",
  "ebarbier@iliad-free.fr": "BARBIER",
  "fblot@iliad-free.fr": "BLOT",
  "mbonardelrichard@iliad-free.fr": "BONARDEL RICHARD",
  "ccaudron@iliad-free.fr": "CAUDRON",
  "ddesvaud@iliad-free.fr": "DESVAUD",
  "aghaiout@iliad-free.fr": "GHAIOUT",
  "pgrand@iliad-free.fr": "GRAND",
  "nguedon@iliad-free.fr": "GUEDON",
  "jherbere@iliad-free.fr": "HERBERE",
  "jholderbaum@iliad-free.fr": "HOLDERBAUM",
  "akaabouni@iliad-free.fr": "KAABOUNI",
  "klamkim@iliad-free.fr": "LAM KIM",
  "clumineau@iliad-free.fr": "LUMINEAU",
  "ymangeol@iliad-free.fr": "MANGEOL",
  "cmonnin@iliad-free.fr": "MONNIN",
  "porseau@iliad-free.fr": "ORSEAU",
  "kporca@iliad-free.fr": "PORCA",
  "jprevot@iliad-free.fr": "PREVOT",
  "sreynolds@iliad-free.fr": "REYNOLDS",
  "nrouzier@iliad-free.fr": "ROUZIER",
  "vselichar@iliad-free.fr": "SELICHAR",
  "nstanislas@iliad-free.fr": "STANISLAS",
  "ethomas@iliad-free.fr": "THOMAS",
};

/**
 * Maps professional email addresses to their zone ID (secto).
 * All current users belong to NAQ. Add future sectos here as needed.
 * Every email in EMAIL_TO_NOM should have a corresponding entry here.
 */
export const EMAIL_TO_ZONE: Record<string, string> = Object.fromEntries(
  Object.keys(EMAIL_TO_NOM).map((email) => [email, "NAQ"])
);
