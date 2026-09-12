/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg:         '#F6F6F3',
        surface:    '#FFFFFF',
        ink:        '#161616',
        muted:      '#6D6D68',
        border:     '#E7E7E2',
        bought:     '#EFF7F0',
        boughtInk:  '#3F7D52',
        accent:     '#C8E85A',
        accentDeep: '#8DA82C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '10px',
      },
    },
  },
  plugins: [],
}
