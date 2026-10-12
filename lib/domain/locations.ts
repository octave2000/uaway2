/**
 * Offline Kenyan place suggestions for route entry. This is deliberately a
 * suggestion catalogue, not an allowlist: drivers and passengers may enter
 * any town, neighbourhood, or other Kenyan place by name.
 */
export type KenyaPlace = { name: string; county: string; aliases?: string[] };
const counties: Array<[string, string, string[]]> = [
  ["Mombasa", "Mombasa", ["Mtwapa", "Bamburi", "Likoni"]],
  ["Kwale", "Kwale", ["Ukunda", "Diani Beach", "Msambweni"]],
  ["Kilifi", "Kilifi", ["Malindi", "Watamu", "Mariakani"]],
  ["Tana River", "Hola", ["Garsen", "Madogo"]],
  ["Lamu", "Lamu", ["Mpeketoni", "Witu"]],
  ["Taita-Taveta", "Voi", ["Wundanyi", "Taveta", "Mwatate"]],
  ["Garissa", "Garissa", ["Dadaab", "Bura East"]],
  ["Wajir", "Wajir", ["Habaswein", "Buna"]],
  ["Mandera", "Mandera", ["El Wak", "Rhamu"]],
  ["Marsabit", "Marsabit", ["Moyale", "Laisamis"]],
  ["Isiolo", "Isiolo", ["Merti"]],
  ["Meru", "Meru", ["Maua", "Nkubu", "Timau"]],
  ["Tharaka-Nithi", "Chuka", ["Marimanti", "Chogoria"]],
  ["Embu", "Embu", ["Runyenjes", "Siakago"]],
  ["Kitui", "Kitui", ["Mwingi", "Mutomo"]],
  ["Machakos", "Machakos", ["Athi River", "Kangundo", "Tala"]],
  ["Makueni", "Wote", ["Sultan Hamud", "Mtito Andei"]],
  ["Nyandarua", "Ol Kalou", ["Njabini", "Engineer"]],
  ["Nyeri", "Nyeri", ["Nanyuki", "Karatina", "Othaya"]],
  ["Kirinyaga", "Kerugoya", ["Kutus", "Sagana"]],
  ["Murang'a", "Murang'a", ["Thika", "Maragua", "Kenol"]],
  ["Kiambu", "Kiambu", ["Ruiru", "Juja", "Limuru", "Kikuyu", "Thika"]],
  ["Turkana", "Lodwar", ["Lokichogio", "Kakuma"]],
  ["West Pokot", "Kapenguria", ["Kacheliba", "Sigor"]],
  ["Samburu", "Maralal", ["Baragoi"]],
  ["Trans Nzoia", "Kitale", ["Endebess"]],
  ["Uasin Gishu", "Eldoret", ["Burnt Forest"]],
  ["Elgeyo-Marakwet", "Iten", ["Kapsowar", "Tambach"]],
  ["Nandi", "Kapsabet", ["Nandi Hills"]],
  ["Baringo", "Kabarnet", ["Eldama Ravine", "Marigat"]],
  ["Laikipia", "Rumuruti", ["Nanyuki", "Nyahururu"]],
  ["Nakuru", "Nakuru", ["Naivasha", "Gilgil", "Molo", "Njoro"]],
  ["Narok", "Narok", ["Kilgoris", "Suswa"]],
  ["Kajiado", "Kajiado", ["Ngong", "Ongata Rongai", "Kitengela", "Namanga"]],
  ["Kericho", "Kericho", ["Litein", "Londiani"]],
  ["Bomet", "Bomet", ["Sotik", "Longisa"]],
  ["Kakamega", "Kakamega", ["Mumias", "Malava", "Lugari"]],
  ["Vihiga", "Mbale", ["Luanda", "Chavakali"]],
  ["Bungoma", "Bungoma", ["Webuye", "Kimilili", "Chwele"]],
  ["Busia", "Busia", ["Malaba", "Nambale"]],
  ["Siaya", "Siaya", ["Bondo", "Ugunja", "Yala"]],
  ["Kisumu", "Kisumu", ["Ahero", "Muhoroni", "Maseno"]],
  ["Homa Bay", "Homa Bay", ["Oyugis", "Kendu Bay", "Mbita"]],
  ["Migori", "Migori", ["Kehancha", "Rongo", "Awendo"]],
  ["Kisii", "Kisii", ["Ogembo", "Suneka"]],
  ["Nyamira", "Nyamira", ["Keroka", "Nyansiongo"]],
  [
    "Nairobi",
    "Nairobi",
    ["Westlands", "Kilimani", "Karen", "Embakasi", "Kasarani", "Runda"],
  ],
];

const additionalPlaces: Array<[string, string, string[]?]> = [
  ["Nairobi CBD", "Nairobi", ["Nairobi Central"]],
  ["Westlands, Nairobi", "Nairobi", ["Westlands"]],
  ["Kilimani, Nairobi", "Nairobi", ["Kilimani"]],
  ["Karen, Nairobi", "Nairobi", ["Karen"]],
  ["Embakasi, Nairobi", "Nairobi", ["Embakasi"]],
  ["Kasarani, Nairobi", "Nairobi", ["Kasarani"]],
  ["Runda, Nairobi", "Nairobi", ["Runda"]],
];

export const kenyaPlaces: KenyaPlace[] = [
  ...counties.flatMap(([county, headquarters, towns]) => [
    { name: headquarters, county, aliases: [county] },
    ...towns.map((name) => ({ name, county })),
  ]),
  ...additionalPlaces.map(([name, county, aliases]) => ({
    name,
    county,
    aliases,
  })),
].filter(
  (place, index, all) =>
    all.findIndex((other) => placeKey(other.name) === placeKey(place.name)) ===
    index,
);

const canonicalByAlias = new Map<string, string>();
for (const place of kenyaPlaces) {
  canonicalByAlias.set(placeKey(place.name), place.name);
  for (const alias of place.aliases ?? [])
    canonicalByAlias.set(placeKey(alias), place.name);
}

export function placeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-KE")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePlace(value: string) {
  const clean = value.normalize("NFC").replace(/\s+/g, " ").trim();
  const known = canonicalByAlias.get(placeKey(clean));
  if (known) return known;
  return clean.replace(/(^|[\s'-])\p{L}/gu, (letter) =>
    letter.toLocaleUpperCase("en-KE"),
  );
}

// Retained for familiar departure hubs on existing journeys. New places do
// not receive fabricated meeting points; passengers and drivers coordinate them.
export const locations = [
  {
    name: "Nairobi",
    point: "Kencom, City Hall Way",
    latitude: -1.2864,
    longitude: 36.8226,
  },
  {
    name: "Mombasa",
    point: "Railway station entrance",
    latitude: -4.0435,
    longitude: 39.6636,
  },
  {
    name: "Kisumu",
    point: "United Mall main entrance",
    latitude: -0.0917,
    longitude: 34.768,
  },
  {
    name: "Nakuru",
    point: "Kenyatta Avenue, central post office",
    latitude: -0.2833,
    longitude: 36.0667,
  },
  {
    name: "Eldoret",
    point: "Uganda Road, central post office",
    latitude: 0.5143,
    longitude: 35.2698,
  },
  {
    name: "Naivasha",
    point: "Kenyatta Avenue, central post office",
    latitude: -0.7167,
    longitude: 36.4333,
  },
] as const;
export function meetingPoint(place: string) {
  return locations.find(
    (location) => placeKey(location.name) === placeKey(place),
  );
}
