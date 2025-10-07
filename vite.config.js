const { defineConfig } = require('vite')
const { resolve } = require('path')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        idl: resolve(__dirname, 'IDL/index.html'),
        bball: resolve(__dirname, 'Bball/index.html'),
        agora: resolve(__dirname, 'agora 21/index.html'),
        agoraCaseStudy: resolve(__dirname, 'agora 21/casestudy/index.html')
      }
    }
  }
})
