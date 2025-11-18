# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML website for a used car dealership (AutoDrive Motors). The entire site is contained in a single `index.html` file using Tailwind CSS for styling.

## Architecture

- **Single-file application**: All HTML and structure are in `index.html:1-156`
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
- Fixed navigation header (index.html:23-33)
- Hero section with call-to-action (index.html:36-43)
- Featured vehicles grid (index.html:46-103)
- "Why Choose Us" features section (index.html:106-128)
- Contact information section (index.html:131-148)
- Footer (index.html:151-153)

## Styling

The site uses Tailwind CSS via CDN with custom configuration (index.html:7-19):
- **Custom colors**: Primary orange (#ff6b35) and primary-dark (#e55a28)
- **Responsive design**: Mobile-first with responsive breakpoints (md, lg)
- **Utility-first approach**: All styling done with Tailwind utility classes
- **Animations**: Hover effects using transitions and transforms
