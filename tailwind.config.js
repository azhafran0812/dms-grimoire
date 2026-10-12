/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    colors: {
      parchment: {
        light: '#f4f1ea', // Latar belakang utama konten
        dark: '#e8e4d9',  // Hover states atau border
      },
      grimoire: {
        dark: '#1a1a1a',  // Sidebar dan teks utama
        gold: '#cda873',  // Aksen tombol dan border
        accent: '#2c3539', // Card background untuk dark mode
      }
    },
    fontFamily: {
      'fantasy-serif': ['Cinzel', 'serif'], // Untuk judul (DM's Grimoire)
      'sans': ['Inter', 'sans-serif'], // Untuk teks UI yang mudah dibaca
    }
  }
},
  plugins: [],
}