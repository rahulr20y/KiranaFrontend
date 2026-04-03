describe('Damaged Goods and Returns Lifecycle', () => {
    let deliveryOtpVal = '';
    const baseUrl = Cypress.config('baseUrl');

    const timestamp = Math.floor(Math.random() * 1000000).toString();
    
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
    });
    
    const dealer = {
        username: `dealer_rt_${timestamp}`,
        email: `dealer_rt_${timestamp}@example.com`,
        password: 'Password123!',
        businessName: `Dealer_RT_${timestamp}`,
        productName: `Fragile_Item_${timestamp}`
    };

    const shopkeeper = {
        username: `shop_rt_${timestamp}`,
        email: `shop_rt_${timestamp}@example.com`,
        password: 'Password123!',
        shopName: `Shop_RT_${timestamp}`
    };

    it('should allow full lifecycle: Order -> Ship (OTP) -> Deliver -> Return -> Approval -> Credit', () => {
        // --- 1. Setup Phase: Dealer & Product ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('input[name="first_name"]').type(`John${timestamp}`);
        cy.get('input[name="last_name"]').type('Doe');
        cy.get('#username').type(dealer.username);
        cy.get('#email').type(dealer.email);
        cy.get('#password').type(dealer.password);
        cy.get('#password_confirm').type(dealer.password);
        cy.get('#user_type').select('dealer');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // Add Product
        cy.contains('Add Product').click();
        cy.get('input[name="name"]').type(dealer.productName);
        cy.get('textarea[name="description"]').type('High quality fragile goods');
        cy.get('input[name="price"]').type('1000');
        cy.get('input[name="stock_quantity"]').type('100');
        cy.get('button').contains('Add Product').click();
        cy.contains('Product added successfully!').should('be.visible');
        cy.get('button[title="Logout"]').click();

        // --- 2. Order Phase: Shopkeeper ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('input[name="first_name"]').type('Jane');
        cy.get('input[name="last_name"]').type('Smith');
        cy.get('#username').type(shopkeeper.username);
        cy.get('#email').type(shopkeeper.email);
        cy.get('#password').type(shopkeeper.password);
        cy.get('#password_confirm').type(shopkeeper.password);
        cy.get('#user_type').select('shopkeeper');
        cy.get('button').contains('Create Account').click();
        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // Shopkeeper follows dealer to browse products
        cy.get('button').contains('Dealers').click();
        cy.contains(`John${timestamp}`).closest('.premium-card').within(() => {
            cy.contains('Follow Dealer').click({ force: true });
            cy.contains('Browse Products', { timeout: 15000 }).click();
        });

        // Add to cart and checkout
        cy.contains(dealer.productName).parents('.productCard').within(() => {
            cy.contains('Add to Cart').click();
        });
        cy.contains('added to cart').should('be.visible');
        cy.get('nav').contains('Cart').click();
        cy.get('textarea[name="address"]').type('123 Premium Street, UI City');
        cy.get('button').contains('Place Order').click();
        cy.contains('Order placed successfully!').should('be.visible');
        cy.get('button[title="Logout"]').click();

        // --- 3. Shipping Phase: Dealer generates OTP ---
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('button').contains('Login').click();

        cy.get('button').contains('Orders').click();
        cy.contains('pending').first().parents('.orderCard').within(() => {
            cy.get('button').contains('Confirm Order').click();
            cy.get('button').contains('Mark as Shipped').click();
        });
        cy.contains('shipped').should('be.visible');
        cy.get('button[title="Logout"]').click();

        // --- 4. Delivery Phase: Shopkeeper retrieves OTP ---
        cy.visit(`${baseUrl}/login`);
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();

        cy.get('button').contains('Orders').click();
        cy.get('.deliveryOtpBox strong').should('be.visible').invoke('text').then((text) => {
            deliveryOtpVal = text.trim();
            cy.log('Retrieved OTP:', deliveryOtpVal);
            cy.get('button[title="Logout"]').click();

            // --- 5. Finalize Delivery: Dealer enters OTP ---
            cy.visit(`${baseUrl}/login`);
            cy.get('input[name="username"]').type(dealer.username);
            cy.get('input[name="password"]').type(dealer.password);
            cy.get('button').contains('Login').click();

            cy.get('button').contains('Orders').click();
            
            // Stub the window prompt for OTP
            cy.window().then((win) => {
                cy.stub(win, 'prompt').returns(deliveryOtpVal);
            });

            cy.contains('shipped').first().parents('.orderCard').within(() => {
                cy.contains('Mark Delivered').click();
            });
            cy.contains('Order status updated').should('be.visible');
            cy.contains('delivered').should('be.visible');
            cy.get('button[title="Logout"]').click();

            // --- 6. Return Phase: Shopkeeper reports damage ---
            cy.visit(`${baseUrl}/login`);
            cy.get('input[name="username"]').type(shopkeeper.username);
            cy.get('input[name="password"]').type(shopkeeper.password);
            cy.get('button').contains('Login').click();
            
            cy.get('button').contains('Orders').click();
            
            // Stub prompts for Return Reason and Qty
            cy.window().then((win) => {
                const stub = cy.stub(win, 'prompt');
                stub.onCall(0).returns('Broken glass');
                stub.onCall(1).returns('1');
            });

            cy.contains('delivered').first().parents('.orderCard').within(() => {
                cy.contains('Report Damage').click();
            });
            
            cy.contains('Return request submitted').should('be.visible');
            cy.contains('Returns').click(); // Switch to returns tab
            cy.contains('Broken glass').should('be.visible');
            cy.get('button[title="Logout"]').click();

            // --- 7. Approval Phase: Dealer ---
            cy.visit(`${baseUrl}/login`);
            cy.get('input[name="username"]').type(dealer.username);
            cy.get('input[name="password"]').type(dealer.password);
            cy.get('button').contains('Login').click();

            cy.contains('Returns').click();
            cy.window().then((win) => {
                cy.stub(win, 'prompt').returns('Quality issue confirmed, refunding.');
            });

            cy.contains('Broken glass').parents('.returnCard').within(() => {
                cy.contains('Approve').click();
            });
            
            cy.contains('Return approved').should('be.visible');
            cy.get('button[title="Logout"]').click();

            // --- 8. Verification Phase: Shopkeeper sees credit ---
            cy.visit(`${baseUrl}/login`);
            cy.get('input[name="username"]').type(shopkeeper.username);
            cy.get('input[name="password"]').type(shopkeeper.password);
            cy.get('button').contains('Login').click();

            cy.contains('Returns').click();
            cy.contains('Total Return Credits').should('be.visible');
            // Calculated credit for 1 quantity of 1000 price = 1000
            cy.contains('₹1,000').should('be.visible');

            // Check Cart for available credit
            cy.get('nav').contains('Cart').click();
            cy.contains('Return Credits Available').should('be.visible');
            cy.contains('₹1,000').should('be.visible');
        });
    });
});
