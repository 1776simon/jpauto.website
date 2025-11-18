# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML website for a used car dealership (JP AUTO). The entire site is contained in a single `index.html` file using Tailwind CSS for styling.

## Architecture

- **Single-file application**: All HTML and structure are in `index.html:1-430`
- **No build process**: This is a static site with no compilation or bundling required
- **Tailwind CSS via CDN**: Uses Tailwind CSS CDN for styling (index.html:7)

## Development Commands

**View the site**: Open `index.html` directly in a web browser, or use a local server:
```bash
# Python 3
python -m http.server 8000

# Node.js (if http-server is installed)
npx http-server
```

Then navigate to `http://localhost:8000`

## Structure

The HTML file contains these main sections:
- Fixed navigation header (index.html:23-66)
- Hero section with call-to-action (index.html:69-83)
- Vehicle search bar (index.html:86-126)
- Quick links section (index.html:129-178)
- Featured vehicles grid (index.html:181-238)
- "Why Choose Us" features section (index.html:241-263)
- Finance options (index.html:266-296)
- Trade-in section (index.html:299-331)
- Service & maintenance (index.html:334-359)
- Testimonials (index.html:362-401)
- Contact information section (index.html:404-421)
- Footer (index.html:424-428)

## Styling

The site uses Tailwind CSS via CDN with custom configuration (index.html:7-19):
- **Custom colors**: Primary orange (#ff6b35) and primary-dark (#e55a28)
- **Responsive design**: Mobile-first with responsive breakpoints (md, lg)
- **Utility-first approach**: All styling done with Tailwind utility classes
- **Animations**: Hover effects using transitions and transforms
