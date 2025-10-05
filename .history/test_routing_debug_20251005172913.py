#!/usr/bin/env python3

import requests
import json

# Test the routing issue by checking what Google Maps API returns for restaurant addresses
def test_geocoding():
    api_key = "AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ"
    
    # Test addresses from the database
    test_addresses = [
        "66HX+MX Iligan City, Lanao del Norte, Heaven Road",  # Altitude Café
        "66RV+6W Iligan City, Lanao del Norte, Basak Malutlut",  # Café Blooper
        "X7Q3+FF Marawi City, Lanao del Sur, Philippines, Heaven Road",  # The Farm Grill
        "X7Q3+FF Marawi City, Lanao del Sur, Philippines, Boriongan St.",  # Binolawan Kape
    ]
    
    for address in test_addresses:
        print(f"\n📍 Testing address: {address}")
        
        # Test geocoding
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}"
        try:
            response = requests.get(geocode_url)
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                formatted_address = data['results'][0]['formatted_address']
                print(f"✅ Coordinates: {location['lat']}, {location['lng']}")
                print(f"✅ Formatted: {formatted_address}")
            else:
                print(f"❌ Geocoding failed: {data['status']}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_geocoding()
