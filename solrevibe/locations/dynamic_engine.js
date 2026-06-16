// Dynamic Territory Generation Engine

export const CURATED_ZONES = [
  {
    id: "ZONE-WYO-MT-01",
    name: "Rocky Mountains Frontier & Wilderness Corridor",
    regionType: "Frontier/Rural",
    center: [43.6801, -107.5000],
    totalPopulation: 981450,
    representativeZip: "82001",
    zipCodes: [
      "82001", "82002", "82003", "82601", "82602", "82604", "83001", "83002",
      "82716", "82718", "82070", "82072", "82414", "82501", "59101", "59102", "59105",
      "59715", "59718", "59801", "59802", "59808", "59601", "59602", "59401", "59404", "59405"
    ],
    soldStationsCount: 0,
    existingStations: [],
    color: "#10B981", // Emerald
    state: "Wyoming & Montana",
    polygon: [
      [45.99, -112.90], [46.25, -111.50], [45.80, -108.50], [43.80, -104.90],
      [41.10, -104.90], [41.00, -110.80], [43.00, -110.90], [44.50, -111.00]
    ]
  },
  {
    id: "ZONE-DEN-01",
    name: "Greater Denver Metro & Foothills Zone",
    regionType: "Metropolitan",
    center: [39.7392, -104.9903],
    totalPopulation: 1024500,
    representativeZip: "80202",
    zipCodes: ["80202", "80203", "80204", "80205", "80206", "80209", "80210", "80211", "80212", "80216", "80218", "80219"],
    soldStationsCount: 1,
    existingStations: ["Apex Recovery Spa"],
    color: "#F59E0B", // Amber
    state: "Colorado",
    polygon: [
      [39.85, -105.15], [39.85, -104.85], [39.65, -104.80], [39.60, -105.00], [39.62, -105.18], [39.75, -105.22]
    ]
  },
  {
    id: "ZONE-SEA-01",
    name: "Puget Sound & Greater Seattle Core",
    regionType: "Metropolitan",
    center: [47.6062, -122.3321],
    totalPopulation: 1015000,
    representativeZip: "98101",
    zipCodes: ["98101", "98102", "98103", "98104", "98105", "98109", "98112", "98115", "98122", "98125", "98133", "98144"],
    soldStationsCount: 2,
    existingStations: ["Emerald Biohacking Lab", "Cascade Longevity Centre"],
    color: "#F59E0B",
    state: "Washington",
    polygon: [
      [47.75, -122.45], [47.75, -122.25], [47.50, -122.20], [47.45, -122.30], [47.45, -122.42], [47.60, -122.48]
    ]
  },
  {
    id: "ZONE-NYC-01",
    name: "New York Core & Manhattan South Zone",
    regionType: "Metropolitan",
    center: [40.7306, -73.9352],
    totalPopulation: 1152000,
    representativeZip: "10001",
    zipCodes: ["10001", "10002", "10003", "10009", "10011", "10012", "10013", "10014", "10016", "10019", "10022", "10023"],
    soldStationsCount: 3,
    existingStations: ["Elite Recovery Spa", "Metropolitan Biohealth Lounge", "Manhattan Chiropractic & Laser"],
    color: "#EF4444", // Red
    state: "New York",
    polygon: [
      [40.80, -74.02], [40.82, -73.90], [40.70, -73.88], [40.66, -73.98], [40.69, -74.04]
    ]
  },
  {
    id: "ZONE-LA-01",
    name: "Southern California Coastal Core Zone",
    regionType: "Metropolitan",
    center: [34.0522, -118.2437],
    totalPopulation: 1088000,
    representativeZip: "90001",
    zipCodes: ["90001", "90012", "90013", "90015", "90021", "90025", "90028", "90291", "90401", "90210", "90064"],
    soldStationsCount: 0,
    existingStations: [],
    color: "#10B981",
    state: "California",
    polygon: [
      [34.15, -118.45], [34.15, -118.15], [33.95, -118.15], [33.90, -118.35], [34.00, -118.52]
    ]
  },
  {
    id: "ZONE-CHI-01",
    name: "Chicago Loop & North Lakeshore Belt",
    regionType: "Metropolitan",
    center: [41.8781, -87.6298],
    totalPopulation: 1055000,
    representativeZip: "60601",
    zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60611", "60614", "60657", "60613", "60610", "60622"],
    soldStationsCount: 2,
    existingStations: ["Windy City Cryotherapy", "Millennium Longevity Spa"],
    color: "#F59E0B",
    state: "Illinois",
    polygon: [
      [42.00, -87.72], [42.02, -87.60], [41.80, -87.58], [41.80, -87.68], [41.90, -87.75]
    ]
  },
  {
    id: "ZONE-DAL-01",
    name: "Dallas-Fort Worth Metroplex Spine Zone",
    regionType: "Metropolitan",
    center: [32.7767, -96.7970],
    totalPopulation: 1035000,
    representativeZip: "75201",
    zipCodes: ["75201", "75202", "75204", "75205", "75206", "75219", "75208", "75214", "75220", "76102", "76104"],
    soldStationsCount: 1,
    existingStations: ["Lone Star Recovery Spa"],
    color: "#F59E0B",
    state: "Texas",
    polygon: [
      [32.88, -96.95], [32.90, -96.65], [32.65, -96.65], [32.62, -96.90]
    ]
  }
];

