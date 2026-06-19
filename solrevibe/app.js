// Global Map Variables
let map;
let zipLayer;
let highlightLayer = null;
let zipToZone = {};
let zonesData = {};
let activeZoneId = null;
let showcaseMarker = null;

// Helper to determine zone color based on status
function getZoneColor(zoneId) {
    const zoneInfo = zonesData[zoneId];
    return (zoneInfo && zoneInfo.status === 'Taken') ? '#a855f7' : '#10b981';
}

// Load Data Indexes on Startup
document.addEventListener("DOMContentLoaded", () => {
    // Add cache buster query parameter to force loading the latest regenerated JSON index files
    const cacheBuster = `?t=${Date.now()}`;
    Promise.all([
        fetch('zip_to_zone.json' + cacheBuster).then(res => {
            if (!res.ok) throw new Error("Failed to load zip_to_zone.json");
            return res.json();
        }),
        fetch('zones_data.json' + cacheBuster).then(res => {
            if (!res.ok) throw new Error("Failed to load zones_data.json");
            return res.json();
        })
    ])
    .then(([zipMap, zoneMap]) => {
        zipToZone = zipMap;
        zonesData = zoneMap;
        initMap();
        initSearch();
    })
    .catch(err => {
        console.error("Error loading territory dataset indices:", err);
        showSearchError("Error initializing map database. Please refresh.");
    });
});

// Initialize Leaflet Map
function initMap() {
    // Center of Continental US
    map = L.map('map', {
        center: [37.8, -96.0],
        zoom: 4,
        zoomControl: true,
        maxZoom: 18,
        minZoom: 3
    });

    // Add CartoDB Positron Tile Layer (Premium Light Mode Map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Adjust Zoom Control Position
    map.zoomControl.setPosition('bottomleft');

    // Add Dynamic Esri Feature Layer for U.S. ZIP Codes
    // This loads ZIP code boundaries in the viewport on-demand from Esri's servers
    zipLayer = L.esri.featureLayer({
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_ZIP_Codes/FeatureServer/0',
        simplifyFactor: 0.35, // Smooths geometries slightly to boost client rendering performance
        precision: 5,
        fields: ['ZIP', 'PO_NAME', 'STATE'], // Fetch minimal attributes
        style: function (feature) {
            const zip = feature.properties.ZIP;
            const zoneId = zipToZone[zip];
            
            if (zoneId) {
                const fillColor = getZoneColor(zoneId);
                // Style zoned territories in semi-transparent emerald green or purple with clean white borders
                return {
                    color: '#ffffff',
                    weight: 1.25,
                    opacity: 0.9,
                    fillColor: fillColor,
                    fillOpacity: 0.35
                };
            } else {
                // Hide ZIP codes that are not zoned
                return {
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    interactive: false // Turn off click events for unzoned areas
                };
            }
        }
    }).addTo(map);

    // Click on Map Feature to Select Zone
    zipLayer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const zip = e.propagatedFrom.feature.properties.ZIP;
        const zoneId = zipToZone[zip];
        if (zoneId) {
            selectZone(zoneId, zip);
            
            // Highlight the entire zone and zoom directly to it
            highlightZonePolygons(zoneId, zip);
        }
    });

    // Close status card when clicking empty space on the map
    map.on('click', () => {
        closeStatusCard();
    });
}

// Setup Search Controls
function initSearch() {
    const searchForm = document.getElementById('zip-search-form');
    const closeCardBtn = document.getElementById('close-card-btn');
    const claimZoneBtn = document.getElementById('claim-zone-btn');

    // Trigger search on form submit (handles both button click and Enter keypress)
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });

    // Close card button handler
    closeCardBtn.addEventListener('click', () => {
        closeStatusCard();
    });

    // Claim button handler
    claimZoneBtn.addEventListener('click', () => {
        claimActiveZone();
    });

    // Door icon click delegation on status card
    const statusCard = document.getElementById('status-card');
    statusCard.addEventListener('click', (e) => {
        const doorTrigger = e.target.closest('#showcase-door-trigger');
        if (doorTrigger && activeZoneId) {
            e.stopPropagation();
            triggerDoorwayZoom(activeZoneId);
        }
    });
}

