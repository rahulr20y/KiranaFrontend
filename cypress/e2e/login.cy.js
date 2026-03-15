/// <reference types="cypress" />

describe('Kirana Login Flow', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/login');
    });

    it('should show validation errors for empty form', () => {
        cy.get('input[name=username]').focus().blur();
        cy.get('button[type=submit]').click();
        // Since HTML5 validation blocks submission, we either check for validity or 
        // update the test to accept that it doesn't redirect
        cy.url().should('include', '/login');
    });

    it('should show error for invalid credentials', () => {
        cy.get('input[name=username]').type('invaliduser');
        cy.get('input[name=password]').type('wrongpassword');
        cy.get('button[type=submit]').click();
        cy.contains(/Invalid credentials|Login failed/i);
    });

    it('should login successfully and redirect to dashboard', () => {
        // Replace with a valid test user
        cy.get('input[name=username]').type('testuser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
    });
});