export const ZIP_PREFIX_LOOKUP = {
  "01": { name: "Boston & Pioneer Valley Hub", center: [42.3601, -71.0589], state: "Massachusetts" },
  "02": { name: "New England Coastal Zone", center: [42.3000, -70.9000], state: "Massachusetts" },
  "03": { name: "New Hampshire Highlands Corridor", center: [43.1939, -71.5724], state: "New Hampshire" },
  "04": { name: "Northern New England Frontier Cluster", center: [43.6615, -70.2553], state: "Maine" },
  "05": { name: "Champlain Valley Agricultural Zone", center: [44.2601, -72.5778], state: "Vermont" },
  "06": { name: "Nutmeg State Industrial Corridor", center: [41.7637, -72.6851], state: "Connecticut" },
  "07": { name: "Garden State Northway Corridor", center: [40.7357, -74.1724], state: "New Jersey" },
  "08": { name: "Delaware River Basin Hub", center: [39.7459, -75.5466], state: "New Jersey & Delaware" },
  "09": { name: "US Forces Atlantic Logistic Zone", center: [39.0000, -76.0000], state: "Military Region" },
  "10": { name: "New York Midtown Corridor", center: [40.7580, -73.9855], state: "New York" },
  "11": { name: "Long Island Sound Commerce Belt", center: [40.7063, -73.6187], state: "New York" },
  "12": { name: "Hudson Valley Ecosystem Belt", center: [42.6526, -73.7562], state: "New York" },
  "13": { name: "Empire Central Expressway Valley", center: [43.0481, -76.1474], state: "New York" },
  "14": { name: "Niagara Frontier High-Tech Hub", center: [42.8864, -78.8784], state: "New York" },
  "15": { name: "Keystone Industrial West Basin", center: [40.4406, -79.9959], state: "Pennsylvania" },
  "16": { name: "Alleghany Plateau Mountain Corridor", center: [42.1292, -80.0851], state: "Pennsylvania" },
  "17": { name: "Susquehanna Valley High-Yield Zone", center: [40.2732, -76.8867], state: "Pennsylvania" },
  "18": { name: "Pocono Mountain Frontier Ridge", center: [41.4089, -75.6624], state: "Pennsylvania" },
  "19": { name: "Delaware Valley Metro Spine", center: [40.0076, -75.1340], state: "Pennsylvania" },
  "20": { name: "Chesapeake Potomac Capital Belt", center: [38.9072, -77.0369], state: "District of Columbia" },
  "21": { name: "Baltimore Harbour Logistics Basin", center: [39.2904, -76.6122], state: "Maryland" },
  "22": { name: "Shenandoah Ridge Defense Cluster", center: [38.0293, -78.4767], state: "Virginia" },
  "23": { name: "Chesapeake Tidewater Port Authority", center: [36.8508, -75.9779], state: "Virginia" },
  "24": { name: "Appalachian Foothills Mineral Belt", center: [37.2710, -79.9414], state: "Virginia" },
  "25": { name: "Kanawha Valley Energy Basin", center: [38.3498, -81.6326], state: "West Virginia" },
  "26": { name: "Mountain State Forest Reserve", center: [39.6295, -79.9559], state: "West Virginia" },
  "27": { name: "Carolina Research Piedmont Zone", center: [35.7796, -78.6382], state: "North Carolina" },
  "28": { name: "Blue Ridge Smoky Mountain Cluster", center: [35.2271, -80.8431], state: "North Carolina" },
  "29": { name: "Palmetto State Coastal Gateway", center: [32.7765, -79.9311], state: "South Carolina" },
  "30": { name: "Peach State Atlanta Tech Hub", center: [33.7490, -84.3880], state: "Georgia" },
  "31": { name: "Savannah River Timber Corridor", center: [32.0835, -81.0998], state: "Georgia" },
  "32": { name: "Florida Northeast Citrus Coast", center: [30.3322, -81.6557], state: "Florida" },
  "33": { name: "Florida Suncoast Marketing Corridor", center: [27.9506, -82.4572], state: "Florida" },
  "34": { name: "Everglades Tropical Commerce Rim", center: [25.7617, -80.1918], state: "Florida" },
  "35": { name: "Deep South Metallurgical Corridor", center: [33.5186, -86.8104], state: "Alabama" },
  "36": { name: "Alabama River Basin Logistics Zone", center: [32.3182, -86.3077], state: "Alabama" },
  "37": { name: "Cumberland Music Valley Zone", center: [36.1627, -86.7816], state: "Tennessee" },
  "38": { name: "Mississippi Bluff Commerce Axis", center: [35.1495, -90.0490], state: "Tennessee" },
  "39": { name: "Mississippi Delta Alliance", center: [32.2988, -90.1848], state: "Mississippi" },
  "40": { name: "Kentucky River Bluegrass Hub", center: [38.0406, -84.5037], state: "Kentucky" },
  "41": { name: "Ohio Falls Transit Corridor", center: [38.2527, -85.7585], state: "Kentucky" },
  "42": { name: "Pennyroyal Appalachian Ridge", center: [37.0697, -84.0624], state: "Kentucky" },
  "43": { name: "Buckeye Scioto Valley Corridor", center: [39.9612, -82.9988], state: "Ohio" },
  "44": { name: "Erie Shore Manufacturing Spine", center: [41.4993, -81.6944], state: "Ohio" },
  "45": { name: "Miami River Valley Aerospace Hub", center: [39.1031, -84.5120], state: "Ohio" },
  "46": { name: "Crossroads of America Metro Plain", center: [39.7684, -86.1581], state: "Indiana" },
  "47": { name: "Wabash River Valley Farmlands", center: [37.9716, -87.5711], state: "Indiana" },
  "48": { name: "Great Lakes Detroit Auto Basin", center: [42.3314, -83.0458], state: "Michigan" },
  "49": { name: "Spartan Peninsula Forestry Zone", center: [42.7335, -84.4831], state: "Michigan" },
  "50": { name: "Hawkeye Corn Belt Central Zone", center: [41.5868, -93.6250], state: "Iowa" },
  "51": { name: "Mississippi River Rapids Corridor", center: [42.5006, -90.6645], state: "Iowa" },
  "52": { name: "Iowa Prairie Livestock Cluster", center: [42.0083, -91.6441], state: "Iowa" },
  "53": { name: "Dairy State Madison Lakes Zone", center: [43.0731, -89.4012], state: "Wisconsin" },
  "54": { name: "Northern Woodlands Frontier Rim", center: [44.8016, -91.4985], state: "Wisconsin" },
  "55": { name: "Twin Cities Mississippi Plain", center: [44.9778, -93.2650], state: "Minnesota" },
  "56": { name: "Red River Wilderness Boundary", center: [46.8738, -96.7858], state: "Minnesota" },
  "57": { name: "Missouri River Dakota Plain", center: [43.5460, -96.7313], state: "South Dakota" },
  "58": { name: "Sheyenne River Prairie Outpost", center: [46.8083, -100.7837], state: "North Dakota" },
  "59": { name: "Big Sky Yellowstone Gateway", center: [45.6788, -111.0356], state: "Montana" },
  "60": { name: "Chicago Loop Central Hub", center: [41.8781, -87.6298], state: "Illinois" },
  "61": { name: "Illinois Prairie Manufacturing Axis", center: [40.6936, -89.5890], state: "Illinois" },
  "62": { name: "River-to-River Commerce Route", center: [38.6270, -90.1994], state: "Missouri" },
  "63": { name: "Osage Hills Leisure Ecosystem", center: [37.1923, -93.2862], state: "Missouri" },
  "64": { name: "Kansas City Gateway Plains", center: [39.0997, -94.5786], state: "Kansas" },
  "65": { name: "Ozarks Agricultural Frontier", center: [37.0902, -95.7129], state: "Missouri" },
  "66": { name: "Sunflower Grasslands & Wheat Cluster", center: [37.6872, -97.3301], state: "Kansas" },
  "67": { name: "High Plains Agricultural Belt", center: [39.0119, -98.4842], state: "Kansas" },
  "68": { name: "Omaha Platte Valley Corridor", center: [41.2565, -95.9345], state: "Nebraska" },
  "69": { name: "Sandhills Cattle Country Frontier", center: [41.4925, -99.9018], state: "Nebraska" },
  "70": { name: "Cajun Bayou Commerce Axis", center: [29.9511, -90.0715], state: "Louisiana" },
  "71": { name: "Red River Forestry Reserve", center: [32.5186, -93.7503], state: "Louisiana" },
  "72": { name: "Ozark Mountain Hot Springs Cluster", center: [34.7465, -92.2896], state: "Arkansas" },
  "73": { name: "Sooner State Oil Reserves Hub", center: [35.4676, -97.5164], state: "Oklahoma" },
  "74": { name: "Cherokee Hills Highlands Frontier", center: [36.1540, -95.9928], state: "Oklahoma" },
  "75": { name: "Dallas-Fort Worth Metroplex Belt", center: [32.7767, -96.7970], state: "Texas" },
  "76": { name: "Gulf Coast Houston Trading Zone", center: [29.7604, -95.3698], state: "Texas" },
  "77": { name: "Palacio de la Alamo Heritage Basin", center: [29.4241, -98.4936], state: "Texas" },
  "78": { name: "West Texas Oil Sands Desert", center: [31.9973, -102.0779], state: "Texas" },
  "79": { name: "Rio Grande Valley Border Cluster", center: [26.2034, -98.2300], state: "Texas" },
  "80": { name: "Denver Rocky Mountain Divide", center: [39.7392, -104.9903], state: "Colorado" },
  "81": { name: "Rocky Foothills Energy Belt", center: [40.0150, -105.2705], state: "Colorado" },
  "82": { name: "Wyoming High Desert Frontier", center: [42.8501, -106.3252], state: "Wyoming" },
  "83": { name: "Snake River Agricultural Valley", center: [43.6088, -116.2008], state: "Idaho" },
  "84": { name: "Wasatch Front Great Salt Lake Zone", center: [40.7608, -111.8910], state: "Utah" },
  "85": { name: "Valley of the Sun Phoenix Core", center: [33.4484, -112.0740], state: "Arizona" },
  "86": { name: "Saguaro Foothills Desert Frontier", center: [32.2226, -110.9747], state: "Arizona" },
  "87": { name: "Rio Grande Enchantment Corridor", center: [35.0844, -106.6511], state: "New Mexico" },
  "88": { name: "Pecos Valley Livestock Plain", center: [32.3933, -104.2255], state: "New Mexico" },
  "89": { name: "Silver State Entertainment-Tech Hub", center: [36.1716, -115.1398], state: "Nevada" },
  "90": { name: "Southern California Coastal Rim", center: [34.0522, -118.2437], state: "California" },
  "91": { name: "Silicon Valley San Francisco Range", center: [37.7749, -122.4194], state: "California" },
  "92": { name: "Orange County Pacific Riviera", center: [33.6846, -117.8265], state: "California" },
  "93": { name: "San Joaquin Vineyard Agri-Belt", center: [36.7378, -119.7871], state: "California" },
  "94": { name: "Sacramento Central Valley Spine", center: [38.5816, -121.4944], state: "California" },
  "95": { name: "Cascade Redwood Wilderness Border", center: [40.5865, -122.3917], state: "California" },
  "96": { name: "Columbia River Timber Frontier", center: [44.0244, -121.3153], state: "Oregon" },
  "97": { name: "Willamette Valley Portland Zone", center: [45.5152, -122.6784], state: "Oregon" },
  "98": { name: "Puget Sound Washington Metro", center: [47.6062, -122.3321], state: "Washington" },
  "99": { name: "Colville Columbia Basin Outpost", center: [47.6588, -117.4260], state: "Washington" }
};