// Perform ZIP Code Validation and Lookup
function performSearch() {
    const searchInput = document.getElementById('zip-search-input');
    const feedbackEl = document.getElementById('search-feedback');
    const rawVal = searchInput.value.trim();
    
    // Clear previous feedback
    feedbackEl.classList.add('hidden');
    feedbackEl.textContent = "";

    // 1. Regular expression validation (exactly 5 digits)
    if (!/^\d{5}$/.test(rawVal)) {
        showSearchError("Please enter a valid 5-digit ZIP code.");
        return;
    }

    // 2. Lookup ZIP in zoning database
    const zoneId = zipToZone[rawVal];
    if (!zoneId) {
        showSearchError(`ZIP code ${rawVal} is not in a zoned territory.`);
        return;
    }

    const zoneInfo = zonesData[zoneId];
    if (!zoneInfo) {
        showSearchError(`Configuration error: Zone ${zoneId} data not found.`);
        return;
    }

    // 3. Highlight the entire zone and zoom directly to it, emphasizing the searched ZIP
    highlightZonePolygons(zoneId, rawVal);

    // 4. Select and display the zone card
    selectZone(zoneId, rawVal);
}

// Draw all ZIP Code boundaries belonging to the selected zone and zoom to them
function highlightZonePolygons(zoneId, searchedZip = null) {
    // Clear previous highlight
    if (highlightLayer) {
        map.removeLayer(highlightLayer);
        highlightLayer = null;
    }

    // Get all ZIP codes in this zone
    const zipsInZone = Object.keys(zipToZone).filter(zip => zipToZone[zip] === zoneId);
    
    if (zipsInZone.length === 0) return;

    // Chunk ZIP codes into groups of 150 to avoid REST API query length limits
    const chunkSize = 150;
    const chunks = [];
    for (let i = 0; i < zipsInZone.length; i += chunkSize) {
        chunks.push(zipsInZone.slice(i, i + chunkSize));
    }

    // Fetch GeoJSON for all chunks
    const fetchPromises = chunks.map(chunk => {
        const zipList = chunk.map(z => `'${z}'`).join(',');
        const queryUrl = `https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_ZIP_Codes/FeatureServer/0/query?where=ZIP IN (${zipList})&outFields=ZIP&outSR=4326&f=geojson`;
        return fetch(queryUrl).then(res => res.json());
    });

    return Promise.all(fetchPromises)
        .then(results => {
            // Merge GeoJSON features
            const mergedFeatures = [];
            results.forEach(geojson => {
                if (geojson.features) {
                    mergedFeatures.push(...geojson.features);
                }
            });

            const mergedGeoJSON = {
                type: "FeatureCollection",
                features: mergedFeatures
            };

            const baseColor = getZoneColor(zoneId);
            const isTaken = zonesData[zoneId] && zonesData[zoneId].status === 'Taken';
            const borderHighlightColor = isTaken ? '#7e22ce' : '#047857';

            // Render the entire zone on the map with subtle white borders
            highlightLayer = L.geoJSON(mergedGeoJSON, {
                style: function (feature) {
                    const zip = feature.properties.ZIP;
                    const isSearched = (zip === searchedZip);
                    return {
                        color: isSearched ? borderHighlightColor : '#ffffff', // Bolder border for the specific searched ZIP code
                        weight: isSearched ? 3 : 1.25,
                        opacity: 1,
                        fillColor: baseColor,
                        fillOpacity: isSearched ? 0.55 : 0.35 // Highlight searched zip slightly darker
                    };
                }
            }).addTo(map);

            // Zoom map to the entire zone's bounds with asymmetrical padding
            const zoneBounds = highlightLayer.getBounds();
            map.fitBounds(zoneBounds, {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [450, 50],
                animate: true,
                duration: 1.2
            });
        })
        .catch(err => {
            console.error("Failed to retrieve zone boundaries outline:", err);
            fallbackToZoneBounds(zoneId);
        });
}

