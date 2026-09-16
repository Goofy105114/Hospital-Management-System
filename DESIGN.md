# Clinical Clarity — Going Merry HMS Design System (DESIGN.md)

This document defines the official design system, token architecture, typography hierarchy, component patterns, and UI conventions for the **Going Merry Hospital Management System (HMS)**. All screens across all role portals (`Patient`, `Doctor`, `Receptionist`, `Pharmacist`, `Nurse`, `Lab Tech`, `Inventory Manager`, `Billing Staff`, `Admin`) must adhere to this system.

---

## 1. Aesthetic Thesis: Clinical Clarity

- **Direction**: Modern Clinical Precision & Human-Centered Healthcare.
- **Core Attributes**: High contrast, crisp data typography, calm clinical slate-and-teal palette, unmistakable status indicators, zero decorative clutter, and low-cognitive-load information hierarchy.
- **Font Family**: `Plus Jakarta Sans` across all headings, labels, metrics, and body text.
- **Icons**: `Material Symbols Outlined` (Google Fonts) and `Lucide React` for featherweight vector clarity.

---

## 2. Color Palette & Token Architecture

The color system is derived from the **Clinical Clarity** specification and Material 3 / Tailwind extended tokens:

### 2.1 Brand & Functional Colors

| Token Name                   | Hex Code              | Purpose & Usage                                                        |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `primary`                    | `#0D9488` / `#00685F` | Primary brand teal, main actions, active states, active tab background |
| `primary-container`          | `#008378`             | Hover state for primary buttons, highlighted action cards              |
| `on-primary`                 | `#FFFFFF`             | Text/icons on primary fill                                             |
| `on-primary-container`       | `#F4FFFC`             | High-contrast light text on primary containers                         |
| `primary-fixed`              | `#89F5E7`             | Soft teal accent pills ("Instant", "Active" badges)                    |
| `on-primary-fixed`           | `#00201D`             | Deep teal text on soft teal accents                                    |
| `secondary`                  | `#0284C7` / `#006398` | Secondary clinical blue (telehealth, prescriptions, schedule pills)    |
| `secondary-container`        | `#5BB8FE`             | Active highlight blue                                                  |
| `on-secondary`               | `#FFFFFF`             | Text on secondary buttons                                              |
| `secondary-fixed`            | `#CCE5FF`             | Soft blue pill backgrounds ("Confirmed", "Ready" tags)                 |
| `on-secondary-fixed-variant` | `#004B73`             | Deep blue text on soft blue tags                                       |
| `tertiary`                   | `#475569` / `#4F5D71` | Slate grey for secondary actions, notes, neutral status                |
| `tertiary-container`         | `#67758B`             | Subtle slate fills                                                     |
| `error`                      | `#BA1A1A` / `#EF4444` | Critical clinical alerts, allergies, cancellations, unpaid bills       |
| `error-container`            | `#FFDAD6`             | Soft pink/red alert banner background                                  |
| `on-error-container`         | `#93000A`             | Deep red text on error banners                                         |
| `success`                    | `#10B981`             | Optimal vitals, confirmed visits, verified results                     |
| `warning`                    | `#F59E0B`             | In-progress wait times, triage alerts, near-expiry items               |

### 2.2 Neutral & Surface Tones

| Token Name                  | Hex Code              | Usage                                                        |
| --------------------------- | --------------------- | ------------------------------------------------------------ |
| `background`                | `#FAF8FF` / `#F8FAFC` | Page body background                                         |
| `surface`                   | `#FAF8FF`             | Default surface base                                         |
| `surface-container-lowest`  | `#FFFFFF`             | Cards, modals, sidebars, header bar, white floating elements |
| `surface-container-low`     | `#F2F3FF` / `#F1F5F9` | Card inner containers, vitals cards, list row hover          |
| `surface-container`         | `#EAEDFF` / `#E2E8F0` | Dividers, secondary pill backgrounds                         |
| `surface-container-high`    | `#E2E7FF` / `#CBD5E1` | Button hover surfaces, progress tracks                       |
| `surface-container-highest` | `#DAE2FD`             | Border highlights, subtle tags                               |
| `on-surface`                | `#0F172A` / `#131B2E` | High-contrast main text (headlines, values, names)           |
| `on-surface-variant`        | `#3D4947` / `#475569` | Secondary body text, timestamps, labels                      |
| `outline`                   | `#6D7A77` / `#94A3B8` | Subtle border lines, input placeholders, icon outlines       |
| `outline-variant`           | `#BCC9C6` / `#E2E8F0` | Hairline dividers between items                              |

---

## 3. Typography Scale (`Plus Jakarta Sans`)

All text uses `Plus Jakarta Sans` with predefined tracking and line-heights:

