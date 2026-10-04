# ♻️ ScrapDeal

> **Empowering informal waste collectors and recyclers through offline-first digital trading, fair price discovery, AI material recognition, mutual digital handovers, and voice-assisted safety guidance.**

[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/expo--sqlite-57.0-003B57?logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-2980B9)](https://xgboost.readthedocs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [System Invariants & Design Principles](#-system-invariants--design-principles)
- [Machine Learning & Intelligence Layer](#-machine-learning--intelligence-layer)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
- [Automated Verification & Testing](#-automated-verification--testing)
- [Security & Compliance](#-security--compliance)
- [Field Usability & Accessibility](#-field-usability--accessibility)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

The scrap and recycling sector in developing economies is heavily informal, opaque, and cash-reliant. Millions of independent collectors (*kabadiwalas*, waste pickers, and aggregators) face severe information asymmetry, volatile scrap rates, unverified middleman deductions, and dangerous hazardous material handling.

**ScrapDeal** bridges this divide with a modern, production-grade mobile platform designed specifically for field conditions:
- **Offline-First**: Complete functionality without an active internet connection using on-device SQLite and intelligent background queue synchronization.
- **Fair Market Discovery**: Real-time price boards broadcast by certified local recyclers with zero fabricated rates.
- **AI Material Intelligence**: Computer vision scrap classification and market regression pricing models with fallback to honest uncertainty.
- **End-to-End Traceability**: Collision-resistant lot IDs, mutual two-party digital handovers, immutable event audit trails, and privacy-preserving QR verification.
- **Low-Literacy & Field Usability**: Voice-guided safety manuals in Marathi, Hindi, and English with Android Text-To-Speech (TTS), large touch targets (≥ 48dp), and high-contrast field modes.

---

## 🚀 Key Features

### 📦 For Scrap Collectors
- **Fast Lot Creation**: Snap photos, record estimated weights, pick conditions, and generate unique lot identifiers (`LOT-XXXXXXXX`).
- **AI Scrap Scanner**: Instant on-device classification for PCBs, Copper, Aluminium, Iron/Steel, Lead-Acid Batteries, Plastics, and E-waste.
- **Real Offer Comparison**: Receive transparent, itemized bids from verified local recyclers based on proximity and material category.
- **Digital Handover**: Dual-confirmation handover flow with weight reconciliation preventing unauthorized downgrades.
- **Cash & UPI Settlement**: Transparent settlement receipts and historical earnings ledger derived strictly from completed deals.
- **Voice-Guided Safety Guidance**: Step-by-step audio instructions on handling hazardous materials (e.g., lead-acid battery leakage, CRT implosion hazards, cable burning hazards).

### 🏭 For Recyclers & Aggregators
- **Live Material Rate Board**: Broadcast verified buy rates per kg with clear timestamps and location radius.
- **Smart Proximity Matching**: Discover available lots within configurable operating zones (Haversine geospatial matching).
- **Offer Engine**: Submit structured purchase offers (rate/kg, pickup vs. drop-off logistics, pickup timelines).
- **Scale Handover Verification**: Inspect material, log verified scale weight, and record mutual digital signatures.
- **Audit & Compliance Trail**: Download and review verifiable provenance logs (`SCRAP-YYYY-XXXXXXXX`) to meet local environmental recycling regulations.

---

## 🏗 Architecture & Tech Stack

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Expo / React Native)"]
        UI["UI Screens (Collector & Recycler)"]
        TTS["Audio & TTS Engine (hi-IN, mr-IN, en-IN)"]
        State["Zustand Stores & React Context"]
        Offline["SQLite Local Database & Sync Queue"]
    end

    subgraph Intelligence ["ML & AI Services"]
        Vision["MobileNet Scrap Classifier (PyTorch)"]
        Pricing["XGBoost Fair Price Regressor"]
        Anomaly["Isolation Forest Anomaly Advisory"]
    end

    subgraph Cloud ["Cloud & Backend Infrastructure"]
        Auth["Firebase Phone Authentication (OTP)"]
        Firestore["Cloud Firestore (Realtime DB)"]
        Storage["Firebase Cloud Storage (Scrap Photos)"]
        Rules["Security Rules & Immutability Enforcement"]
    end

    UI --> State
    UI --> TTS
    State <--> Offline
    UI <--> Intelligence
    Offline <--> |SyncEngine (Bidirectional)| Firestore
    Offline <--> Storage
    State <--> Auth
```

### Technology Matrix

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React Native 0.86, Expo SDK 57 | Cross-platform runtime targeting Android & iOS |
| **Language** | TypeScript 6.0 | Strict type safety and robust domain contracts |
| **Local Storage** | `expo-sqlite` (v57) | High-performance ACID SQL database with indexed sync queues |
| **State Management** | Zustand 5.0 + React Context | Lightweight reactive state & role/language scoping |
| **Backend / Cloud** | Firebase 12 | Phone Auth, Firestore, Cloud Storage |
| **Navigation** | React Navigation 7 | Native stack and bottom-tab role-isolated routing |
| **Computer Vision** | PyTorch 2.2+, Torchvision | MobileNet scrap classification pipeline |
| **Market Pricing** | XGBoost 2.0+, Scikit-Learn | Empirical price estimation & anomaly detection |
| **Voice / Speech** | `expo-speech` | Multilingual Text-To-Speech with BCP-47 locale tags |

---

## 📁 Project Structure

```plaintext
ScrapDeal/
├── App.tsx                     # Application entry point with SQLite & Session bootstrap
├── app.json                    # Expo configuration & native capabilities
├── firestore.rules             # Production security rules (role isolation & immutability)
├── storage.rules               # Cloud Storage security rules for scrap photos
├── requirements.txt            # Python dependencies for ML training pipelines
├── package.json                # Project dependencies and test runner scripts
├── src/
│   ├── components/             # Reusable UI widgets (OfferCard, ErrorState, SafetyPlayer, etc.)
│   ├── constants/              # System constants, colors, material definitions
│   ├── context/                # Context providers (LanguageContext, RoleContext, CreateLotContext)
│   ├── i18n/                   # Multi-language translation dictionaries (English, Hindi, Marathi)
│   ├── navigation/             # Role-isolated navigators (Root, Auth, Collector, Recycler)
│   ├── screens/                # UI screens partitioned by domain:
│   │   ├── auth/               # Login, Signup, Phone OTP verification screens
│   │   ├── collector/          # Lot creation, offer review, handover, safety screens
│   │   ├── recycler/           # Market rate board, lot discovery, bidding, handover screens
│   │   ├── onboarding/         # Role selection and onboarding carousel
│   │   └── common/             # Traceability view, settings, and profile screens
│   ├── services/               # Enterprise business services:
│   │   ├── ai/                 # On-device & remote material classification inference
│   │   ├── audio/              # Text-to-speech audio service for accessibility
│   │   ├── connectivity/       # Network state detection and reconnect handlers
│   │   ├── deal/               # Offer acceptance, deal lifecycle, and state machine
│   │   ├── firebase/           # Firebase initialization, phone auth, and firestore client
│   │   ├── location/           # Permission-aware GPS location & distance matching
│   │   ├── payment/            # Cash & UPI settlement orchestrator with idempotency
│   │   ├── pricing/            # Real-time rate board and price discovery services
│   │   ├── safety/             # 10 hazardous waste handling guides & hazard detection
│   │   ├── sqlite/             # SQLite migrations, relational schema, and local CRUD
│   │   ├── sync/               # Bidirectional background SyncEngine with retry backoff
│   │   └── traceability/       # Immutable audit logs, QR tokens, and handover certificates
│   ├── store/                  # Zustand persistent global stores (auth, sync, notification)
│   ├── theme/                  # Design tokens, typography, and high-contrast field themes
│   └── types/                  # Strict TypeScript interfaces and domain schemas
├── ml/
│   ├── material/               # MobileNet scrap category classifier training
│   ├── pricing/                # XGBoost fair price regressor training
│   ├── anomaly/                # Isolation Forest fraud and outlier detector
│   └── datasets/               # Scrap taxonomy definitions and dataset helpers
└── scripts/                    # Comprehensive automated test suites (Phase 2 - 8)
    ├── test_auth.mjs           # Real phone authentication & OTP security audit
    ├── test_scenarios.mjs      # Phase 2 offline SQLite cache & sync scenarios
    ├── test_phase3.mjs         # Phase 3 core collector <-> recycler deal lifecycle
    ├── test_phase4.mjs         # Phase 4 location matching, price board & permissions
    ├── test_phase5.mjs         # Phase 5 AI material vision, pricing & anomaly suite
    ├── test_phase6.mjs         # Phase 6 payments, settlement & push notifications
    ├── test_phase7.mjs         # Phase 7 digital traceability & audit immutability
    ├── test_phase8.mjs         # Phase 8 safety guidance, TTS & low-literacy field UX
    └── test_safety_tts.mjs     # TTS multilingual audio verification
```

---

## 🔒 System Invariants & Design Principles

ScrapDeal is engineered under strict operational invariants:

1. **Zero Fake Data**:
   - Every price, offer, earnings total, and matching recycler is derived from genuine database entries.
   - If historical market data is insufficient for an AI price estimate, the app displays:  
     `"Not enough market data for AI estimate"` instead of hallucinating values.
2. **Offline Resilience**:
   - The app functions seamlessly with zero connectivity. Lot creation, photo capture, safety audio guidance, and cash confirmations persist immediately in SQLite.
   - A pending queue automatically replays operations to Cloud Firestore once internet connectivity resumes.
3. **Audit Trail Immutability**:
   - Traceability audit events (`LOT_CREATED` ➔ `DEAL_CONFIRMED` ➔ `HANDOVER_STARTED` ➔ `WEIGHT_CONFIRMED` ➔ `HANDOVER_CONFIRMED` ➔ `PAYMENT_COMPLETED`) are strictly append-only. Firestore security rules prevent modifying or deleting historical audit entries.
4. **Advisory Anomaly Detection**:
   - Fraud, outlier weights, and abnormal pricing flagged by the AI engine trigger **advisory warnings** for human review rather than abruptly banning users or aborting live trade.
5. **Two-Party Handover Integrity**:
   - Neither the collector nor the recycler can unilaterally mark a handover complete. Both must independently verify and submit confirmation. When scale weight differs from the estimate, both the original estimate and actual scale weight are preserved.

---

## 🧠 Machine Learning & Intelligence Layer

ScrapDeal integrates three specialized ML subsystems located in `ml/`:

### 1. Scrap Material Recognition (`ml/material/`)
- **Model**: MobileNetV3 (optimized for edge mobile deployment).
- **Taxonomy**: `pcb`, `copper`, `aluminium`, `iron_steel`, `cables`, `battery`, `plastic`, `e_waste`.
- **Feedback Loop**: When a collector overrides an AI classification, the system stores `predictedMaterial`, `finalMaterial`, and user feedback metadata to continuously improve dataset labeling.

### 2. Fair Price Discovery (`ml/pricing/`)
- **Model**: XGBoost Regression trained on historical scrap transaction datasets.
- **Inputs**: Material category, condition, lot weight, historical local market rates, and seasonal trends.
- **Output**: Empirical fair price range (e.g., `₹9,750 - ₹10,200`) with explicit confidence scores.

### 3. Transaction Anomaly Detection (`ml/anomaly/`)
- **Model**: Isolation Forest unsupervised anomaly detector.
- **Purpose**: Flags abnormal transaction parameters (e.g., 500% above market rates or anomalous weight jumps) with descriptive advisory notes.

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Expo CLI**: Installed via npx or global
- **Python**: `v3.10+` (optional, only required for retraining ML models)
- **Physical Device or Emulator**: Android (recommended for TTS and hardware camera) or iOS

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Muazzam0101/ScrapDeal.git
   cd ScrapDeal
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Install Python ML dependencies** *(optional, for model training)*:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

---

### Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Populate `.env` with your Firebase project credentials:

```ini
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

> **Note**: Never commit your real production secrets or `.env` file to version control.

---

### Running the App

Start the Expo development server:

```bash
npm start
```

Target-specific launch commands:
```bash
# Android emulator or connected device
npm run android

# iOS simulator (macOS required)
npm run ios

# Web browser preview
npm run web
```

---

## 🧪 Automated Verification & Testing

ScrapDeal includes an extensive, end-to-end automated verification test suite simulating real mobile lifecycles (network drops, SQLite rollbacks, permission denials, and cryptographic handovers):

| Test Command | Scope & Coverage |
| :--- | :--- |
| `npm test` | Default Phase 5 AI/ML Intelligence verification suite |
| `npm run test:auth` | Real phone authentication, cryptographic OTP generation, expiry & lockout |
| `npm run test:phase2` | Offline SQLite caching, session persistence, and sync queue retry |
| `npm run test:phase3` | Core Scrap Deal Flow (Collector <-> Recycler full lifecycle) |
| `npm run test:phase4` | Recycler price board, Haversine matching, and permission denial |
| `npm run test:phase5` | AI material vision, price regression, and anomaly advisory flags |
| `npm run test:phase6` | Payment settlement (Cash/UPI), idempotency, and notifications |
| `npm run test:phase7` | Traceability, collision-resistant tokens, and audit immutability |
| `npm run test:phase8` | Offline safety guidance, low-literacy UX, and Android TTS |
| `npm run test:safety` | Multilingual safety TTS verification across mr-IN, hi-IN, and en-IN |
| `npm run test:all` | **Runs the entire test suite consecutively across all phases** |

### Running the Full Test Suite:
```bash
npm run test:all
```

---

## 🛡 Security & Compliance

- **Authentication Security**:
  - Eliminates hardcoded test bypasses or prefills.
  - Generates dynamic 6-digit cryptographic OTPs with 5-minute expirations and a 5-attempt brute-force lockout window.
- **Granular Firestore Security Rules**:
  - `firestore.rules` enforces role-based access control (RBAC).
  - Collectors cannot impersonate recyclers; recyclers cannot modify collector lot data or alter agreed rates.
  - Traceability events are write-once, append-only, and protected against unauthorized deletions or modifications.
- **Privacy Safe QR Code Sharing**:
  - Verification QR tokens (`SD-VERIFY-...`) expose only compliance-safe public metadata (material category, net weight, timestamp, and recycling certification status) without leaking private user contact information or sensitive financial tokens.

---

## 🔊 Field Usability & Accessibility

- **Native Text-To-Speech (TTS)**: Built-in voice instructions supporting Hindi (`hi-IN`), Marathi (`mr-IN`), and English (`en-IN`) using Android's native speech synthesis engine.
- **Touch Target Accessibility**: All actionable buttons, inputs, and interactive cards strictly satisfy the standard minimum touch target size of **≥ 48 × 48 dp**.
- **Field Contrast Palette**: High-contrast, glare-resistant theme tokens optimized for direct sunlight outdoor use by waste pickers and scrap yards.
- **Jargon-Free Terminology**: Technical statuses are abstracted into clear, localizable labels (e.g., *"Saved on phone"* instead of *"Pending SQLite sync queue entry"*).

---

## 🤝 Contributing

Contributions are welcomed! To maintain the stability and reliability of the platform, please ensure:

1. Fork the repository and create your feature branch: `git checkout -b feature/amazing-feature`.
2. Follow strict TypeScript type checking: `npm run typecheck`.
3. Verify that all automated test suites pass without regression: `npm run test:all`.
4. Commit your changes: `git commit -m 'feat: add amazing feature'`.
5. Push to the branch: `git push origin feature/amazing-feature`.
6. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.