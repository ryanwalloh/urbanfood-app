#!/usr/bin/env python3
"""
Test script for the simplified rider location view
"""
import requests
import json

# Test configuration
BASE_URL = "http://192.168.254.111:8000"
ENDPOINT = "/delivery/update-rider-location/"

def test_simple_view():
    """Test the simplified rider location view"""
    
    # Test data
    test_data = {
        "latitude": 8.2275,
        "longitude": 124.2458
    }
    
    print("🧪 Testing Simplified Rider Location View")
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
            
            # Check response
            if response.status_code == 401:
                print("✅ Authentication error (expected - no user logged in)")
            elif response.status_code == 200:
                print("✅ Request successful!")
            elif "CSRF" in str(response_data):
                print("❌ CSRF error still present")
            else:
                print(f"ℹ️ Other response: {response_data}")
                
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
    test_simple_view()
