#!/usr/bin/env python
import requests
import json

# Test the order acceptance API endpoint
def test_accept_order():
    # First, let's login as a rider
    login_url = "http://localhost:8000/loginByPassword/"
    login_data = {
        "email": "testrider@example.com",  # Assuming this rider exists
        "password": "password123"  # Assuming this is the password
    }
    
    session = requests.Session()
    
    try:
        # Try to login
        login_response = session.post(login_url, json=login_data)
        print(f"Login response status: {login_response.status_code}")
        print(f"Login response: {login_response.text}")
        
        if login_response.status_code == 200:
            # Now try to accept an order
            accept_url = "http://localhost:8000/rider/update-order-status/"
            accept_data = {
                "order_id": "7",  # Using order 7 from our earlier check
                "status": "assigned"
            }
            
            accept_response = session.post(accept_url, data=accept_data)
            print(f"Accept order response status: {accept_response.status_code}")
            print(f"Accept order response: {accept_response.text}")
            
            if accept_response.status_code == 200:
                print("✅ Order acceptance test PASSED!")
            else:
                print("❌ Order acceptance test FAILED!")
        else:
            print("❌ Login failed, cannot test order acceptance")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_accept_order()
