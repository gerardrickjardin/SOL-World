import re

with open('solrevibe/locations/index.html', 'r') as f:
    html = f.read()

# 1. Add triggerSearch logic
new_search = '''
        // Search functionality
        window.triggerSearch = function(zip) {
            const input = document.getElementById('search-input');
            if (input) {
                input.value = zip;
                input.dispatchEvent(new KeyboardEvent('keypress', {key: 'Enter'}));
            }
        };

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    const zip = searchInput.value.trim();
                    const zone = getZoneFromZip(zip);
                    if (zone) {
                        const feature = zoneToFeature(zone);
                        
                        // Check if it's already on map, else add
                        let foundLayer = null;
                        geojsonLayer.eachLayer(l => {
                            if (l.feature.properties.code === feature.properties.code) {
                                foundLayer = l;
                            }
                        });
                        
                        if (!foundLayer) {
                            geojsonLayer.addData(feature);
                            foundLayer = geojsonLayer.getLayers().find(l => l.feature.properties.code === feature.properties.code);
                        }
                        
                        if (foundLayer) {
                            map.fitBounds(foundLayer.getBounds());
                            foundLayer.fire('click');
                        }
                    } else {
                        alert('Invalid or unsupported ZIP code.');
                    }
                }
            });
        }
'''

html = re.sub(r'const searchBtn = document\.getElementById.*?\}\);', new_search, html, flags=re.DOTALL)
html = re.sub(r'const searchInput = document\.getElementById.*?\}\);', '', html, flags=re.DOTALL)

new_open_panel = '''
        function openPanel(feature) {
            currentSelectedZoneId = feature.properties.code;
            const props = feature.properties;
            const status = window.territoryStatusMap[props.code] || 'Available';
            const isAssigned = status === 'Assigned';
            const soldCount = isAssigned ? 3 : (props.soldStationsCount || 0);

            // Show card
            document.getElementById('zone-details-card').classList.remove('hidden');

            document.getElementById('t-name').innerText = props.name;
            document.getElementById('t-code').innerText = props.code;
            document.getElementById('t-state').innerText = props.state || 'Unknown Region';
            document.getElementById('t-rep-zip').innerText = props.representativeZip || props.zipCodes[0];
            document.getElementById('t-pop').innerText = (props.totalPopulation || 1000000).toLocaleString();
            
            document.getElementById('t-clinics-count').innerText = soldCount;
            if (soldCount === 0) {
                document.getElementById('t-clinics-count').className = 'text-emerald-400';
                document.getElementById('card-top-border').className = 'absolute top-0 left-0 w-full h-1 bg-emerald-500';
                document.getElementById('t-opportunity').innerText = '100% OPEN OPPORTUNITY';
                document.getElementById('t-opportunity').className = 'text-[10px] font-bold tracking-wide bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded uppercase';
            } else if (soldCount < 3) {
                document.getElementById('t-clinics-count').className = 'text-amber-400';
                document.getElementById('card-top-border').className = 'absolute top-0 left-0 w-full h-1 bg-amber-500';
                document.getElementById('t-opportunity').innerText = 'PARTIAL AVAILABILITY';
                document.getElementById('t-opportunity').className = 'text-[10px] font-bold tracking-wide bg-amber-500/20 text-amber-400 px-2 py-1 rounded uppercase';
            } else {
                document.getElementById('t-clinics-count').className = 'text-red-400';
                document.getElementById('card-top-border').className = 'absolute top-0 left-0 w-full h-1 bg-red-500';
                document.getElementById('t-opportunity').innerText = 'MARKET LOCKED';
                document.getElementById('t-opportunity').className = 'text-[10px] font-bold tracking-wide bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase';
            }

            document.getElementById('t-zips-count').innerText = props.zipCodes.length;
            const zipsGrid = document.getElementById('t-zips-grid');
            zipsGrid.innerHTML = props.zipCodes.map(z => `<div class="bg-[#131b2f] border border-slate-700 text-slate-300 text-xs py-1 text-center rounded">${z}</div>`).join('');

            const peersContainer = document.getElementById('t-peers-container');
            if (props.existingStations && props.existingStations.length > 0 && !isAssigned) {
                peersContainer.innerHTML = `<ul class="list-disc pl-4 text-sm text-slate-300 space-y-1">` + 
                    props.existingStations.map(s => `<li>${s}</li>`).join('') + `</ul>`;
            } else if (isAssigned || soldCount === 3) {
                peersContainer.innerHTML = `<p class="text-sm text-red-400">Territory fully claimed by master licensees.</p>`;
            } else {
                peersContainer.innerHTML = `<p class="text-sm text-emerald-400">No competing SOL REViBE presence currently recorded in this zone. You hold absolute premium field monopoly.</p>`;
            }

            const banner = document.getElementById('status-banner');
            banner.classList.remove('hidden');
            if (soldCount === 0) {
                banner.className = 'mt-6 bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between';
                document.getElementById('banner-icon').className = 'bg-emerald-500/20 text-emerald-400 p-2 rounded-lg text-xl';
                document.getElementById('banner-icon').innerText = '✨';
                document.getElementById('banner-title').innerText = '🔥 FIRST MOVER ADVANTAGE AVAILABLE!';
                document.getElementById('banner-title').className = 'text-lg font-bold uppercase text-emerald-400';
                document.getElementById('banner-badge').innerText = 'UNCLAIMED ZONE';
                document.getElementById('banner-badge').className = 'bg-emerald-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded';
                document.getElementById('banner-desc').innerHTML = `You will be the absolute first business in this 1-Million population market to feature SOL REViBE. <span class="font-bold text-white">(3 of 3 top-tier slots open)</span>.`;
                document.getElementById('banner-side-badge').innerText = 'ZONE STATUS: UNTOUCHED';
                document.getElementById('banner-side-badge').className = 'border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-md text-xs font-mono font-bold';
            } else if (soldCount < 3) {
                banner.className = 'mt-6 bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 flex items-center justify-between';
                document.getElementById('banner-icon').className = 'bg-amber-500/20 text-amber-400 p-2 rounded-lg text-xl';
                document.getElementById('banner-icon').innerText = '⚠️';
                document.getElementById('banner-title').innerText = 'LIMITED SLOTS REMAINING';
                document.getElementById('banner-title').className = 'text-lg font-bold uppercase text-amber-400';
                document.getElementById('banner-badge').innerText = 'PARTIAL ZONE';
                document.getElementById('banner-badge').className = 'bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded';
                document.getElementById('banner-desc').innerHTML = `There is already an established presence in this network. <span class="font-bold text-white">(${3 - soldCount} of 3 top-tier slots open)</span>. First mover advantage is gone.`;
                document.getElementById('banner-side-badge').innerText = `ZONE STATUS: ${soldCount}/3 CLAIMED`;
                document.getElementById('banner-side-badge').className = 'border border-amber-500/50 text-amber-400 px-3 py-1 rounded-md text-xs font-mono font-bold';
            } else {
                banner.className = 'mt-6 bg-red-950/30 border border-red-500/50 rounded-xl p-4 flex items-center justify-between';
                document.getElementById('banner-icon').className = 'bg-red-500/20 text-red-400 p-2 rounded-lg text-xl';
                document.getElementById('banner-icon').innerText = '🔒';
                document.getElementById('banner-title').innerText = 'TERRITORY COMPLETELY LOCKED';
                document.getElementById('banner-title').className = 'text-lg font-bold uppercase text-red-400';
                document.getElementById('banner-badge').innerText = 'MAX CAPACITY';
                document.getElementById('banner-badge').className = 'bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded';
                document.getElementById('banner-desc').innerHTML = `This territory has reached its maximum density limit. <span class="font-bold text-white">(0 of 3 top-tier slots open)</span>. No new licenses will be issued for this zone.`;
                document.getElementById('banner-side-badge').innerText = 'ZONE STATUS: CLOSED';
                document.getElementById('banner-side-badge').className = 'border border-red-500/50 text-red-400 px-3 py-1 rounded-md text-xs font-mono font-bold';
            }
        }
'''
html = re.sub(r'function openPanel\(feature\) \{.*?\n        \}', new_open_panel, html, flags=re.DOTALL)


