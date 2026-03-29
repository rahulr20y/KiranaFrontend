describe('Payment Gateway Integration: Razorpay Flow', () => {
  const shopkeeperInfo = {
    username: `sk_pay_${Date.now()}`,
    password: 'password123',
    shopName: `Test_Shop_${Date.now()}`,
    userType: 'shopkeeper'
  };

  const dealerInfo = {
    username: `dealer_pay_${Date.now()}`,
    password: 'password123',
    businessName: `Test_Dealer_${Date.now()}`,
    userType: 'dealer'
  };

  before(() => {
    // Signup Dealer first
    cy.visit('/signup');
    cy.get('input[name="username"]').type(dealerInfo.username);
    cy.get('input[name="first_name"]').type('John');
    cy.get('input[name="last_name"]').type('Doe');
    cy.get('input[name="email"]').type(`${dealerInfo.username}@example.com`);
    cy.get('input[name="password"]').type(dealerInfo.password);
    cy.get('input[name="password_confirm"]').type(dealerInfo.password);
    cy.get('select[name="user_type"]').select('dealer');
    cy.get('button').contains('Create Account').click();
    
    cy.url({timeout: 15000}).should('include', '/dashboard');
    cy.contains('button', 'Profile').click();
    cy.contains('button', 'Edit Profile').click();
    cy.get('input[name="business_name"]').clear().type(dealerInfo.businessName);
    cy.get('button').contains('Save Changes').click();
    cy.get('button').contains('Logout').click();

    // Signup Shopkeeper and follow dealer
    cy.visit('/signup');
    cy.get('input[name="username"]').type(shopkeeperInfo.username);
    cy.get('input[name="first_name"]').type('Jane');
    cy.get('input[name="last_name"]').type('Smith');
    cy.get('input[name="email"]').type(`${shopkeeperInfo.username}@example.com`);
    cy.get('input[name="password"]').type(shopkeeperInfo.password);
    cy.get('input[name="password_confirm"]').type(shopkeeperInfo.password);
    cy.get('select[name="user_type"]').select('shopkeeper');
    cy.get('button').contains('Create Account').click();
    
    cy.url({timeout: 15000}).should('include', '/dashboard');
    cy.contains('button', 'Profile', {timeout: 10000}).click();
    cy.contains('button', 'Edit Profile').click();
    cy.get('input[name="shop_name"]').clear().type(shopkeeperInfo.shopName);
    cy.get('button').contains('Save Changes').click();
    cy.contains('Profile updated successfully!').should('be.visible');

    cy.get('button').contains('Dealers').click();
    cy.contains(dealerInfo.businessName, { timeout: 20000 }).should('be.visible');
    cy.contains(dealerInfo.businessName).parent().find('button').contains('Follow').click();
    cy.contains('Successfully followed dealer!', { timeout: 15000 }).should('be.visible');

    // Create an order via backend/dealer to have a balance (or simulate via API)
    // For simplicity in E2E, we'll just log in as dealer and record a sale
    cy.get('button').contains('Logout').click();
    cy.visit('/login');
    cy.get('input[name="username"]').type(dealerInfo.username);
    cy.get('input[name="password"]').type(dealerInfo.password);
    cy.get('button[type="submit"]').click();

    cy.contains('button', 'My Products').click();
    
    // Add a product first
    cy.contains('button', '+ Add Product').click();
    cy.get('input[name="name"]').type('Payment Test Product');
    cy.get('textarea[name="description"]').type('Test Description'); // Added description
    cy.get('input[name="price"]').type('500');
    cy.get('input[name="stock_quantity"]').type('10'); // Fixed field name to stock_quantity
    cy.get('button').contains('Add Product').click();
    cy.contains('Product added successfully!').should('be.visible');

    // Refresh to see new shopkeeper and products
    cy.reload();
    cy.contains('button', 'My Products').click();
    cy.contains('button', '🤝 New Sale').click();
    
    // Wait for the dropdown to populate
    cy.get('select[name="shopkeeper_id"]', {timeout: 10000}).should('contain', shopkeeperInfo.shopName);
    cy.get('select[name="shopkeeper_id"]').select(shopkeeperInfo.shopName);
    cy.get('select[name="product_id"]').should('contain', 'Payment Test Product');
    cy.get('select[name="product_id"]').contains('Payment Test Product').then(option => {
      cy.get('select[name="product_id"]').select(option.val());
    });
    cy.get('input[name="quantity"]').clear().type('1');
    cy.contains('button', 'Record Sale & Deduct Stock').click();
    cy.contains('Sale recorded successfully!').should('be.visible');
    cy.get('button').contains('Logout').click();
  });

  it('should initiate digital payment from Ledger and handle Razorpay mock checkout', () => {
    // Login Shopkeeper
    cy.visit('/login');
    cy.get('input[name="username"]').type(shopkeeperInfo.username);
    cy.get('input[name="password"]').type(shopkeeperInfo.password);
    cy.get('button[type="submit"]').click();

    // Go to Khata
    cy.contains('button', 'Khata (Ledger)').click();
    cy.contains(dealerInfo.businessName).should('be.visible');
    cy.contains('₹500').should('be.visible');

    // Intercept Razorpay SDK load and Order Creation
    cy.intercept('GET', 'https://checkout.razorpay.com/v1/checkout.js', (req) => {
        req.reply('window.Razorpay = function(options) { this.open = () => { options.handler({ razorpay_order_id: "order_mock_123", razorpay_payment_id: "pay_mock_123", razorpay_signature: "sig_mock_123" }); } };');
    }).as('razorpaySDK');

    cy.intercept('POST', '**/payments/create_razorpay_order/').as('createOrder');
    cy.intercept('POST', '**/payments/verify/').as('verifyPayment');

    // Click Pay Digitally
    cy.contains('button', '💳 Pay Digitally').click();

    // Check loading toast
    cy.contains('Initializing secure payment...').should('be.visible');

    // Wait for Order Creation and capture order ID
    cy.wait('@createOrder').then((interception) => {
        const orderId = interception.response.body.razorpay_order_id;
        expect(orderId).to.exist;

        // NOW we can mock the Razorpay handler with the ACTUAL order ID
        cy.window().then((win) => {
            // Because the script might have already loaded, we might need to redefine window.Razorpay
            win.Razorpay = function(options) {
                this.open = () => {
                    options.handler({
                        razorpay_order_id: orderId, // Use the real one from backend
                        razorpay_payment_id: "pay_mock_123",
                        razorpay_signature: "sig_mock_123"
                    });
                };
            };
        });
    });

    // Wait for verify call
    cy.wait('@verifyPayment').its('response.statusCode').should('eq', 200);

    // Check Success toast
    cy.contains('Payment Successful!').should('be.visible');

    // Verify ledge updated (balance should be 0 now)
    cy.contains('td', '₹0').should('be.visible');
  });
});
