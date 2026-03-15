/// <reference types="cypress" />

describe('Kirana Products Page', () => {
    beforeEach(() => {
        // Login first (replace with valid test user)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('testuser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
        cy.visit('http://localhost:3000/products');
    });

    it('should display products and categories', () => {
        cy.contains('Browse Products');
        cy.get('input[placeholder="Search products..."]').should('exist');
    });

    it('should search for a product', () => {
        cy.get('input[placeholder="Search products..."]').type('test');
        cy.get('button').contains('Search').click();
        cy.contains('test', { matchCase: false });
    });

    it('should filter by category', () => {
        cy.get('select').first().select(1); // Select first category
    });

    it('should sort products', () => {
        cy.get('select').eq(1).select('price-asc');
        cy.get('select').eq(1).select('price-desc');
        cy.get('select').eq(1).select('name');
    });

    it('should place an order', () => {
        cy.get('button').contains('Order').first().click();
        cy.contains('Order placed successfully!');
    });
});
