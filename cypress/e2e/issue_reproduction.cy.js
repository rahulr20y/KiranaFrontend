describe('Issue Reproduction: Dealer Dashboard and Invoice', () => {
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000';
    const uniqueId = Math.random().toString(36).substring(2, 8);
    
    const dealer = {
        username: 'dealeruser',
        password: 'testpassword123',
        productName: `New_Product_${uniqueId}`
    };

    const shopkeeper = {
        username: 'shopkeeperuser',
        password: 'testpassword123'
    };

    it('should allow dealer to create product, shopkeeper to order, and dealer to see order and invoice', () => {
        // 1. Dealer Login
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/dashboard');
        cy.contains('Dealer Dashboard').should('be.visible');

        // 2. Add Product
        cy.contains('button', '+ Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('textarea[name="description"]').type('High quality product for testing.');
        cy.get('input[name="price"]').type('250');
        cy.get('input[name="stock_quantity"]').type('500');
        cy.get('button[type="submit"]').contains('Add Product').click();
        
        cy.contains('Product added successfully!').should('be.visible');
        
        // 3. Verify Product appears in dashboard
        cy.reload(); // Ensure fresh data
        cy.contains(dealer.productName).should('be.visible');

        cy.contains('Logout').click();

        // 4. Shopkeeper Login
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/dashboard');

        // 5. Place Order
        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.contains(dealer.productName).should('be.visible');
        cy.contains('button', 'Add to Cart').first().click();
        cy.contains('Cart').click();
        cy.contains('Confirm & Place Order').click();
        cy.contains('Order(s) placed successfully').should('be.visible');

        // 6. Verify Invoice Button exists and doesn't crash (basic check)
        cy.contains('Orders').click();
        cy.contains('Order #').first().parents('[class*="orderCard"]').within(() => {
            cy.contains('📄 Invoice').should('be.visible').click();
        });
        // We can't easily verify the PDF content in Cypress without plugins, but clicking it shouldn't crash the UI.

        cy.contains('Logout').click();

        // 7. Dealer Login to verify Order
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();
        
        cy.contains('Orders').click();
        cy.contains(dealer.productName).should('be.visible'); // The order card should show the product name
        
        // Check Invoice on Dealer side too
        cy.contains('Order #').first().parents('[class*="orderCard"]').within(() => {
            cy.contains('📄 Invoice').should('be.visible').click();
        });
    });
});
