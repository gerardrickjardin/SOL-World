/*
 * SOL REViBE station list.
 * Single source of truth for:
 *   - the Location dropdown on the waiver form (experience.html)
 *   - the interactive station locator map + free trial voucher (experience.html)
 *
 * SAMPLE DATA - replace with the real SOL REViBE partner locations.
 * Each entry: { name: 'Business Name', city: 'City', state: 'ST', lat: 00.0000, lng: -000.0000 }
 */
window.SOL_STATIONS = [
    { name: "Joe's Massage Parlor",   city: 'Golden',  state: 'CO', lat: 39.7555, lng: -105.2211 },
    { name: 'Sample Wellness Studio', city: 'Denver',  state: 'CO', lat: 39.7392, lng: -104.9903 },
    { name: 'Sample Recovery Lounge', city: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
    { name: 'Sample Day Spa',         city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 }
];
