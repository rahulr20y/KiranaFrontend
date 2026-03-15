/// <reference types="cypress" />

describe('Kirana Dashboard Access', () => {
    it('should redirect unauthenticated user to login', () => {
        cy.visit('http://localhost:3000/dashboard');
        cy.url().should('include', '/login');
    });

    it('should show dealer dashboard for dealer', () => {
        // Login as dealer (replace with valid dealer credentials)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('dealeruser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
        cy.contains('Dealer Dashboard');
    });

    it('should show shopkeeper dashboard for shopkeeper', () => {
        // Login as shopkeeper (replace with valid shopkeeper credentials)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('shopkeeperuser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
        cy.contains('Shopkeeper Dashboard');
    });
});
