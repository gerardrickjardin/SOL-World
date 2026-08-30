import csv
import json
import urllib.request
import os
from collections import defaultdict

def download_coordinates():
    print("Downloading ZIP code coordinates from blakek/us-zips...")
    url = 'https://raw.githubusercontent.com/blakek/us-zips/master/key-value.js'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        
    start_idx = content.find('[')
    end_idx = content.rfind(']')
    
    if start_idx == -1 or end_idx == -1:
        raise ValueError("Could not find array structure in key-value.js")
        
    json_str = content[start_idx : end_idx + 1]
    raw_list = json.loads(json_str)
    
    zip_coords = {}
    for item in raw_list:
        zip_code = item[0].strip().zfill(5)
        coords = item[1]
        zip_coords[zip_code] = (float(coords['latitude']), float(coords['longitude']))
        
    print(f"Loaded {len(zip_coords)} ZIP code coordinates.")
    return zip_coords

def process_zoned_data(zip_coords):
    print("Reading US_ZIP_CODES_ZONED.csv...")
    
    zip_to_zone = {}
    zone_stats = {}
    
    csv_file = 'US_ZIP_CODES_ZONED.csv'
    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"Could not find {csv_file}")
        
    with open(csv_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_zip = row['ZIP Code'].strip()
            zip_code = raw_zip.zfill(5)
            
            orig_zone_id = row['Zone ID'].strip()
            state = row['State'].strip()
            county = row['County'].strip()
            city = row['City'].strip()
            
            status = row.get('Status', 'Available').strip() if row.get('Status') else 'Available'
            showcase_name = row.get('Showcase Business Name', '').strip() if row.get('Showcase Business Name') else ''
            showcase_street = row.get('Showcase Street', '').strip() if row.get('Showcase Street') else ''
            showcase_city = row.get('Showcase City', '').strip() if row.get('Showcase City') else ''
            showcase_state = row.get('Showcase State', '').strip() if row.get('Showcase State') else ''
            showcase_zip = row.get('Showcase Zip', '').strip() if row.get('Showcase Zip') else ''
            
            # Solve Zone ID collisions across states (e.g. DEN-A in CO vs TX) by creating a unique key
            zone_id = f"{orig_zone_id}-{state}"
            
            try:
                pop = int(row['Estimated Population'].replace(',', '')) if row['Estimated Population'] else 0
            except ValueError:
                pop = 0
                
            try:
                target_pop = int(row['Zone Target Pop'].replace(',', '')) if row['Zone Target Pop'] else 0
            except ValueError:
                target_pop = 0
                
            zip_to_zone[zip_code] = zone_id
            
            if zone_id not in zone_stats:
                zone_stats[zone_id] = {
                    'zone_id': zone_id,
                    'orig_zone_id': orig_zone_id,
                    'states': set(),
                    'counties': set(),
                    'cities': set(),
                    'zipcodes': [],
                    'total_pop': 0,
                    'target_pop': target_pop,
                    'coords': [],
                    'status': 'Available',
                    'showcase_name': '',
                    'showcase_street': '',
                    'showcase_city': '',
                    'showcase_state': '',
                    'showcase_zip': '',
                    'taken_city': '',
                    'taken_state': '',
                    'taken_zip': ''
                }
                
            stats = zone_stats[zone_id]
            stats['states'].add(state)
            stats['counties'].add(county)
            stats['cities'].add(city)
            stats['zipcodes'].append(zip_code)
            stats['total_pop'] += pop
            
            # If any ZIP is Taken, mark the zone as Taken and populate showcase details
            if status.lower() == 'taken':
                stats['status'] = 'Taken'
                stats['taken_city'] = city
                stats['taken_state'] = state
                stats['taken_zip'] = zip_code
                if showcase_name:
                    stats['showcase_name'] = showcase_name
                if showcase_street:
                    stats['showcase_street'] = showcase_street
                if showcase_city:
                    stats['showcase_city'] = showcase_city
                if showcase_state:
                    stats['showcase_state'] = showcase_state
                if showcase_zip:
                    stats['showcase_zip'] = showcase_zip
            
            if zip_code in zip_coords:
                stats['coords'].append(zip_coords[zip_code])
                
    # High-fidelity mock showcase data generation for Taken zones that lack detailed info
    for zone_id, stats in zone_stats.items():
        if stats['status'] == 'Taken' and not stats['showcase_name']:
            primary_city = stats['taken_city'] if stats['taken_city'] else sorted(list(stats['cities']))[0]
            primary_state = stats['taken_state'] if stats['taken_state'] else sorted(list(stats['states']))[0]
            primary_zip = stats['taken_zip'] if stats['taken_zip'] else stats['zipcodes'][0]
            
            stats['showcase_name'] = f"SOL REViBE Flagship Hub - {primary_city}"
            stats['showcase_street'] = "100 W 36th Ave" if primary_state == 'AK' else "100 Main Street"
            stats['showcase_city'] = primary_city
            stats['showcase_state'] = primary_state
            stats['showcase_zip'] = primary_zip
                
    print(f"Processed {len(zip_to_zone)} ZIP codes and identified {len(zone_stats)} unique state-specific zones.")
    
    # Compute centroids and bounds
    final_zones = {}
    for zone_id, stats in zone_stats.items():
        coords_list = stats['coords']
        
        if coords_list:
            lats = [c[0] for c in coords_list]
            lons = [c[1] for c in coords_list]
            center_lat = sum(lats) / len(lats)
            center_lon = sum(lons) / len(lons)
            center = [center_lat, center_lon]
            
            min_lat, max_lat = min(lats), max(lats)
            min_lon, max_lon = min(lons), max(lons)
            if min_lat == max_lat:
                min_lat -= 0.03
                max_lat += 0.03
            if min_lon == max_lon:
                min_lon -= 0.03
                max_lon += 0.03
            bounds = [[min_lat, min_lon], [max_lat, max_lon]]
        else:
            center = [37.0902, -95.7129]
            bounds = [[34.0, -118.0], [40.0, -74.0]]
            
        final_zones[zone_id] = {
            'zone_id': zone_id,
            'orig_zone_id': stats['orig_zone_id'],
            'states': sorted(list(stats['states'])),
            'counties': sorted(list(stats['counties'])),
            'cities': sorted(list(stats['cities'])),
            'zip_count': len(stats['zipcodes']),
            'total_pop': stats['total_pop'],
            'target_pop': stats['target_pop'],
            'center': center,
            'bounds': bounds,
            'status': stats['status'],
            'showcase_name': stats['showcase_name'],
            'showcase_street': stats['showcase_street'],
            'showcase_city': stats['showcase_city'],
            'showcase_state': stats['showcase_state'],
            'showcase_zip': stats['showcase_zip']
        }
        
    print("Writing output files...")
    with open('zip_to_zone.json', 'w', encoding='utf-8') as f:
        json.dump(zip_to_zone, f, indent=2)
        
    with open('zones_data.json', 'w', encoding='utf-8') as f:
        json.dump(final_zones, f, indent=2)
        
    print("All outputs generated successfully!")
    print(" - zip_to_zone.json")
    print(" - zones_data.json")

if __name__ == '__main__':
    try:
        zip_coords = download_coordinates()
        process_zoned_data(zip_coords)
    except Exception as e:
        print("Error processing data:", e)
