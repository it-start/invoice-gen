
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review (Updated)
**Phase 1, 2, and 3 are Complete.**
The application is now a fully functional, mobile-responsive PWA-ready Invoice & Lease generator.

**Achievements:**
*   **Modular Architecture:** Hooks (`useInvoice`, `useLease`), Forms (`InvoiceForm`, `LeaseForm`), and UI (`WizardContainer`) are well separated.
*   **Mobile-First UX:** The new `WizardContainer` automatically transforms long forms into a step-by-step wizard on small screens.
*   **AI Integration:** Gemini parsing works for both document types.
*   **PDF Engine:** Robust rendering with React-PDF.

---

## ✅ Phase 1: Refactoring (Completed)
- [x] **Component Decomposition**: Split `App.tsx` into specialized components.
- [x] **Custom Hooks**: Encapsulated state logic.
- [x] **Reusable UI**: Created `InputGroup`.

---

## ✅ Phase 2: Consolidation & Polish (Completed)
- [x] **PDF Architecture**: Centralized styles (though `pdfStyles.ts` needs full adoption in next cycle).
- [x] **Localization**: Added `i18n.ts` for EN/RU switching.
- [x] **AI Expansion**: Added Lease parsing schema.

---

## ✅ Phase 3: Mobile Wizard Mode (Completed)
- [x] **Mobile Detection**: Created `useIsMobile` hook.
- [x] **Wizard UI**: Implemented `WizardContainer` with step navigation.
- [x] **Form Integration**: Refactored `InvoiceForm` and `LeaseForm` to use the Wizard steps.

---

## 🛠 Phase 4: Styling Unification (Next Step)
*Objective: Ensure consistent code style for PDFs.*
*   **Task:** Fully migrate `InvoicePdf` and `LeasePdf` to use `styles/pdfStyles.ts` exclusively. currently they still have some local styles.

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