new_curated_logic = '''
        function populateCuratedHubs() {
            const container = document.getElementById('curated-hubs-container');
            if(!container) return;
            container.innerHTML = CURATED_ZONES.map(zone => {
                const status = window.territoryStatusMap ? window.territoryStatusMap[zone.id] : null;
                const isAssigned = status === 'Assigned';
                const soldCount = isAssigned ? 3 : (zone.soldStationsCount || 0);
                
                let badgeClass = 'text-emerald-400 border-emerald-900 bg-emerald-950/50';
                let badgeText = '0/3 open';
                if (soldCount > 0 && soldCount < 3) {
                    badgeClass = 'text-amber-400 border-amber-900 bg-amber-950/50';
                    badgeText = `${soldCount}/3 sold`;
                } else if (soldCount === 3) {
                    badgeClass = 'text-red-400 border-red-900 bg-red-950/50';
                    badgeText = '3/3 sold';
                }

                return `
                    <div onclick="triggerSearch('${zone.representativeZip}')" class="bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition flex justify-between items-center group">
                        <div>
                            <p class="text-[10px] text-slate-500 font-mono mb-1">${zone.id}</p>
                            <h4 class="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition">${zone.name.split(' & ')[0].split('Core')[0]}</h4>
                            <p class="text-[10px] text-slate-500">${zone.state}</p>
                        </div>
                        <div class="border rounded-full px-3 py-1 text-xs font-bold ${badgeClass}">
                            ${badgeText}
                        </div>
                    </div>
                `;
            }).slice(0, 6).join('');
        }
        setTimeout(populateCuratedHubs, 1000);
'''
html = html.replace('</script>', new_curated_logic + '\n    </script>')
html = html.replace('// Redraw styles if layer exists', 'populateCuratedHubs();\n            // Redraw styles if layer exists')

with open('solrevibe/locations/index.html', 'w') as f:
    f.write(html)
