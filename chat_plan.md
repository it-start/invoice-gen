
# 🧠 Chat Architecture & Roadmap

> **Status:** Phase 4 (Media & Intelligence)
> **Context:** `InvoiceGen Pro` is now a PWA-ready collaborative workspace with robust offline capabilities and a polished mobile UI.

---

## 1. ✅ Implemented Architecture (The "Hybrid Timeline")

We have successfully implemented the **"Trinity of Data"** architecture, merging three distinct sources into a single, coherent timeline:

1.  **Static State:** `LeaseData` (Vehicle, Pricing) is the "Context".
2.  **System History:** Immutable events (e.g., "Confirmed by Owner") fetched via REST are the "Truth".
3.  **Ephemeral Talk:** Human communication streamed via Ntfy/SSE is the "Color".

---

## 2. ✅ Completed Milestones

### 📱 Mobile Experience
*   **Compact UI:** Humanized dates ("Just now", "Yesterday") and optimized headers for small screens.
*   **Wizard Mode:** Complex Lease Forms transform into a step-by-step wizard on mobile.
*   **Smart Navigation:** URL-based routing ensures the "Back" button works intuitively between List and Room views.
*   **Native Feel:** Disabled pinch-zoom, added dynamic PDF scaling, and specific iOS input tweaks.

### ✍️ Digital Signatures
*   **Capture:** `SignaturePad` component allows touch/mouse drawing.
*   **Storage:** Signatures are stored as Base64 strings within `LeaseData`.
*   **Output:** PDF (`@react-pdf`) and HTML previews render signatures in the correct footer blocks.

### 💬 Interactive Chat
*   **Action Bubbles:** Status changes (Confirm/Reject) are rendered as interactive system messages.
*   **Read Receipts:** Visibility-based logic (IntersectionObserver) marks messages as read when they appear on screen.
*   **Mini-Editor:** The Right Sidebar allows editing the Lease details alongside the conversation.

### 💾 Robust Persistence & Offline (PWA)
*   **IndexedDB:** Migrated `chatStore` to `IndexedDB` for handling large datasets.
*   **Service Worker:** Implemented `sw.js` for caching app shell (HTML/JS/CSS) and handling background push notifications.
*   **Manifest:** Added `manifest.json` for "Add to Home Screen" capability.

---

## 3. 🚧 Current Focus: Media Sharing 📸

**Goal:** Allow users to upload images (car condition, ID photos) directly in chat.

### Implementation Plan
1.  **UI Components:**
    *   Activate the `ImageIcon` button in `ChatInput`.
    *   Create a `FilePreview` component for selected images before sending.
    *   Implement an `ImageMessage` bubble renderer in the chat stream.
2.  **Logic:**
    *   Handle file selection (`input type="file"`).
    *   Convert images to Base64 (for MVP) or upload to an endpoint (for Production).
    *   Send as `type: 'image'` message payload.

---

## 4. 🔮 Next Steps: Intelligence

### A. AI Participant 🤖
*   **Goal:** Move AI from a "Modal" to a "Chat Participant".
*   **Scenario:** User types: *"@AI, summarize the deposit terms"* or *"@AI, draft an invoice for scratch repair"*.
*   **Implementation:**
    *   Detect `@AI` trigger in `sendMessage`.
    *   Route prompt to `geminiService`.
    *   Inject AI response as a message into the stream.

---

## 5.  backlog

### Performance Tuning
*   **Virtualization:** If chat history grows > 1000 messages, implement `react-window` for the message list.
*   **Image Optimization:** Resize images on the client before sending to save bandwidth.
