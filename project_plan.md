
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review
**Phases 1-5 Complete.**
The application is a fully functional, AI-powered, API-connected document generator.

**Core Strengths:**
*   **Dual Engine:** Seamlessly handles structured Invoices and complex Lease Agreements.
*   **Connected:** Fetches real-time reservation data from Ownima.
*   **Mobile-First:** "Wizard Mode" makes complex data entry easy on phones.
*   **Visuals:** High-fidelity PDF generation with auto-highlighting of critical data (Early/Late times).

---

## 🚧 Current Focus: Phase 1.5 - Architecture Refactor

Before moving to Digital Signatures, we must clean up technical debt to prevent bugs.

### 1. ♻️ Unify Data Loading (DRY)
*   **Problem:** `PreviewPage.tsx` and `useLease.ts` duplicate the logic for Fetching API -> Generating QR -> Merging Defaults.
*   **Solution:** Extract this pipeline into `services/leaseLoader.ts`. Both the Editor (Import button) and Preview Page (On Load) will use this single function.

### 2. 🧩 Decompose EditorPage
*   **Problem:** `EditorPage.tsx` is too large (AI logic, Modal UI, PDF handlers).
*   **Solution:**
    *   Extract `AiModal` to `components/modals/AiModal.tsx`.
    *   Extract AI state logic to `hooks/useAiAssistant.ts`.

### 3. 📂 Standardize Structure
*   **Problem:** Inconsistent folder nesting (`src/pages` vs `pages`).
*   **Solution:** Move all pages to root `pages/`.

---

## 📜 Completed Phases (History)

### ✅ Phase 1: Refactoring
*   Component Decomposition, Custom Hooks (`useInvoice`, `useLease`), Reusable UI.

### ✅ Phase 2: Consolidation & Polish
*   PDF Architecture (Shared Styles), Localization (i18n), AI Schema Expansion.

### ✅ Phase 3: Mobile Wizard Mode
*   Mobile Detection, Wizard UI Container, Form Refactoring.

### ✅ Phase 4: Styling Unification
*   Design System (`pdfStyles.ts`), Layout Primitives, Table/Grid standardization.

### ✅ Phase 5: External API Integration
*   `ownimaApi` Service, Environment Config, "Load from Cloud" UI, Data Mapping.

---

## 🔮 The Future: "Pro" Features Roadmap

### 📅 Phase 6: Digital Signatures (The "Paperless" Step)
**Goal:** Allow users (Renters/Owners) to sign directly on the device screen.
*   **Signature Pad:** Integrate `react-signature-canvas` into the `WizardContainer` (Step 5).
*   **State Management:** Store signatures as Base64 data URIs in `LeaseData`.
*   **PDF Integration:** Render the captured signature image into the PDF signature block, replacing the text placeholder.
*   **Value:** True "Walk-in" experience—generate, sign, and email PDF without a printer.

### 📅 Phase 7: Local Document History (The "Dashboard" Step)
**Goal:** Persist generated documents so users don't lose work when starting new ones.
*   **Storage Engine:** Implement `idb` (IndexedDB wrapper) to bypass `localStorage` size limits.
*   **Dashboard UI:** Create a "History" sidebar tab listing past Invoices/Leases.
*   **Actions:** Add "Clone", "Delete", and "Reprint" capabilities.
*   **Search:** Filter history by Name, Date, or ID.

### ⚡ Phase 8: PWA & Offline Capability (The "Field" Step)
**Goal:** Make the app installable and functional without internet (except API fetching).
*   **Manifest:** Add `manifest.json` for "Add to Home Screen".
*   **Service Worker:** Cache app shell (JS/CSS) for instant loading.
*   **Offline Mode:** Graceful handling of API errors when offline (allow manual entry fallback).

---

## 💡 Backlog & Experiments

### 1. 🧠 AI "God Mode"
*   **Idea:** A single text area entry point. The AI analyzes the text and auto-routes to `InvoiceForm` or `LeaseForm` with pre-filled data.

### 2. 📤 One-Click Share
*   **Idea:** Instead of just downloading, use the Web Share API to send the PDF directly to WhatsApp/Telegram/Email on mobile devices.

### 3. 🎨 Theme Engine
*   **Idea:** Allow users to upload a logo and select a primary color (Brand Identity) that propagates to the PDF styles.

---

## 📜 Coding Commandments
1.  **Bible:** `types.ts` is the law.
2.  **KISS:** Keep components small.
3.  **DRY:** Reuse styles and utilities.
4.  **UX:** Mobile users are first-class citizens.
