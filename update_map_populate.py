import re

with open('solrevibe/locations/index.html', 'r') as f:
    html = f.read()

new_initial_data = """
        // Build a complete map of all US zones by generating one zone for each prefix
        const allZones = [...CURATED_ZONES];
        Object.keys(ZIP_PREFIX_LOOKUP).forEach(prefix => {
            const isCurated = CURATED_ZONES.some(z => z.zipCodes.some(zc => zc.startsWith(prefix)));
            if (!isCurated) {
                // Generate a base zone for this prefix
                const z = getZoneFromZip(prefix + "000");
                if (z) allZones.push(z);
            }
        });

        const initialData = {
            type: "FeatureCollection",
            features: allZones.map(zoneToFeature)
        };
"""

html = re.sub(
    r'const initialData = \{.*?features: CURATED_ZONES\.map\(zoneToFeature\)\n\s*\}\;',
    new_initial_data,
    html,
    flags=re.DOTALL
)

with open('solrevibe/locations/index.html', 'w') as f:
    f.write(html)
