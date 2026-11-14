# SafarSathi - Data Flow Diagrams (DFD)

---

## 1. DFD Level 0 (Context Level Diagram)
The Level 0 Context Diagram describes the boundary of the SafarSathi system and its direct interactions with external entities: Passenger, Conductor, Administrator, and Payment Gateway.

```mermaid
flowchart TD
    User["👤 Passenger / User"]
    Admin["⚙️ Administrator"]
    Conductor["🧑‍✈️ Bus Conductor"]
    System["(( 🚌 SafarSathi Bus Booking System ))"]
    PaymentGateway["💳 Payment Gateway / Mode"]

    User -->|"Search Routes & Stops, Select Seats, Submit Booking"| System
    System -->|"E-Ticket PNR, Booking Status, Seat Confirmation"| User

    Admin -->|"Manage Fleet, Configure Stops & Fares, Conductor PIN"| System
    System -->|"Analytics, Bookings Reports, Master Overview"| Admin

    Conductor -->|"Login with Mobile/Bus# & PIN, Update Boarding"| System
    System -->|"Passenger Manifest, Seat Chart, Route Distance"| Conductor

    System -->|"Payment Verification Request"| PaymentGateway
    PaymentGateway -->|"Payment Confirmation"| System
```

---

## 2. DFD Level 1 (High-Level Process Breakdown)
Decomposes the core processes and maps them directly to persistent data stores:

```mermaid
flowchart TD
    User["👤 Passenger"]
    Admin["⚙️ Admin"]
    Conductor["🧑‍✈️ Conductor"]

    subgraph Processes
        P1["1.0 User & Auth Management"]
        P2["2.0 Route & Bus Search"]
        P3["3.0 Seat Lock & Concurrency"]
        P4["4.0 Ticket Booking & Pricing"]
        P5["5.0 Conductor & Boarding Operations"]
        P6["6.0 Fleet & Fare Administration"]
    end

    subgraph DataStores ["Data Stores"]
        D1[("D1: Users")]
        D2[("D2: Buses & Stops")]
        D3[("D3: Bookings")]
        D4[("D4: Seat Holds")]
        D5[("D5: Coupons")]
    end

    User -->|"Register / Login"| P1
    P1 -->|"Store & Validate User"| D1
    D1 -->|"Auth Token & Role"| P1

    User -->|"Search Source, Destination, Date"| P2
    P2 <-->|"Query Active Buses & Stops"| D2

    User -->|"Select Seat(s)"| P3
    P3 <-->|"Check & Create Temporary Hold (10 min)"| D4
    P3 <-->|"Check Double-Booking"| D3

    User -->|"Submit Passenger Info & Coupon"| P4
    P4 <-->|"Validate Discount"| D5
    P4 -->|"Store Confirmed Booking (PNR)"| D3
    P4 -->|"Release Hold"| D4

    Conductor -->|"Conductor Login"| P5
    P5 <-->|"Fetch Assigned Bus Manifest"| D2
    P5 <-->|"Read & Update Boarding Status"| D3

    Admin -->|"Add/Edit Buses, Stops, Fares"| P6
    P6 -->|"Update Fleet Data"| D2
    P6 <-->|"View All Bookings"| D3
```

---

## 3. DFD Level 2 (Booking & Concurrency Process 4.0 Sub-system)
Details how the system handles pricing calculation, ACID transactions, and double-booking lockout.

```mermaid
flowchart TD
    P_In["Passenger Request: Bus ID, Travel Date, Seats, Stops"]
    
    subgraph Step4 ["Process 4.0: Ticket Booking Engine"]
        P4_1["4.1 Calculate Stop-wise Distance & Fare"]
        P4_2["4.2 Verify Coupon Validity"]
        P4_3["4.3 Acquire DB Transaction Lock"]
        P4_4["4.4 Detect Seat Conflicts (Double-Booking Check)"]
        P4_5["4.5 Generate Unique PNR (SS-XXXXXXXX)"]
        P4_6["4.6 Insert Booking Record & Clear Holds"]
        P4_7["4.7 Return E-Ticket & Confirmation"]
    end

    P_In --> P4_1
    P4_1 --> P4_2
    P4_2 --> P4_3
    P4_3 --> P4_4
    P4_4 -->|"Seat Already Booked (409 Conflict)"| Err["Rollback & Display Red Seat Lock"]
    P4_4 -->|"Seats Available"| P4_5
    P4_5 --> P4_6
    P4_6 --> P4_7
```

