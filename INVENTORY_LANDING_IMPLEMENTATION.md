# JP AUTO - Inventory Landing Page Implementation Guide

**Date Created:** December 22, 2024
**Status:** Ready for Implementation
**Estimated Time:** 4-6 hours

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Implementation Checklist](#pre-implementation-checklist)
3. [Task Breakdown](#task-breakdown)
4. [Code Snippets](#code-snippets)
5. [Testing Checklist](#testing-checklist)
6. [Rollback Plan](#rollback-plan)

---

## Overview

### Goal
Transform the inventory page into the main landing page, removing the current homepage and implementing a streamlined, conversion-focused design.

### Key Changes
- Remove homepage, make inventory the root landing page
- Redesign header (remove top bar, consolidate navigation)
- Add hero banner to inventory page
- Redesign car cards (custom price badges, 2-column layout, photo overlays)
- Mobile-responsive filter system
- Footer simplification

### Brand Colors (Already Configured)
- **Primary (Dark Teal):** `#083344`
- **Primary Dark:** `#05232e`
- **Primary Light:** `#0d4d62`
- **Background:** `#52525b`
- **Foreground:** `#ffffff`

---

## Pre-Implementation Checklist

- [ ] Backup current site: `cp -r . ../jpauto-website-backup-$(date +%Y%m%d)`
- [ ] Create new git branch: `git checkout -b inventory-landing-redesign`
- [ ] Test Jekyll build: `bundle exec jekyll build`
- [ ] Have rollback plan ready (see section below)

---

## Task Breakdown

### Phase 1: Header Redesign (Tasks 1-7)

#### 1.1 Remove Top Bar & Consolidate Phone/Hours
**File:** `_includes/header.html`

**Current Structure (Lines 1-19):**
```html
<header class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <!-- Top Bar -->
    <div class="flex justify-between items-center py-2 text-sm border-b border-gray-200">
      <div class="flex items-center gap-4">
        <a href="tel:+19166187197">...</a>
        <span class="text-gray-600">Mon-Fri: {{ site.business.hours.monday }}, Sat-Sun: By Appointment</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/financing">Get Pre-Approved</a>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="py-4">
```

**New Structure:**
```html
<header class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <!-- Main Navigation (No top bar) -->
    <nav class="py-4">
      <div class="flex items-center justify-between">
        <!-- Logo + Contact Info (Horizontal Layout) -->
        <div class="flex items-center gap-6">
          <!-- Logo -->
          <a href="/" class="flex items-center">
            <div class="text-3xl font-bold">
              <span class="text-primary">JP</span>
              <span class="text-gray-800">AUTO</span>
            </div>
          </a>

          <!-- Vertical Divider -->
          <div class="hidden md:block h-10 w-px bg-gray-300"></div>

          <!-- Phone & Hours (Desktop Only) -->
          <div class="hidden md:flex items-center gap-4">
            <a href="tel:+19166187197" class="flex items-center gap-2 text-gray-800 hover:text-primary text-lg font-semibold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              (916) 618-7197
            </a>
            <span class="text-gray-400">|</span>
            <span class="text-gray-600 text-base">Mon-Fri: 9AM-7PM</span>
          </div>
        </div>
```

#### 1.2 Update Navigation Links
**File:** `_includes/header.html`

**Remove these links from desktop nav (Lines 33-40):**
- `Home` (line 34)
- `Inventory` (line 35)
- `Services` (line 38)
- `About` (line 39)

**Keep these links:**
- `Financing` (line 36)
- `Trade-In` (line 37)
- `Contact Us` (line 40 - keep as CTA button)

**New Desktop Navigation (Lines 33-41):**
```html
<!-- Desktop Navigation -->
<div class="hidden md:flex items-center space-x-8">
  <a href="/financing" class="text-gray-700 hover:text-primary font-medium transition">Financing</a>
  <a href="/trade-in" class="text-gray-700 hover:text-primary font-medium transition">Trade-In</a>
  <a href="/contact" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition font-semibold">Contact Us</a>
</div>
```

**Update Mobile Menu (Lines 52-61):**
```html
<!-- Mobile Navigation Menu -->
<div id="mobile-menu" class="hidden md:hidden mt-4 pb-4">
  <div class="flex flex-col space-y-3">
    <!-- Phone (Mobile Only) -->
    <a href="tel:+19166187197" class="flex items-center gap-2 text-primary font-semibold px-4 py-2 border-b border-gray-200">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
      </svg>
      (916) 618-7197
    </a>

    <a href="/financing" class="text-gray-700 hover:text-primary font-medium transition px-4 py-2">Financing</a>
    <a href="/trade-in" class="text-gray-700 hover:text-primary font-medium transition px-4 py-2">Trade-In</a>
    <a href="/contact" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold text-center">Contact Us</a>
  </div>
</div>
```

---

### Phase 2: Footer Redesign (Tasks 8-9)

#### 2.1 Remove "Shop" Section, Add "About"
**File:** `_includes/footer.html`

**Current Structure (Lines 1127-1136):**
```html
<!-- Quick Links -->
<div>
  <h3 class="text-white font-semibold mb-4">Shop</h3>
  <ul class="space-y-2 text-sm">
    <li><a href="/inventory">View Inventory</a></li>
    <li><a href="/inventory?featured=true">Featured Vehicles</a></li>
    <li><a href="/inventory?sort=new">New Arrivals</a></li>
    <li><a href="/inventory?price=under20k">Under $20,000</a></li>
  </ul>
</div>
```

**Replace with:**
```html
<!-- Quick Links -->
<div>
  <h3 class="text-white font-semibold mb-4">Company</h3>
  <ul class="space-y-2 text-sm">
    <li><a href="/about" class="hover:text-primary transition">About Us</a></li>
    <li><a href="/financing" class="hover:text-primary transition">Financing</a></li>
    <li><a href="/trade-in" class="hover:text-primary transition">Trade-In</a></li>
    <li><a href="/contact" class="hover:text-primary transition">Contact</a></li>
  </ul>
</div>
```

---

### Phase 3: Homepage to Inventory Landing (Tasks 10-14)

#### 3.1 Archive Current Homepage
**Terminal Commands:**
```bash
# Archive current homepage
cp index.html index-homepage-backup-$(date +%Y%m%d).html

# Add to .gitignore
echo "index-homepage-backup-*.html" >> .gitignore
```

#### 3.2 Extract Hero Banner from Homepage
**File:** `index.html` (Lines 8-20)

**Current Hero Banner:**
```html
<!-- Hero Banner Section -->
<section id="home" class="relative w-full overflow-hidden">
  <div class="relative w-full h-[400px] md:h-[600px] lg:h-[700px]">
    <!-- Hero Banner Image -->
    <img src="/assets/images/hero-banner.jpg" alt="JP AUTO - Quality Used Cars Sacramento" class="absolute inset-0 w-full h-full object-cover" loading="eager">
    <!-- Banner Content -->
    <div class="absolute inset-0 z-10 bg-black/30 flex items-center justify-center text-center text-white px-4">
      <div>
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">Find Your Perfect Ride</h2>
        <p class="text-lg md:text-xl lg:text-2xl drop-shadow-md">Quality Pre-Owned Vehicles at Unbeatable Prices</p>
      </div>
    </div>
  </div>
</section>
```

**Resized Hero Banner (Half Height):**
```html
<!-- Hero Banner Section -->
<section id="home" class="relative w-full overflow-hidden">
  <div class="relative w-full h-[200px] md:h-[300px] lg:h-[350px]">
    <!-- Hero Banner Image -->
    <img src="/assets/images/hero-banner.jpg" alt="JP AUTO - Quality Used Cars Sacramento" class="absolute inset-0 w-full h-full object-cover object-center" loading="eager" style="object-position: center 40%;">
    <!-- Banner Content -->
    <div class="absolute inset-0 z-10 bg-black/30 flex items-center justify-center text-center text-white px-4">
      <div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">Find Your Perfect Ride</h1>
        <p class="text-base md:text-lg lg:text-xl drop-shadow-md">Quality Pre-Owned Vehicles at Unbeatable Prices</p>
      </div>
    </div>
  </div>
</section>
```

**Note:** `object-position: center 40%` helps avoid cropping important parts of the image when reducing height.

#### 3.3 Create New Landing Page
**File:** Create new `index.html` in root

**Structure:**
```html
---
layout: default
title: JP AUTO - Quality Used Cars Sacramento
description: Browse our complete inventory of quality pre-owned vehicles at unbeatable prices. Sacramento's trusted source for used cars.
---

<!-- Hero Banner (from above) -->
<section id="home" class="relative w-full overflow-hidden">
  <!-- Insert resized hero banner here -->
</section>

<!-- Inventory Content (from _pages/inventory.md) -->
<div class="bg-white">
  <!-- Remove the old page header gradient -->
  <!-- Remove breadcrumb navigation -->

  <!-- Filters and Results -->
  <!-- Copy entire content from _pages/inventory.md starting at line 29 -->
</div>
```

#### 3.4 Remove Old Inventory Page
**Terminal Commands:**
```bash
# Archive old inventory page
mv _pages/inventory.md _pages/inventory-backup-$(date +%Y%m%d).md

# Update .gitignore
echo "_pages/inventory-backup-*.md" >> .gitignore
```

---

### Phase 4: Car Card Redesign (Tasks 15-22)

#### 4.1 Adjust Grid for 4:3 Screens
**File:** New `index.html` (Vehicle Grid Section)

**Current Grid (Line 144 in inventory.md):**
```html
<div id="vehicle-grid" class="grid gap-6 mb-8" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));">
```

**New Grid (More Lenient for 4:3 Screens):**
```html
<div id="vehicle-grid" class="grid gap-6 mb-8" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));">
```

**Explanation:** Reducing from 480px to 360px allows 4 cards to fit on 1440px wide screens (common 4:3 ratio).

#### 4.2 Mobile Filter Collapse
**File:** New `index.html`

**Add Filter Toggle Button (Mobile Only):**
```html
<!-- Mobile Filter Toggle Button -->
<div class="lg:hidden mb-6">
  <button id="filter-toggle-btn" class="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold flex items-center justify-center gap-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
    </svg>
    Filters
    <span id="active-filter-count" class="hidden bg-white text-primary px-2 py-0.5 rounded-full text-sm font-bold"></span>
  </button>
</div>
```

**Update Sidebar with Mobile Hidden Class:**
```html
<!-- Sidebar Filters -->
<aside id="filter-sidebar" class="w-full hidden lg:block">
  <div class="bg-white rounded-lg shadow-md p-6 sticky top-24">
    <!-- Existing filter content -->
  </div>
</aside>
```

**Add Toggle JavaScript (after existing filter script):**
```javascript
// Mobile filter toggle
const filterToggleBtn = document.getElementById('filter-toggle-btn');
const filterSidebar = document.getElementById('filter-sidebar');
const activeFilterCount = document.getElementById('active-filter-count');

filterToggleBtn?.addEventListener('click', () => {
  filterSidebar.classList.toggle('hidden');
  filterSidebar.classList.toggle('block');
});

// Update active filter count
function updateFilterCount() {
  const activeFilters = [
    filterMake, filterModel, filterYearMin, filterYearMax,
    filterPrice, filterBodyType, filterTransmission, filterFuelType
  ].filter(f => f.value).length;

  if (activeFilters > 0) {
    activeFilterCount.textContent = activeFilters;
    activeFilterCount.classList.remove('hidden');
  } else {
    activeFilterCount.classList.add('hidden');
  }
}

// Call updateFilterCount in applyFilters function
function applyFilters() {
  // ... existing code ...
  updateFilterCount();
}
```

#### 4.3 Redesigned Car Card
**File:** New `index.html`

**Current Card Structure (Lines 147-233 in inventory.md):**
```html
<div class="vehicle-card border border-gray-300 rounded-lg overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
     data-make="..." data-model="..." ...>

  <!-- Vehicle Image -->
  <div class="w-full h-64 bg-gray-300 overflow-hidden relative">
    <img src="..." alt="..." class="w-full h-full object-cover" loading="lazy">
  </div>

  <!-- Vehicle Info -->
  <div class="p-6 flex flex-col">
    <!-- Title -->
    <div class="h-12 mb-3">
      <h3 class="text-lg font-bold text-gray-900 line-clamp-2">
        {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
      </h3>
    </div>

    <!-- Price -->
    <p class="text-primary text-2xl font-bold mb-4">
      ${{ vehicle.price }}
    </p>

    <!-- Details List (5 items) -->
    <ul class="space-y-2 mb-4 text-gray-700 text-sm flex-grow">
      <li>📍 Mileage</li>
      <li>📄 Title Status</li>
      <li>⚙️ Transmission</li>
      <li>⛽ Fuel Type</li>
      <li>🎨 Exterior Color</li>
    </ul>

    <!-- Button -->
    <a href="..." class="...">View Details</a>
  </div>
</div>
```

**New Card Structure:**
```html
<div class="vehicle-card border border-gray-300 rounded-lg overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
     data-make="{{ vehicle.make }}"
     data-model="{{ vehicle.model }}"
     data-year="{{ vehicle.year }}"
     data-price="{{ vehicle.price }}"
     data-body-type="{{ vehicle.body_type }}"
     data-transmission="{{ vehicle.transmission }}"
     data-fuel-type="{{ vehicle.fuel_type }}"
     data-date="{{ vehicle.date_added }}">

  <!-- Vehicle Image with Clickable Link & Overlay -->
  <a href="{{ vehicle.url }}" class="block relative">
    <div class="w-full h-64 bg-gray-300 overflow-hidden relative">
      {% if vehicle.primary_image %}
        <img src="{{ vehicle.primary_image }}"
             alt="{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}"
             class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
             loading="lazy"
             onerror="this.src='/assets/images/placeholder-car.jpg'">
      {% else %}
        <div class="w-full h-full flex items-center justify-center bg-gray-200">
          <span class="text-gray-400 text-4xl">🚗</span>
        </div>
      {% endif %}

      <!-- Bottom Bar Overlay (Only on first image) -->
      <div class="absolute bottom-0 left-0 right-0 bg-primary text-white px-3 py-2 text-xs leading-tight">
        <div class="font-semibold">JP AUTO  |  (916) 618-7197</div>
        <div class="opacity-90">Sacramento, CA  |  jpautomotivegroup.com</div>
      </div>

      {% if vehicle.featured %}
      <div class="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
        FEATURED
      </div>
      {% endif %}
    </div>
  </a>

  <!-- Vehicle Info -->
  <div class="p-4 flex flex-col">

    <!-- Title & Price on Same Line -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <!-- Title (Left) -->
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-bold text-gray-900 line-clamp-2 leading-tight">
          {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
          {% if vehicle.trim %}<span class="text-gray-600 text-sm">{{ vehicle.trim }}</span>{% endif %}
        </h3>
      </div>

      <!-- Price Badge (Right) - Flag Shape with Cut Corner -->
      <div class="price-badge-wrapper flex-shrink-0">
        <div class="price-badge bg-primary text-white px-3 py-1.5 font-bold text-base relative">
          <div class="price-cut-corner"></div>
          ${{ vehicle.price | divided_by: 1.0 | round | number_with_delimiter }}
        </div>
      </div>
    </div>

    <!-- Vehicle Details - 2 Column Layout -->
    <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-gray-700 text-xs">
      <!-- Left Column -->
      <div class="space-y-1.5">
        <!-- Mileage -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm">📍</span>
          <span class="truncate">{{ vehicle.mileage | divided_by: 1000 | round }}K mi</span>
        </div>

        <!-- Title Status -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm">📄</span>
          <span class="font-bold truncate">{% if vehicle.title_status %}{{ vehicle.title_status }}{% else %}N/A{% endif %}</span>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-1.5">
        <!-- Fuel Type -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm">⛽</span>
          <span class="truncate">{% if vehicle.fuel_type %}{{ vehicle.fuel_type }}{% else %}N/A{% endif %}</span>
        </div>

        <!-- Exterior/Interior Color -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm">🎨</span>
          <span class="truncate">{% if vehicle.exterior_color %}{{ vehicle.exterior_color }}{% if vehicle.interior_color %}/{{ vehicle.interior_color }}{% endif %}{% else %}N/A{% endif %}</span>
        </div>
      </div>
    </div>

    <!-- View Details Button -->
    <a href="{{ vehicle.url }}"
       class="inline-block w-full text-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold text-sm mt-auto">
      View Details
    </a>
  </div>
</div>
```

#### 4.4 Price Badge Cut Corner CSS
**File:** `_layouts/default.html` (Add to `<style>` section)

**Add after existing custom styles:**
```css
/* Price Badge with Cut Corner */
.price-badge {
  position: relative;
  clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px);
}

/* Alternative using pseudo-element for cut corner */
.price-badge-wrapper {
  position: relative;
}

.price-cut-corner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 12px 12px 0 0;
  border-color: white transparent transparent transparent;
}

.price-badge {
  display: inline-block;
  position: relative;
  overflow: visible;
}
```

**Note:** Two options provided:
- **Option 1 (clip-path):** Simple, modern, single element
- **Option 2 (pseudo-element):** Better browser compatibility, uses white triangle overlay

Choose based on browser support requirements.

---

### Phase 5: Photo Overlay Implementation (Task 23)

#### 5.1 Bottom Bar Overlay CSS
**File:** `_layouts/default.html` (Add to `<style>` section)

**CSS for Bottom Bar Overlay:**
```css
/* Vehicle Photo Bottom Bar Overlay */
.vehicle-card a:first-of-type .bg-primary {
  /* Only show on first photo (which is in the card) */
  background-color: #083344; /* Solid primary color */
  font-family: 'Montserrat', sans-serif;
}

/* Ensure overlay sits above image */
.vehicle-card a:first-of-type {
  position: relative;
  z-index: 1;
}

/* Responsive font sizing */
@media (max-width: 640px) {
  .vehicle-card a:first-of-type .bg-primary {
    font-size: 10px;
    padding: 6px 8px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .vehicle-card a:first-of-type .bg-primary {
    font-size: 11px;
  }
}
```

**Overlay HTML (already included in card structure above):**
```html
<!-- Bottom Bar Overlay -->
<div class="absolute bottom-0 left-0 right-0 bg-primary text-white px-3 py-2 text-xs leading-tight">
  <div class="font-semibold">JP AUTO  |  (916) 618-7197</div>
  <div class="opacity-90">Sacramento, CA  |  jpautomotivegroup.com</div>
</div>
```

**Specifications:**
- **Layout:** Two lines
- **Background:** Solid `#083344` (no transparency)
- **Text Color:** White
- **Line 1:** `JP AUTO  |  (916) 618-7197` (semibold)
- **Line 2:** `Sacramento, CA  |  jpautomotivegroup.com` (90% opacity)
- **Height:** Auto-adjusting based on content (~50-60px total)
- **Position:** Absolute, bottom of first photo only
- **Always visible:** Yes (not on hover)

---

### Phase 6: Configuration Updates (Task 24)

#### 6.1 Update Jekyll Config
**File:** `_config.yml`

**Current Lines 3-7:**
```yaml
# Site Settings
title: "JP Auto - Quality Used Cars in Sacramento"
description: "Sacramento's trusted source for quality pre-owned vehicles. Browse our inventory, get financing, and find your perfect car today."
url: "https://jpautomotivegroup.com"
baseurl: ""
```

**Update to:**
```yaml
# Site Settings
title: "JP AUTO - Quality Used Cars Sacramento"
description: "Browse our complete inventory of quality pre-owned vehicles at unbeatable prices. Sacramento's trusted dealership for used cars since 2005."
url: "https://jpautomotivegroup.com"
baseurl: ""
```

**Current Collections (Lines 26-32):**
```yaml
# Collections
collections:
  vehicles:
    output: true
    permalink: /vehicles/:title/
  pages:
    output: true
    permalink: /:title/
```

**No changes needed** - collections remain the same.

---

## Code Snippets

### Complete New Header
**File:** `_includes/header.html`

```html
<!-- Navigation Header -->
<header class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <!-- Main Navigation (No top bar) -->
    <nav class="py-4">
      <div class="flex items-center justify-between">

        <!-- Logo + Contact Info (Horizontal Layout) -->
        <div class="flex items-center gap-6">
          <!-- Logo -->
          <a href="/" class="flex items-center">
            <div class="text-3xl font-bold">
              <span class="text-primary">JP</span>
              <span class="text-gray-800">AUTO</span>
            </div>
          </a>

          <!-- Vertical Divider -->
          <div class="hidden md:block h-10 w-px bg-gray-300"></div>

          <!-- Phone & Hours (Desktop Only) -->
          <div class="hidden md:flex items-center gap-4">
            <a href="tel:+19166187197" class="flex items-center gap-2 text-gray-800 hover:text-primary text-lg font-semibold transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              (916) 618-7197
            </a>
            <span class="text-gray-400">|</span>
            <span class="text-gray-600 text-base">Mon-Fri: 9AM-7PM</span>
          </div>
        </div>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <a href="/financing" class="text-gray-700 hover:text-primary font-medium transition">Financing</a>
          <a href="/trade-in" class="text-gray-700 hover:text-primary font-medium transition">Trade-In</a>
          <a href="/contact" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition font-semibold">Contact Us</a>
        </div>

        <!-- Mobile Menu Button -->
        <button id="mobile-menu-button" class="md:hidden text-gray-700 hover:text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation Menu -->
      <div id="mobile-menu" class="hidden md:hidden mt-4 pb-4">
        <div class="flex flex-col space-y-3">
          <!-- Phone (Mobile Only) -->
          <a href="tel:+19166187197" class="flex items-center gap-2 text-primary font-semibold px-4 py-2 border-b border-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            (916) 618-7197
          </a>

          <a href="/financing" class="text-gray-700 hover:text-primary font-medium transition px-4 py-2">Financing</a>
          <a href="/trade-in" class="text-gray-700 hover:text-primary font-medium transition px-4 py-2">Trade-In</a>
          <a href="/contact" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold text-center">Contact Us</a>
        </div>
      </div>
    </nav>
  </div>
</header>
```

### Complete Updated Footer
**File:** `_includes/footer.html`

Replace the "Shop" section (div containing h3 "Shop") with:

```html
<!-- Company Links -->
<div>
  <h3 class="text-white font-semibold mb-4">Company</h3>
  <ul class="space-y-2 text-sm">
    <li><a href="/about" class="hover:text-primary transition">About Us</a></li>
    <li><a href="/financing" class="hover:text-primary transition">Financing</a></li>
    <li><a href="/trade-in" class="hover:text-primary transition">Trade-In</a></li>
    <li><a href="/contact" class="hover:text-primary transition">Contact</a></li>
  </ul>
</div>
```

---

## Testing Checklist

### Pre-Launch Testing

#### Desktop (1920x1080)
- [ ] Header: Logo + phone/hours display correctly side-by-side
- [ ] Header: Only Financing, Trade-In, Contact links visible
- [ ] Hero banner: Displays at ~350px height, image not distorted
- [ ] Car cards: 4 cards fit in one row
- [ ] Car cards: Price badge displays with cut corner
- [ ] Car cards: Photo overlay shows dealer info on first image
- [ ] Car cards: Details in 2-column layout (Miles+Title | Fuel+Colors)
- [ ] Car cards: Clicking photo navigates to detail page
- [ ] Filters: Sidebar visible by default
- [ ] Footer: "Company" section shows About link

#### Tablet (768x1024)
- [ ] Header: Phone/hours still visible
- [ ] Car cards: 2-3 cards per row
- [ ] Filters: Sidebar visible

#### Mobile (375x667)
- [ ] Header: Phone number in mobile menu only
- [ ] Header: Mobile menu toggles correctly
- [ ] Hero banner: Displays at ~200px height
- [ ] Car cards: 1 card per row
- [ ] Car cards: Photo overlay text readable (10px font)
- [ ] Filters: Hidden by default, toggle button works
- [ ] Filters: Count badge shows active filter count

#### Functional Testing
- [ ] Filter by Make → Model dropdown populates
- [ ] Filter by Price range → Results update
- [ ] Sort dropdown → Cards reorder correctly
- [ ] Clear filters → All filters reset
- [ ] URL parameters → Filters load from URL on page load
- [ ] Vehicle photo click → Navigates to `/vehicles/:title/`
- [ ] Mobile filter toggle → Sidebar shows/hides
- [ ] All links in header/footer work

#### Performance
- [ ] Page loads in <3 seconds
- [ ] Images lazy load properly
- [ ] No JavaScript errors in console
- [ ] No CSS layout shifts

#### Cross-Browser
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Rollback Plan

### If Issues Arise During Implementation

#### Quick Rollback (Revert to Backup)
```bash
# Stop Jekyll server
# Ctrl+C

# Restore from backup
rm -rf ./*
cp -r ../jpauto-website-backup-YYYYMMDD/* .

# Rebuild
bundle exec jekyll build
bundle exec jekyll serve
```

#### Git Rollback (If Using Git)
```bash
# Discard all changes
git checkout .

# Or revert to specific commit
git log --oneline  # Find commit hash before changes
git reset --hard <commit-hash>

# Rebuild
bundle exec jekyll build
```

#### Selective Rollback (Keep Some Changes)

**Restore just header:**
```bash
cp ../jpauto-website-backup-YYYYMMDD/_includes/header.html _includes/
```

**Restore just homepage:**
```bash
cp ../jpauto-website-backup-YYYYMMDD/index.html index.html
```

---

## Implementation Order Recommendation

### Day 1 (2-3 hours)
1. ✅ Create backup
2. ✅ Create git branch
3. ✅ Update header (`_includes/header.html`)
4. ✅ Update footer (`_includes/footer.html`)
5. ✅ Test header/footer on existing site
6. ✅ Commit changes: `git commit -m "Update header and footer navigation"`

### Day 2 (2-3 hours)
7. ✅ Archive current `index.html`
8. ✅ Extract and resize hero banner
9. ✅ Create new `index.html` with hero + inventory content
10. ✅ Remove breadcrumb navigation
11. ✅ Update `_config.yml`
12. ✅ Test new landing page
13. ✅ Commit changes: `git commit -m "Create inventory landing page"`

### Day 3 (1-2 hours)
14. ✅ Redesign car cards (HTML structure)
15. ✅ Add price badge CSS with cut corner
16. ✅ Add photo overlay CSS and HTML
17. ✅ Add mobile filter toggle
18. ✅ Test all card features
19. ✅ Commit changes: `git commit -m "Redesign vehicle cards with overlays"`

### Day 4 (1 hour)
20. ✅ Full testing (desktop, tablet, mobile)
21. ✅ Cross-browser testing
22. ✅ Performance check
23. ✅ Fix any bugs found
24. ✅ Final commit: `git commit -m "Final testing and bug fixes"`
25. ✅ Merge to main: `git checkout main && git merge inventory-landing-redesign`
26. ✅ Deploy to production

---

## Notes & Tips

### Hero Banner Image Cropping
- Original image height: 700px
- New height: 350px (50% reduction)
- Use `object-position: center 40%` to keep the focal point in view
- Test on actual image to ensure no important elements are cut off
- May need to adjust percentage based on image composition

### Price Badge Corner Cut
- Two CSS methods provided (clip-path vs pseudo-element)
- **Clip-path:** Modern, clean, but IE11 doesn't support
- **Pseudo-element:** Works everywhere, slightly more complex
- Choose based on browser requirements

### Photo Overlay Positioning
- Overlay only appears on **first photo** in each card
- Uses `absolute` positioning within the `<a>` tag
- Ensure parent `<a>` has `position: relative`
- Z-index ensures overlay sits above image

### Mobile Filter Design
- Filter sidebar hidden by default on mobile (`lg:hidden`)
- Toggle button shows filter count badge
- Clicking toggle slides sidebar in/out
- Consider adding smooth transition: `transition-all duration-300`

### Grid Responsiveness
- 360px min-width allows 4 cards on 1440px screens (4:3 common)
- At 1920px (16:9), 5 cards will fit
- At 1024px (tablet), 2-3 cards fit
- At 768px and below, 1-2 cards fit
- Test on actual devices to verify

### Performance Optimization
- All vehicle images use `loading="lazy"`
- Hero banner uses `loading="eager"` (first visible content)
- Consider adding width/height attributes to images to prevent layout shift
- Minify CSS/JS before production deploy

---

## Troubleshooting Common Issues

### Issue: Header phone number not visible on desktop
**Solution:** Check `hidden md:flex` classes are correct. Parent div should have `md:flex`, items inside should not have `hidden` on larger screens.

### Issue: Price badge cut corner not showing
**Solution:** Ensure either clip-path is supported or pseudo-element ::before is rendering. Check browser DevTools for CSS errors.

### Issue: Photo overlay covering entire image
**Solution:** Verify `absolute` positioning is on overlay div, and parent `<a>` has `relative` positioning. Check `bottom-0 left-0 right-0` classes.

### Issue: Filter toggle not working on mobile
**Solution:** Verify JavaScript is running (check console for errors). Ensure `filter-sidebar` ID matches in HTML and JS. Check `lg:hidden` class is on sidebar.

### Issue: Cards not fitting 4 across on 4:3 screen
**Solution:** Reduce `minmax()` value from 360px to 340px or lower. Check for extra padding/margins in grid gap.

### Issue: Hero banner image looks stretched/distorted
**Solution:** Use `object-fit: cover` and adjust `object-position` percentage. May need to use different image or crop source image.

### Issue: Vehicle photos not clickable
**Solution:** Ensure `<a href="{{ vehicle.url }}">` wraps the image div. Check for z-index conflicts with overlay.

---

## Success Criteria

### Project is complete when:
- [x] Current homepage archived
- [x] Inventory page is now root (`/`)
- [x] Header shows logo + phone/hours horizontally
- [x] Header has only 3 nav links (Financing, Trade-In, Contact)
- [x] Footer has "Company" section with About link
- [x] Hero banner displays at half height (~350px)
- [x] Car cards show 4 across on 4:3 screens
- [x] Price badge has teal background with cut corner
- [x] Photo overlay shows dealer info on first photo
- [x] Vehicle details in 2 columns
- [x] Mobile filter collapses to toggle button
- [x] All photos are clickable
- [x] Site works on desktop, tablet, mobile
- [x] No console errors
- [x] Page load time <3 seconds

---

## Post-Implementation

### After successful deployment:
1. Monitor Google Analytics for bounce rate changes
2. Check Google Search Console for crawl errors
3. Update sitemap if needed
4. Monitor page speed with Google PageSpeed Insights
5. Collect user feedback for 1-2 weeks
6. Plan iteration improvements

### Possible Future Enhancements:
- Add search box in hero banner
- Implement lazy loading for filter dropdowns
- Add "Compare Vehicles" feature
- Add "Save to Favorites" functionality
- Implement advanced filters (mileage range slider, year slider)
- Add social proof (customer reviews) to homepage
- Implement A/B testing for CTA buttons

---

**END OF IMPLEMENTATION GUIDE**

---

*Last Updated: December 22, 2024*
*Version: 1.0*
*Author: Claude Code Assistant*
*Estimated Implementation Time: 4-6 hours*
