#!/usr/bin/env python3

import requests
import json

def test_order_api():
    # Login
    session = requests.Session()
    login_data = {'email': 'testrider@gmail.com', 'password': 'testpass123'}
    login_response = session.post(
        'http://localhost:8000/loginByPassword/', 
        json=login_data, 
        headers={'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json'}
    )
    
    print(f"Login status: {login_response.status_code}")
    if login_response.status_code != 200:
        print("Login failed")
        return
    
    print("Login successful")
    
    # Test order 8
    order_data = {'order_id': 8}
    order_response = session.post(
        'http://localhost:8000/rider/fetch-order-details/', 
        json=order_data, 
        headers={'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json'}
    )
    
    print(f"Order response status: {order_response.status_code}")
    if order_response.status_code == 200:
        order_details = order_response.json()
        print("Order details:")
        print(f"  Restaurant: {order_details.get('restaurant_name')}")
        print(f"  Restaurant Street: {order_details.get('restaurant_street')}")
        print(f"  Restaurant Barangay: {order_details.get('restaurant_barangay')}")
        print(f"  Full Address: {order_details.get('restaurant_street')}, {order_details.get('restaurant_barangay')}")
    else:
        print(f"Order API failed: {order_response.text}")

if __name__ == "__main__":
    test_order_api()
