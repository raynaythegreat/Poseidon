# Landing Page, Collapsible Sidebar & Aegean Oceanic Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Poseidon into a dual-mode experience with a stunning public landing page, redesigned authenticated home, collapsible sidebar, and beautiful Aegean Mediterranean color scheme.

**Architecture:**
- Create separate public landing page (`/landing`) and authenticated home page (`/home`)
- Add collapsible sidebar with state management (collapsed/expanded)
- Establish comprehensive design tokens for Aegean palette (cerulean, azure, sea green, gold)
- Use route-based rendering to show landing vs dashboard based on auth state

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Framer Motion, React Context API

---

## Task 1: Create Aegean Color Palette Design Tokens

**Files:**
- Create: `app/globals.css` (update color variables)
- Modify: `tailwind.config.ts` (add theme colors)

**Step 1: Define CSS variables for Aegean palette**

Add to `:root` in `app/globals.css`:

```css
:root {
  /* Aegean Mediterranean Palette */
  /* Deep Cerulean - primary ocean depth */
  --aegean-deep: #0047ab;
  --aegean-deep-light: #0056b3;
  --aegean-deep-dark: #003380;

  /* Azure - crystal waters */
  --aegean-azure: #007fff;
  --aegean-azure-light: #3399ff;
  --aegean-azure-dark: #0066cc;

  /* Sea Green - coastal vegetation */
  --aegean-sea: #2e8b57;
  --aegean-sea-light: #3cb371;
  --aegean-sea-dark: #246b44;

  /* Gold - sun on Mediterranean waters */
  --aegean-gold: #d4af37;
  --aegean-gold-light: #e5c158;
  --aegean-gold-dark: #b8941f;

  /* Supporting neutrals */
  --foam-white: #f8fbfd;
  --sand-beige: #f5f0e6;
  --stone-grey: #8b9dad;
  --deep-navy: #0a1628;

  /* Semantic mappings */
  --primary: var(--aegean-deep);
  --secondary: var(--aegean-azure);
  --accent: var(--aegean-gold);
  --success: var(--aegean-sea);
}
```

**Step 2: Update dark theme colors**

Add to `.dark` in `app/globals.css`:

```css
.dark {
  --background: var(--deep-navy);
  --foreground: var(--foam-white);
  --surface: #0f1f33;
  --surface-muted: #162942;
  --surface-strong: #1d3352;
  --ink: var(--foam-white);
  --ink-muted: var(--stone-grey);
  --ink-subtle: #5a6b7f;
  --line: var(--surface-strong);
  --line-strong: #2a4566;
  --neon-primary: var(--aegean-azure);
  --neon-secondary: var(--aegean-sea);
  --grid-color: var(--aegean-deep);
  --bg-spot-1: var(--aegean-azure);
  --bg-spot-2: var(--aegean-sea);
}
```

**Step 3: Add Tailwind theme colors**

Update `tailwind.config.ts`:

```typescript
colors: {
  aegean: {
    deep: {
      DEFAULT: '#0047ab',
      light: '#0056b3',
      dark: '#003380',
    },
    azure: {
      DEFAULT: '#007fff',
      light: '#3399ff',
      dark: '#0066cc',
    },
    sea: {
      DEFAULT: '#2e8b57',
      light: '#3cb371',
      dark: '#246b44',
    },
    gold: {
      DEFAULT: '#d4af37',
      light: '#e5c158',
      dark: '#b8941f',
    },
  },
  foam: '#f8fbfd',
  sand: '#f5f0e6',
  stone: '#8b9dad',
  navy: '#0a1628',
}
```

**Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat: add Aegean Mediterranean color palette"
```

---

## Task 2: Create Collapsible Sidebar Context

**Files:**
- Create: `contexts/SidebarContext.tsx`

**Step 1: Create sidebar context**

```typescript
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add contexts/SidebarContext.tsx
git commit -m "feat: add collapsible sidebar context"
```

---

## Task 3: Update Sidebar Component with Collapse Toggle

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

**Step 1: Read current sidebar implementation**

Run: `Read components/dashboard/Sidebar.tsx`
Note: Current structure, nav items, icons

**Step 2: Add collapse toggle button**

Add at top of sidebar, below header:

```tsx
import { useSidebar } from "@/contexts/SidebarContext";

// In component, add toggle button
<button
  onClick={toggleSidebar}
  className="absolute top-4 right-[-12px] z-50 w-6 h-6 bg-aegean-deep hover:bg-aegean-azure rounded-r-md flex items-center justify-center text-foam transition-colors border-y border-r border-aegean-gold/30"
  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
