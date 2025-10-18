// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {}, // Should be 'tailwindcss', NOT '@tailwindcss/postcss'
    autoprefixer: {},
  },
}