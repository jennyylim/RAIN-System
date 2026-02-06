# RAIN - Resource Asset Inventory Network

RAIN is an enterprise-grade IT Asset Management (ITAM) and Deployment system designed to bridge the gap between HR personnel requests and IT hardware logistics. It features a robust handover protocol with digital signatures, real-time inventory tracking, and a Gemini-powered "Genesis" engine for intelligent database management.

## 🚀 Key Features

-   **IT BAU Portal**: Complete fleet control, inventory management, and fulfillment tracking.
-   **HR Admin Portal**: Seamless personnel onboarding/offboarding requests and stock decision handling.
-   **Employee Self-Service**: UAT (User Acceptance Testing) forms with digital signatures and photo evidence for asset custody.
-   **RAIN AI Genesis**: A Gemini-integrated engine that allows admins to provision database states and audit logs using natural language.
-   **Handover Record System**: Generates printable, high-fidelity PDF-ready handover receipts with witness sign-offs.

## 🛠 Tech Stack

-   **Frontend**: React 19 (ESM), Tailwind CSS
-   **State Management**: LocalStorage-backed Persistent Ledger (Simulating a Production DB)
-   **AI Integration**: Google Gemini SDK (@google/genai)
-   **Icons**: FontAwesome 6 Pro

## 📥 Setup

1.  Clone the repository.
2.  Set your `API_KEY` in the environment variables (for Gemini functionality).
3.  Open `index.html` in a modern browser.

---
*Developed by RAIN Systems Logistics Team.*