export function generateOrganicPolygon(center, radiusDegrees = 0.12) {
  const points = [];
  const numSides = 8;
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    const wave = Math.sin(i * 1.5) * 0.12 + Math.cos(i * 2.8) * 0.08 + 1.0;
    const lat = center[0] + Math.sin(angle) * radiusDegrees * wave;
    const lng = center[1] + Math.cos(angle) * (radiusDegrees * 1.3) * wave;
    points.push([lat, lng]);
  }
  return points;
}

function getRandomB2BClinicName(seed) {
  const brandStart = ["Apex", "Helix", "Synergy", "Equilibrium", "Zenith", "Quantum", "Peak", "Rejuvenate", "Core", "Nexus", "Summit", "Altus", "Solace"];
  const medicalType = ["Longevity Center", "Recovery Lab", "Cryo & Wellness", "MedSpa & Recovery", "Aesthetics Clinic", "Physiotherapy Hub", "Chiro & Rehab", "Biohacking Center"];
  return `${brandStart[seed % brandStart.length]} ${medicalType[(seed * 2) % medicalType.length]}`;
}

export function getZoneFromZip(userInputZip, lat = null, lng = null) {
  const cleaned = userInputZip.trim().replace(/\s+/g, "");
  if (!/^\d{5}$/.test(cleaned)) {
    return null;
  }

  const foundCurated = CURATED_ZONES.find(zone => zone.zipCodes.includes(cleaned));
  if (foundCurated) {
    return foundCurated;
  }

  const doubleCheckCurated = CURATED_ZONES.find(zone => zone.zipCodes.some(z => z.substring(0, 3) === cleaned.substring(0, 3)));
  if (doubleCheckCurated) {
    return doubleCheckCurated;
  }

  const prefix2 = cleaned.substring(0, 2);
  const prefix2Geom = ZIP_PREFIX_LOOKUP[prefix2];

  const baseGeom = prefix2Geom || {
    name: "Heartland Expansion Zone",
    center: [38.5000, -98.0000],
    state: "Kansas"
  };

  const zipNum = parseInt(cleaned, 10);
  const seedVal = zipNum % 10;
  let soldCount = 0;
  let existingStations = [];

  if (seedVal < 4) {
    soldCount = 0;
    existingStations = [];
  } else if (seedVal < 7) {
    soldCount = 1;
    existingStations = [getRandomB2BClinicName(zipNum)];
  } else if (seedVal < 9) {
    soldCount = 2;
    existingStations = [getRandomB2BClinicName(zipNum), getRandomB2BClinicName(zipNum + 73)];
  } else {
    soldCount = 3;
    existingStations = [
      getRandomB2BClinicName(zipNum),
      getRandomB2BClinicName(zipNum + 73),
      getRandomB2BClinicName(zipNum + 144)
    ];
  }

  const computedCenter = lat && lng ? [lat, lng] : [
    baseGeom.center[0] + ((zipNum % 100) - 50) * 0.003,
    baseGeom.center[1] + (((zipNum * 3) % 100) - 50) * 0.003
  ];

  const zipCodesCluster = [cleaned];
  for (let i = 1; i <= 6; i++) {
    const adjacentZip = String(zipNum + (i % 2 === 0 ? i : -i)).padStart(5, "0");
    zipCodesCluster.push(adjacentZip);
  }

  const totalPopulation = 950000 + (zipNum % 100) * 1250;
  const polygon = generateOrganicPolygon(computedCenter, 0.15);

  return {
    id: `ZONE-${prefix2}-${zipNum % 999}`,
    name: `${baseGeom.name} (Cluster #${100 + (zipNum % 900)})`,
    regionType: zipNum % 3 === 0 ? "Suburban" : (zipNum % 7 === 0 ? "Frontier/Rural" : "Metropolitan"),
    center: computedCenter,
    totalPopulation,
    zipCodes: zipCodesCluster,
    soldStationsCount: soldCount,
    existingStations,
    state: baseGeom.state,
    representativeZip: cleaned,
    polygon
  };
}
