// Major provinces and cities in the Philippines
export const philippineLocations = {
  "Metro Manila": [
    "Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Parañaque", 
    "Pasay", "Caloocan", "Marikina", "Muntinlupa", "Las Piñas", 
    "Mandaluyong", "San Juan", "Valenzuela", "Navotas", "Malabon", "Pateros"
  ],
  "Cavite": [
    "Bacoor", "Cavite City", "Dasmariñas", "General Trias", "Imus", 
    "Tagaytay", "Trece Martires", "Alfonso", "Amadeo", "Carmona", 
    "Indang", "Kawit", "Magallanes", "Maragondon", "Mendez", 
    "Naic", "Noveleta", "Rosario", "Silang", "Tanza", "Ternate"
  ],
  "Laguna": [
    "Biñan", "Cabuyao", "Calamba", "San Pablo", "San Pedro", "Santa Rosa", 
    "Alaminos", "Bay", "Calauan", "Cavinti", "Famy", "Kalayaan", "Liliw", 
    "Los Baños", "Luisiana", "Lumban", "Mabitac", "Magdalena", "Majayjay", 
    "Nagcarlan", "Paete", "Pagsanjan", "Pakil", "Pangil", "Pila", 
    "Rizal", "Santa Cruz", "Santa Maria", "Siniloan", "Victoria"
  ],
  "Rizal": [
    "Antipolo", "Cainta", "Taytay", "Angono", "Baras", "Binangonan", 
    "Cardona", "Jalajala", "Morong", "Pililla", "Rodriguez", "San Mateo", 
    "Tanay", "Teresa"
  ],
  "Batangas": [
    "Batangas City", "Lipa", "Tanauan", "Santo Tomas", "Agoncillo", "Alitagtag", 
    "Balayan", "Balete", "Bauan", "Calaca", "Calatagan", "Cuenca", "Ibaan", 
    "Laurel", "Lemery", "Lian", "Lobo", "Mabini", "Malvar", "Mataas na Kahoy", 
    "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan", "San Luis", 
    "San Nicolas", "San Pascual", "Santa Teresita", "Taal", "Talisay", "Taysan", "Tingloy", "Tuy"
  ],
  "Bulacan": [
    "Malolos", "Meycauayan", "San Jose del Monte", "Baliuag", "Angat", 
    "Balagtas", "Bocaue", "Bulakan", "Bustos", "Calumpit", "Doña Remedios Trinidad", 
    "Guiguinto", "Hagonoy", "Marilao", "Norzagaray", "Obando", "Pandi", 
    "Paombong", "Plaridel", "Pulilan", "San Ildefonso", "San Miguel", "San Rafael", "Santa Maria"
  ],
  "Pampanga": [
    "Angeles", "San Fernando", "Mabalacat", "Apalit", "Arayat", "Bacolor", 
    "Candaba", "Floridablanca", "Guagua", "Lubao", "Macabebe", "Magalang", 
    "Masantol", "Mexico", "Minalin", "Porac", "San Luis", "San Simon", 
    "Santa Ana", "Santa Rita", "Santo Tomas", "Sasmuan"
  ],
  "Cebu": [
    "Cebu City", "Lapu-Lapu", "Mandaue", "Talisay", "Carcar", "Danao", 
    "Naga", "Toledo", "Alcantara", "Alcoy", "Alegria", "Aloguinsan", 
    "Argao", "Asturias", "Badian", "Balamban", "Bantayan", "Barili", 
    "Bogo", "Boljoon", "Borbon", "Carmen", "Catmon", "Compostela", 
    "Consolacion", "Cordova", "Daanbantayan", "Dalaguete", "Dumanjug", 
    "Ginatilan", "Liloan", "Madridejos", "Malabuyoc", "Medellin", "Minglanilla", 
    "Moalboal", "Oslob", "Pilar", "Pinamungajan", "Poro", "Ronda", "Samboan", 
    "San Fernando", "San Francisco", "San Remigio", "Santa Fe", "Santander", 
    "Sibonga", "Sogod", "Tabogon", "Tabuelan", "Tuburan", "Tudela"
  ],
  "Davao": [
    "Davao City", "Digos", "Mati", "Panabo", "Samal", "Tagum", 
    "Asuncion", "Baganga", "Banaybanay", "Bansalan", "Boston", "Caraga", 
    "Carmen", "Compostela", "Don Marcelino", "Hagonoy", "Jose Abad Santos", 
    "Kapalong", "Kiblawan", "Lupon", "Magsaysay", "Malalag", "Malita", 
    "Manay", "Mawab", "Monkayo", "Nabunturan", "New Bataan", "New Corella", 
    "Padada", "Santa Cruz", "Santa Maria", "Santo Tomas", "Sulop", "Talaingod"
  ],
  "Iloilo": [
    "Iloilo City", "Passi", "Ajuy", "Alimodian", "Anilao", "Badiangan", 
    "Balasan", "Banate", "Barotac Nuevo", "Barotac Viejo", "Batad", 
    "Bingawan", "Cabatuan", "Calinog", "Carles", "Concepcion", "Dingle", 
    "Dueñas", "Dumangas", "Estancia", "Guimbal", "Igbaras", "Janiuay", 
    "Lambunao", "Leganes", "Lemery", "Leon", "Maasin", "Miagao", "Mina", 
    "New Lucena", "Oton", "Pavia", "Pototan", "San Dionisio", "San Enrique", 
    "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara", "Sara", 
    "Tigbauan", "Tubungan", "Zarraga"
  ],
  "Other": ["Other"]
};

// Get all provinces
export const getProvinces = (): string[] => {
  return Object.keys(philippineLocations);
};

// Get cities for a specific province
export const getCitiesForProvince = (province: string): string[] => {
  return philippineLocations[province as keyof typeof philippineLocations] || [];
};
