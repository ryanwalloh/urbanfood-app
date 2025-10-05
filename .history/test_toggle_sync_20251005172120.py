#!/usr/bin/env python
import requests
import json

def test_toggle_sync():
    # First, let's login as a rider
    login_url = "http://localhost:8000/loginByPassword/"
    login_data = {
        "email": "testrider@gmail.com",
        "password": "testpass123"
    }
    
    session = requests.Session()
    
    try:
        # Login
        headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
        login_response = session.post(login_url, json=login_data, headers=headers)
        print(f"Login response status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            # Test 1: Get current status
            status_url = "http://localhost:8000/rider/status/"
            status_response = session.get(status_url)
            print(f"Current status: {status_response.json()}")
            
            # Test 2: Set status to online (true)
            toggle_url = "http://localhost:8000/rider/toggle-status/"
            toggle_data = {"status": "true"}
            toggle_response = session.post(toggle_url, data=toggle_data)
            print(f"Set to online response: {toggle_response.json()}")
            
            # Test 3: Verify status is online
            status_response = session.get(status_url)
            print(f"Status after setting online: {status_response.json()}")
            
            # Test 4: Set status to offline (false)
            toggle_data = {"status": "false"}
            toggle_response = session.post(toggle_url, data=toggle_data)
            print(f"Set to offline response: {toggle_response.json()}")
            
            # Test 5: Verify status is offline
            status_response = session.get(status_url)
            print(f"Status after setting offline: {status_response.json()}")
            
            # Test 6: Test toggle behavior (no status parameter)
            toggle_response = session.post(toggle_url)
            print(f"Toggle response: {toggle_response.json()}")
            
            # Test 7: Verify final status
            status_response = session.get(status_url)
            print(f"Final status: {status_response.json()}")
            
            print("✅ All tests completed!")
        else:
            print("❌ Login failed")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_toggle_sync()
