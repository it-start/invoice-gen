# 🛠️ Backend Task: Migrate Vehicle Entity to Polymorphic Asset Entity

**Objective:**
Refactor the existing `Vehicle` Protobuf definition into a generic `Asset` definition to support multi-domain rentals (Property, Equipment, etc.) while maintaining backward compatibility for Vehicles via strict typing.

---

## 1. New Proto Definition (`asset.proto`)

Replace (or augment) the existing `vehicle.proto` with the following structure.

```protobuf
syntax = "proto3";

package entities;

option go_package = "github.com/ownima/backend/proto/entities";

import "google/protobuf/timestamp.proto";
import "google/protobuf/struct.proto"; // Key for flexibility
import "proto/entities/money.proto";   // Ensure this exists or define it

// --- ENUMS ---

enum AssetDomain {
  ASSET_DOMAIN_UNSPECIFIED = 0;
  ASSET_DOMAIN_VEHICLE = 1;
  ASSET_DOMAIN_PROPERTY = 2;
  ASSET_DOMAIN_EQUIPMENT = 3;
  ASSET_DOMAIN_COWORKING = 4;
}

enum AssetStatus {
  ASSET_STATUS_UNSPECIFIED = 0;
  ASSET_STATUS_DRAFT = 1;
  ASSET_STATUS_AVAILABLE = 2;
  ASSET_STATUS_BOOKED = 3;
  ASSET_STATUS_MAINTENANCE = 4;
  ASSET_STATUS_ARCHIVED = 5;
}

// --- CORE ENTITY ---

message Asset {
  // Core Identifiers
  string id = 1;
  string organization_id = 2; // Replaces owner_id for B2B scale, mapped to owner for P2P
  
  // Display Data
  string name = 3; // e.g., "BMW X5" or "Sunset Villa"
  string description = 4;
  repeated string images = 5; // Simplified from `entities.Picture` to URL list
  
  // Classification
  AssetDomain domain = 6;
  AssetStatus status = 7;
  
  // Pricing (Simplified)
  Money base_price = 8; // Daily rate or base unit
  string price_template_id = 9;
  
  // Polymorphic Domain Data
  // This allows the Asset to "shapeshift" based on domain
  oneof details {
    VehicleAttributes vehicle = 10;
    PropertyAttributes property = 11;
    EquipmentAttributes equipment = 12;
  }

  // Flexible/AI Attributes
  // Stores non-standard fields without schema changes (e.g., "wifi_speed", "coffee_machine")
  google.protobuf.Struct flexible_attributes = 13;

  // Metadata
  google.protobuf.Timestamp created_at = 20;
  google.protobuf.Timestamp updated_at = 21;
  PublicationStats stats = 22;
}

// --- DOMAIN SPECIFIC ATTRIBUTES ---

message VehicleAttributes {
  // Identifiers
  string reg_number = 1; // License plate
  string vin = 2;
  
  // Classification
  string type = 3; // "car", "bike" (Replaces rigid enum for flexibility)
  string sub_type = 4; // "sedan", "suv"
  
  // Specs (Flattened from SpecificationInfo)
  string brand = 5;
  string model = 6;
  int32 year = 7;
  string color = 8;
  string transmission = 9; // "auto", "manual"
  string fuel_type = 10;   // "petrol", "electric"
  float mileage = 11;
  int32 seats = 12;
  int32 doors = 13;
  
  // Features (Flattened from AdditionalInfo)
  bool air_conditioning = 14;
  bool navigation = 15;
  bool all_wheel_drive = 16;
}

message PropertyAttributes {
  string address_full = 1;
  string unit_number = 2;
  
  // Specs
  float area_sqm = 3;
  float bedrooms = 4;
  float bathrooms = 5;
  
  // Features
  bool furnished = 6;
  bool pets_allowed = 7;
  bool parking_included = 8;
}

message EquipmentAttributes {
  string serial_number = 1;
  string manufacturer = 2;
  string model_year = 3;
  string condition = 4; // "new", "used", "refurbished"
}

// --- COMMON TYPES ---

message PublicationStats {
  float completion_score = 1; // 0.0 to 1.0 (replaces checked_ratio)
  int32 missing_fields_count = 2;
  bool is_ready_for_publish = 3;
}

message Money {
  string currency_code = 1; // ISO 4217, e.g., "USD"
  int64 units = 2;          // Amount in smallest unit (cents)
}

// Renamed from "Garage" to "InventoryLocation" to be agnostic
message InventoryLocation {
  string id = 1;
  string name = 2; // e.g., "Downtown Garage" or "Warehouse B"
  string address = 3;
  
  // Simple list of asset IDs stored here
  repeated string stored_asset_ids = 4;
  
  // Operational details
  bool is_active = 5;
  string working_hours = 6; // Could be struct/json
}
```

---

## 2. Key Architectural Changes

### A. Polymorphism via `oneof`
**Change:** Replaced the rigid `Vehicle` message with `Asset` containing a `oneof details` block.
**Benefit:**
*   **Database:** Allows storing different asset types in a single table (e.g., using a JSONB column for `details` or separate tables linked by ID).
*   **API:** Frontend receives a typed object. If `domain` is `VEHICLE`, the `vehicle` field is populated. If `PROPERTY`, the `property` field is populated.

### B. Flattening & Simplification
**Change:** Removed nested `GeneralInfo`, `SpecificationInfo`, `AdditionalInfo` structs for Vehicles.
**Benefit:**
*   Reduces object depth (e.g., `asset.vehicle.brand` instead of `asset.general_info.brand`).
*   Easier for AI to map data.

### C. Flexible Attributes (`google.protobuf.Struct`)
**Change:** Added `flexible_attributes`.
**Benefit:**
*   Allows storing arbitrary data extracted by AI (e.g., "coffee_machine_brand", "view_type") without requiring a schema migration every time a new attribute is discovered.

### D. Strict Types to Strings
**Change:** Converted `VehicleType` (Enum) to `string`.
**Benefit:**
*   Allows adding new types (e.g., "E-Scooter", "Hoverboard") dynamically via the Admin UI without recompiling the backend binary.

---

## 3. Migration Plan (Suggested)

1.  **Generate Go Code:** Run `protoc` to generate new Go structs.
2.  **DB Migration:**
    *   Create `assets` table.
    *   Write a script to read all rows from `vehicles`.
    *   Map `vehicle` fields to `Asset` + `VehicleAttributes`.
    *   Insert into `assets` with `domain = ASSET_DOMAIN_VEHICLE`.
3.  **API Update:**
    *   Update `GET /api/v1/vehicles` to query from the new `assets` table (filtering by domain).
    *   Implement `GET /api/v2/assets` to expose the generic structure.
