/// <reference types="cypress" />

describe('Dealer Dashboard', () => {
    beforeEach(() => {
        // Login as dealer (replace with valid dealer credentials)
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type('dealeruser');
        cy.get('input[name=password]').type('testpassword123');
        cy.get('button[type=submit]').click();
        cy.url().should('include', '/dashboard');
    });

    it('should display dealer stats', () => {
        cy.contains('Dealer Dashboard');
        cy.contains('Total Products');
    });

    it('should open add product form', () => {
        cy.contains('Add Product').click();
        cy.get('input[name=name]').should('exist');
    });

    it('should add a new product', () => {
        cy.contains('Add Product').click();
        cy.get('input[name=name]').type('Test Product');
        cy.get('input[name=description]').type('Test Description');
        cy.get('input[name=price]').type('100');
        cy.get('input[name=stock_quantity]').type('10');
        cy.get('select[name=category]').select(1);
        cy.get('button[type=submit]').click();
        cy.contains('Test Product');
    });
});
