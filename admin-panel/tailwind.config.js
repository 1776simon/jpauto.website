/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material 3 Color Scheme - Orange Theme
        primary: {
          DEFAULT: '#ff6b35',
          light: '#ff9668',
          dark: '#e55a28',
          container: '#ffede8',
          'on-container': '#2d0800',
        },
        secondary: {
          DEFAULT: '#77574d',
          light: '#9d7a6e',
          dark: '#5d3f37',
          container: '#ffddd3',
          'on-container': '#2c160e',
        },
        surface: {
          DEFAULT: '#fffbff',
          variant: '#f5dfd9',
          dim: '#e3ddd9',
          bright: '#fffbff',
          container: '#f5f1ed',
          'container-low': '#fef6f2',
          'container-high': '#ebe7e3',
          'container-highest': '#e5e1dd',
        },
        outline: {
          DEFAULT: '#85736c',
          variant: '#d8c2ba',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#410002',
        },
        success: {
          DEFAULT: '#2e7d32',
          container: '#c8e6c9',
          'on-container': '#0d3d0f',
        },
      },
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '28px',
        'full': '9999px',
      },
      boxShadow: {
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-5': '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
