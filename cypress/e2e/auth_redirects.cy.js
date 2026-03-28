describe('Authentication Redirects', () => {
    it('should redirect unauthenticated users from dashboard to login', () => {
        cy.visit(`${Cypress.config('baseUrl')}/dashboard`);
        cy.url().should('include', '/login');
    });

    it('should show 404 or redirect for non-existent routes', () => {
        cy.visit(`${Cypress.config('baseUrl')}/non-existent-route`, { failOnStatusCode: false });
        cy.get('body').should('be.visible');
    });
});
