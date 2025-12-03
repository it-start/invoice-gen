# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review (Updated)
**Phase 1 (Refactoring) is Complete.**
The monolithic `App.tsx` has been successfully decomposed. The application now follows a modular architecture with clear separation of concerns:
*   **State & Logic:** Encapsulated in `hooks/useInvoice.ts` and `hooks/useLease.ts`.
*   **UI/Forms:** Separated into `components/forms/`.
*   **Core:** `App.tsx` now acts as a layout composer, drastically reducing complexity.

**Remaining Technical Debt:**
*   **PDF Styles:** `PdfDocument.tsx` and `LeasePdf.tsx` still define their own styles and font registration. This violates DRY.
*   **Localization:** The UI is a mix of Russian (Invoice side) and English (Lease side).
*   **AI:** Gemini integration is currently limited to Invoices only.

---

## ✅ Phase 1: Refactoring (Completed)
- [x] **Component Decomposition**: Split `App.tsx` into `InvoiceForm`, `LeaseForm`, and `Sidebar` logic.
- [x] **Custom Hooks**: Created `useInvoice` and `useLease` to handle state, persistence, and logic.
- [x] **Reusable UI**: Created `InputGroup` for standardized inputs.
- [x] **QR Code**: Integrated dynamic QR generation for Leases.

---

## 🛠 Phase 2: Consolidation & Polish (Current Focus)
*Objective: Clean up the remaining duplication and standardize the UX.*

### 1. PDF Architecture (High Priority)
*   **Task:** Create `styles/pdfStyles.ts`.
*   **Goal:** Share font registration (Roboto), common colors, and table utility styles between `InvoicePdf` and `LeasePdf`.

### 2. Localization (i18n Lite)
*   **Task:** Create a simple dictionary object.
*   **Goal:** Allow the UI labels ("Date", "Amount", "Seller") to switch between RU/EN based on a setting, rather than hardcoding them in the components.

### 3. AI Expansion
*   **Task:** Update `geminiService.ts`.
*   **Goal:** Add a `schemaType` parameter to support parsing Lease Agreements from unstructured text (emails/chats).

---

## 💡 Phase 3: "Brilliant Ideas" (Feature Expansion)

### 1. 🧠 AI "God Mode"
*   **Idea:** A single "Magic Paste" button that detects if the text is an Invoice or a Lease and routes it to the correct parser automatically.

### 2. 📱 Mobile "Wizard Mode"
*   **Idea:** The sidebar is dense. On mobile, convert the form into a step-by-step wizard (Step 1: Who, Step 2: What, Step 3: How much).

### 3. ☁️ Cloud Sync (Optional)
*   **Idea:** Allow saving templates to `localStorage` slots (e.g., "Save as Template A").

---

## 📜 Coding Commandments (Reaffirmed)

1.  **Bible (Single Source of Truth):** `types.ts` is the law.
2.  **KISS:** Keep components small. If a component exceeds 150 lines, ask why.
3.  **DRY:** If you copy-paste styles, create a utility class or a shared style object.

---

## 🗓 Next Immediate Steps
1.  **Refactor PDF Styles:** Extract common styles to `styles/pdfStyles.ts`.
2.  **AI for Leases:** Add a schema for Lease data in `geminiService.ts`.
