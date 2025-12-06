
# 🧠 Chat Architecture & Roadmap

> **Status:** Phase 3.5 (Robustness & Sync)
> **Context:** `InvoiceGen Pro` has evolved into a collaborative workspace merging real-time chat, document editing, and state management.

---

## 1. ✅ Implemented Architecture (The "Hybrid Timeline")

We have successfully implemented the **"Trinity of Data"** architecture, merging three distinct sources into a single, coherent timeline:

1.  **Static State:** `LeaseData` (Vehicle, Pricing) is the "Context".
2.  **System History:** Immutable events (e.g., "Confirmed by Owner") fetched via REST are the "Truth".
3.  **Ephemeral Talk:** Human communication streamed via Ntfy/SSE is the "Color".

### Key Technical Achievements
*   **Strict Identity:** Users are identified via `authService`, enabling strict "Me" vs "Other" message alignment.
*   **IndexedDB Persistence:** Chat sessions use `IndexedDB` via `dbService` to store large chat histories locally, enabling robust offline capabilities and faster loads.
*   **Reactive Store:** `chatStore` (Zustand) manages optimistic UI updates for instant feedback (e.g., sending messages, changing status).
*   **Mobile-First Routing:** Navigation logic handles deep linking (`/chat/detail/:id`) and back-button behavior seamlessly on small screens.

---

## 2. ✅ Completed Milestones

### 📱 Mobile Experience
*   **Compact UI:** Humanized dates ("Just now", "Yesterday") and optimized headers for small screens.
*   **Wizard Mode:** Complex Lease Forms transform into a step-by-step wizard on mobile.
*   **Smart Navigation:** URL-based routing ensures the "Back" button works intuitively between List and Room views.

### ✍️ Digital Signatures (Phase 6 Complete)
*   **Capture:** `SignaturePad` component allows touch/mouse drawing.
*   **Storage:** Signatures are stored as Base64 strings within `LeaseData`.
*   **Output:** PDF (`@react-pdf`) and HTML previews render signatures in the correct footer blocks.

### 💬 Interactive Chat
*   **Action Bubbles:** Status changes (Confirm/Reject) are rendered as interactive system messages within the chat stream.
*   **Read Receipts:** Logic to track and reset unread counts based on active session focus.
*   **Mini-Editor:** The Right Sidebar allows editing the Lease details alongside the conversation.

### 💾 Robust Persistence (Phase 7 Part 1)
*   **IndexedDB:** Migrated `chatStore` from `localStorage` to `IndexedDB` to handle larger datasets and prevent storage limits.
*   **Hydration:** Implemented async hydration logic to ensure smooth startup.

---

## 3. 🚧 Current Focus: Intelligence & Media

### A. Media Sharing 📸
*   **Goal:** Allow users to upload images (car condition, ID photos) directly in chat.
*   **Implementation:** 
    *   Hook up the `ImageIcon` button in `ChatLayout`.
    *   Integrate with Ntfy attachment API or a separate object storage.
    *   Render `image` type messages in the stream.

### B. AI Participant 🤖
*   **Goal:** Move AI from a "Modal" to a "Chat Participant".
*   **Scenario:** User types: *"@AI, summarize the deposit terms"* or *"@AI, draft an invoice for scratch repair"*.
*   **Implementation:**
    *   Detect `@AI` trigger in `sendMessage`.
    *   Route prompt to `geminiService`.
    *   Inject AI response as a message into the stream.

---

## 4. 🔮 Future: Offline & Sync

### A. Background Sync
*   **Problem:** Messages only arrive when the tab is open.
*   **Solution:** Implement a Service Worker to handle Push Notifications and background synchronization when the app is closed.
