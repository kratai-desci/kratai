# Kratai Brand & Design Theme

**Version**: 1.0  
**Last Updated**: June 11, 2026  
**Purpose**: Design system for consistent branding across extension, landing page, and marketing materials

---

## 🎨 Color Palette

### Primary Colors

**Brand Yellow (Primary)**
```
#F4D03F - Main brand color (Kratai rabbit yellow)
#D4AF37 - Gold accent
#C9A227 - Darker shade for hover states
```

**Neutral Dark (Background)**
```
#1E1E1E - Primary dark background
#252526 - Secondary background
#2D2D30 - Card/panel background
#3E3E42 - Border color
```

**Neutral Light (Text)**
```
#FFFFFF - Primary text on dark
#CCCCCC - Secondary text
#808080 - Tertiary text / muted
```

### Semantic Colors

**Success / Added**
```
#4CAF50 - Success green (git added)
#81C784 - Light green (hover)
```

**Warning / Modified**
```
#FFC107 - Warning yellow (git modified)
#FFD54F - Light yellow (hover)
```

**Error / Deleted**
```
#F44336 - Error red (git deleted)
#E57373 - Light red (hover)
```

**Info / Links**
```
#2196F3 - Info blue
#64B5F6 - Light blue (hover)
```

---

## 🔤 Typography

### Font Families

**Primary (UI)**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Code / Monospace**
```css
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### Font Sizes

```
Hero Heading: 48px / 3rem (bold)
H1: 36px / 2.25rem (semi-bold)
H2: 28px / 1.75rem (semi-bold)
H3: 24px / 1.5rem (medium)
H4: 20px / 1.25rem (medium)
Body: 16px / 1rem (regular)
Small: 14px / 0.875rem (regular)
Tiny: 12px / 0.75rem (regular)
```

### Font Weights

```
Light: 300
Regular: 400
Medium: 500
Semi-bold: 600
Bold: 700
```

### Line Heights

```
Tight: 1.2 (headings)
Normal: 1.5 (body text)
Relaxed: 1.75 (long-form content)
```

---

## 🎯 Logo & Iconography

### Logo

**Primary Logo**: White rabbit silhouette on transparent background  
**Icon Size**: 128x128px minimum for app icons  
**Safe Area**: 10% padding on all sides  

**Logo Variations**:
- `icon.png` - Dark rabbit on light background (marketplace thumbnail)
- `icon_white.png` - White rabbit on dark background (preferred for dark themes)
- `icon.svg` - Scalable vector version

**Logo Usage**:
- Minimum size: 32x32px
- Clearspace: Logo height × 0.5 on all sides
- Never stretch or distort
- Always maintain aspect ratio

### Iconography Style

**Style**: Outline/line icons with 2px stroke  
**Size**: 24×24px, 20×20px, 16×16px  
**Color**: Match text color or use brand yellow for emphasis  
**Examples**: From Material Icons or Heroicons

---

## 📐 Layout & Spacing

### Spacing Scale

Based on 8px grid system:

```
xs:  4px  (0.25rem)
sm:  8px  (0.5rem)
md:  16px (1rem)
lg:  24px (1.5rem)
xl:  32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
4xl: 96px (6rem)
```

### Layout Grid

**Desktop**: 12-column grid, 24px gutters  
**Tablet**: 8-column grid, 16px gutters  
**Mobile**: 4-column grid, 16px gutters  

**Max Content Width**: 1280px (center aligned)  
**Sidebar Width**: 280px (navigation)  

---

## 🎭 Component Styles

### Buttons

**Primary Button**
```css
background: #F4D03F;
color: #1E1E1E;
padding: 12px 24px;
border-radius: 6px;
font-weight: 600;
transition: all 0.2s ease;

hover: {
  background: #D4AF37;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 208, 63, 0.3);
}
```

**Secondary Button**
```css
background: transparent;
color: #FFFFFF;
border: 2px solid #3E3E42;
padding: 10px 22px;
border-radius: 6px;
font-weight: 500;

hover: {
  border-color: #F4D03F;
  color: #F4D03F;
}
```

**Ghost Button**
```css
background: transparent;
color: #CCCCCC;
padding: 12px 24px;

hover: {
  color: #F4D03F;
}
```

### Cards

**Default Card**
```css
background: #2D2D30;
border: 1px solid #3E3E42;
border-radius: 8px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

hover: {
  border-color: #F4D03F;
  box-shadow: 0 4px 16px rgba(244, 208, 63, 0.15);
}
```

### Inputs

**Text Input**
```css
background: #1E1E1E;
border: 1px solid #3E3E42;
border-radius: 4px;
padding: 10px 12px;
color: #FFFFFF;
font-size: 14px;

focus: {
  border-color: #F4D03F;
  outline: none;
  box-shadow: 0 0 0 3px rgba(244, 208, 63, 0.1);
}
```

### Navigation

**Header**
```css
background: rgba(30, 30, 30, 0.95);
backdrop-filter: blur(10px);
border-bottom: 1px solid #3E3E42;
height: 64px;
position: sticky;
top: 0;
z-index: 100;
```

**Nav Links**
```css
color: #CCCCCC;
font-size: 14px;
font-weight: 500;
padding: 8px 16px;
transition: color 0.2s ease;

