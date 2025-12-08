package "asset-teleport" {
  version: "1.0.0"
  doc: "Multi-domain asset management platform to abstract vehicles to generic assets (property, equipment, co-working)."
}

# --- Core Data Types ---
type Asset {
  id: String
  organization_id: String
  name: String
  domain_type: Enum["vehicle", "property", "equipment", "coworking"]
  attributes: Map<String, String> # Flexible attributes for domain-specific data
  images: List<String>
  status: Enum["available", "booked", "maintenance"]
}

type Booking {
  id: String
  asset_id: String
  user_id: String
  start_datetime: DateTime
  end_datetime: DateTime
  status: Enum["pending", "confirmed", "cancelled", "completed"]
  pricing: Map<String, Any> # e.g., { total_amount: 1200.00, currency_code: "USD" }
  contract_terms_hash: String # Reference to generated contract
}

# --- AI Specific Types ---
type UnstructuredAssetData {
  text_content: String
  source_metadata: Map<String, String>
}

type StructuredAssetData {
  name: String
  domain_type: String
  extracted_attributes: Map<String, String>
  confidence_score: Float
}

type UserIntent {
  intent_type: String
  entities: Map<String, String>
  domain_context: String
}

type ContractClauses {
  standard_clauses: List<String>
  jurisdiction_specific_clauses: List<String>
  compliance_risks: List<String>
}

# --- Modules ---

module "data.asset_repo" {
  contract: {
    input: { action: Enum["create", "read", "update", "delete"], asset?: Asset, id?: String },
    output: Asset
  }
  instructions: { system_template: "Handles CRUD operations for the Asset entity." }
}

module "data.booking_repo" {
  contract: {
    input: { action: Enum["create", "read", "update", "delete"], booking?: Booking, id?: String },
    output: Booking
  }
  instructions: { system_template: "Handles CRUD operations for the Booking entity." }
}

module "ai.asset_onboarder" {
  contract: { input: UnstructuredAssetData, output: StructuredAssetData }
  runtime: { model: "gemini-1.5-pro" }
  instructions: {
    system_template: "Parses unstructured text descriptions into structured Asset data, identifying domain_type and attributes."
  }
}

module "ai.intent_classifier" {
  contract: { input: { chat_message: String, current_domain: String }, output: UserIntent }
  runtime: { model: "gemini-1.5-pro" }
  instructions: {
    system_template: "Analyzes chat messages to recognize domain-specific user intents (e.g., 'schedule viewing' for property)."
  }
}

module "ai.recommendation_engine" {
  contract: { input: { user_id: String, current_asset_id: String, context: Map<String, String> }, output: List<Asset> }
  runtime: { model: "gemini-1.5-pro" }
  instructions: {
    system_template: "Suggests related assets to users based on current activity and cross-domain embeddings."
  }
}

module "ai.contract_generator" {
  contract: { input: { asset: Asset, booking: Booking, jurisdiction: String }, output: ContractClauses }
  runtime: { model: "gemini-1.5-pro" }
  instructions: {
    system_template: "Generates lease agreement clauses tailored to asset domain and jurisdiction, flagging compliance risks."
  }
}

module "api.v2_asset_service" {
  contract: {
    input: { path: String, method: Enum["GET", "POST", "PUT", "DELETE"], body: Map<String, Any>, headers: Map<String, String> },
    output: Map<String, Any>
  }
  instructions: { system_template: "Exposes generic /api/v2/assets and /api/v2/bookings endpoints." }
}

module "events.dispatcher" {
  contract: { input: { event_type: String, payload: Map<String, Any> }, output: Boolean }
  instructions: { system_template: "Dispatches generic asset-related events (e.g., AssetCheckedOut, BookingCreated)." }
}

module "migration.legacy_converter" {
  contract: { input: Map<String, Any>, output: { asset_data: Asset, booking_data: Booking } }
  instructions: { system_template: "Converts legacy 'LeaseData' into new 'Asset' and 'Booking' entities." }
}

# --- Pipelines ---

pipeline "ingest_unstructured_asset" {
  doc: "Workflow to onboard an asset by parsing unstructured text via AI and storing it."

  input: {
    asset_text: String,
    source_metadata: Map<String, String>,
    organization_id: String
  }

  # 1. Prepare data for AI parsing
  let unstructured_data = UnstructuredAssetData(
    text_content: input.asset_text,
    source_metadata: input.source_metadata
  )

  # 2. Use AI to parse into structured format
  let structured_data = run ai.asset_onboarder(unstructured_data)

  # 3. Create a new Asset entity
  let new_asset = Asset(
    id: UUID.generate(), # Simulated ID generation
    organization_id: input.organization_id,
    name: structured_data.name,
    domain_type: structured_data.domain_type,
    attributes: structured_data.extracted_attributes,
    images: [], # Placeholder, might be inferred later or added manually
    status: "available"
  )

  # 4. Store the new asset
  let created_asset = run data.asset_repo(action: "create", asset: new_asset)

  # 5. Dispatch asset creation event
  run events.dispatcher(event_type: "AssetCreated", payload: { asset_id: created_asset.id, domain_type: created_asset.domain_type })

  return created_asset
}

pipeline "create_new_booking" {
  doc: "Orchestrates the creation of a new booking, including contract generation and event dispatch."

  input: {
    asset_id: String,
    user_id: String,
    start_datetime: DateTime,
    end_datetime: DateTime,
    pricing_details: Map<String, Any>,
    jurisdiction: String
  }

  # 1. Retrieve Asset details
  let asset_details = run data.asset_repo(action: "read", id: input.asset_id)

  # 2. Generate contract clauses
  let contract_clauses = run ai.contract_generator(asset: asset_details, booking: {
    id: UUID.generate(), # Temp booking for contract gen
    asset_id: input.asset_id,
    user_id: input.user_id,
    start_datetime: input.start_datetime,
    end_datetime: input.end_datetime,
    pricing: input.pricing_details,
    status: "pending",
    contract_terms_hash: ""
  } as Booking, jurisdiction: input.jurisdiction)

  # 3. Create new Booking entity
  let new_booking = Booking(
    id: UUID.generate(),
    asset_id: input.asset_id,
    user_id: input.user_id,
    start_datetime: input.start_datetime,
    end_datetime: input.end_datetime,
    pricing: input.pricing_details,
    status: "pending",
    contract_terms_hash: SHA256.hash(contract_clauses.standard_clauses.join("\n")) # Simplified hash for example
  )

  # 4. Store the new booking
  let created_booking = run data.booking_repo(action: "create", booking: new_booking)

  # 5. Dispatch booking created event
  run events.dispatcher(event_type: "BookingCreated", payload: { booking_id: created_booking.id, asset_id: created_booking.asset_id })

  return created_booking
}

pipeline "handle_api_v2_request" {
  doc: "Processes incoming API v2 requests using the generic asset service."
  input: { path: String, method: String, body: Map<String, Any>, headers: Map<String, String> }
  let response = run api.v2_asset_service(
    path: input.path,
    method: input.method as Enum["GET", "POST", "PUT", "DELETE"],
    body: input.body,
    headers: input.headers
  )
  return response
}