describe('Damaged Goods and Returns Lifecycle', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `dealer_returns_${timestamp}`,
        email: `dealer_returns_${timestamp}@example.com`,
        password: 'Password123!',
        productName: `Fragile_Item_${timestamp}`
    };

    const shopkeeper = {
        username: `shop_returns_${timestamp}`,
        email: `shop_returns_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should allow shopkeeper to report damaged goods and dealer to approve and credit the account', () => {
        // --- 1. Setup Phase ---
        // Dealer signup and product creation
        cy.visit(`${baseUrl}/signup`);
        cy.get('#username').type(dealer.username);
        cy.get('#email').type(dealer.email);
        cy.get('#password').type(dealer.password);
        cy.get('#password_confirm').type(dealer.password);
        cy.get('#user_type').select('dealer');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('input[name="price"]').type('1000');
        cy.get('input[name="stock_quantity"]').type('100');
        cy.get('button').last().click();
        cy.contains('Product added successfully!').should('be.visible');
        cy.get('button').contains('Logout').click();

        // Shopkeeper signup and ordering
        cy.visit(`${baseUrl}/signup`);
        cy.get('#username').type(shopkeeper.username);
        cy.get('#email').type(shopkeeper.email);
        cy.get('#password').type(shopkeeper.password);
        cy.get('#password_confirm').type(shopkeeper.password);
        cy.get('#user_type').select('shopkeeper');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.productName);
        cy.get('button').contains('Order').click();
        cy.contains('Order placed successfully!').should('be.visible');

        // --- 2. Reporting Phase ---
        cy.get('button').contains('Orders').click();
        cy.contains('Order #').first().parents('.orderCard').within(() => {
            cy.contains('Report Damage / Return').click();
        });

        // Fill return request form
        cy.get('select[name="item"]').select(dealer.productName);
        cy.get('input[name="quantity"]').clear().type('1');
        cy.get('textarea[name="reason"]').type('Item arrived with broken packaging.');
        cy.get('button').contains('Submit Request').click();
        cy.contains('Return request submitted successfully').should('be.visible');

        // Verify status is pending in returns tab
        cy.get('button').contains('Returns').click();
        cy.contains('pending').should('be.visible');
        cy.contains(dealer.productName).should('be.visible');
        cy.get('button').contains('Logout').click();

        // --- 3. Dealer Approval Phase ---
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();

        cy.get('button').contains('Returns').click();
        cy.contains(shopkeeper.username).should('be.visible');
        cy.contains('Approve').click();
        
        // Handle prompt for notes
        cy.window().then((win) => {
            cy.stub(win, 'prompt').returns('Acceptance of damage, credit issued.');
        });
        
        cy.contains('Approved and credited successfully').should('be.visible');
        cy.contains('approved').should('be.visible');

        // --- 4. Ledger Verification Phase ---
        // Verify that the ledger (Khata) has been updated with the credit
        cy.get('button').contains('Khata (Ledger)').click();
        cy.contains('₹1000').should('be.visible');
        cy.contains('Total Receivable').parent().should('contain', '₹0'); // Original 1000 - 1000 credit = 0
        
        cy.get('button').contains('Logout').click();

        // Final Shopkeeper check
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();
        
        cy.get('button').contains('Khata (Ledger)').click();
        cy.contains('₹0').should('be.visible'); // Amount Due should be 0
        cy.contains('Total Payments Made').parent().should('contain', '₹1000'); // Credit counts as payment/reduction
    });
});
