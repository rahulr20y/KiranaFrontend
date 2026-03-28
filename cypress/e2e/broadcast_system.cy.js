describe('Dealer Broadcast System', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `dealer_bc_${timestamp}`,
        email: `dealer_bc_${timestamp}@example.com`,
        password: 'Password123!',
        businessName: `Wholesale_${timestamp}`,
        broadcastTitle: `Promo ${timestamp}`,
        broadcastMsg: `Special discount for all our followers today! ${timestamp}`
    };

    const shopkeeper = {
        username: `shop_bc_${timestamp}`,
        email: `shop_bc_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should allow dealer to broadcast and shopkeeper to view it', () => {
        // 1. Dealer sign up and send broadcast
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Dealer', { force: true });
        cy.get('#last_name').type('BC', { force: true });
        cy.get('#username').type(dealer.username, { force: true });
        cy.get('#email').type(dealer.email, { force: true });
        cy.get('#password').type(dealer.password, { force: true });
        cy.get('#password_confirm').type(dealer.password, { force: true });
        cy.get('#user_type').select('dealer', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        
        // Update profile business name
        cy.get('button').contains('Profile').click();
        cy.get('button').contains('Edit Profile').click();
        cy.get('input[name="business_name"]').clear().type(dealer.businessName);
        cy.get('button').contains('Save Changes').click();
        cy.contains('Profile updated successfully!', { timeout: 10000 });
        cy.reload();
        cy.contains(dealer.businessName); // Confirm it persists
        
        // Send Broadcast
        cy.get('button').contains('Broadcasts').click();
        cy.get('button').contains('Send Broadcast').click();
        cy.get('input[placeholder*="Title"]').type(dealer.broadcastTitle);
        cy.get('textarea[placeholder*="followers"]').type(dealer.broadcastMsg);
        cy.get('select').select('warning');
        cy.get('button').contains('Broadcast to Followers').click();
        
        cy.contains(dealer.broadcastTitle).should('be.visible');
        cy.get('button').contains('Logout').click();

        // 2. Shopkeeper follows dealer and checks broadcast
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Shop', { force: true });
        cy.get('#last_name').type('BC', { force: true });
        cy.get('#username').type(shopkeeper.username, { force: true });
        cy.get('#email').type(shopkeeper.email, { force: true });
        cy.get('#password').type(shopkeeper.password, { force: true });
        cy.get('#password_confirm').type(shopkeeper.password, { force: true });
        cy.get('#user_type').select('shopkeeper', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        
        // Initially should not see broadcast
        cy.contains(dealer.broadcastTitle).should('not.exist');
        
        // Follow dealer
        cy.get('button').contains('Dealers').click();
        cy.get('button').contains('Follow Dealer').first().click();
        
        // Verify broadcast appears in Overview
        cy.get('button').contains('Overview').click();
        cy.contains(dealer.broadcastTitle, { timeout: 15000 }).should('be.visible');
        
        // Verify broadcast in dedicated tab
        cy.get('button').contains('Broadcasts').click();
        cy.contains(dealer.broadcastTitle).should('be.visible');
        cy.contains(dealer.broadcastMsg).should('be.visible');
    });
});