>
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {isCollapsed ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    )}
  </svg>
</button>
```

**Step 3: Add collapsed state styling**

```tsx
const sidebarClass = isCollapsed
  ? "w-16" // collapsed width
  : "w-64"; // expanded width

// In collapsed mode, show only icons
const navItemsClass = isCollapsed
  ? "flex flex-col items-center gap-4 px-2"
  : "flex flex-col gap-1";
```

**Step 4: Add tooltips for collapsed mode**

```tsx
{isCollapsed && (
  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-aegean-deep text-foam px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
    {item.label}
  </div>
)}
```

**Step 5: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add sidebar collapse toggle with tooltips"
```

---

## Task 4: Update DashboardLayout for Sidebar Integration

**Files:**
- Modify: `components/dashboard/DashboardLayout.tsx`

**Step 1: Import SidebarProvider and hook**

```tsx
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
```

**Step 2: Add mobile menu toggle button to Header**

Create new toggle button in Header component:

```tsx
import { useSidebar } from "@/contexts/SidebarContext";

// In Header component
const { toggleMobile } = useSidebar();

<button
  onClick={toggleMobile}
  className="md:hidden p-2 hover:bg-aegean-deep/20 rounded-lg transition-colors"
  aria-label="Toggle menu"
>
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>
```

**Step 3: Wrap app with SidebarProvider**

Modify `app/layout.tsx` to wrap children:

```tsx
import { SidebarProvider } from "@/contexts/SidebarContext";

// In body
<SidebarProvider>
  {children}
</SidebarProvider>
```

**Step 4: Commit**

```bash
git add components/dashboard/DashboardLayout.tsx app/layout.tsx
git commit -m "feat: integrate collapsible sidebar with layout"
```

---

## Task 5: Create Public Landing Page Route

**Files:**
- Create: `app/landing/page.tsx`
- Create: `components/landing/LandingHero.tsx`
- Create: `components/landing/LandingFeatures.tsx`
- Create: `components/landing/LandingCTA.tsx`

**Step 1: Create landing page route**

Create `app/landing/page.tsx`:

```tsx
import { Metadata } from "next";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingCTA from "@/components/landing/LandingCTA";

export const metadata: Metadata = {
  title: "Poseidon - AI-Powered Development Platform",
  description: "Build, deploy, and scale with AI assistance",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-navy">
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
    </main>
  );
}
```

**Step 2: Create hero section with ocean wave animation**

Create `components/landing/LandingHero.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-navy via-[#0d1f3a] to-[#0a1628]">
      {/* Animated wave background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-aegean-deep to-transparent animate-pulse" />
        <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <motion.path
            initial={{ d: "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" }}
            animate={{ d: ["M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z", "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z", "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            fill="rgba(0, 127, 255, 0.1)"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-foam mb-6">
            <span className="bg-gradient-to-r from-aegean-azure via-aegean-deep to-aegean-sea bg-clip-text text-transparent">
              Poseidon
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-stone mb-12 max-w-3xl mx-auto leading-relaxed">
            Ride the wave of AI-powered development. Build, deploy, and scale your projects with the power of the ocean at your fingertips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/login"
              className="px-8 py-4 bg-aegean-deep hover:bg-aegean-azure text-foam rounded-lg font-semibold transition-all shadow-lg hover:shadow-aegean-azure/30 hover:scale-105"
            >
              Start Building
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border-2 border-aegean-gold text-aegean-gold hover:bg-aegean-gold hover:text-navy rounded-lg font-semibold transition-all"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Floating particles */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-4 h-4 bg-aegean-azure rounded-full opacity-30 blur-sm"
        animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-6 h-6 bg-aegean-sea rounded-full opacity-20 blur-sm"
        animate={{ y: [0, 40, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-aegean-gold rounded-full opacity-40 blur-sm"
        animate={{ y: [0, -25, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
      />
    </section>
  );
}
```

**Step 3: Commit**

```bash
git add app/landing/page.tsx components/landing/LandingHero.tsx
git commit -m "feat: create landing page hero with ocean wave animation"
```

---

## Task 6: Create Landing Features Section

**Files:**
- Create: `components/landing/LandingFeatures.tsx`

**Step 1: Create features showcase component**