// Fallback zoom to the pre-calculated boundaries of the entire zone
function fallbackToZoneBounds(zoneId) {
    const zoneInfo = zonesData[zoneId];
    if (zoneInfo && zoneInfo.bounds) {
        map.fitBounds(zoneInfo.bounds, {
            paddingTopLeft: [50, 50],
            paddingBottomRight: [450, 50],
            animate: true,
            duration: 1.2
        });
    }
}

// Select a Zone and Display the Metadata Card
function selectZone(zoneId, zipCode) {
    activeZoneId = zoneId;
    const zoneInfo = zonesData[zoneId];
    
    if (!zoneInfo) return;

    // Helper to format integers with commas
    const numFormatter = new Intl.NumberFormat('en-US');

    // Populate Card fields
    const badgeEl = document.getElementById('card-status-badge');
    const titleEl = document.getElementById('card-status-title');
    const claimBtn = document.getElementById('claim-zone-btn');

    if (zoneInfo.status === 'Taken') {
        badgeEl.className = 'status-badge taken';
        badgeEl.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> FLAGSHIP ACTIVATED`;

        titleEl.className = 'card-title status-taken';
        titleEl.textContent = `The Flagship Hub for this zone has been activated by ${zoneInfo.showcase_name}! Good news: The heavy lifting is done. The SOL REViBE brand is already being built in your backyard. Apply now to become an Official Network Provider in this territory before the 100 provider slots fill up!`;

        // Populate and show the Flagship Hub detail row with the door icon next to the business name
        const flagshipRow = document.getElementById('row-flagship');
        flagshipRow.classList.remove('hidden');
        document.getElementById('val-flagship').innerHTML = `${zoneInfo.showcase_name} <span id="showcase-door-trigger" class="door-icon" title="Zoom to Flagship Hub">🚪</span>`;

        claimBtn.className = 'claim-btn taken';
        claimBtn.innerHTML = `Become a Network Partner <i class="fa-solid fa-arrow-right"></i>`;
    } else {
        badgeEl.className = 'status-badge available';
        badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> AVAILABLE`;

        titleEl.className = 'card-title status-available';
        titleEl.textContent = `Good news! This zone is available.`;

        // Hide the Flagship Hub detail row
        document.getElementById('row-flagship').classList.add('hidden');

        claimBtn.className = 'claim-btn available';
        claimBtn.innerHTML = `Claim This Zone Now <i class="fa-solid fa-arrow-right"></i>`;
    }

    document.getElementById('val-zone-id').textContent = zoneId;
    
    // Cities display logic (concatenate first few cities)
    let cityText = zoneInfo.cities.slice(0, 3).join(', ');
    if (zoneInfo.cities.length > 3) {
        cityText += ` (+${zoneInfo.cities.length - 3} more)`;
    }
    document.getElementById('val-city').textContent = cityText;
    document.getElementById('val-state').textContent = zoneInfo.states.join(', ');
    document.getElementById('val-zips-count').textContent = `${zoneInfo.zip_count} ZIP code(s)`;
    document.getElementById('val-pop').textContent = numFormatter.format(zoneInfo.total_pop);
    document.getElementById('val-target-pop').textContent = numFormatter.format(zoneInfo.target_pop);

    // Show the Card with transitions
    const cardEl = document.getElementById('status-card');
    cardEl.classList.remove('hidden');
}

// Clear active selections and hide card
function closeStatusCard() {
    activeZoneId = null;
    document.getElementById('status-card').classList.add('hidden');
    
    if (highlightLayer) {
        map.removeLayer(highlightLayer);
        highlightLayer = null;
    }

    if (showcaseMarker) {
        map.removeLayer(showcaseMarker);
        showcaseMarker = null;
    }

    // Hide the Flagship Hub detail row
    document.getElementById('row-flagship').classList.add('hidden');
    
    document.getElementById('zip-search-input').value = "";
}

