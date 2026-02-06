# CyberFest 2026 - Official Website

a readme changed now again


A National-Level Cybersecurity Conclave website for CyberFest 2026, hosted at CBIT, Hyderabad, and organized by Digital Defence Club (DDC).

## 🎯 Event Overview

- **Event:** CyberFest 2026 - National Cybersecurity Conclave
- **Dates:** 6th & 7th February 2026
- **Venue:** Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad
- **Duration:** 36 Hours Continuous Event
- **Organized By:** Digital Defence Club (DDC), CBIT

## ✨ Features Implemented

### Website Sections
- **Hero Section** - Animated landing with event logo, date, and CTAs
- **About Section** - Event overview with statistics
- **Event Details** - Structured information cards
- **Hackathon Track** - AI in Cybersecurity & Blockchain Security themes
- **CTF Track** - Capture The Flag challenges with terminal-style UI
- **Expert Sessions** - Panel talks and judging panel information
- **Schedule** - Day-wise timeline for both days
- **Venue** - Location details with embedded Google Map
- **Sponsors** - Tiered sponsor/partner showcase
- **Footer** - Contact info, social links, and credits

### Design Elements
- Dark cyber/hacker aesthetic theme
- Neon cyan and matrix green accents
- Animated matrix rain background
- Cyber grid patterns and hexagon overlays
- Glitch effects and scan line animations
- Floating and pulsing glow effects
- 3D card hover transformations
- Terminal-style code blocks
- Responsive design for all devices

## 🛠 Tech Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Customizable component library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Typography
- **Orbitron** - Futuristic display font (headings)
- **Rajdhani** - Clean sans-serif (body text)
- **Share Tech Mono** - Monospace (terminal/code)

### Additional Libraries
- **TanStack React Query** - Data fetching
- **React Router DOM** - Client-side routing
- **Class Variance Authority** - Component variants
- **Tailwind Merge** - Class merging utility

## 🎨 Design System

### Color Palette
- **Background:** Deep Navy (#050816)
- **Primary:** Electric Cyan (#00f0ff)
- **Secondary:** Matrix Green (#00ff41)
- **Accent:** Bright Blue (#3d8bff)
- **Text:** Light blue/white variants

### Custom CSS Effects
- `.cyber-grid` - Animated grid background
- `.text-glow` - Neon text glow effect
- `.neon-border` - Glowing border effect
- `.cyber-card` - Glassmorphism card style
- `.glitch` - Glitch animation
- `.scan-lines` - CRT scan line overlay
- `.terminal-cursor` - Blinking cursor
- `.float` - Floating animation
- `.pulse-glow` - Pulsing glow effect
- `.gradient-text` - Gradient text fill

## 📁 Project Structure

```
src/
├── assets/              # Logo images
├── components/
│   ├── ui/              # Shadcn components
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── EventDetailsSection.tsx
│   ├── HackathonSection.tsx
│   ├── CTFSection.tsx
│   ├── ExpertSessionsSection.tsx
│   ├── ScheduleSection.tsx
│   ├── VenueSection.tsx
│   ├── SponsorsSection.tsx
│   ├── Footer.tsx
│   └── CyberBackground.tsx
├── pages/
│   └── Index.tsx
├── index.css            # Design system & custom styles
└── App.tsx              # Root component
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

© 2026 CyberFest 2026 | Digital Defence Club, CBIT