| Style Name    | Size | Line Height | Weight          | Letter Spacing            |
| ------------- | ---- | ----------- | --------------- | ------------------------- |
| `headline-xl` | 36px | 44px        | 700 (Bold)      | -0.02em                   |
| `headline-lg` | 28px | 36px        | 600 (Semi-bold) | -0.01em                   |
| `headline-md` | 20px | 28px        | 600 (Semi-bold) | -0.005em                  |
| `headline-sm` | 16px | 24px        | 600 (Semi-bold) | 0em                       |
| `data-metric` | 32px | 38px        | 700 (Bold)      | -0.02em (Tabular figures) |
| `body-lg`     | 16px | 24px        | 400 (Regular)   | 0em                       |
| `body-md`     | 14px | 20px        | 400 (Regular)   | 0em                       |
| `body-sm`     | 12px | 16px        | 400 (Regular)   | +0.01em                   |
| `label-lg`    | 14px | 20px        | 600 (Semi-bold) | +0.01em                   |
| `label-md`    | 12px | 16px        | 600 (Semi-bold) | +0.02em                   |
| `label-sm`    | 11px | 14px        | 700 (Bold)      | +0.04em (Uppercase)       |

---

## 4. Spacing & Border Radii

- **Grid Spacing**:
  - `space-1`: 0.25rem (4px)
  - `space-2`: 0.5rem (8px)
  - `space-3`: 0.75rem (12px)
  - `space-4`: 1rem (16px)
  - `space-5`: 1.25rem (20px)
  - `space-6`: 1.5rem (24px)
  - `space-8`: 2rem (32px)
  - `space-10`: 2.5rem (40px)
  - `space-12`: 3rem (48px)
- **Radii**:
  - `rounded-lg`: 8px (Buttons, inputs, inner tags, table cells)
  - `rounded-xl`: 12px (Cards, banners, panels, modals)
  - `rounded-full`: 9999px (Status dots, pill badges, avatar containers)
- **Shadows**:
  - `shadow-sm`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
  - Header / Sidebar shadow: `shadow-[0_1px_8px_rgba(0,0,0,0.04)]`

---

## 5. Core Layout Components

### 5.1 Left Navigation Sidebar (Width: `w-72`)

- Fixed left navigation (`fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest`).
- Header with Logo ("Going Merry") + Role Badge (e.g., "PATIENT PORTAL", "CLINICIAN DESK", "PHARMACY DISPENSARY").
- Navigation items: icon (`Material Symbols` or `Lucide`), title, rounded pill selection state (`bg-primary-container text-on-primary-container font-label-lg shadow-sm`).
- Footer block: 24/7 Clinical Hotline card (`+1 (800) 555-MERRY`) with emergency icon and subtitle.

### 5.2 Fixed Top Navigation Header (Height: `h-16`)

- Left-offset `left-72 right-0`.
- Global search input (`bg-surface-container-low`, icon on left, placeholder with keyboard hints).
- Facility location pill (`Main Clinic - Bldg B` with green pulsating dot).
- Notification bell with red status badge.
- Active user avatar + name + ID / MRN badge + dropdown arrow.
- Interactive Role Switcher dropdown allowing instant role-switching for end-to-end testing across all 12 canonical roles.

### 5.3 Live Outpatient Queue Widget

- Displayed prominently in all outpatient screens.
- **Assigned Token Highlight**: Large `#A-24` in `text-primary font-data-metric`.
- **Wait Time Estimate**: `~18 mins` in `headline-lg font-bold`.
- **Trio Metrics Grid**: `Now Serving (#A-21)`, `Ahead of You (3)`, `Desk Gate (Room 304)`.
- **Queue Progress Bar**: Rounded bar with emerald/teal progression fill.
- **Status Location Pill**: Guidance callout (e.g. _"Please proceed towards Waiting Lounge 3B adjacent to Station 4"_).

### 5.4 Step-by-Step Clinical Wizards (Booking, Check-in, Dispensing)

- Progress stepper ribbon at top (e.g. 1. Department -> 2. Doctor -> 3. Date & Time -> 4. Patient -> 5. Confirmation).
- Split layout:
  - 8-column main selection canvas (interactive department cards, doctor profiles, time slot pills).
  - 4-column sticky summary rail (Facility, Physician, Scheduled Time, Patient Details, Breakdown of Insurance & Copay, Confirm Button).

### 5.5 Data Cards & Vitals Baseline

- Metric cards with three vertical blocks:
  1. Label + Status Badge (e.g. "Blood Pressure" + "Optimal").
  2. Large Metric + Unit (e.g. "118/76 mmHg" in `font-data-metric`).
  3. Status explanation with checkmark (e.g. "Standard Adult Target").

---

## 6. Motion & Micro-Interactions

- Pulsing live indicator: `animate-pulse` and `animate-ping` for active clinic stations and queues.
- Hover states: `transition-all duration-200 ease-in-out` on buttons, card rows, and sidebar links.
- Progress bar animations: `transition-all duration-700 ease-out` on queue and milestone status bars.
- Accessible focus rings: `focus:ring-2 focus:ring-primary focus:outline-none`.