// Show validation feedback
function showSearchError(message) {
    const feedbackEl = document.getElementById('search-feedback');
    feedbackEl.textContent = message;
    feedbackEl.classList.remove('hidden');
    
    // Auto-hide feedback after 5 seconds
    setTimeout(() => {
        if (!feedbackEl.classList.contains('hidden') && feedbackEl.textContent === message) {
            feedbackEl.classList.add('hidden');
        }
    }, 5000);
}

// Claim Zone and Smooth Scroll to Form
function claimActiveZone() {
    if (!activeZoneId) return;

    const zoneInfo = zonesData[activeZoneId];
    if (!zoneInfo) return;

    // Pre-populate application form inputs
    const zoneInput = document.getElementById('claimed-zone');
    const cityInput = document.getElementById('claimed-city');

    zoneInput.value = activeZoneId;
    cityInput.value = `${zoneInfo.cities[0]}, ${zoneInfo.states[0]}`;

    // Smoothly scroll down to form section
    const formSection = document.getElementById('application-form-section');
    formSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });

    // Provide a visual pulse effect on the input card to grab attention
    const formCards = document.querySelectorAll('.form-card');
    formCards.forEach(card => {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        card.style.transform = 'translateY(-4px)';
        if (zoneInfo.status === 'Taken') {
            card.style.boxShadow = '0 12px 25px rgba(168, 85, 247, 0.15)';
        } else {
            card.style.boxShadow = '0 12px 25px rgba(16, 185, 129, 0.15)';
        }
        
        setTimeout(() => {
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
        }, 1200);
    });
}

// Doorway zoom logic: geocode Showcase address, place marker and zoom in ultra-deep
function triggerDoorwayZoom(zoneId) {
    const zoneInfo = zonesData[zoneId];
    if (!zoneInfo || !zoneInfo.showcase_street) return;

    const address = `${zoneInfo.showcase_street}, ${zoneInfo.showcase_city}, ${zoneInfo.showcase_state} ${zoneInfo.showcase_zip}`;
    
    // Call Nominatim API for geocoding client-side
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`)
        .then(res => res.json())
        .then(data => {
            let lat, lon;
            if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lon = parseFloat(data[0].lon);
            } else {
                console.warn("Address not found via Nominatim. Using zone center.");
                lat = zoneInfo.center[0];
                lon = zoneInfo.center[1];
            }
            showFlagshipOnMap(lat, lon, zoneInfo.showcase_name, address);
        })
        .catch(err => {
            console.error("Geocoding failed:", err);
            // Fallback to zone center
            showFlagshipOnMap(zoneInfo.center[0], zoneInfo.center[1], zoneInfo.showcase_name, address);
        });
}

function showFlagshipOnMap(lat, lon, businessName, address) {
    if (showcaseMarker) {
        map.removeLayer(showcaseMarker);
    }

    // Create a beautiful custom purple pin
    const purpleIcon = L.divIcon({
        className: 'flagship-pin-container',
        html: `
            <div class="flagship-pulse"></div>
            <div class="flagship-pin">
                <i class="fa-solid fa-store"></i>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42]
    });

    showcaseMarker = L.marker([lat, lon], { icon: purpleIcon }).addTo(map);

    const popupContent = `
        <div class="flagship-popup-content">
            <div class="popup-tag">FLAGSHIP HUB</div>
            <h4 class="popup-biz-name">${businessName}</h4>
            <p class="popup-biz-addr"><i class="fa-solid fa-location-dot"></i> ${address}</p>
        </div>
    `;

    showcaseMarker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-flagship-popup'
    }).openPopup();

    // Zoom in ultra-deep (street-level: 18)
    map.setView([lat, lon], 18, {
        animate: true,
        duration: 1.5
    });
}