```tsx
"use client";

import { motion } from "framer-motion";

const features = [
  {
    icon: "💬",
    title: "AI-Powered Chat",
    description: "Natural conversation with multiple AI models. Ask questions, get code, solve problems.",
    gradient: "from-aegean-deep to-aegean-azure",
  },
  {
    icon: "📂",
    title: "Repository Integration",
    description: "Connect your GitHub repos. Understand context, make changes, deploy seamlessly.",
    gradient: "from-aegean-azure to-aegean-sea",
  },
  {
    icon: "🚀",
    title: "One-Click Deploy",
    description: "Deploy to Vercel, Render, or more. From code to production in seconds.",
    gradient: "from-aegean-sea to-aegean-gold",
  },
  {
    icon: "📊",
    title: "Project Management",
    description: "Track your history, manage projects, and continue where you left off.",
    gradient: "from-aegean-gold to-aegean-deep",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-navy relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foam mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-aegean-azure to-aegean-sea bg-clip-text text-transparent">
              {" "}Build Faster
            </span>
          </h2>
          <p className="text-stone text-lg max-w-2xl mx-auto">
            Powerful features inspired by the depths of the Aegean Sea
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-surface-muted to-surface-strong border border-aegean-deep/20 hover:border-aegean-azure/50 transition-all hover:shadow-xl hover:shadow-aegean-deep/20"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-foam mb-3">{feature.title}</h3>
              <p className="text-stone leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add components/landing/LandingFeatures.tsx
git commit -m "feat: add features section to landing page"
```

---

## Task 7: Create Call-to-Action Section

**Files:**
- Create: `components/landing/LandingCTA.tsx`

