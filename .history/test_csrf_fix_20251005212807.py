#!/usr/bin/env python3
"""
Test script to verify CSRF fix for rider location API endpoint
"""
import requests
import json

# Test configuration
BASE_URL = "http://192.168.254.111:8000"  # Update with your server IP
ENDPOINT = "/delivery/update-rider-location/"

def test_csrf_fix():
    """Test the CSRF fix for rider location update endpoint"""
    
    # Test data
    test_data = {
        "latitude": 8.2275,
        "longitude": 124.2458
    }
    
    print("🧪 Testing CSRF Fix for Rider Location API Endpoint")
    print(f"📍 URL: {BASE_URL}{ENDPOINT}")
    print(f"📊 Test Data: {test_data}")
    
    try:
        # Make the request without CSRF token
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
            
            # Check if CSRF error is resolved
            if response.status_code == 403 and "CSRF" in str(response_data):
                print("❌ CSRF error still present")
            elif response.status_code == 403 and "Authentication credentials were not provided" in str(response_data):
                print("✅ CSRF error resolved! Now getting authentication error (expected)")
            elif response.status_code == 200:
                print("✅ CSRF error resolved! Request successful")
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
    test_csrf_fix()
