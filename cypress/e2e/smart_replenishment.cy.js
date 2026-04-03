describe('Smart Replenishment AI Flow', () => {
  const dealerId = `dealer_${Date.now()}`;
  const shopkeeperId = `shop_ai_${Date.now()}`;
  const productName = `AI Rice ${Date.now()}`;

  before(() => {
    // 1. Register Dealer and Setup Profile
    cy.visit('/signup');
    cy.get('select[name="user_type"]').select('dealer');
    cy.get('input[name="first_name"]').type('John');
    cy.get('input[name="last_name"]').type('Dealer');
    cy.get('input[name="username"]').type(dealerId);
    cy.get('input[name="email"]').type(`${dealerId}@test.com`);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="password_confirm"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Set Professional Business Name for searchability
    cy.contains('Profile').click();
    cy.contains('Edit Profile').click();
    cy.get('input[name="business_name"]').clear().type('Premium Wholesale');
    cy.get('button').contains('Save Changes').click();
    cy.contains('Profile updated successfully', { timeout: 10000 });

    // Add Product
    cy.contains('My Products').click();
    cy.contains('Add Product').click();
    cy.get('input[name="name"]').type(productName);
    cy.get('input[name="price"]').type('100');
    cy.get('input[name="stock_quantity"]').type('500');
    cy.get('textarea[name="description"]').type('Best organic rice for testing AI.');
    cy.get('button[type="submit"]').click();
    cy.contains('Product added successfully', { timeout: 10000 });
    
    // Logout
    cy.get('button[title="Logout"]').click();

    // 2. Register Shopkeeper
    cy.visit('/signup');
    cy.get('select[name="user_type"]').select('shopkeeper');
    cy.get('input[name="first_name"]').type('Jane');
    cy.get('input[name="last_name"]').type('Shop');
    cy.get('input[name="username"]').type(shopkeeperId);
    cy.get('input[name="email"]').type(`${shopkeeperId}@test.com`);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="password_confirm"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Follow Dealer
    cy.contains('Dealers').click();
    cy.contains('Premium Wholesale', { timeout: 15000 }).parent().contains('Follow').click();
    cy.contains('Unfollow', { timeout: 10000 }); // Confirm followed
    
    // 3. Establish Purchase History (Order 1)
    cy.contains('Dealers').parent().find('button').contains('Browse Products').click();
    cy.contains(productName, { timeout: 15000 }).parent().find('button').contains('Add to Cart').click();
    cy.visit('/cart');
    cy.get('button').contains('Place Order').click();
    cy.contains('Order Placed Successfully', { timeout: 15000 });
    cy.wait(2000); // Wait between orders to ensure distinct timestamps

    // (Order 2) - Establish frequency
    cy.visit('/products'); 
    cy.contains(productName).parent().find('button').contains('Add to Cart').click();
    cy.visit('/cart');
    cy.get('button').contains('Place Order').click();
    cy.contains('Order Placed Successfully', { timeout: 15000 });
    cy.wait(1000);
  });

  it('should show smart restock suggestion for the product in overview', () => {
    // Intercept API call to verify data
    cy.intercept('GET', '**/orders/suggestions/').as('getSuggestions');
    
    // Refresh to get suggestions
    cy.visit('/dashboard');
    cy.wait('@getSuggestions', { timeout: 20000 }).then((interception) => {
      console.log('Suggestions API Response:', interception.response.body);
    });
    
    cy.contains('Overview').click();
    
    // Look for Suggestions Banner
    cy.contains('Smart Replenishment suggestions', { timeout: 20000 }).should('be.visible');
    
    // Verify our product is in the suggestions
    cy.get('[data-cy="suggestion-card"]').contains(productName).should('be.visible');
    
    // Test "Add to Cart" from suggestion
    cy.get('[data-cy="suggestion-card"]').contains('Add to Cart').click();
    
    // Success toast should appear
    cy.contains(`Added ${productName} to cart!`, { timeout: 5000 }).should('be.visible');
  });
});
