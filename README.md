# InvoiceGen Pro 📄

**InvoiceGen Pro** is a professional, client-side document generator built with React and TypeScript. It specializes in creating compliant Russian business invoices ("Счет на оплату") and vehicle lease agreements with high-fidelity PDF output.

Built for **Ownima**, it seamlessly integrates with reservation APIs to fetch real-time data, while also offering AI-powered text import capabilities using Google Gemini.

## 🚀 Key Features

*   **Dual Document Engine**:
    *   **Russian Invoices**: Standardized A4 layout with automatic VAT calculation and bank details formatting.
    *   **Lease Agreements**: Dynamic vehicle rental contracts with automatic "Early/Late" pickup highlighting and fee calculation.
*   **Real-time PDF Generation**: Instant client-side rendering using `@react-pdf/renderer`. No backend required for generation.
*   **AI Smart Import**: Paste unstructured text (emails, messages) and let **Google Gemini 2.5** parse it into structured forms.
*   **Mobile-First Wizard**: Complex forms transform into a step-by-step wizard on mobile devices for easy field entry.
*   **API Integration**: Direct connection to Ownima Reservation API to pull booking details via ID.
*   **Server-Side Preview**: Support for rendering server-generated HTML templates for authorized users.

## 🛠️ Tech Stack

*   **Framework**: React 18 + Vite
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: Tailwind CSS
*   **PDF Engine**: `@react-pdf/renderer`
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React
*   **Routing**: React Router DOM

## 🏁 Getting Started

### Prerequisites

*   Node.js (v18+) or Bun
*   A Google Gemini API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/invoice-gen-pro.git

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

*   `src/components/forms`: Form logic and UI inputs.
*   `src/components/modals`: Dialogs (Login, AI Import).
*   `src/components/ui`: Reusable UI atoms (Wizard, InputGroup).
*   `src/components/PdfDocument.tsx`: Invoice PDF layout definition.
*   `src/components/LeasePdf.tsx`: Lease Agreement PDF layout definition.
*   `src/pages`: Main application views (`EditorPage`, `PreviewPage`).
*   `src/services`: API clients (`ownimaApi`, `geminiService`, `authService`).
*   `src/hooks`: State management logic (`useInvoice`, `useLease`).
*   `src/types.ts`: Centralized TypeScript interfaces.

## 🔒 Authentication

The application handles two types of flows:
1.  **Public/Editor Mode**: Open access for generating documents manually.
2.  **Protected Preview**: When viewing specific reservations via `/preview/lease/:id`, the app may require authentication via the `LoginModal` if the API returns a 401.

## 📄 License

Proprietary / Internal Tool for Ownima.
