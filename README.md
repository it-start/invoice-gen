# Ownima Pro 📄

**Ownima Pro** is a professional rental management workspace built with React and TypeScript. It seamlessly integrates Lease Agreement generation, Invoice creation, and real-time Chat for Owners and Renters.

Built for **Ownima**, it provides a unified platform to manage vehicle reservations, sign contracts digitally, and communicate via a unified timeline.

## 🚀 Key Features

*   **Rent & Lease Manager**:
    *   **Lease Agreements**: Dynamic vehicle rental contracts with automatic "Early/Late" pickup highlighting and fee calculation.
    *   **Russian Invoices**: Standardized A4 layout with automatic VAT calculation and bank details formatting.
    *   **Digital Signatures**: Sign directly on the device using the integrated signature pad.
*   **Real-time Collaboration**:
    *   **Chat System**: Integrated messaging with Owners/Renters.
    *   **System Events**: Automatic updates for reservation status changes (Confirmed, Collected, Overdue).
*   **Offline-Ready (PWA)**:
    *   **Service Worker**: Caches app shell for instant loading and offline access.
    *   **IndexedDB**: Persists chat history and session data locally.
*   **AI Smart Import**: Paste unstructured text (emails, messages) and let **Google Gemini 2.5** parse it into structured forms.
*   **Mobile-First Wizard**: Complex forms transform into a step-by-step wizard on mobile devices.

## 🛠️ Tech Stack

*   **Framework**: React 18 + Vite
*   **Language**: TypeScript (Strict Mode)
*   **State Management**: Zustand
*   **Persistence**: IndexedDB (idb)
*   **Styling**: Tailwind CSS
*   **PDF Engine**: `@react-pdf/renderer`
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Routing**: React Router DOM

## 🏁 Getting Started

### Prerequisites

*   Node.js (v18+) or Bun
*   A Google Gemini API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/ownima/ownima-pro.git

# Install dependencies
npm install
# or
bun install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required for AI features
API_KEY=your_google_gemini_api_key

# Optional: Override backend URL (Default: https://stage.ownima.com/api/v1/reservation)
OWNIMA_API_URL=https://api.your-backend.com/v1/reservation
```

### Development

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build
```

## 🧩 Project Structure

*   `src/components/chat`: Chat layout and components.
*   `src/components/forms`: Form logic and UI inputs.
*   `src/components/modals`: Dialogs (Login, AI Import).
*   `src/components/ui`: Reusable UI atoms (Wizard, InputGroup, SignaturePad).
*   `src/stores`: Global state (chatStore).
*   `src/services`: API clients (`ownimaApi`, `geminiService`, `dbService`).
*   `src/hooks`: React hooks (`useInvoice`, `useLease`).
*   `src/types.ts`: Centralized TypeScript interfaces.

## 🔒 Authentication

The application handles two types of flows:
1.  **Public/Editor Mode**: Open access for generating documents manually.
2.  **Protected Preview**: When viewing specific reservations via `/preview/lease/:id`, the app may require authentication via the `LoginModal` if the API returns a 401.

## 📄 License

Proprietary / Internal Tool for Ownima.