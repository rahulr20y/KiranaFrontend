/// <reference types="cypress" />

describe('Shopkeeper Dashboard', () => {
    beforeEach(() => {
        // Login as shopkeeper (replace with valid shopkeeper credentials)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('shopkeeperuser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
    });

    it('should display shopkeeper stats', () => {
        cy.contains('Shopkeeper Dashboard');
        cy.contains('Preferred Dealers');
    });

    it('should follow and unfollow a dealer', () => {
        cy.contains('Dealers').click();
        cy.get('button').contains('Follow').first().click();
        cy.contains('Unfollow');
        cy.get('button').contains('Unfollow').first().click();
        cy.contains('Follow');
    });
});
