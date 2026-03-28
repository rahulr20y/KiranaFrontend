describe('Digital Ledger (Khata) System', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const dealer = {
        username: `dealer_khata_${timestamp}`,
        password: 'Password123!',
        email: `dealer_khata_${timestamp}@example.com`,
        businessName: `Khata_Wholesale_${timestamp}`
    };
    const shopkeeper = {
        username: `sk_khata_${timestamp}`,
        password: 'Password123!',
        email: `sk_khata_${timestamp}@example.com`,
        shopName: `Khata_Shop_${timestamp}`
    };
    const product = {
        name: `Khata_Product_${timestamp}`,
        price: '1000',
        stock: '100'
    };

    it('should track orders and payments correctly in the ledger', () => {
        // 1. Dealer Signup
        cy.visit('/signup');
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="email"]').type(dealer.email);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('input[name="password_confirm"]').type(dealer.password);
        cy.get('select[name="user_type"]').select('dealer');
        cy.get('button').contains('Create Account').click();
        
        // Auto-login check
        cy.url({timeout: 15000}).should('include', '/dashboard');

        // (No need for step 2 if auto-logged in)
        // Skip manual login

        // 3. Dealer Setup Profile & Product
        cy.get('button').contains('Profile').click();
        cy.get('button').contains('Edit Profile').click();
        cy.get('input[name="business_name"]').clear().type(dealer.businessName);
        cy.get('button').contains('Save Changes').click();
        
        cy.get('button').contains('My Products').click();
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(product.name);
        cy.get('textarea[name="description"]').type('Khata test product');
        cy.get('input[name="price"]').type(product.price);
        cy.get('input[name="stock_quantity"]').type(product.stock);
        cy.get('button').contains('Add Product').click();
        cy.contains(product.name).should('be.visible');

        // Logout Dealer
        cy.get('button').contains('Logout').click();

        // 4. Shopkeeper Signup
        cy.visit('/signup');
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="email"]').type(shopkeeper.email);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('input[name="password_confirm"]').type(shopkeeper.password);
        cy.get('select[name="user_type"]').select('shopkeeper');
        cy.get('button').contains('Create Account').click();

        // 5. Auto-login shopkeeper
        cy.url({timeout: 15000}).should('include', '/dashboard');

        // 6. Shopkeeper Places Order
        cy.get('button').contains('Dealers').click();
        cy.contains(dealer.businessName).should('be.visible');
        cy.get('button').contains('Follow Dealer').first().click();
        
        // Buy product - assuming Buy button appears in dealer card or similar
        // For simplicity, we navigate to products or use the basic order flow
        cy.get('button').contains('Overview').click();
        // Since we followed, dealer is in overview
        cy.contains(dealer.businessName).click(); // Click dealer to see products
        cy.contains(product.name).parent().contains('Buy').click();
        cy.get('input[type="number"]').clear().type('2'); // Buy 2
        cy.get('button').contains('Confirm Order').click();
        
        // 7. Verify Khata Balance (Debt increased)
        cy.get('button').contains('Khata (Ledger)').click();
        // Total orders should be 2 * 1000 = 2000
        cy.contains('₹2000').should('be.visible');
        cy.get('td').contains('₹2000').should('be.visible'); // Balance Due

        // 8. Record Payment (Debt decreased)
        cy.window().then((win) => {
            cy.stub(win, 'prompt').returns('500'); // Pay 500
        });
        cy.get('button').contains('Record Payment').click();
        
        // New balance should be 2000 - 500 = 1500
        cy.contains('₹1500').should('be.visible');
        cy.contains('Total Payments Made').parent().contains('₹500');

        // 9. Verify from Dealer side
        cy.get('button').contains('Logout').click();
        cy.get('input[placeholder="Username"]').type(dealer.username);
        cy.get('input[placeholder="Password"]').type(dealer.password);
        cy.get('button').contains('Login').click();
        
        cy.get('button').contains('Khata (Ledger)').click();
        cy.contains('₹1500').should('be.visible');
        cy.contains('Total Receivable').parent().contains('₹1500');
        cy.contains(shopkeeper.username).should('be.visible');
    });
});
