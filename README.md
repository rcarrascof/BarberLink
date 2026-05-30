# 💈 BarberLink - SaaS Administration Platform

[![React Native](https://img.shields.io/badge/React_Native-CLI-61dafb.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-Clean-4b32c3.svg?style=flat-square&logo=eslint)](https://eslint.org)
[![Aesthetics](https://img.shields.io/badge/Aesthetics-Premium_Glassmorphism-emerald.svg?style=flat-square)](#)

**BarberLink** is a high-end, responsive B2B SaaS administration mobile platform developed for barbershop owners. The entire system is styled with a premium dark-mode glassmorphic interface (`#0a0a0a` background, `#10b981` emerald green highlights) and designed to run scheduling, reminders, and reservation operations through a single, shared WhatsApp Business session with multi-tenant database session routing.

---

## 🛠️ Key Platform Features

### 1. ⚙️ Streamlined Settings & SaaS Billing (`src/screens/SettingsScreen.tsx`)
* **Premium Profile Header**: Renders shop initials and trial/premium active status badges with clean glassmorphic details.
* **🌐 Contextual i18n Engines**: Dynamic locale toggles supporting instant, system-wide language changes between **Español (🇪🇸)** and **English (🇺🇸)**.
* **Store-Compliant SaaS Checkouts**: Removed standard direct inputs (card/PayPal) to achieve 100% store submission compliance. Displays local subscription statuses and lets users purchase a premium license using **simulated native checkout modal sheets** (Face ID validation, account confirmations).

### 2. 📇 Real Contacts Import System (`src/screens/ClientsScreen.tsx`)
* **New Architecture Integration**: Swapped static mapping references for cross-architecture validation (`typeof Contacts.checkPermission === 'function'`) to ensure native linkages operate seamlessly on both the Old Architecture and New Architecture/TurboModules.
* **iOS 18 Limited Access Fallback**: Resolves new Apple contact permissions natively. If the authorization returns `'undefined'` or `'limited'`, we perform a direct, ultimate validation call using `Contacts.getAll()`. If it succeeds, the flow proceeds safely, showing only the selected contacts.
* **Alert Conflict Resolution**: Unified and structured warning alerts inside `loadPhoneContacts` to avoid modal overwriting bugs (e.g. `Permiso Desactivado` replacing `Permiso Requerido`).

### 3. 🚀 Onboarding & Bot Setup Wizard (`src/screens/OnboardingScreen.tsx`)
* **Multi-Step Guide**: Features an interactive, step-by-step setup wizard (4 Steps) that guides newly registered or logged-in users through setting up their business details, customized price plans, and WhatsApp Bot parameters.
* **Core Barbershop Configuration**: Captures Shop Name, Owner Name, and a customized Base Service Price, automatically scaling the rest of the services menu prices.
* **WhatsApp Bot Setup**: Assigns the mobile number for the bot using a country flag selector modal, customizes the AI greeting template, and activates the Autopilot bookings toggle.
* **Visual Progress Indicators**: Displays progress-tracking visual dots at the top of the wizard.

### 4. 📝 Geolocated Onboarding & Redirection (`src/screens/LoginScreen.tsx`)
* **Automatic Geolocation Detection**: Performs a non-blocking public API geolocation call on startup to auto-detect the user's country code and caller badge (supporting 20+ regions: 🇺🇸, 🇩🇴, 🇲🇽, 🇨🇴, 🇪🇸, and more).
* **International Default Priority**: Swapped regional order inside `CountrySelectorModal` to prioritize an international focus (`🇺🇸 +1` prefix and `201-555-0123` placeholder) while keeping other options readily accessible.
* **First-Time Redirect**: Intercepts phone, Google, Apple, and registration logins. If it's the user's very first login, they are automatically guided to the `Onboarding` Setup Wizard.

### 5. ⏱️ Availability, Lunch Breaks, & Blockout Grid (`src/screens/AvailabilityScreen.tsx`)
* **Modular Time Pickers**: Uses an extracted, lightweight `<TimeSelectorModal>` to select commercial opening and closing slots at 30-minute intervals.
* **🍽️ Lunch Breaks Control**: Toggles custom lunch-hour ranges per day offloading bot automated WhatsApp bookings during break intervals.
* **🚫 Weekday Hourly Blockout**: Day-by-day scheduler matrix where barbers can tap specific hours (e.g. `10:00 AM`, `03:00 PM`) to toggle them between active (green) or blocked/disabled (red).

### 6. 📅 Appointments Agenda CRUD (`src/screens/AgendaScreen.tsx`)
* **Dynamic Timeline**: Renders today's schedules in real-time.
* **Interactive Rescheduling**: Tap any appointment to modify hours, select available barbers, and confirm dates. Automatically triggers mock client notifications via WhatsApp API.
* **Cancellation Flow**: Safe cancellation with native double-confirmation warnings and visual status updates.

### 7. 💵 Control de Ingresos / Revenue Analytics (`src/screens/RevenueScreen.tsx`)
* **Financial Dashboards**: Renders Monthly Earnings, Cash Flow, and visual progress charts.
* **Team Commission Split**: Computes commission divisions automatically (e.g., 60% Shop / 40% Barber) per transaction to handle bookkeeping effortlessly.

### 8. 🛡️ GDPR & Mobile Safety Compliance (`src/components/PrivacyPolicyModal.tsx`)
* **Privacy modal sheet**: High-fidelity B2B data safety, WhatsApp opt-in details, and encryption commitments.
* **Compliance links**: Linked directly in the Settings dashboard and Login footer to satisfy strict Apple APNs Guideline 5.1.1 and Google Play Data Safety requirements.

---

## 📁 Project Architecture & Components

```
BarberLink/
├── App.tsx                        # App entry point with contextual Providers
├── babel.config.js                # Babel configurations with conditional release optimizations
├── src/
│   ├── components/
│   │   ├── Button.tsx             # Styled emerald action button
│   │   ├── Card.tsx               # Glassmorphic visual container
│   │   ├── PrivacyPolicyModal.tsx # Safety policy disclosure modal
│   │   ├── CountrySelectorModal.tsx # Reusable geolocated flag picker modal
│   │   ├── TimeSelectorModal.tsx  # Reusable 30-min schedule list picker modal
│   │   ├── GoogleSignInModal.tsx  # Reusable simulated Google OAuth accounts picker
│   │   └── AppleSignInModal.tsx   # Reusable simulated iOS Apple Sign-In & Face ID modal
│   ├── navigation/
│   │   └── AppNavigator.tsx       # BottomTab & Stack routing navigation mapping
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Styled login & geolocated signup screen
│   │   ├── OnboardingScreen.tsx   # Step-by-step Bot & Barbershop configuration wizard
│   │   ├── HomeScreen.tsx         # Dashboard with metrics and push triggers
│   │   ├── AgendaScreen.tsx       # Visual timeline calendar with reschedule CRUD
│   │   ├── ClientsScreen.tsx      # Searchable customer catalog logs
│   │   ├── SettingsScreen.tsx     # Staff CRUD, catalog, language & logout screen
│   │   ├── ServicesScreen.tsx     # Services list catalog with active search
│   │   ├── BarbersScreen.tsx      # Barbers team catalog with status switches
│   │   └── AvailabilityScreen.tsx # Time grids, lunch breaks, and blocked hour slots
│   └── services/
│       ├── config.ts              # Decoupled dev & prod configuration variables
│       ├── firebase.ts            # Dynamic environment-driven Firebase initialization
│       ├── LanguageContext.tsx    # Context-driven multi-language engine provider
│       ├── translations.ts        # Comprehensive i18n Spanish / English dictionary
│       ├── storage.ts             # Centralized AsyncStorage persistent data mapper
│       └── notifications.ts       # Push notifications permission & background simulation
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have completed the official [React Native CLI Environment Setup](https://reactnative.dev/docs/set-up-your-environment) for your host platform (macOS/Windows) and target device (iOS/Android).

### 1. Install Dependencies
Clone the repository and install the standard NPM packages:
```bash
npm install
```

### 2. Configure iOS (macOS only)
Run Ruby bundler to install CocoaPods, then link the native packages:
```bash
bundle install
cd ios
bundle exec pod install
cd ..
```

### 3. Run the Development Server
Launch the Metro bundler to handle the visual assembly of JS modules:
```bash
npm start
```

### 4. Build & Launch App
Open a separate terminal window and launch the build process for your target platform:

#### Run iOS Simulator:
```bash
npm run ios
```

#### Run Android Emulator:
```bash
npm run android
```

---

## 🧪 Verification & Auditing

We maintain strict type systems and formatting guidelines. You can verify code health before deploying with the following scripts:

### TypeScript strict check:
```bash
npx tsc --noEmit
```

### ESLint audit:
```bash
npm run lint
```

---

## 🗄️ Core Services Specifications

### Central Persistence System (`src/services/storage.ts`)
The app utilizes a centralized AsyncStorage interface to map data structures cleanly across screens. Standard keys include:
* `@barberlink_shop_name`, `@barberlink_owner_name`
* `@barberlink_country_code` (stores geolocated or manually selected country)
* `@barberlink_shop_phone` (stores the WhatsApp bot phone number)
* `@barberlink_bot_message` (stores the WhatsApp greeting template)
* `@barberlink_onboarding_completed` (tracks onboarding completion status)
* `@barberlink_blocked_slots` (stores blocked hours per weekday in record collections)
* `@barberlink_barbers`, `@barberlink_services` (stores dynamic team array list)
