describe('Polish Features: Bulk Import, Ledger, & Toasts', () => {
  const dealerInfo = {
    username: `dealer_polish_${Date.now()}`,
    password: 'password123',
    businessName: `Polish_Dealer_${Date.now()}`,
    userType: 'dealer'
  };

  const shopkeeperInfo = {
    username: `sk_polish_${Date.now()}`,
    password: 'password123',
    shopName: `Polish_Shop_${Date.now()}`,
    userType: 'shopkeeper'
  };

  before(() => {
    // Signup Dealer
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
    cy.get('button').contains('Profile').click();
    cy.get('button').contains('Edit Profile').click();
    cy.get('input[name="business_name"]').clear().type(dealerInfo.businessName);
    cy.get('button').contains('Save Changes').click();
    cy.contains('Profile updated successfully!').should('be.visible');
    cy.contains(dealerInfo.businessName).should('be.visible');
    cy.get('button').contains('Logout').click();

    // Signup Shopkeeper
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
    cy.get('button').contains('Profile').click();
    cy.get('button').contains('Edit Profile').click();
    cy.get('input[name="shop_name"]').clear().type(shopkeeperInfo.shopName);
    cy.get('button').contains('Save Changes').click();
    cy.contains('Profile updated successfully!').should('be.visible');
    cy.contains(shopkeeperInfo.shopName).should('be.visible');
    cy.get('button').contains('Logout').click();
  });

  it('should bulk import products and show success toast', () => {
    // Login Dealer
    cy.visit('/login');
    cy.get('input[name="username"]').type(dealerInfo.username);
    cy.get('input[name="password"]').type(dealerInfo.password);
    cy.get('button[type="submit"]').click();

    // Go to Products
    cy.contains('button', 'My Products').click();

    // Bulk Import
    cy.get('input[type="file"]').selectFile('/tmp/sample_products.csv', { force: true });
    
    // Verify Success Toast (Generic message)
    cy.contains('imported').should('be.visible');
    
    // Verify Products added to table
    cy.get('table').should('contain', 'Bulk Rice');
    cy.get('table').should('contain', 'Bulk Dal');
  });

  it('should follow a dealer and show notification toast', () => {
    // Login Shopkeeper
    cy.visit('/login');
    cy.get('input[name="username"]').type(shopkeeperInfo.username);
    cy.get('input[name="password"]').type(shopkeeperInfo.password);
    cy.get('button[type="submit"]').click();

    // Find and follow dealer
    cy.contains('button', 'Dealers').click();
    cy.contains(dealerInfo.businessName).scrollIntoView().should('be.visible');
    cy.contains(dealerInfo.businessName).parent().find('button').contains('Follow').click();

    // Check for success toast
    cy.contains('Successfully followed dealer!').should('be.visible');
  });

  it('should view detailed ledger history and calculate running balance', () => {
    // Login Dealer
    cy.visit('/login');
    cy.get('input[name="username"]').type(dealerInfo.username);
    cy.get('input[name="password"]').type(dealerInfo.password);
    cy.get('button[type="submit"]').click();

    // Go to Khata
    cy.contains('button', 'Khata (Ledger)').click();

    // Initiate a Sale for the shopkeeper
    cy.contains('button', 'My Products').click();
    cy.contains('button', '🤝 New Sale').click();
    cy.get('select[name="shopkeeper_id"]').find('option').should('have.length.at.least', 2); // default + 1
    cy.get('select[name="shopkeeper_id"]').select(shopkeeperInfo.shopName);
    cy.get('select[name="product_id"]').find('option').should('have.length.at.least', 2);
    cy.get('select[name="product_id"]').contains('Bulk Rice').then(option => {
      cy.get('select[name="product_id"]').select(option.val());
    });
    cy.get('input[name="quantity"]').clear().type('1');
    cy.contains('button', 'Record Sale & Deduct Stock').click();
    cy.contains('Sale recorded successfully!').should('be.visible');

    // View Ledger
    cy.contains('button', 'Khata (Ledger)').click();
    cy.contains('button', 'Details →').click();

    // Verify Passbook modal
    cy.contains('Ledger History').should('be.visible');
    cy.get('table').contains('Order #').should('be.visible');
    cy.contains('Current Net Balance').should('be.visible');
    cy.contains('₹1500').should('be.visible');

    // Close modal
    cy.get('button[aria-label="Close modal"]').click();
    cy.contains('h2', 'Ledger History').should('not.exist');
  });
});
