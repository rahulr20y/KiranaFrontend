describe('Inventory Synchronization', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `dealer_${timestamp}`,
        email: `dealer_${timestamp}@example.com`,
        password: 'Password123!',
        productName: `Product_${timestamp}`,
        initialStock: 100,
        orderQuantity: 2
    };

    const shopkeeper = {
        username: `shop_${timestamp}`,
        email: `shop_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should deduct stock on order and restore on cancellation', () => {
        // 1. Dealer adds product
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Dealer', { force: true });
        cy.get('#last_name').type('One', { force: true });
        cy.get('#username').type(dealer.username, { force: true });
        cy.get('#email').type(dealer.email, { force: true });
        cy.get('#password').type(dealer.password, { force: true });
        cy.get('#password_confirm').type(dealer.password, { force: true });
        cy.get('#user_type').select('dealer', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('textarea[name="description"]').type('Inventory test product');
        cy.get('input[name="price"]').type('100');
        cy.get('input[name="stock_quantity"]').clear().type(dealer.initialStock.toString());
        cy.get('button').last().click();
        
        // Check dealer dashboard shows stock
        cy.contains(dealer.productName).parent().contains(dealer.initialStock.toString());
        cy.get('button').contains('Logout').click();

        // 2. Shopkeeper places order
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Shop', { force: true });
        cy.get('#last_name').type('One', { force: true });
        cy.get('#username').type(shopkeeper.username, { force: true });
        cy.get('#email').type(shopkeeper.email, { force: true });
        cy.get('#password').type(shopkeeper.password, { force: true });
        cy.get('#password_confirm').type(shopkeeper.password, { force: true });
        cy.get('#user_type').select('shopkeeper', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        cy.contains('nav a', 'Products').click();
        
        // Verify initial stock in marketplace
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.contains(dealer.productName).parent().contains(`Stock: ${dealer.initialStock}`);

        // Order 1 item (the code I modified orders 1 by default in pages/products.js)
        cy.get('button').contains('Order').click();
        cy.contains('Order placed successfully!').should('be.visible');

        // Check stock reduced to 99 in marketplace (my fix calls fetchData after order)
        cy.contains(`Stock: ${dealer.initialStock - 1}`, { timeout: 10000 }).should('be.visible');

        // 3. Shopkeeper cancels order and check stock restoration
        cy.get('button').contains('Dashboard').click();
        cy.get('button').contains('📋 Orders', { timeout: 15000 }).click();
        
        // Handle confirm dialog
        cy.on('window:confirm', () => true);

        // Click Cancel Order
        cy.get('button').contains('Cancel Order').first().click();
        
        // Wait for removal or status change
        cy.contains('cancelled', { timeout: 15000 }).should('be.visible');

        // Go back to products and verify stock is restored
        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.contains(`Stock: ${dealer.initialStock}`, { timeout: 15000 }).should('be.visible');
    });
});
