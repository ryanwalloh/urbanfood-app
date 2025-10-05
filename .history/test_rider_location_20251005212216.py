#!/usr/bin/env python3
"""
Test script for rider location API endpoint
"""
import requests
import json

# Test configuration
BASE_URL = "http://192.168.254.111:8000"  # Update with your server IP
ENDPOINT = "/delivery/update-rider-location/"

def test_rider_location_endpoint():
    """Test the rider location update endpoint"""
    
    # Test data
    test_data = {
        "latitude": 8.2275,
        "longitude": 124.2458
    }
    
    print("🧪 Testing Rider Location API Endpoint")
    print(f"📍 URL: {BASE_URL}{ENDPOINT}")
    print(f"📊 Test Data: {test_data}")
    
    try:
        # Make the request
        response = requests.post(
            f"{BASE_URL}{ENDPOINT}",
            json=test_data,
            headers={
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout=10
        )
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        # Try to parse JSON response
        try:
            response_data = response.json()
            print(f"✅ JSON Response: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"❌ Non-JSON Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the server")
        print("💡 Make sure the Django server is running")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    test_rider_location_endpoint()
