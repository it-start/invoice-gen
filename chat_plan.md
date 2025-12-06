# 🧠 Chat Architecture Strategy: Research, Collapse, Predict, Believe

> **Status:** Draft / Living Document
> **Context:** Evolution of `InvoiceGen Pro` from a static generator to a dynamic conversational platform.

---

## 1. 🔍 Research (The Current State)

We have successfully hybridized three distinct data sources into a single "Timeline" view.

*   **The Trinity of Data:**
    1.  **Static State:** The `LeaseData` (Vehicle, Pricing, Dates) fetched via REST.
    2.  **System History:** Immutable events (`historyToChatMessage`) fetched via REST. These are the "Truth" of the contract lifecycle (e.g., "Confirmed by Owner").
    3.  **Ephemeral Talk:** Human communication (`ntfyToChatMessage`) streamed via SSE. These are the "Context" around the truth.

*   **Observations:**
    *   **Ntfy is fast but loose:** It relies on topics. Currently, we use the `reservationId` (UUID) as the topic. This is secure enough for now but relies on "Security by Obscurity".
    *   **Date Grouping is critical:** Users lose context in long history streams. The new "Date Separator" component solves this.
    *   **Mobile Fragmentation:** On mobile, users switch between "Edit Form" and "Chat". They feel like two different apps.

---

## 2. 📉 Collapse (The Simplification)

We need to reduce cognitive load by merging concepts.

*   **Collapse Form & Profile:**
    *   *Current:* The Right Sidebar shows a read-only "Profile" and "Lease Context".
    *   *Collapse:* The Right Sidebar *should be* the `LeaseForm`. Why have a separate "Editor" mode? On Desktop, the Chat and the Form should live side-by-side. Editing the form sends a "System Message" to the chat (e.g., "Price updated to 5000").
*   **Collapse Status & Message:**
    *   *Current:* Messages have `metadata.status`.
    *   *Collapse:* We should treat **Actions as Messages**. A "Confirm" button isn't UI outside the chat; it's a message waiting to be sent. When clicked, it morphs into a System Message.
*   **Collapse "Me" vs "Other":**
    *   Currently, we infer "Me" based on the Ntfy title.
    *   *Collapse:* We need strict Auth ID matching. `authService` should provide a `currentUserId`, and message alignment should strictly follow `msg.senderId === currentUserId`.

---

## 3. 🔮 Predict (The Roadmap)

Where is this ecosystem going?

*   **Prediction 1: The "Actionable" Chat**
    *   Users will stop using the "Form" to change states.
    *   Instead, the AI or System will inject **Interactive Widgets** into the chat stream.
    *   *Example:* System posts: "Vehicle due for return in 1 hour." -> User sees buttons: [Extend 1 Day] [Confirm Return].
*   **Prediction 2: AI as a Mediator**
    *   The `useAiAssistant` hook will move from a "Modal" to a "Chat Participant".
    *   User types: "@AI, draft an invoice for damage repair."
    *   AI responds with a generated PDF attachment directly in the stream.
*   **Prediction 3: Offline Sync will be hard but necessary**
    *   Ntfy/SSE requires a connection.
    *   We will predict a move to **Local-First Architecture** (using `RxDB` or `TanStack Query` with persistence) so the chat works offline and syncs when back online.

---

## 4. 🧘 Believe (The Philosophy)

These are the core tenets driving the UX decisions:

1.  **The Timeline is the Source of Truth:**
    *   If it didn't happen in the chat stream, it didn't happen. The "Document" is just a snapshot of the timeline at a specific moment.
2.  **UI/UX/AIX Convergence:**
    *   **UI:** Clean, readable, timestamped.
    *   **UX:** Auto-scrolls, highlights urgent status.
    *   **AIX (AI Experience):** The system anticipates needs (e.g., prompting for a signature when status becomes `pending`).
3.  **Transparency Builds Trust:**
    *   By mixing "System Logs" (Server) with "User Chat" (Human), we create a verifiable audit trail that looks friendly. It prevents "I never said that" disputes in rental scenarios.

---

## 5. 🛠 Action Plan (Next Steps)

1.  **Refactor Right Sidebar:** Turn the static Profile view into a functional Mini-Editor.
2.  **Interactive Bubbles:** Create a `ChatMessage` variant that renders buttons (Accept/Reject) for lease status changes.
3.  **Persist Chat:** Implement `idb` (IndexedDB) caching for messages to prevent the "loading spinner" on every page refresh.
