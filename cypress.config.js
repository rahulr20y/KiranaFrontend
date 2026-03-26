const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        baseUrl: 'https://kiranafrontend.vercel.app',
        specPattern: 'cypress/e2e/**/*.cy.js',
        supportFile: false,
        video: true,
        defaultCommandTimeout: 10000,
    },
});