hover: {
  color: #F4D03F;
}

active: {
  color: #F4D03F;
  border-bottom: 2px solid #F4D03F;
}
```

---

## 🎬 Animations & Transitions

### Timing Functions

```
ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94) - Default
ease-in-out: cubic-bezier(0.42, 0, 0.58, 1) - Smooth
bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) - Playful
```

### Duration

```
Fast: 150ms - Hover states, small changes
Normal: 250ms - Most transitions
Slow: 400ms - Page transitions, large movements
```

### Common Animations

**Fade In**
```css
animation: fadeIn 0.4s ease-out;

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up**
```css
animation: slideUp 0.4s ease-out;

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Scale In**
```css
animation: scaleIn 0.3s ease-out;

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

---

## 🖼️ Image & Media Guidelines

### Screenshots

**Format**: PNG with transparency for UI elements  
**Dimensions**: 
- Hero screenshot: 1920×1080px
- Feature screenshots: 1280×720px
- Thumbnails: 640×360px

**Border**: 1px solid #3E3E42  
**Border Radius**: 8px  
**Shadow**: `0 8px 24px rgba(0, 0, 0, 0.4)`

### GIF Demos

**Frame Rate**: 30fps  
**Duration**: 5-10 seconds (loop)  
**Size**: Max 5MB  
**Dimensions**: 1280×720px or 1920×1080px

### Icons & Illustrations

**Style**: Minimalist, line-based  
**Colors**: Use brand yellow (#F4D03F) as accent  
**Background**: Transparent or dark (#1E1E1E)

---

## 🎨 Diagram-Specific Styling

### Class Diagram Colors

**Class Box**
```css
background: #2D2D30;
border: 2px solid #3E3E42;
border-radius: 4px;
```

**Interface Box**
```css
background: transparent;
border: 2px dashed #3E3E42;
border-radius: 4px;
```

**Git Change States**
```
Added: #4CAF50 (green background)
Modified: #FFC107 (yellow background)
Deleted: #F44336 (red, strikethrough text)
```

**Relationships**
```
Inheritance: Solid line, triangle arrow (#808080)
Implementation: Dashed line, triangle arrow (#808080)
Composition: Solid line, filled diamond (#808080)
Uses/Dependency: Dashed line, open arrow (#606060)
```

### Sequence Diagram Colors

**Actor/Class Boxes**
```css
border: 2px solid #3E3E42;
background: #2D2D30;
```

**Lifelines**
```css
stroke: #3E3E42;
stroke-width: 2px;
stroke-dasharray: 5, 5;
```

**Method Calls**
```
Entry arrow: #F4D03F (yellow, solid)
Return arrow: #808080 (gray, dashed)
```

---

## 🌐 Web-Specific Guidelines

### Landing Page Sections

**Hero Section**
- Full viewport height (100vh)
- Centered content with demo GIF
- Large heading with brand yellow accent
- CTA buttons: Primary (yellow) + Secondary (outlined)

**Features Section**
- 3-column grid on desktop, 1-column on mobile
- Icon + heading + description format
- Screenshots with hover effects

**Visual Tour Section**
- Large screenshots with captions
- Side-by-side layout on desktop
- Stacked on mobile

**Footer**
- Dark background (#1E1E1E)
- 4-column layout (Product, Resources, Company, Social)
- Small brand logo and copyright

### Code Blocks

```css
background: #1E1E1E;
border: 1px solid #3E3E42;
border-radius: 6px;
padding: 16px;
font-family: 'SF Mono', monospace;
font-size: 14px;
line-height: 1.6;
color: #CCCCCC;

/* Syntax highlighting */
keyword: #569CD6;
string: #CE9178;
function: #DCDCAA;
comment: #6A9955;
```

---

## ✅ Brand Voice & Tone

**Voice**: Professional yet approachable, technical but friendly

**Tone Characteristics**:
- Clear and concise
- Confident without being arrogant
- Helpful and educational
- Enthusiastic about code visualization

**Example Phrases**:
- ✅ "Visualize your codebase at a glance"
- ✅ "See what changed between commits"
- ✅ "Works great with polyglot codebases"
- ❌ "Revolutionary AI-powered mega tool"
- ❌ "The ultimate solution you've been waiting for"

---

## 📦 Design Assets Location

All design assets are stored in:
```
/demo/           - Demo GIF and screenshots
/icon.png        - Dark logo
/icon_white.png  - Light logo (preferred)
/icon.svg        - Vector logo
```

---

## 🎯 Quick Reference

**Primary Action Color**: `#F4D03F` (Brand Yellow)  
**Background**: `#1E1E1E` (Dark)  
**Text**: `#FFFFFF` (White)  
**Border**: `#3E3E42` (Gray)  
**Border Radius**: `6px` (buttons), `8px` (cards)  
**Font**: System font stack  
**Spacing Unit**: `8px` base  

---

**Use this theme guide to maintain visual consistency across all Kratai properties!** 🎨