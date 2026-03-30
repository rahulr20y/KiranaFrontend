describe('Wholesale Trust & Efficiency Flow', () => {
    const baseUrl = Cypress.config('baseUrl');
    const uniqueId = Math.random().toString(36).substring(2, 8) + Date.now().toString().slice(-4);
    
    const dealer = {
        username: `dealer_b2b_${uniqueId}`,
        email: `dealer_b2b_${uniqueId}@example.com`,
        password: 'Password123!',
        productName: `Bulk_Product_${uniqueId}`
    };

    const shopkeeper = {
        username: `shop_b2b_${uniqueId}`,
        email: `shop_b2b_${uniqueId}@example.com`,
        password: 'Password123!'
    };

    it('should verify Tiered Pricing, One-Click Reorder, and OTP Delivery', () => {
        // --- 1. Dealer Setup: Add Product with Tiers ---
        cy.intercept('POST', '**/api/v1/users/register/').as('dealerSignup');
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('B2B', { force: true });
        cy.get('#last_name').type('Wholesaler', { force: true });
        cy.get('#username').type(dealer.username, { force: true });
        cy.get('#email').type(dealer.email, { force: true });
        cy.get('#password').type(dealer.password, { force: true });
        cy.get('#password_confirm').type(dealer.password, { force: true });
        cy.get('#user_type').select('dealer', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.wait('@dealerSignup', { timeout: 30000 });
        cy.url({ timeout: 60000 }).should('include', '/dashboard');
        cy.contains('[v1.8 FORCED]', { timeout: 15000 }).should('be.visible');
        
        cy.log('Opening Add Product form');
        cy.contains('button', 'Add Product').should('be.visible').click();
        
        // Wait for form
        cy.get('input[name="name"]', { timeout: 10000 }).should('be.visible').type(dealer.productName);
        cy.get('textarea[name="description"]').type('Testing wholesale tiered pricing.');
        cy.get('input[name="price"]').type('500'); // Base price
        cy.get('input[name="stock_quantity"]').type('1000');
        
        // Add Price Tier
        cy.log('Adding Price Tier');
        cy.contains('button', '+ Add Tier').should('be.visible').click();
        cy.get('input[placeholder="50"]').should('be.visible').type('50');
        cy.get('input[placeholder="90"]').type('400'); // Discounted price
        
        cy.contains('button', 'Add Product').last().click();
        cy.contains('Product added successfully!').should('be.visible');
        
        // Force refresh to ensure list is updated
        cy.reload();
        cy.contains('[v1.8 FORCED]', { timeout: 15000 }).should('be.visible');
        cy.contains(dealer.productName, { timeout: 15000 }).should('be.visible');
        
        cy.contains('Logout').click();

        // --- 2. Shopkeeper: Tiered Pricing Verification ---
        cy.intercept('POST', '**/api/v1/users/register/').as('shopSignup');
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Retail', { force: true });
        cy.get('#last_name').type('Partner', { force: true });
        cy.get('#username').type(shopkeeper.username, { force: true });
        cy.get('#email').type(shopkeeper.email, { force: true });
        cy.get('#password').type(shopkeeper.password, { force: true });
        cy.get('#password_confirm').type(shopkeeper.password, { force: true });
        cy.get('#user_type').select('shopkeeper', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.wait('@shopSignup', { timeout: 30000 });
        cy.url({ timeout: 60000 }).should('include', '/dashboard');
        // Wait for the latest version with tiered pricing UI
        cy.contains('[v1.8 FORCED]', { timeout: 15000 }).should('be.visible');
        
        // Go to Products
        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.contains(dealer.productName).should('be.visible');
        cy.contains('50+ @ ₹400').should('be.visible'); // Verify tier visibility
        
        // Add to Cart
        cy.contains('button', 'Add to Cart').first().click();
        cy.contains('Cart').click();
        
        // Place a small order (10 units - base price)
        cy.contains('₹500').should('be.visible');
        
        // Increase to 100 units to trigger bulk price (₹400)
        cy.get('input[type="number"]').last().invoke('val', '').trigger('change').type('100').trigger('change');
        cy.contains('₹40,000').should('be.visible'); // 100 * 400
        cy.contains('Bulk Savings: -₹10,000').should('be.visible'); // (500-400)*100 = 10000 savings
        
        // Place first bulk order
        cy.contains('Confirm & Place Order').click();
        cy.contains('Order(s) placed successfully').should('be.visible');

        // Switch to Orders tab for full re-order button
        cy.log('Switching to Orders tab');
        cy.get('div[class*="tab"]').contains('Orders').click({ force: true });
        cy.contains('My Orders', { timeout: 15000 }).should('be.visible');
        
        // Find the bulk order and re-order
        cy.contains('Order #').first().parents('[class*="orderCard"]').within(() => {
            cy.contains('⚡ Re-order').click();
        });
        
        // Should land in cart with 100 items
        cy.url().should('include', '/cart');
        cy.contains(dealer.productName).should('be.visible');
        cy.get('input[type="number"]').last().should('have.value', '100');
        cy.contains('₹40,000').should('be.visible');
        
        // Place a second bulk order to deplete stock faster for suggestion test
        cy.contains('Confirm & Place Order').click();
        cy.contains('Order(s) placed successfully').should('be.visible');
        
        // --- 4. OTP Lifecycle ---
        cy.contains('Logout').click();
        
        // Dealer: Mark Shipped
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();
        
        cy.get('button').contains('Orders').click();
        cy.get('button').contains('✅ Confirm Order').first().click();
        cy.contains('Order status updated to confirmed').should('be.visible');
        cy.get('button').contains('🚚 Mark as Shipped').first().click();
        cy.contains('Order status updated to shipped').should('be.visible');
        cy.contains('Logout').click();
        
        // Shopkeeper: Get OTP
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();
        
        cy.get('button').contains('Orders').click();
        cy.get('div').contains('Delivery OTP').parent().find('strong').invoke('text').as('orderOtp');
        
        cy.contains('Logout').click();
        
        // Dealer: Finalize with OTP
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();
        cy.get('button').contains('Orders').click();
        
        cy.get('@orderOtp').then((otp) => {
            cy.window().then((win) => {
                cy.stub(win, 'prompt').returns(otp);
            });
            cy.get('button').contains('🛡️ Mark Delivered (Verify OTP)').first().click();
        });
        
        cy.contains('Order status updated to delivered').should('be.visible');
        
        // --- 5. Verify Smart Stock Suggesions ---
        cy.contains('Logout').click();
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();
        
        // Should show "Smart Stock Suggestions" banner (because product is depleting)
        cy.contains('Smart Stock Suggestions', { timeout: 15000 }).should('be.visible');
        cy.contains(dealer.productName).should('be.visible');
        cy.contains('Quick Restock').should('be.visible').click();
        
        // Should take back to cart
        cy.url().should('include', '/cart');
        cy.contains(dealer.productName).should('be.visible');
        
        cy.log('All B2B Trust & Efficiency features verified!');
    });
});
