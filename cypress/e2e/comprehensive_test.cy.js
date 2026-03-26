/// <reference types="cypress" />

describe('Kirana Application - Comprehensive UI Test', () => {
    const baseUrl = 'https://kiranafrontend.vercel.app';
    const timestamp = Date.now();
    
    // User credentials
    const dealer = {
        username: `dealer_${timestamp}`,
        email: `dealer_${timestamp}@example.com`,
        password: 'Password123!',
        firstName: 'Dinesh',
        lastName: 'Dealer'
    };

    const shopkeeper = {
        username: `shopkeeper_${timestamp}`,
        email: `shopkeeper_${timestamp}@example.com`,
        password: 'Password123!',
        firstName: 'Suresh',
        lastName: 'Shopkeeper'
    };

    const testProduct = {
        name: `Test Product ${timestamp}`,
        description: 'High quality test product for automated verification.',
        price: '450',
        stock: '100'
    };

    it('should verify the landing page loads correctly', () => {
        cy.visit(baseUrl);
        cy.contains('Kirana').should('be.visible');
        cy.contains('Dealers').should('be.visible');
        cy.contains('Shopkeepers').should('be.visible');
        cy.contains('Login').should('be.visible');
        cy.get('a[href="/signup"]').first().click();
        cy.url().should('include', '/signup');
    });

    it('should register a new Dealer and add a product', () => {
        cy.visit(`${baseUrl}/signup`);
        
        // Fill signup form
        cy.get('select[name="user_type"]').select('dealer');
        cy.get('input[name="first_name"]').type(dealer.firstName);
        cy.get('input[name="last_name"]').type(dealer.lastName);
        cy.get('input[name="email"]').type(dealer.email);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('input[name="password_confirm"]').type(dealer.password);
        
        cy.get('button[type="submit"]').click();

        // Wait for token persistence and redirect
        cy.wait(2000);
        cy.url().should('include', '/dashboard');
        cy.contains('Dealer Dashboard').should('be.visible');
        cy.contains(dealer.firstName).should('be.visible');

        // Add a product
        cy.contains('+ Add Product').click();
        cy.get('input[name="name"]').type(testProduct.name);
        cy.get('textarea[name="description"]').type(testProduct.description);
        cy.get('input[name="price"]').type(testProduct.price);
        cy.get('input[name="stock_quantity"]').type(testProduct.stock);
        
        // The mock backend might need a category if it's strict, 
        // but current frontend categories are loaded from API. 
        // Let's see if we can just submit.
        cy.get('button').contains('Add Product').click();
        cy.wait(1000);

        // Verify product appears in the list
        cy.contains(testProduct.name).should('be.visible');
        cy.contains(`₹${testProduct.price}`).should('be.visible');
    });

    it('should register a new Shopkeeper, browse and order the product', () => {
        cy.visit(`${baseUrl}/signup`);
        
        // Fill signup form
        cy.get('select[name="user_type"]').select('shopkeeper');
        cy.get('input[name="first_name"]').type(shopkeeper.firstName);
        cy.get('input[name="last_name"]').type(shopkeeper.lastName);
        cy.get('input[name="email"]').type(shopkeeper.email);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('input[name="password_confirm"]').type(shopkeeper.password);
        
        cy.get('button[type="submit"]').click();

        // Wait for token persistence and redirect
        cy.wait(2000);
        cy.url().should('include', '/dashboard');
        cy.contains('Shopkeeper Dashboard').should('be.visible');

        // Confirm we are logged in by checking navbar
        cy.get('button').contains('Logout').should('be.visible');

        // Browse products - use the Navbar link directly
        // Instead of clicking, visit to be sure (Cypress visit with existing localStorage is fine)
        cy.visit(`${baseUrl}/products`);
        cy.url().should('include', '/products');

        // Search for the newly created product
        cy.get('input[placeholder*="Search"]').type(testProduct.name);
        
        // Wait for results
        cy.contains(testProduct.name).should('be.visible');
        
        // Place an order
        // Find the specific product card and click order
        cy.contains(testProduct.name)
            .parents('[class*="productCard"]')
            .find('button')
            .contains('Order')
            .click();

        // Check for success message
        cy.contains('Order placed successfully').should('be.visible');
    });

    it('should verify profile information in dashboard', () => {
        // Login as the shopkeeper we just created
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/dashboard');
        
        // Switch to Profile tab
        cy.contains('Profile').click();
        
        // Check shop name (backend defaults it)
        cy.contains('Shop Name').should('be.visible');
        cy.contains(shopkeeper.firstName).should('be.visible');
    });
});
