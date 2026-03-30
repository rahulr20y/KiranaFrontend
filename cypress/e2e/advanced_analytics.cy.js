describe('Advanced Dealer Analytics', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    const dealer = {
        username: `analyst_dealer_${timestamp}`,
        email: `analyst_dealer_${timestamp}@example.com`,
        password: 'Password123!',
        product1: `Rice_Premium_${timestamp}`,
        product2: `Wheat_Bulk_${timestamp}`
    };

    const shopkeeper = {
        username: `analyst_shop_${timestamp}`,
        email: `analyst_shop_${timestamp}@example.com`,
        password: 'Password123!'
    };

    it('should generate and display accurate business analytics for dealers', () => {
        // 1. Dealer Signup and Product Creation
        cy.visit(`${baseUrl}/signup`);
        cy.get('#username').type(dealer.username);
        cy.get('#email').type(dealer.email);
        cy.get('#password').type(dealer.password);
        cy.get('#password_confirm').type(dealer.password);
        cy.get('#user_type').select('dealer');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // Add Product 1 (High Price, Low Stock)
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.product1);
        cy.get('input[name="price"]').type('2000');
        cy.get('input[name="stock_quantity"]').type('50');
        cy.get('input[name="low_stock_threshold"]').clear().type('60'); // Force low stock alert
        cy.get('button').last().click();
        cy.contains('Product added successfully!').should('be.visible');

        // Add Product 2 (Lower Price, High Stock)
        cy.get('button').contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.product2);
        cy.get('input[name="price"]').type('500');
        cy.get('input[name="stock_quantity"]').type('500');
        cy.get('button').last().click();
        cy.contains('Product added successfully!').should('be.visible');

        cy.get('button').contains('Logout').click();

        // 2. Shopkeeper Signup and Placing Orders
        cy.visit(`${baseUrl}/signup`);
        cy.get('#username').type(shopkeeper.username);
        cy.get('#email').type(shopkeeper.email);
        cy.get('#password').type(shopkeeper.password);
        cy.get('#password_confirm').type(shopkeeper.password);
        cy.get('#user_type').select('shopkeeper');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // Order Product 1 (Premium)
        cy.contains('nav a', 'Products').click();
        cy.get('input[placeholder*="Search"]').type(dealer.product1);
        cy.get('button').contains('Order').click();
        cy.contains('Order placed successfully!').should('be.visible');

        // Order Product 2 (Bulk) - 10 Units
        cy.get('input[placeholder*="Search"]').clear().type(dealer.product2);
        // Assuming there's a quantity input or we just click order multiple times or use cart
        // Let's use the simplest order flow available in the UI
        cy.get('button').contains('Order').click();
        cy.contains('Order placed successfully!').should('be.visible');

        cy.get('button').contains('Logout').click();

        // 3. Verify Analytics on Dealer Dashboard
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();

        // Navigate to Analytics/Insights
        cy.get('button').contains('Insights').click(); // Custom tab for analytics

        // Verify "Business Insights" header
        cy.contains('Business Insights').should('be.visible');

        // Verify Stats Cards
        cy.contains('Total Orders').parent().should('contain', '2');
        cy.contains('Total Revenue').parent().should('contain', '₹2,500'); // 2000 + 500

        // Verify Charts are rendered (Canvas check)
        cy.get('canvas').should('have.length.at.least', 3); // Revenue Trend, Top Products, Inventory Health

        // Verify Top Products list
        cy.contains('Top Selling Products').parent().within(() => {
            cy.contains(dealer.product1).should('be.visible');
            cy.contains(dealer.product2).should('be.visible');
        });

        // Verify Inventory Health
        cy.contains('Inventory Health').parent().within(() => {
            cy.contains('Low Stock').should('be.visible');
            // Since we set threshold 60 and stock 50, it should be low stock
        });

        // Verify Quick Performance
        cy.contains('Avg. Order Value').parent().should('contain', '₹1250'); // 2500 / 2
    });
});
