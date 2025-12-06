
# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review
**Phases 1-5 & Refactoring Complete.**
The application is now highly modular. The `EditorPage` has been successfully decomposed into dedicated hooks (`useAiAssistant`) and components (`AiModal`), significantly improving maintainability.

**Core Strengths:**
*   **Dual Engine:** Seamlessly handles structured Invoices and complex Lease Agreements.
*   **Hybrid Rendering:** Supports Client-Side PDF generation (`@react-pdf`) and Server-Side HTML previews.
*   **Secure:** Integrated Token-based Authentication, Login Modal, and Iframe PostMessage handshake.
*   **Global:** Fully localized (EN/RU) UI and document output.
*   **Mobile-First:** "Wizard Mode" makes complex data entry easy on phones.
*   **Clean Architecture:** Centralized API services, strict Types, and modular UI components.

---

## 🚧 Current Focus: Phase 6 - Digital Signatures (The "Paperless" Step)

We are moving towards a fully digital workflow. The goal is to allow users (Renters/Owners) to sign directly on the device screen, removing the need to print the PDF.

### 1. ✍️ Signature Capture UI
*   **Library:** Integrate `react-signature-canvas`.
*   **Integration:** Add a new step to the `WizardContainer` (Step 5) specifically for signing.
*   **UI:** Create a signing pad with "Clear" and "Save" controls.

### 2. 💾 State Management
*   **Storage:** Store captured signatures as Base64 data URIs within the `LeaseData` structure.
*   **Updates:** Update `types.ts` to support `ownerSignature` and `renterSignature` fields.

### 3. 📄 PDF Integration
*   **Rendering:** Update `LeasePdf.tsx` and `InvoicePdf.tsx` to render the captured signature images in the signature blocks if available.
*   **Fallback:** Maintain the existing text/line placeholder if no digital signature is provided.

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

### ✅ Phase 1.5: Architecture Cleanup
*   **Decomposition:** `EditorPage.tsx` refactored. AI logic moved to `useAiAssistant.ts` and UI to `AiModal.tsx`.

---

## 🔮 The Future: "Pro" Features Roadmap

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

### 🧪 Technical Debt: Test Coverage
*   **Goal:** Add unit tests for the complex pricing logic in `ownimaApi.ts` and the mapping functions.

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
