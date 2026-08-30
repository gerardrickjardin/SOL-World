import re

with open("solrevibe/locations/index.html", "r") as f:
    html = f.read()

# The new body HTML structure
new_body_content = """
<body class="bg-[#0b1329] text-slate-100 antialiased min-h-screen p-4 md:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- HEADER / SEARCH SECTION -->
        <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold tracking-tight text-white">U.S. Territory Search</h1>
                    <span class="bg-teal-900/40 text-teal-400 border border-teal-500/50 rounded-full px-2 py-0.5 text-xs font-mono font-bold tracking-wide">PROTOTYPE v1.4</span>
                </div>
                <div class="flex gap-3">
                    <button onclick="map.setView([39.8283, -98.5795], 4);" class="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm font-medium border border-slate-700 transition">↺ Reset Map</button>
                </div>
            </div>

            <p class="text-slate-300 mb-4 text-sm">We group neighboring zip codes into high-value <span class="text-cyan-400">"Zone IDs"</span> of roughly <span class="text-white font-bold">1,000,000 population</span>. Look up any area to instantly visualize geographical coverage and determine eligibility for the exclusive <span class="text-white font-bold">First Mover Advantage</span>.</p>

            <div class="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mt-6">
                <p class="text-sm font-bold text-white mb-3">Enter a 5-digit ZIP code to check territory availability for SOL REViBE:</p>
                <div class="flex gap-4">
                    <div class="relative flex-1">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-xl">⚲</span>
                        <input type="text" id="search-input" placeholder="e.g. 80202 (Denver), 98101 (Seattle), 82001 (Wyoming)" class="w-full bg-[#050a16] border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition font-mono">
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 mt-4 text-sm">
                    <span class="text-slate-500">Quick ZIP Jump:</span>
                    <button onclick="triggerSearch('82001')" class="text-emerald-400 bg-emerald-950/30 border border-emerald-900 px-3 py-1 rounded hover:bg-emerald-900/50 transition font-mono">82001 (Wyoming)</button>
                    <button onclick="triggerSearch('80202')" class="text-amber-400 bg-amber-950/30 border border-amber-900 px-3 py-1 rounded hover:bg-amber-900/50 transition font-mono">80202 (Denver)</button>
                    <button onclick="triggerSearch('98101')" class="text-amber-400 bg-amber-950/30 border border-amber-900 px-3 py-1 rounded hover:bg-amber-900/50 transition font-mono">98101 (Seattle)</button>
                    <button onclick="triggerSearch('10001')" class="text-red-400 bg-red-950/30 border border-red-900 px-3 py-1 rounded hover:bg-red-900/50 transition font-mono">10001 (New York)</button>
                    <button onclick="triggerSearch('90001')" class="text-emerald-400 bg-emerald-950/30 border border-emerald-900 px-3 py-1 rounded hover:bg-emerald-900/50 transition font-mono">90001 (Los Angeles)</button>
                </div>
            </div>

            <!-- DYNAMIC STATUS BANNER -->
            <div id="status-banner" class="mt-6 border rounded-xl p-4 flex items-center justify-between hidden">
                <div class="flex items-start gap-4">
                    <div id="banner-icon" class="p-2 rounded-lg text-xl"></div>
                    <div>
                        <div class="flex items-center gap-3">
                            <h3 id="banner-title" class="text-lg font-bold uppercase text-white"></h3>
                            <span id="banner-badge" class="text-xs font-bold px-2 py-0.5 rounded text-slate-900"></span>
                        </div>
                        <p id="banner-desc" class="text-sm mt-1"></p>
                    </div>
                </div>
                <div class="text-right whitespace-nowrap pl-4">
                    <span id="banner-side-badge" class="border px-3 py-1 rounded-md text-xs font-mono font-bold"></span>
                </div>
            </div>
        </div>

        <!-- MAIN TWO-COLUMN GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- LEFT COLUMN: ZONE INTELLIGENCE -->
            <div class="lg:col-span-5 space-y-6">
                <!-- Zone Identity Card -->
                <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-6 shadow-2xl relative overflow-hidden hidden" id="zone-details-card">
                    <div class="absolute top-0 left-0 w-full h-1" id="card-top-border"></div>
                    
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-2">
                            <span class="text-cyan-400">⚲</span>
                            <span id="t-code" class="font-mono font-bold tracking-wider text-sm"></span>
                        </div>
                        <span id="t-opportunity" class="text-xs font-bold tracking-wide px-2 py-1 rounded"></span>
                    </div>

                    <p id="t-state" class="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-2"></p>
                    <h2 id="t-name" class="text-2xl font-bold text-white leading-tight mb-2"></h2>
                    <p class="text-sm text-slate-400 flex items-center gap-2 mb-6">
                        <span class="text-slate-500">●</span> Boundary covers representative target ZIP <span id="t-rep-zip" class="font-bold text-white"></span>
                    </p>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                            <p class="text-xs text-slate-500 mb-1">Clustered Population</p>
                            <p id="t-pop" class="text-2xl font-bold text-cyan-400"></p>
                            <p class="text-[10px] text-slate-500 mt-1">~1 Million Milestone</p>
                        </div>
                        <div class="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                            <p class="text-xs text-slate-500 mb-1">Stations Contracted</p>
                            <p class="text-2xl font-bold text-slate-300"><span id="t-clinics-count"></span> <span class="text-sm font-normal text-slate-500">/ 3 Max</span></p>
                            <p class="text-[10px] text-slate-500 mt-1">Top-Tier Threshold</p>
                        </div>
                    </div>

                    <!-- Zip Code Grid -->
                    <div class="mb-6">
                        <div class="flex justify-between text-xs font-bold mb-2">
                            <span class="text-slate-400 flex items-center gap-2">▤ Clustered Zip-Code Network:</span>
                            <span class="text-slate-500"><span id="t-zips-count"></span> linked zones</span>
                        </div>
                        <div id="t-zips-grid" class="bg-[#0a0f1c] border border-slate-800 rounded-lg p-3 grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[120px] overflow-y-auto">
                        </div>
                    </div>

                    <!-- Peers -->
                    <div>
                        <div class="text-xs font-bold text-slate-400 flex items-center gap-2 mb-2">⚑ Active Network Peers:</div>
                        <div class="bg-[#0a0f1c] border border-slate-800 rounded-lg p-4" id="t-peers-container">
                        </div>
                    </div>
                </div>

                <!-- Onboarding Card -->
                <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-6 shadow-2xl" id="onboarding-card">
                    <h3 class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Representative Actions & Onboarding</h3>
                    
                    <div class="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                        <p class="text-xs text-slate-400 mb-3 flex items-center gap-2">ⓘ Reserve or check exclusive terms below:</p>
                        
                        <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Recipient/Lead Partner Email:</label>
                        <input id="f-email" type="email" placeholder="steve@soltheory.com" class="w-full bg-[#050a16] border border-slate-700 rounded p-2 text-sm text-white mb-3 focus:border-cyan-500 outline-none">
                        
                        <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Proposed Brand Name / Hub Notes:</label>
                        <textarea id="f-business" rows="2" placeholder="e.g. Apex Longevity Spa Denver, or general questions..." class="w-full bg-[#050a16] border border-slate-700 rounded p-2 text-sm text-white mb-4 focus:border-cyan-500 outline-none resize-none"></textarea>

                        <button id="assign-btn" onclick="assignTerritory()" class="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-3 rounded-lg shadow-lg transition text-sm">Lock First Mover Claim Brief</button>
                    </div>
                </div>

                <!-- Protocols -->
                <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-6 shadow-2xl text-sm">
                    <h3 class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">ⓘ Protocols & Tiering Definition:</h3>
                    <ul class="space-y-3 text-slate-400">
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-0.5">✓</span> <span><strong class="text-white">First Mover Advantage</strong> occurs when a zone is at 0/3. Releasing localized media buy credits to this claim instantly.</span></li>
                        <li class="flex items-start gap-2"><span class="text-amber-500 mt-0.5">✓</span> <span><strong class="text-white">Top-Tier Slots Availability</strong> ends when exactly three brands enter a 1-million cluster. Once capped, no new buyers qualify.</span></li>
                        <li class="flex items-start gap-2"><span class="text-cyan-500 mt-0.5">ℹ</span> <span>Our database uses local postal adjacency algorithms to assemble metropolitan census counts.</span></li>
                    </ul>
                </div>
            </div>

            <!-- RIGHT COLUMN: MAP & CARDS -->
            <div class="lg:col-span-7 flex flex-col gap-6">
                <!-- Map Container -->
                <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-2 shadow-2xl relative">
                    <div id="map" class="w-full h-[450px] rounded-lg overflow-hidden bg-slate-900 border border-slate-800"></div>
                </div>

                <!-- Curated Hubs Grid -->
                <div class="bg-[#131b2f] border border-[#1e293b] rounded-xl p-6 shadow-2xl flex-1">
                    <h3 class="text-sm font-bold text-white tracking-widest uppercase mb-2 flex items-center gap-2"><span class="text-cyan-400">⚲</span> Core Curated Demonstration Hubs</h3>
                    <p class="text-xs text-slate-400 mb-4">Select a pre-populated B2B metropolitan hub or vast wilderness frontier zone to inspect.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="curated-hubs-container">
                    </div>
                </div>
            </div>
        </div>

        <footer class="text-center text-xs text-slate-600 pt-8 pb-12">
            <p>© 2026 SOL REViBE Commercial Operations. All rights reserved.</p>
            <p class="mt-1 max-w-2xl mx-auto">This workspace application is intended internally for SOL REViBE sales executives and prospective commercial partners to confirm licensing zones. Final regulatory boundaries are subject to state authority filings.</p>
        </footer>
    </div>
"""

# Replace body tag
html = re.sub(r'<body.*?>.*?<!-- Scripts -->', new_body_content + '\n    <!-- Scripts -->', html, flags=re.DOTALL)

with open("solrevibe/locations/index.html", "w") as f:
    f.write(html)
