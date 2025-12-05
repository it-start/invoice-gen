# Contributing to InvoiceGen Pro

Thank you for contributing! This document outlines the standards and architectural patterns used in this project.

## 🧠 Core Philosophy

1.  **Type Safety First**: We use strict TypeScript. Avoid `any`. All data structures (Invoices, Leases) are defined in `src/types.ts`.
2.  **Mobile First**: The UI must work on mobile devices. We use a custom `WizardContainer` pattern for complex forms on small screens.
3.  **Client-Side Heavy**: PDF generation happens in the browser. We avoid sending sensitive data to a backend for generation unless using the specific "Server Preview" mode.

## 🏗️ Architecture

### Data Flow
*   **Hooks**: Logic is encapsulated in custom hooks (`useInvoice.ts`, `useLease.ts`). These handle state, localStorage persistence, and API calls.
*   **Services**: Stateless API wrappers.
    *   `ownimaApi.ts`: Handles fetching reservations and normalizing data.
    *   `geminiService.ts`: Handles interaction with Google AI.
    *   `authService.ts`: Manages Bearer tokens.

### PDF Rendering
We use `@react-pdf/renderer`.
*   **Styles**: PDF styles are distinct from CSS. They are defined in `src/styles/pdfStyles.ts` and imported into document components.
*   **Layout**: We use `View`, `Text`, and `Image` primitives.
*   **Note**: CSS (Tailwind) classes **do not** apply to PDF components. You must use the `StyleSheet` API.

### Internationalization (i18n)
*   All user-facing text must be wrapped in the `t()` function from `src/utils/i18n.ts`.
*   Add new keys to the `TranslationKey` type and the `dictionary` object in `i18n.ts`.

## 💅 Styling Guide

*   **Tailwind CSS**: Used for the web interface (Editor, Preview shell, Modals).
*   **Colors**: Use the `slate` palette for structure and `blue` (`#2563eb`) for primary actions.
*   **Forms**: Use `InputGroup` component for consistent labelling and spacing.

## 🤖 AI Integration Guidelines

When modifying `geminiService.ts`:
1.  **Schemas**: Always define strict output schemas using the Google GenAI SDK `Schema` type.
2.  **Temperature**: Keep temperature low (`0.1`) for data extraction tasks to ensure determinism.
3.  **Safety**: Never log full API keys or sensitive user data in the console.

## 🧪 Development Workflow

1.  **Branching**: Use feature branches (e.g., `feature/digital-signatures`).
2.  **Linting**: Ensure no TypeScript errors before committing.
3.  **Testing**: Manually verify:
    *   Desktop Editor (Split view).
    *   Mobile Editor (Wizard view).
    *   PDF Generation (Download and open).
    *   API Import (Load a reservation ID).

## 📦 Deployment

The project is configured for Vercel/Static hosting.
*   Build command: `npm run build`
*   Output directory: `dist`
