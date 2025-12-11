# JP AUTO Brand System

This is the centralized brand system for JP AUTO. All colors, spacing, and design tokens are defined here.

## Files

- **tokens.json** - Source of truth for all brand tokens
- **dist/brand.css** - CSS variables for all tokens
- **dist/tokens.js** - JavaScript/ES6 exports
- **dist/tailwind.config.js** - Tailwind configuration
- **dist/index.html** - Visual brand documentation

## Usage

### Option 1: CSS Variables (Recommended)

Import the CSS file in your HTML:

```html
<link rel="stylesheet" href="../brand/dist/brand.css">
```

Use variables in your CSS:

```css
.element {
  background: var(--color-background);
  color: var(--color-foreground);
}
```

### Option 2: Tailwind Config

Import in your `tailwind.config.js`:

```javascript
const brand = require('./brand/dist/tailwind.config.js');

module.exports = {
  theme: {
    extend: {
      colors: brand.colors,
      spacing: brand.spacing,
      borderRadius: brand.borderRadius,
      boxShadow: brand.boxShadow
    }
  }
}
```

### Option 3: Inline Tailwind (CDN)

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'primary': '#083344',
          'background': '#52525b'
        }
      }
    }
  }
</script>
```

## Making Changes

1. Edit `tokens.json`
2. Run `npm run build`
3. All projects automatically use the updated tokens

## View Documentation

Open `dist/index.html` in a browser to see the visual brand guide.
