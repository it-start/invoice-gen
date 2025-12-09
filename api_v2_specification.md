# 🔌 API V2 Specification: Asset-Teleport

**Version:** 2.0 (Draft)
**Status:** Requirements Definition
**Context:** This API layer connects the new Polymorphic React Frontend (V2) with the refactored Backend `Asset` entities.

---

## 1. General Standards

*   **Base URL:** `/api/v2`
*   **Authentication:** Bearer Token (same as V1).
*   **Content-Type:** `application/json`
*   **Date Format:** ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
*   **Pagination:** `?page=1&limit=20` (Response includes `meta: { total, page, last_page }`).

---

## 2. Assets Resource

**Core Entity:** `Asset` (Polymorphic)

### 2.1 List Assets
**GET** `/assets`

*   **Query Params:**
    *   `domain`: `vehicle` | `property` | `equipment` | `coworking` (Optional)
    *   `status`: `available` | `booked` | `maintenance`
    *   `search`: String (matches name, attributes)
*   **Response:**
    ```json
    {
      "data": [
        {
          "id": "ast_123",
          "name": "Tesla Model Y",
          "domain_type": "vehicle",
          "status": "available",
          "images": ["url1.jpg"],
          "details": {
            "vehicle": { "plate": "ABC-123", "mileage": 12000 }
          }
        }
      ],
      "meta": { "total": 50 }
    }
    ```

### 2.2 Get Asset Detail
**GET** `/assets/:id`

### 2.3 Create Asset
**POST** `/assets`

*   **Body (Polymorphic):**
    The `details` object must match the `domain_type`.
    ```json
    {
      "name": "Seaside Villa",
      "domain_type": "property",
      "organization_id": "org_1",
      "details": {
        "property": {
          "address_full": "123 Ocean Dr",
          "bedrooms": 3,
          "bathrooms": 2
        }
      },
      "flexible_attributes": {
        "wifi_speed": "500mbps",
        "view": "ocean"
      }
    }
    ```

### 2.4 Update Asset
**PUT** `/assets/:id`

### 2.5 Delete (Archive) Asset
**DELETE** `/assets/:id`
*   *Note:* Soft delete. Sets status to `ASSET_STATUS_ARCHIVED`.

---

## 3. Bookings & Scheduler

**Core Entity:** `BookingV2`

### 3.1 List Bookings (List View)
**GET** `/bookings`

*   **Query Params:**
    *   `asset_id`: Filter by specific asset.
    *   `status`: `confirmed` | `pending` | `cancelled`

### 3.2 Get Scheduler Data (Timeline View)
**GET** `/bookings/range`

*   **Query Params:**
    *   `start_date`: ISO Date (e.g., `2024-06-01`)
    *   `end_date`: ISO Date (e.g., `2024-06-30`)
    *   `domain`: Filter by domain (optional)
*   **Response:** Optimized for Gantt chart rendering.
    ```json
    [
      {
        "id": "bkg_999",
        "asset_id": "ast_123",
        "user_label": "John Doe",
        "start": "2024-06-05T14:00:00Z",
        "end": "2024-06-10T10:00:00Z",
        "status": "confirmed",
        "color_code": "blue" // Optional helper for frontend
      }
    ]
    ```

### 3.3 Create Booking
**POST** `/bookings`

*   **Body:**
    ```json
    {
      "asset_id": "ast_123",
      "user_id": "user_456", // Or guest details object
      "start_datetime": "2024-06-05T14:00:00Z",
      "end_datetime": "2024-06-10T10:00:00Z",
      "pricing": {
        "total_amount": 50000, // Cents
        "currency_code": "USD"
      }
    }
    ```

### 3.4 Update Status (Workflow)
**PATCH** `/bookings/:id/status`

*   **Body:** `{ "status": "confirmed" }`
*   *Triggers:* Sending of confirmation emails/webhooks.

---

## 4. AI Pipelines (Server-Side)

Moving logic from Client (Gemini SDK) to Server for security and logging.

### 4.1 Parse Unstructured Asset
**POST** `/ai/parse-asset`

*   **Input:**
    ```json
    {
      "text_content": "2020 BMW X5, Black, VIN 123456789, 50k miles."
    }
    ```
*   **Output:** Returns a structured `Asset` object (preview) that the user can confirm in the UI.

### 4.2 Analyze Chat Intent
**POST** `/ai/analyze-intent`

*   **Input:** Chat history context.
*   **Output:** Suggested actions (Reply, Create Booking, Send Invoice).

---

## 5. Analytics (Dashboard)

### 5.1 Dashboard Summary
**GET** `/analytics/summary`

*   **Response:**
    ```json
    {
      "revenue": { "total": 1500000, "currency": "USD", "trend_pct": 12 },
      "occupancy": { "rate": 0.85, "active_count": 45 },
      "domain_breakdown": {
        "vehicle": 60,
        "property": 30,
        "equipment": 10
      },
      "upcoming_handovers": [ ...list of bookings... ]
    }
    ```

---

## 6. Migration Bridge

### 6.1 Import V1 Data
**POST** `/migration/import-v1`

*   *Internal Admin Endpoint.*
*   Triggers the backend pipeline to read from `vehicles` table and populate `assets` table.