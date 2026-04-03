describe('Mock Payment & Ledger Settlement', () => {
    let timestamp;
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000';

    beforeEach(() => {
        timestamp = Date.now().toString().slice(-6);
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('should place an order, pay via Mock UPI, and verify ledger settlement', () => {
        // --- 1. Register Dealer ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('input[name="first_name"]').type('John');
        cy.get('input[name="last_name"]').type('Doe');
        cy.get('#username').type(`dealer${timestamp}`);
        cy.get('#email').type(`dealer${timestamp}@test.com`);
        cy.get('#password').type('password123!');
        cy.get('#password_confirm').type('password123!');
        cy.get('#user_type').select('dealer');
        cy.get('button').contains('Create Account').click();

        // Create Product
        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        cy.contains('My Products', { timeout: 15000 }).click();
        cy.contains('+ Add Product', { timeout: 15000 }).click();
        cy.get('input[name="name"]').type(`Bulk Grains ${timestamp}`);
        cy.get('textarea[name="description"]').type('Premium quality wholesale grains');
        cy.get('input[name="price"]').type('100');
        cy.get('input[name="stock_quantity"]').type('1000');
        cy.get('button').contains('Add Product').click();
        
        // Wait for inventory to update
        cy.contains(`Bulk Grains ${timestamp}`).should('be.visible');
        cy.get('button[title="Logout"]').click();

        // --- 2. Register Shopkeeper ---
        cy.visit(`${baseUrl}/signup`);
        cy.get('input[name="first_name"]').type('John');
        cy.get('input[name="last_name"]').type('Doe');
        cy.get('#username').type(`shop${timestamp}`);
        cy.get('#email').type(`shop${timestamp}@test.com`);
        cy.get('#password').type('password123!');
        cy.get('#password_confirm').type('password123!');
        cy.get('#user_type').select('shopkeeper');
        cy.get('button').contains('Create Account').click();

        // Follow Dealer
        cy.url({ timeout: 15000 }).should('include', '/dashboard');
        cy.get('button').contains('Dealers').click();
        
        // Wait for dealers to load and check visibility specifically
        cy.contains(`dealer${timestamp}`, { timeout: 30000 }).should('be.visible');
        cy.contains(`dealer${timestamp}`).closest('div[class*="dealerCard"]').within(() => {
            cy.contains('Follow Dealer').click();
            cy.contains('Browse Products', { timeout: 15000 }).click();
        });

        // Add to Cart
        cy.url().should('include', '/products');
        cy.contains(`Bulk Grains ${timestamp}`, { timeout: 15000 }).should('be.visible');
        cy.contains(`Bulk Grains ${timestamp}`).closest('div').within(() => {
            cy.get('input[type="number"]').clear().type('10');
            cy.get('button').contains('Add').click();
        });

        // Checkout
        cy.visit(`${baseUrl}/cart`);
        cy.get('button').contains('Place Order').click();
        cy.contains('Order Placed Successfully', { timeout: 15000 });

        // --- 3. Check Khata (Ledger) ---
        cy.visit(`${baseUrl}/dashboard`);
        cy.get('button').contains('Khata').click();
        
        // Verify balance 1000
        cy.contains(`dealer${timestamp}`, { timeout: 15000 }).closest('tr').within(() => {
            cy.contains('₹1,000');
            cy.contains('Scan & Pay (Mock)').click();
        });

        // Handle Payment Modal
        cy.contains('Scan & Pay Dealer', { timeout: 5000 }).should('be.visible');
        cy.get('button').contains('I have Paid (Confirm)').click();

        // --- 4. Verify Settlement ---
        cy.contains(`Payment of ₹1000 successful`, { timeout: 15000 });
        cy.contains(`dealer${timestamp}`).closest('tr').within(() => {
            cy.contains('₹0'); // Balance should be settled
        });
    });
});
