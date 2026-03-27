describe('Shopkeeper Dashboard Dynamic Data', () => {
    const baseUrl = 'https://kiranafrontend.vercel.app';
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `dealer_dash_${timestamp}`,
        email: `dealer_dash_${timestamp}@example.com`,
        password: 'Password123!',
        productName: `Product_${timestamp}`
    };

    const shopkeeper = {
        username: `shop_dash_${timestamp}`,
        email: `shop_dash_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should display preferred dealers and recent orders dynamically', () => {
        // --- 1. Dealer Setup ---
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
        
        // Add a product
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('textarea[name="description"]').type('Dashboard test product.');
        cy.get('input[name="price"]').type('500');
        cy.get('input[name="stock_quantity"]').type('100');
        cy.get('button').contains('Add Product', { timeout: 10000 }).last().click();
        
        // Go to profile and set business name
        cy.get('button').contains('Profile').click();
        cy.get('button').contains('Edit Profile').click();
        cy.get('input').filter(':visible').first().clear().type(`Business_${dealer.username}`);
        cy.get('button').contains('Save Changes').click();
        
        cy.get('button').contains('Logout').click();

        // --- 2. Shopkeeper Setup ---
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

        // --- 3. Follow Dealer ---
        cy.get('button').contains('Dealers').click();
        cy.get('h3', { timeout: 10000 }).contains(`Business_${dealer.username}`).parent().find('button').contains('Follow Dealer').click();
        
        // Verify Preferred Dealers count updated
        cy.get('button').contains('Overview').click();
        cy.get('div').contains('Preferred Dealers').parent().find('div').first().should('have.text', '1');
        
        // Verify Top Dealers section
        cy.get('h3').contains('Top Dealers').parent().contains(`Business_${dealer.username}`).should('be.visible');

        // --- 4. Order Product ---
        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.get('h3', { timeout: 10000 }).contains(dealer.productName).should('be.visible');
        cy.get('button').contains('Order').first().click();
        cy.get('div', { timeout: 15000 }).contains('Order placed successfully!').should('be.visible');

        // --- 5. Verify Orders on Dashboard ---
        cy.get('button').contains('Dashboard').click();
        cy.get('button').contains('Overview').click();
        
        // Active Orders should be 1
        cy.get('div').contains('Active Orders').parent().find('div').first().should('have.text', '1');
        
        // Recent Orders section
        cy.get('h3').contains('Recent Orders').parent().contains('₹500').should('be.visible');
        cy.get('h3').contains('Recent Orders').parent().contains('pending').should('be.visible');
        
        // Orders Tab
        cy.get('button').contains('Orders').click();
        cy.get('h2').contains('My Orders').should('be.visible');
        cy.get('.orderCard').should('have.length.at.least', 1);
        cy.get('.orderCard').first().contains('₹500').should('be.visible');
        cy.get('.orderCard').first().contains('pending').should('be.visible');
    });
});