**Step 1: Create CTA component**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingCTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-navy to-[#0d1f3a] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aegean-deep/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-foam mb-6">
            Ready to Dive In?
          </h2>
          <p className="text-xl text-stone mb-12 max-w-2xl mx-auto">
            Join thousands of developers building the future with Poseidon's AI-powered platform.
          </p>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-aegean-deep via-aegean-azure to-aegean-sea text-foam text-lg font-semibold rounded-xl transition-all shadow-2xl hover:shadow-aegean-azure/40 hover:scale-105"
          >
            <span>Get Started Free</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add components/landing/LandingCTA.tsx
git commit -m "feat: add CTA section to landing page"
```

---

## Task 8: Redesign Authenticated Home Page

**Files:**
- Modify: `components/home/HomePage.tsx`
- Modify: `components/home/HeroSection.tsx`

**Step 1: Update HomePage with new styling**

Modify `components/home/HomePage.tsx` to use Aegean colors:

```tsx
// Update gradient classes to use Aegean palette
className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aegean-deep via-aegean-azure to-aegean-sea p-12 md:p-16 text-center"
```

**Step 2: Update HeroSection styling**

Modify `components/home/HeroSection.tsx`:

```tsx
// Update gradient background
className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aegean-deep via-aegean-azure to-aegean-sea p-12 md:p-16 text-center"

// Update button styling
<button className="px-4 py-2 bg-aegean-deep/10 hover:bg-aegean-azure/20 backdrop-blur-sm rounded-lg text-foam text-sm font-medium transition-colors border border-aegean-gold/30">
```

**Step 3: Commit**

```bash
git add components/home/HomePage.tsx components/home/HeroSection.tsx
git commit -m "style: update home page with Aegean color scheme"
```

---

## Task 9: Update Sidebar Styling

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

**Step 1: Apply new color scheme**

Update sidebar background, borders, and active states:

```tsx
// Sidebar background
className="bg-surface border-r border-aegean-deep/20"

// Active nav item
className="flex items-center gap-3 px-4 py-3 rounded-lg bg-aegean-deep text-foam font-medium"

// Inactive nav item
className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone hover:bg-aegean-deep/10 hover:text-foam transition-colors"
```

**Step 2: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "style: apply Aegean theme to sidebar"
```

---

## Task 10: Update Mobile Navigation Styling

**Files:**
- Modify: `components/dashboard/DashboardLayout.tsx`

**Step 1: Update mobile nav colors**

```tsx
// Mobile nav background
className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 border-t border-aegean-deep/20 z-50 backdrop-blur-xl"

// Active indicator
className={activeTab === item.id ? "text-aegean-azure" : "text-stone"}
```

**Step 2: Commit**

```bash
git add components/dashboard/DashboardLayout.tsx
git commit -m "style: update mobile navigation with Aegean theme"
```

---

## Task 11: Update Settings Page Styling

**Files:**
- Modify: `components/settings/SettingsPage.tsx`

**Step 1: Apply new colors to settings**

Update section headers, inputs, buttons:

```tsx
// Section cards
className="card-hover rounded-xl p-6"

// Input fields
className="w-full px-4 py-3 bg-surface-muted border border-aegean-deep/20 rounded-lg text-ink focus:ring-2 focus:ring-aegean-azure focus:border-transparent"

// Primary buttons
className="px-6 py-3 bg-aegean-deep hover:bg-aegean-azure text-foam rounded-lg font-semibold transition-colors"
```

**Step 2: Commit**

```bash
git add components/settings/SettingsPage.tsx
git commit -m "style: apply Aegean theme to settings page"
```

---

## Task 12: Update Other Components with New Colors

**Files:**
- Modify: `components/dashboard/Header.tsx`
- Modify: `components/home/ProjectCard.tsx`
- Modify: `components/home/TemplateCard.tsx`

**Step 1: Update Header**

```tsx
// Header background
className="bg-surface/80 backdrop-blur-xl border-b border-aegean-deep/20"

// User dropdown button
className="flex items-center gap-3 px-4 py-2 hover:bg-aegean-deep/10 rounded-lg transition-colors"
```

**Step 2: Update ProjectCard**

```tsx
// Card hover effect
className="card-hover rounded-xl overflow-hidden group"

// Badge styling
className="px-3 py-1 bg-aegean-sea/20 text-aegean-sea text-xs font-medium rounded-full"
```

**Step 3: Update TemplateCard**

```tsx
// Template card gradient
className="relative p-6 rounded-xl bg-gradient-to-br from-aegean-deep/10 to-aegean-azure/10 border border-aegean-deep/20 hover:border-aegean-azure/40 transition-all group"
```

**Step 4: Commit**

```bash
git add components/dashboard/Header.tsx components/home/ProjectCard.tsx components/home/TemplateCard.tsx
git commit -m "style: apply Aegean theme to remaining components"
```

---

## Task 13: Add Route Protection Logic

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add auth check to main page**

Modify root page to redirect unauthenticated users to landing:

```tsx
import { redirect } from "next/navigation";

// This is a simplified check - in production, verify actual auth state
// For now, we'll show the home page directly since the app doesn't have full auth
export default function HomePage() {
  // TODO: Add actual auth check
  // const isAuthenticated = checkAuth();
  // if (!isAuthenticated) {
  //   redirect("/landing");
  // }
  return <HomePageComponent />;
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add route protection placeholder"
```

---

## Task 14: Update Scrollbar and Global Styles

**Files:**
- Modify: `app/globals.css`

**Step 1: Update scrollbar colors**

```css
::-webkit-scrollbar-thumb {
  @apply bg-aegean-deep/50 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-aegean-azure;
}
```

**Step 2: Update focus rings**

```css
input:focus,
textarea:focus,
select:focus {
  @apply outline-none ring-2 ring-aegean-azure ring-offset-2 ring-offset-background;
}
```

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: update scrollbar and focus styles with Aegean theme"
```

---

## Task 15: Verify and Test

**Files:**
- Test: Manual verification

**Step 1: Build project**

Run: `npm run build`
Expected: SUCCESS, no errors

**Step 2: Start dev server**

Run: `npm run dev`
Expected: Server starts on port 1998

**Step 3: Test landing page**

Visit: `http://localhost:1998/landing`
Check:
- Hero displays with wave animation
- Features grid renders properly
- CTA section visible
- Colors match Aegean palette

**Step 4: Test authenticated home**

Visit: `http://localhost:1998/`
Check:
- Home page displays with new colors
- Sidebar collapse toggle works
- Collapsed sidebar shows tooltips
- Mobile menu toggle works

**Step 5: Test all pages**

Check:
- Settings page renders with new colors
- Chat, repos, deploy pages work
- All navigation functional

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: complete Aegean theme and landing page implementation"
```

---

## Summary

This implementation plan creates:
1. **Public landing page** at `/landing` with hero, features, and CTA sections
2. **Collapsible sidebar** with toggle button and mobile responsiveness
3. **Aegean Mediterranean color scheme** throughout the app
4. **Redesigned authenticated home** with oceanic aesthetics

Total tasks: 15
Estimated time: 2-3 hours

**Key files modified:**
- `app/globals.css` - Color variables
- `tailwind.config.ts` - Theme colors
- `contexts/SidebarContext.tsx` - Sidebar state
- `components/dashboard/Sidebar.tsx` - Collapse toggle
- `components/landing/*` - Landing page components
- All major UI components - Color updates
