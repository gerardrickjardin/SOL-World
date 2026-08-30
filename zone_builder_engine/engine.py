import json
import math
import requests
from shapely.geometry import shape, mapping, Polygon
from shapely.ops import unary_union

STATE_POPS = {
    "Alabama": 5024279, "Alaska": 733391, "Arizona": 7151502, "Arkansas": 3011524, "California": 39538223,
    "Colorado": 5773714, "Connecticut": 3605944, "Delaware": 989948, "District of Columbia": 689545,
    "Florida": 21538187, "Georgia": 10711908, "Hawaii": 1455271, "Idaho": 1839106, "Illinois": 12812508,
    "Indiana": 6785528, "Iowa": 3190369, "Kansas": 2937880, "Kentucky": 4505836, "Louisiana": 4657757,
    "Maine": 1362359, "Maryland": 6177224, "Massachusetts": 7029917, "Michigan": 10077331, "Minnesota": 5706494,
    "Mississippi": 2961279, "Missouri": 6154913, "Montana": 1084225, "Nebraska": 1961504, "Nevada": 3104614,
    "New Hampshire": 1377529, "New Jersey": 9288994, "New Mexico": 2117522, "New York": 20201249,
    "North Carolina": 10439388, "North Dakota": 779094, "Ohio": 11799448, "Oklahoma": 3959353,
    "Oregon": 4237256, "Pennsylvania": 13002700, "Rhode Island": 1097379, "South Carolina": 5118425,
    "South Dakota": 886667, "Tennessee": 6910840, "Texas": 29145505, "Utah": 3271616, "Vermont": 643077,
    "Virginia": 8631393, "Washington": 7705281, "West Virginia": 1793716, "Wisconsin": 5893718, "Wyoming": 576851
}

def generate_territories():
    print("Downloading US States GeoJSON...")
    url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"
    r = requests.get(url)
    states_data = r.json()

    out_features = []
    total_zones = 0

    print("Processing States...")
    for state_feature in states_data['features']:
        state_name = state_feature['properties']['name']
        if state_name not in STATE_POPS:
            continue
            
        pop = STATE_POPS[state_name]
        # Target ~1M per zone
        num_zones = max(1, round(pop / 1000000))
        
        geom = shape(state_feature['geometry'])
        
        if num_zones == 1:
            # Whole state is one zone
            total_zones += 1
            out_features.append({
                "type": "Feature",
                "geometry": mapping(geom),
                "properties": {
                    "name": f"{state_name} Territory",
                    "state": state_name,
                    "code": f"{state_name[:2].upper()}-001",
                    "population": pop,
                    "zips": int(pop / 10000)
                }
            })
            continue
            
        # Slice state
        minx, miny, maxx, maxy = geom.bounds
        width = maxx - minx
        height = maxy - miny
        
        # Decide orientation based on aspect ratio
        if width > height:
            # Cut vertically
            slice_width = width / num_zones
            for i in range(num_zones):
                x0 = minx + i * slice_width
                x1 = minx + (i + 1) * slice_width
                box = Polygon([(x0, miny), (x1, miny), (x1, maxy), (x0, maxy)])
                intersected = geom.intersection(box)
                
                if intersected.is_empty:
                    continue
                
                total_zones += 1
                out_features.append({
                    "type": "Feature",
                    "geometry": mapping(intersected),
                    "properties": {
                        "name": f"{state_name} Zone {i+1}",
                        "state": state_name,
                        "code": f"{state_name[:2].upper()}-{(i+1):03d}",
                        "population": int(pop / num_zones),
                        "zips": int((pop / num_zones) / 10000)
                    }
                })
        else:
            # Cut horizontally
            slice_height = height / num_zones
            for i in range(num_zones):
                y0 = miny + i * slice_height
                y1 = miny + (i + 1) * slice_height
                box = Polygon([(minx, y0), (maxx, y0), (maxx, y1), (minx, y1)])
                intersected = geom.intersection(box)
                
                if intersected.is_empty:
                    continue
                    
                total_zones += 1
                out_features.append({
                    "type": "Feature",
                    "geometry": mapping(intersected),
                    "properties": {
                        "name": f"{state_name} Zone {i+1}",
                        "state": state_name,
                        "code": f"{state_name[:2].upper()}-{(i+1):03d}",
                        "population": int(pop / num_zones),
                        "zips": int((pop / num_zones) / 10000)
                    }
                })

    print(f"Generated {total_zones} Total Zones!")
    
    with open('../solrevibe/locations/territories.geojson', 'w') as f:
        json.dump({"type": "FeatureCollection", "features": out_features}, f)
    
    print("Saved to solrevibe/locations/territories.geojson")

if __name__ == "__main__":
    generate_territories()
