
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review (Updated)
**Phase 1, 2, 3, and 4 are Complete.**
The application now features a robust, unified styling system for PDFs, ensuring consistency across different document types.

**Achievements:**
*   **Modular Architecture:** Hooks (`useInvoice`, `useLease`), Forms (`InvoiceForm`, `LeaseForm`), and UI (`WizardContainer`) are well separated.
*   **Mobile-First UX:** The new `WizardContainer` automatically transforms long forms into a step-by-step wizard on small screens.
*   **AI Integration:** Gemini parsing works for both document types.
*   **Unified Design System:** `pdfStyles.ts` provides a single source of truth for PDF typography and layout primitives.

---

## ✅ Phase 1: Refactoring (Completed)
- [x] **Component Decomposition**: Split `App.tsx` into specialized components.
- [x] **Custom Hooks**: Encapsulated state logic.
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

## 🚧 Phase 5: External API Integration (In Progress)
- [ ] **API Service**: Create `services/ownimaApi.ts` to fetch and map data.
- [ ] **Hook Update**: Add loading state and fetch logic to `useLease`.
- [ ] **UI Update**: Add "Load" button to Lease Form.

---

## 💡 Future Ideas (Backlog)
### 1. 🧠 AI "God Mode"
*   **Idea:** A single "Magic Paste" button that detects if the text is an Invoice or a Lease and routes it to the correct parser automatically.

### 2. ☁️ Cloud Sync
*   **Idea:** Allow saving templates to `localStorage` slots (e.g., "Save as Template A").

---

## 📜 Coding Commandments
1.  **Bible:** `types.ts` is the law.
2.  **KISS:** Keep components small.
3.  **DRY:** Reuse styles and utilities.
