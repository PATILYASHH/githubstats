// Parse GitHub's free-text "location" into a best-effort { city, country }.
// GitHub location is unreliable ("SF", "Bengaluru 🇮🇳", "Remote", "City, CA"),
// so this is deliberately loose: strip emoji/flags, split on commas, title-case,
// and normalize a handful of common aliases. Users can override the result on
// their profile, so we favour simple + predictable over clever.

const COUNTRY_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "united states of america": "United States",
  america: "United States",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  uae: "United Arab Emirates",
  in: "India",
  ind: "India",
  bharat: "India",
  deutschland: "Germany",
  brasil: "Brazil",
  nl: "Netherlands",
  españa: "Spain",
  espana: "Spain",
};

const CITY_ALIASES: Record<string, string> = {
  sf: "San Francisco",
  "san francisco, ca": "San Francisco",
  "sf bay area": "San Francisco",
  "bay area": "San Francisco",
  nyc: "New York",
  "new york city": "New York",
  blr: "Bengaluru",
  bangalore: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  bglr: "Bengaluru",
};

// Two-letter US state codes — when the trailing comma-part is one of these we
// treat the country as the United States rather than mis-filing the state as a
// country (the very common "City, CA" pattern).
const US_STATES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

// Strings that aren't real places — map to null so they don't pollute boards.
const NON_LOCATIONS = new Set([
  "remote","earth","everywhere","anywhere","worldwide","the internet","internet",
  "the moon","moon","mars","localhost","127.0.0.1","null","undefined","n/a",
  "somewhere","home","global","world","metaverse","cyberspace","void",
]);

function stripJunk(s: string): string {
  return s
    // emoji, flags, symbols, pictographs
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-/'])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
}

export function normCountry(s: string): string {
  const k = s.toLowerCase().trim();
  return COUNTRY_ALIASES[k] ?? titleCase(s);
}

export function normCity(s: string): string {
  const k = s.toLowerCase().trim();
  return CITY_ALIASES[k] ?? titleCase(s);
}

export interface ParsedLocation {
  city: string | null;
  country: string | null;
}

export function parseLocation(raw: string | null | undefined): ParsedLocation {
  if (!raw) return { city: null, country: null };
  const clean = stripJunk(raw);
  if (!clean || NON_LOCATIONS.has(clean.toLowerCase())) {
    return { city: null, country: null };
  }

  const parts = clean
    .split(/[,/|·•]/)
    .map((p) => p.trim())
    .filter((p) => p && !NON_LOCATIONS.has(p.toLowerCase()));
  if (parts.length === 0) return { city: null, country: null };

  let cityPart: string | null = null;
  let countryPart: string | null = null;

  if (parts.length === 1) {
    // A lone token is a country if we recognise it, otherwise assume a city.
    const k = parts[0].toLowerCase();
    if (COUNTRY_ALIASES[k]) countryPart = parts[0];
    else cityPart = parts[0];
  } else {
    cityPart = parts[0];
    const last = parts[parts.length - 1];
    if (US_STATES.has(last.toLowerCase())) {
      countryPart = "United States";
    } else {
      countryPart = last;
    }
  }

  return {
    city: cityPart ? normCity(cityPart) : null,
    country: countryPart ? normCountry(countryPart) : null,
  };
}
