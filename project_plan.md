# 🚀 InvoiceGen Pro: Architecture & Roadmap

## 🧐 Current Status Review
The project has successfully graduated from a simple Invoice Generator to a Multi-Document Platform (Invoice + Lease).

**Strengths:**
*   **Tech Stack:** Modern (React 18, Vite, TypeScript, Tailwind).
*   **Core Features:** PDF Generation (`@react-pdf/renderer`) is robust. AI parsing (`@google/genai`) is implemented.
*   **Data Integrity:** `types.ts` acts as the "Bible" (Single Source of Truth).

**Weaknesses (Technical Debt):**
*   **Monolithic `App.tsx`:** The main file handles layout, state management for two different domains, form logic, and persistence. It violates the Single Responsibility Principle.
*   **Hardcoded Text:** Strings are scattered (Russian/English mix).
*   **Duplicated Styles:** PDF styles share similarities but are isolated.

---

## 🛠 Phase 1: Refactoring (The "Clean House" Protocol)
*Objective: Decouple logic and enforce DRY/KISS.*

### 1. Component Decomposition (Split the Monolith)
`App.tsx` is over 500 lines. We need to split it:
- [ ] **`components/forms/InvoiceForm.tsx`**: Move `renderInvoiceForm` logic here.
- [ ] **`components/forms/LeaseForm.tsx`**: Move `renderLeaseForm` logic here.
- [ ] **`components/ui/InputGroup.tsx`**: Extract the reusable input component to its own file.
- [ ] **`components/Sidebar.tsx`**: Extract the sidebar navigation logic.

### 2. Custom Hooks (Logic Separation)
Move state and effects out of the UI layer.
- [ ] **`hooks/useInvoice.ts`**: Manage `invoiceData`, `localStorage`, `handleReset`, `aiImport`.
- [ ] **`hooks/useLease.ts`**: Manage `leaseData`, `localStorage`, `qrCode` generation.

### 3. PDF Architecture
- [ ] **Shared Styles**: Create `styles/pdfStyles.ts` to share fonts and common layout values between `PdfDocument` and `LeasePdf`.

---

## 💡 Phase 2: "Brilliant Ideas" (Feature Expansion)

### 1. 🧠 AI "God Mode" for Contracts
Currently, AI only parses Invoices.
*   **Idea:** Allow pasting *any* messy text (email, WhatsApp chat) into the Lease form.
*   **Implementation:** Update `geminiService.ts` to accept a `type` parameter ('invoice' | 'lease') and switch schemas dynamically.

### 2. 🌍 Localization (i18n)
*   **Idea:** One-click switch between Russian and English interface/PDFs.
*   **Implementation:** Simple JSON dictionary for labels.

### 3. 📱 Mobile "Field Mode"
*   **Idea:** The current sidebar is tight on mobile.
*   **Implementation:** Create a "Wizard Mode" for mobile users. Step 1: Vehicle, Step 2: Dates, Step 3: Sign. Focus on the data entry, show preview only at the end.

### 4. 💱 Dynamic Currency & Units
*   **Idea:** Don't hardcode "THB" or "rub.".
*   **Implementation:** Add a currency selector in the settings that propagates to all Previews and PDFs.

---

## 📜 Coding Commandments

1.  **Bible (Single Source of Truth):**
    *   If a field exists in the PDF, it **must** exist in `types.ts`.
    *   Never calculate totals inside the View layer; calculate them in the Hook/Logic layer.

2.  **KISS (Keep It Simple, Stupid):**
    *   Do not introduce Redux or Zustand yet. React Context + Hooks is sufficient for this scale.
    *   Do not build a backend unless authentication is strictly required.

3.  **DRY (Don't Repeat Yourself):**
    *   If you write `className="border border-gray-300 rounded..."` more than 3 times, make it a component or a Tailwind utility class.

4.  **Hive (Modularity):**
    *   Each document type (Invoice, Lease) should be a self-contained module (Type + Form + Preview + PDF) that plugs into the main App shell.

---

## 🗓 Next Immediate Steps
1.  Extract `InvoiceForm` and `LeaseForm` components.
2.  Move AI logic to `hooks/useGemini.ts`.
3.  Fix the mixed language strings in the UI.
