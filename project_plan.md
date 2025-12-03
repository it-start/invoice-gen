
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review
**All Phases (1-5) are now Complete.**
The application has evolved into a fully connected, AI-powered document generator for both Russian Invoices and Vehicle Lease Agreements.

**Key Achievements:**
*   **Modular Architecture:** Clean separation of concerns with Hooks, Services, and UI Components.
*   **Mobile Wizard:** Optimized UX for small screens.
*   **AI Integration:** Gemini parsing for unstructured text input.
*   **External API:** Direct integration with Ownima API for fetching reservation data.
*   **Unified Styling:** Robust PDF engine with shared design primitives.

---

## ✅ Phase 1: Refactoring (Completed)
- [x] **Component Decomposition**: Split `App.tsx` into specialized components.
- [x] **Custom Hooks**: Encapsulated state logic (`useInvoice`, `useLease`).
- [x] **Reusable UI**: Created `InputGroup`.

---

## ✅ Phase 2: Consolidation & Polish (Completed)
- [x] **PDF Architecture**: Centralized styles and fonts.
- [x] **Localization**: Added `i18n.ts`.
- [x] **AI Expansion**: Added Lease parsing schema.

---

## ✅ Phase 3: Mobile Wizard Mode (Completed)
- [x] **Mobile Detection**: Created `useIsMobile` hook.
- [x] **Wizard UI**: Implemented `WizardContainer`.
- [x] **Form Integration**: Refactored forms to use Wizard.

---

## ✅ Phase 4: Styling Unification (Completed)
- [x] **Design System**: Expanded `pdfStyles.ts` with grid, typography, and component primitives.
- [x] **Refactoring**: Migrated `InvoicePdf` and `LeasePdf` to use shared styles.

---

## ✅ Phase 5: External API Integration (Completed)
- [x] **API Service**: Created `services/ownimaApi.ts` to fetch and map data.
- [x] **Configuration**: Externalized `API_BASE_URL` to environment variables.
- [x] **Visual Logic**: Implemented "Early/Late" time highlighting in UI and PDF.
- [x] **Hook & UI**: Integrated loading states and "Cloud Download" button.

---

## 💡 Future Ideas (Backlog)
### 1. 🧠 AI "God Mode"
*   **Idea:** A single "Magic Paste" button that detects if the text is an Invoice or a Lease and routes it to the correct parser automatically.

### 2. ☁️ Cloud Sync & Templates
*   **Idea:** Allow saving templates to `localStorage` slots (e.g., "Save as Template A") or a remote DB.

### 3. 🛡️ Data Validation
*   **Idea:** Add Zod schemas to validate forms before PDF generation (e.g., checking for valid dates or required fields).

---

## 📜 Coding Commandments
1.  **Bible:** `types.ts` is the law.
2.  **KISS:** Keep components small.
3.  **DRY:** Reuse styles and utilities.
