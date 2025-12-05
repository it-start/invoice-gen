
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review
**Phases 1-5 & Enterprise Features Complete.**
The application has evolved into a production-ready tool with robust security, localization, and hybrid rendering capabilities.

**Core Strengths:**
*   **Dual Engine:** Seamlessly handles structured Invoices and complex Lease Agreements.
*   **Hybrid Rendering:** Supports Client-Side PDF generation (`@react-pdf`) and Server-Side HTML previews.
*   **Secure:** Integrated Token-based Authentication, Login Modal, and Iframe PostMessage handshake.
*   **Global:** Fully localized (EN/RU) UI and document output.
*   **Mobile-First:** "Wizard Mode" makes complex data entry easy on phones.

---

## 🚧 Current Focus: Phase 1.5 - Architecture Cleanup

We have successfully unified the data loading logic. The next immediate step is decomposing the large Editor component.

### 1. 🧩 Decompose EditorPage (Next Up)
*   **Problem:** `EditorPage.tsx` is too large (AI logic, Modal UI, PDF handlers are inline).
*   **Solution:**
    *   Extract `AiModal` to `components/modals/AiModal.tsx`.
    *   Extract AI state logic to `hooks/useAiAssistant.ts`.

### 2. 🧪 Test Coverage
*   **Goal:** Add unit tests for the complex pricing logic in `ownimaApi.ts` and the mapping functions.

---

## 📜 Completed Phases (History)

### ✅ Phase 1: Refactoring
*   Component Decomposition, Custom Hooks (`useInvoice`, `useLease`), Reusable UI.

### ✅ Phase 2: Consolidation & Polish
*   PDF Architecture (Shared Styles), AI Schema Expansion.

### ✅ Phase 3: Mobile Wizard Mode
*   Mobile Detection, Wizard UI Container, Form Refactoring.

### ✅ Phase 4: Styling & Branding
*   Design System (`pdfStyles.ts`), Logo/Favicon integration, "Ownima" branding.

### ✅ Phase 5: External API & Architecture
*   `ownimaApi` Service, Environment Config, `loadLeaseData` centralized loader.
*   **Refactor:** Unified fetching, QR generation, and default merging into a single robust service function.

### ✅ Phase 5.5: Enterprise Features
*   **Auth:** Login Modal, Bearer Token management, 401 handling.
*   **Integration:** Iframe `postMessage` support for embedding in dashboards.
*   **Hybrid Preview:** Support for `?output=blob` (Raw PDF) and `?template_id` (Server-Side HTML).
*   **i18n:** Full English/Russian translation of UI and Forms.

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
