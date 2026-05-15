# Delivery Boy Panel Walkthrough

I have implemented a complete "Delivery Partner" panel for the Green Bond application, featuring advanced "Swiggy-like" live tracking and navigation.

## Features Implemented

1.  **Delivery Dashboard**:
    *   Overview of stats (Assigned, Delivered, Pending, Earnings).
    *   Quick view of the current active delivery.
    
2.  **Assigned Orders Management**:
    *   **View Orders**: Delivery partners see orders that have been 'Accepted' by farmers.
    *   **Pickup Action**: Ability to mark an 'Accepted' order as 'Shipped' (Picked up).
    *   **Deliver Action**: Ability to mark a 'Shipped' order as 'Delivered'.
    *   **Navigate Action**: For active deliveries ('Shipped'), a **Navigate** button opens the Live Navigation page.
    
3.  **Live Navigation (Swiggy-Style)**:
    *   **Interactive Map**: Uses Leaflet Maps to show the Delivery Partner (Bike) and Customer (Home).
    *   **Path Visualization**: Draws a blue dashed line connecting the delivery partner to the customer.
    *   **Live Updates**: Simulates movement! The delivery partner marker automatically moves 5% closer to the destination every 5 minutes (simulating real-time updates).
    *   **Data Sync**: Updates are saved to simulated backend (`localStorage`) so the User Panel can reflect this data in real-time.
    *   **External Navigation**: Button to open Google Maps for turn-by-turn voice navigation.

4.  **Delivery History**:
    *   A table view of all past delivered orders.

## How to Test Live Tracking

1.  **Login**:
    *   Go to Landing Page -> Delivery Partner Login.
    *   Login with any credentials.

2.  **Start Navigation**:
    *   Go to "Assigned Orders".
    *   If you have a "Shipped" order, click **Navigate**. (If only "Ready for Pickup", click "Pickup Order" first).
    
3.  **Observe Simulation**:
    *   On the Tracking page, you will see a Bike icon and a Home icon.
    *   Wait for **5 seconds**.
    *   You will see a "Location updated" toast notification.
    *   The Bike icon will slightly move along the line towards the Home icon.
    *   ETA will decrease dynamically.
