/// <reference types="cypress" />

describe('Kirana Navbar and Logout', () => {
    it('should show correct links for unauthenticated user', () => {
        cy.visit('http://localhost:3000/');
        cy.contains('Login');
        cy.contains('Sign Up');
    });

    it('should logout successfully', () => {
        // Login as test user (replace with valid credentials)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('testuser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
        cy.contains('Logout').click();
        cy.url().should('eq', 'http://localhost:3000/');
        cy.contains('Login');
    });
});
