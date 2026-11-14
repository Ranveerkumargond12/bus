# SafarSathi - Entity-Relationship (ER) Diagram

---

## 1. Database Entity-Relationship Architecture
Represents all system entities, primary keys, foreign keys, constraints, and relationships.

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : places
    BUSES ||--o{ BOOKINGS : scheduled_for
    BUSES ||--o{ SEAT_HOLDS : holds
    BUSES ||--o{ REVIEWS : rated_in
    BOOKINGS ||--o{ REVIEWS : reviewed_by

    USERS {
        int id PK
        string name
        string email UK
        string phone
        string password
        string role "user | admin"
        datetime created_at
        datetime updated_at
    }

    BUSES {
        int id PK
        string bus_name
        string bus_number
        string bus_type
        string source
        string destination
        string departure_time
        string arrival_time
        string duration
        decimal fare
        decimal rating
        int seats_capacity
        text amenities
        text boarding_points
        text dropping_points
        string conductor_name
        string conductor_phone
        string conductor_pin
        string distance
        json route_stops
        string status "Active | Inactive"
        datetime created_at
    }

    BOOKINGS {
        int id PK
        string pnr UK "SS-XXXXXXXX"
        int user_id FK
        int bus_id FK
        string passenger_name
        string passenger_email
        string passenger_phone
        string source
        string destination
        string stop_distance
        string seat_no
        date travel_date
        decimal base_fare
        decimal tax_fare
        decimal addons_fare
        decimal discount_amount
        decimal total_fare
        json addons
        json passengers_detail
        string status "Confirmed | Cancelled"
        string boarding_status "Pending | Boarded"
        string payment_status "Paid | Refunded"
        string payment_method
        datetime created_at
    }

    SEAT_HOLDS {
        int id PK
        int bus_id FK
        date travel_date
        string seat_no
        string hold_token
        datetime expires_at
        datetime created_at
    }

    COUPONS {
        int id PK
        string code UK
        string title
        string description
        decimal discount_amount
        string discount_type "flat | percent"
        decimal min_spend
        int active
        datetime created_at
    }

    REVIEWS {
        int id PK
        string pnr
        int user_id FK
        int bus_id FK
        int rating
        text comment
        datetime created_at
    }
```

---

## 2. Entity Descriptions & Cardinality
1. **USERS**: Stores customer and administrator profiles.
   - `USERS` to `BOOKINGS` (1:N): One registered user can place multiple ticket bookings.
2. **BUSES**: Stores bus fleet, conductor credentials, and intermediate stop configurations.
   - `BUSES` to `BOOKINGS` (1:N): One bus serves multiple bookings across different dates and seats.
   - `BUSES` to `SEAT_HOLDS` (1:N): Tracks concurrent 10-minute temporary seat locks.
3. **BOOKINGS**: Central transaction record storing PNR, passenger details, selected stops, and boarding status.
4. **COUPONS**: Promotional discounts applied dynamically against base fare.

