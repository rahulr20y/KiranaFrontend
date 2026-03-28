describe('Kirana Full Business Lifecycle', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `dealer_${timestamp}`,
        email: `dealer_${timestamp}@example.com`,
        password: 'Password123!',
        productName: `Product_${timestamp}`
    };

    const shopkeeper = {
        username: `shop_${timestamp}`,
        email: `shop_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should complete the entire business lifecycle: Dealer Setup -> Shopkeeper Order -> Stats Verification', () => {
        // --- 1. Dealer Signup ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Dinesh', { force: true });
        cy.get('#last_name').type('Wholesaler', { force: true });
        cy.get('#username').type(dealer.username, { force: true });
        cy.get('#email').type(dealer.email, { force: true });
        cy.get('#password').type(dealer.password, { force: true });
        cy.get('#password_confirm').type(dealer.password, { force: true });
        cy.get('#user_type').select('dealer', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        // Wait up to 5 minutes for Vercel deployment to propagate
        cy.contains('[v1.7 FORCED]', { timeout: 300000 }).should('be.visible');
        
        // Add a product
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('textarea[name="description"]').type('Self-verification test product.');
        cy.get('input[name="price"]').type('500');
        cy.get('input[name="stock_quantity"]').type('100');
        cy.get('button').contains('Add Product', { timeout: 10000 }).last().click();

        // Verify Total Products stat
        cy.get('div').contains('Total Products', { timeout: 15000 }).parent().find('div').first().should('have.text', '1');
        cy.get('button').contains('Logout').click();

        // --- 2. Shopkeeper Procurement ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Rajesh', { force: true });
        cy.get('#last_name').type('Retailer', { force: true });
        cy.get('#username').type(shopkeeper.username, { force: true });
        cy.get('#email').type(shopkeeper.email, { force: true });
        cy.get('#password').type(shopkeeper.password, { force: true });
        cy.get('#password_confirm').type(shopkeeper.password, { force: true });
        cy.get('#user_type').select('shopkeeper', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        
        // DEBUG LOG
        cy.intercept('GET', '**/shopkeepers/my_profile/').as('getShopProfile');
        cy.reload(true); // Force reload to get latest code
        cy.wait('@getShopProfile').then((interception) => {
            cy.log('SHOP PROFILE:', JSON.stringify(interception.response.body));
        });

        // Marketplace Ordering
        cy.contains('nav a', 'Products').click();
        cy.url().should('include', '/products');
        
        // Search and Order
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.get('h3', { timeout: 10000 }).contains(dealer.productName).should('be.visible');
        
        // Place Order
        cy.get('button').contains('Order').first().click();
        cy.get('div', { timeout: 15000 }).contains('Order placed successfully!').should('be.visible');
        
        // Verify Shopkeeper Stats update
        cy.get('button').contains('Dashboard').click();
        cy.get('div').contains('Active Orders').parent().find('div').first().should('have.text', '1');
        cy.get('button').contains('Logout').click();

        // --- 3. Dealer Stats Update ---
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Sign In').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        
        // Verify Dealer received the order stat
        cy.get('div').contains('Total Orders', { timeout: 15000 }).parent().find('div').first().should('have.text', '1');
    });
});
