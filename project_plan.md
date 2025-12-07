
# 🚀 Ownima Pro: Architecture & Roadmap

## 🧐 Current Status Review
**Phases 1-6 & Chat Foundation Complete.**
The application has evolved into a robust **PWA (Progressive Web App)** with offline capabilities, real-time chat, and a "Mobile-First" design.

**Core Strengths:**
*   **Dual Engine:** Seamlessly handles structured Invoices and complex Lease Agreements.
*   **Hybrid Rendering:** Client-Side PDF generation (`@react-pdf`) + Server-Side HTML previews.
*   **Secure:** Integrated Token-based Authentication & Iframe Handshake.
*   **Offline-Ready:** Service Worker caching & IndexedDB persistence.
*   **Collaborative:** Real-time Chat with media sharing and system status updates.

---

## 🚧 Current Focus: Phase 7 - Intelligence & Polish

We are now enhancing the "Smart" aspects of the workspace.

### 1. 🤖 AI Chat Participant
*   **Goal:** Allow users to invoke AI within the chat stream.
*   **Interaction:** User types `@AI draft reply...` -> System generates text.
*   **Context:** AI has access to `LeaseData` to answer questions like "When is the return date?".

### 2. 💅 Final Polish
*   **Transitions:** Smooth layout shifts between List/Room views on mobile.
*   **Gestures:** Swipe-to-archive (Implemented).
*   **Virtualization:** Optimize chat list for 1000+ sessions.

---

## 📜 Completed Phases (History)

### ✅ Phase 1-5: Foundation
*   Refactoring, PDF Engine, Mobile Wizard, API Integration, Auth.

### ✅ Phase 6: Digital Signatures (The "Paperless" Step)
*   **Capture:** `SignaturePad` component integrated.
*   **Storage:** Base64 signatures stored in `LeaseData`.
*   **Output:** Signatures rendered in PDF and HTML previews.

### ✅ Phase 6.5: Chat & PWA (The "Field" Step)
*   **PWA:** `manifest.json` and `sw.js` for "Add to Home Screen" and offline shell.
*   **Persistence:** Migrated from `localStorage` to `IndexedDB` for robust data storage.
*   **Sync:** Background sync logic (swr) when app regains focus.
*   **Media:** Image sharing enabled in Chat.
*   **UI:** "Future UI" Header with visual timeline and smart status.

---

## 🔮 The Future: "Pro" Features Roadmap

### 📅 Phase 8: Dashboard & Analytics
*   **History:** List of past generated PDFs (local history).
*   **Stats:** "Total Revenue this month", "Active Cars".

### 🧪 Technical Debt
*   **Tests:** Unit tests for pricing logic.
*   **Optimization:** Image compression before upload.

---

## 💡 Backlog & Experiments

### 1. 🧠 AI "God Mode"
*   **Idea:** A single text area entry point. The AI analyzes the text and auto-routes to `InvoiceForm` or `LeaseForm` with pre-filled data.

### 2. 📤 One-Click Share
*   **Idea:** Use Web Share API to send PDF directly to WhatsApp/Telegram.

---

## 📜 Coding Commandments
1.  **Bible:** `types.ts` is the law.
2.  **KISS:** Keep components small.
3.  **DRY:** Reuse styles and utilities.
4.  **UX:** Mobile users are first-class citizens.
