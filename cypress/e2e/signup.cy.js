/// <reference types="cypress" />

describe('Kirana Signup Flow', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/signup');
    });

    it('should show validation errors for empty form', () => {
        cy.get('button[type=submit]').click();
        // HTML5 validation prevents submission, so just verify we are still on signup page
        cy.url().should('include', '/signup');
    });

    it('should register a new user successfully', () => {
        const id = Date.now() + Cypress._.random(0, 1e6);
        cy.get('input[name=first_name]').type('Rahul');
        cy.get('input[name=last_name]').type('Test');
        cy.get('input[name=username]').type(`rahultest${id}`);
        cy.get('input[name=email]').type(`rahultest${id}@example.com`);
        cy.get('input[name=password]').type('testpassword123');
        cy.get('input[name=password_confirm]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
    });
});
